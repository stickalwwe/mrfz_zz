/* ============================================================================
 * 明日方舟 · 泰拉大陆 · MVU Zod 变量结构脚本
 * 放置位置：酒馆助手 → 角色脚本（新建脚本，粘贴全文；脚本名建议 01 变量结构）
 * 生效条件：新开聊天（修改本脚本或 [initvar] 后必须新开聊天）
 *
 * 设计原则：
 *   界面上可见的时间/地点/背景/立绘/台词/人物/关系/物品/大事记/行动建议
 *   全部来自本 schema 定义的变量；界面只做渲染，不写死剧情数据。
 *   动态集合使用 record / array，新增人物、物品、关系直接 insert 即可。
 * ========================================================================== */

import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

/* ---------- 0~100 数值钳制 ---------- */
const u100 = () => z.coerce.number().transform(v => _.clamp(v, 0, 100));

/* ---------- 稀有度 ---------- */
const 稀有度 = () =>
  z.enum(['普通', '精良', '稀有', '关键']).prefault('普通')
    .describe('稀有度：普通 < 精良 < 稀有 < 关键');

/* ---------- 状态标签 ---------- */
const 状态标签 = z.object({
  名称: z.string().prefault('待补充'),
  稀有度: 稀有度(),
  描述: z.string().prefault('待补充').describe('该状态的具体表现与影响'),
});

/* ---------- 在场人物（键 = 角色本名，必须与立绘映射表一致） ---------- */
const 人物条目 = z.object({
  阵营: z.string().prefault('无').describe('所属阵营 / 组织，如 罗德岛、龙门近卫局、无'),
  身份: z.string().prefault('待补充').describe('当前身份或职务'),
  职业: z.string().prefault('无').describe('职业 / 分支，如 术师 · 近卫、医师、狙击'),
  种族: z.string().prefault('无').describe('种族，如 卡特斯、菲林、鲁珀、萨卡兹、黎博利'),
  好感度: u100().describe('对博士的信赖，0~100'),
  好感度评价: z.string().prefault('待评价').describe('如 初次见面 / 试探 / 信任 / 疏离'),
  服饰: z.string().prefault('待补充').describe('当前着装（颜色、款式、装备）'),
  姿势: z.string().prefault('待补充').describe('当前姿态 / 动作 / 站位'),
});

/* ---------- 人际关系 ---------- */
const 关系条目 = z.object({
  关系: z.string().prefault('待补充').describe('如 同行 / 合作 / 监督 / 敌对'),
  关系评价: z.string().prefault('待补充').describe('一句话关系评价'),
  好感度: u100().describe('关系亲密度，0~100'),
});

/* ---------- 物品栏 ---------- */
const 物品条目 = z.object({
  稀有度: 稀有度(),
  类型: z.enum(['消耗品', '材料', '道具', '装备', '文件', '凭证', '货币', '纪念品']).prefault('道具'),
  数量: z.coerce.number().int().prefault(1).describe('数量，归零后自动移除'),
  描述: z.string().prefault('待补充').describe('物品介绍 / 用途 / 来历'),
});

/* ---------- 演出分段 ---------- */
const 分段条目 = z.object({
  说话者: z.string().prefault('旁白').describe('该段发言者；旁白段填“旁白”'),
  旁白: z.boolean().prefault(false).describe('true = 旁白段；旁白段只写叙述，不得包含对白'),
  台词: z.string().prefault('').describe('该段内容：一句台词，或 1~3 句旁白；旁白段不得包含人物对白'),
  立绘: z
    .array(z.string())
    .prefault([])
    .transform(d => _.takeRight(d, 3))
    .describe('本段上镜立绘的角色名，按左→右排列；允许重复；留空沿用上一段'),
});

/* ============================================================
 * 根结构
 * ============================================================ */
export const Schema = z
  .object({
    /* ---------- 世界 ---------- */
    世界: z
      .object({
        时间: z.string().prefault('00:00').describe('HH:MM，如 21:58'),
        日期: z.string().prefault('1月1日 周一').describe('如 11月2日 周日；年份由界面统一补'),
        地点: z.string().prefault('未知区域').describe('区域 · 具体地点'),
        天气: z.string().prefault('未知').describe('天气与温度'),
        背景图: z.string().prefault('').describe('场景短 ID，取自【总纲】场景短 ID 表'),
        音效开关: z.boolean().prefault(true).describe('打字音效开关，用户专属；AI 不得修改'),
      })
      .prefault({}),

    /* ---------- 演出（正文的唯一载体） ---------- */
    演出: z
      .object({
        分段: z
          .array(分段条目)
          .prefault([])
          .describe('本轮全部旁白 / 台词，按顺序播放，点击推进。**正文写在这里**'),
        说话者: z.string().prefault('旁白').describe('最后一段的发言者'),
        台词: z.string().prefault('').describe('最后一段的内容'),
        旁白: z.boolean().prefault(true).describe('最后一段是否旁白'),
      })
      .prefault({}),

    /* ---------- 主角（玩家，任何身份均可） ---------- */
    主角: z
      .object({
        姓名: z.string().prefault('').describe('由玩家决定；未设定时留空，不要替玩家取名'),
        身份: z.string().prefault('未设定').describe('由玩家决定；未设定时保持“未设定”'),
        外貌: z.string().prefault('').describe('只写剧情中明确出现过的特征，未设定时留空'),
        服饰: z.string().prefault(''),
        姿势: z.string().prefault(''),
        状态: z.array(状态标签).prefault([]).transform(d => _.takeRight(d, 12)),
      })
      .prefault({}),

    /* ---------- 在场人物 ---------- */
    在场人物: z
      .record(z.string().describe('角色本名，必须与立绘映射表一致'), 人物条目)
      .prefault({})
      .describe('当前场景在场的人物；离场时 remove'),

    /* ---------- 人际关系 ---------- */
    人际关系: z
      .record(z.string().describe('角色名'), 关系条目)
      .prefault({})
      .describe('与博士有人际关系的人物'),

    /* ---------- 物品栏 ---------- */
    物品栏: z
      .record(z.string().describe('物品名'), 物品条目)
      .prefault({})
      .transform(data => _.pickBy(data, it => Number(it && it.数量) > 0))
      .describe('物品栏；数量≤0 自动消失'),

    /* ---------- 大事记 ---------- */
    大事记: z
      .array(
        z.object({
          时间: z.string().prefault('').describe('如 11月2日 22:10'),
          事件: z.string().prefault('').describe('事件描述'),
        }),
      )
      .prefault([])
      .transform(d => _.takeRight(d, 30))
      .describe('按时间顺序追加的重大事件'),

    /* ---------- 行动建议 ---------- */
    行动建议: z
      .array(z.string())
      .prefault([])
      .transform(d => _.takeRight(d, 4))
      .describe('给玩家的 4 个可点击选项，每轮重新生成'),

    /* ---------- 剧情回顾（界面自动读取） ---------- */
    $剧情回顾: z
      .array(
        z.object({
          说话者: z.string().prefault('旁白'),
          台词: z.string().prefault(''),
        }),
      )
      .prefault([])
      .transform(d => _.takeRight(d, 100))
      .describe('界面自动读取各楼层 演出.分段 并回填，最多最近 100 条；AI 不要修改'),

    /* ---------- 系统日志（状态栏操作留痕） ---------- */
    系统日志: z
      .array(z.string())
      .prefault([])
      .transform(d => _.takeRight(d, 20))
      .describe('玩家在状态栏的操作记录；AI 可 remove 已消化条目'),
  })
  .transform(data => {
    if (Array.isArray(data.行动建议)) {
      const a = data.行动建议.slice(0, 4);
      while (a.length < 4) a.push('');
      data.行动建议 = a;
    }
    return data;
  });

$(() => {
  registerMvuSchema(Schema);
});
