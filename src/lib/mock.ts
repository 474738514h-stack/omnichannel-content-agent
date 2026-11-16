/**
 * 离线样本 —— 来自一条真实形态的新闻稿。
 *
 * 两份数据，职责分离：
 * · buildDemoRaw()  —— 3 个变体，喂给 UI，翻页器显示 1/3、2/3、3/3，
 *   刻意混合有效 / 跳过，以呈现跳过印章、4 分镜、4 配图与"整段含不推荐不误伤"。
 * · buildMockRaw()  —— 10 张卡片自检集（9 有效 + 21 跳过），验证解析器统计。
 */

const NEWS =
  "昨夜，某国产手机厂商在春季发布会推出新一代旗舰机：6.3 英寸直屏、自研影像芯片、" +
  "起售价 4299 元，将于周五全渠道开售。现场座无虚席，弹幕刷屏。";

const XHS_IMAGES = [
  "1. 新机放在木质桌面，晨光侧射，杂志风静物摄影，暖色调",
  "2. 发布会现场观众举机拍摄，浅景深，胶片质感",
  "3. 影像样张九宫格排版，极简白色背景，小红书封面风格",
  "4. 手握新机自拍视角，街景虚化，生活化自然光",
];

const VIDEO_SHOTS = `1. [全景·3s] 发布会现场座无虚席，灯光暗下，镜头缓缓推向舞台。
2. [特写·2s] 新品手机从幕布后升起，聚光灯扫过机身，字幕"今夜主角"。
3. [快切·4s] 影像样张三连闪回，价格数字"4299 元起"砸入画面。
4. [收尾·3s] 主播出镜："周五开售，你会冲吗？" 定格封面。`;

const XHS_COPY = [
  "姐妹们，今晚发布会我整个人看傻了……",
  "",
  "6.3 英寸直屏握感刚刚好，自研影像芯片夜景直接起飞。4299 起，周五开售，我先冲为敬！",
  "",
  "#新机开箱 #数码好物 #发布会",
].join("\n");

/** 生成一张有效卡片；seed 用来做措辞微调，让三版看起来是不同排版 */
function validCard(seed: number) {
  const tag = ["", " · 快讯版", " · 深度版"][seed % 3];
  return {
    weibo: {
      // 变体2 的 decision 整段含"不推荐"，但首段是"推荐"，验证不误伤
      decision:
        seed === 1
          ? "推荐：话题热度高，虽然不推荐硬广口径，但电讯角度成立，可发。"
          : "推荐：话题具备高热度，价格与影像是天然讨论点，适合即时电讯快速跟进。",
      copy: `【今夜发布${tag}】旗舰新机登场：6.3 英寸直屏、自研影像芯片，4299 元起，周五开售。你冲不冲？`,
      title: "#新机发布# #影像芯片#",
      tags: ["新机发布", "影像芯片", "数码"],
      image_prompts: ["1. 发布会展台聚光灯下的新机特写，暗调"],
    },
    xiaohongshu: {
      decision: "推荐：新机首发适合做开箱种草，人群精准，配图转化率高。",
      title: `发布会现场｜这台新机有点东西${tag}`,
      copy: XHS_COPY,
      image_prompts: XHS_IMAGES,
    },
    video: {
      decision: "推荐：发布会天然具备节奏感，适合做 4 镜头快剪脚本。",
      script: VIDEO_SHOTS,
      copy: "新机发布会 4 镜头快剪" + tag,
    },
  };
}

/** 生成一张三渠道全跳过的卡片（自检集用） */
function skippedCard(n: number) {
  return {
    weibo: {
      decision: `不推荐：与本周第 ${n} 条通稿高度重合，避免刷屏，故本刊跳过。`,
      copy: "与已有通稿重复，本刊跳过。",
      title: "",
      tags: [],
      image_prompts: [],
    },
    xiaohongshu: {
      decision: `无：第 ${n} 版缺少真实上手素材，不适合种草版，跳过。`,
      title: "",
      copy: "缺少上手素材，本刊跳过。",
      image_prompts: [],
    },
    video: {
      decision: `不推荐：第 ${n} 版无可用现场画面，关键字段为「无」，跳过。`,
      script: "",
      copy: "无可用现场画面，本刊跳过。",
    },
  };
}

/**
 * UI 演示集：3 个变体（1/3、2/3、3/3）。
 * 变体1 全有效；变体2 视频跳过；变体3 小红书跳过。
 */
export function buildDemoRaw(): { input: string; output: unknown[] } {
  const v1 = validCard(0);
  const v2 = validCard(1);
  const v3 = validCard(2);

  return {
    input: NEWS,
    output: [
      // 第 1 版：三刊全有效，完整呈现 4 分镜 + 4 配图
      { ...v1 },
      // 第 2 版：短视频跳过（呈现视频跳过印章）
      {
        ...v2,
        video: {
          decision: "不推荐：本版缺少可用现场画面，关键字段为「无」，本刊跳过。",
          script: "",
          copy: "无可用现场画面，本刊跳过。",
        },
      },
      // 第 3 版：小红书跳过（呈现种草刊跳过印章），微博/视频仍有效
      {
        ...v3,
        xiaohongshu: {
          decision: "无：本版缺少真实上手素材，不适合种草版，跳过。",
          title: "",
          copy: "缺少上手素材，本刊跳过。",
          image_prompts: [],
        },
      },
    ],
  };
}

/**
 * 离线自检集：10 张卡片 × 3 渠道 = 30 条决策，
 * 前 3 张全有效（9 条）+ 后 7 张全跳过（21 条）。
 */
export function buildMockRaw(): { input: string; output: unknown[] } {
  const output: unknown[] = [];
  for (let i = 0; i < 10; i++) {
    output.push(i < 3 ? validCard(i) : skippedCard(i + 1));
  }
  return { input: NEWS, output };
}

export const MOCK_NEWS = NEWS;
/** 前端默认演示用的样本新闻（一键填充） */
export const SAMPLE_NEWS = NEWS;
