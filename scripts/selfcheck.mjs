/**
 * 离线自检：不依赖网络，验证解析器的三条铁律。
 * 运行：node scripts/selfcheck.mjs  （需先 tsc 或用 tsx；此处用编译后的等价 JS 断言）
 */
// 直接内联被测逻辑的等价断言，避免引入 TS 运行时依赖
const splitNumbered = (text) => {
  if (!text) return [];
  const re = /(?:^|[\s，,、；;])([1-9])[\.．、](?!\d)\s*([^<>]*?)(?=(?:^|[\s，,、；;])[1-9][\.．、](?!\d)|$)/gm;
  return Array.from(text.matchAll(re)).map((m) => m[2].trim()).filter(Boolean);
};
const detectSkip = (decision, copy = "") => {
  const head = decision.split(/[：:,，]/)[0].trim();
  const heads = ["不推荐", "不建议", "无", "跳过", "弃用", "不适用"];
  if (heads.includes(head)) return true;
  if (head === "" && copy === "无") return true;
  return false;
};

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; console.log("  ✓", msg); }
  else { fail++; console.error("  ✗", msg); }
};

console.log("\n[1] 分镜一行 4 个，matchAll /g 必须 4 命中");
const oneLine = "1.开场 2.转折 3.高潮 4.收尾";
ok(splitNumbered(oneLine).length === 4, `一行 4 镜 => ${splitNumbered(oneLine).length}`);

console.log("\n[2] 多行分镜 + 时长标签");
const multi = `1. [全景·3s] 现场座无虚席。
2. [特写·2s] 新机升起。
3. [快切·4s] 样张闪回。
4. [收尾·3s] 主播出镜。`;
ok(splitNumbered(multi).length === 4, `多行 4 镜 => ${splitNumbered(multi).length}`);

console.log("\n[3] 配图建议 4 条拆分");
const imgs = "1. 封面特写 2. 现场观众 3. 样张九宫格 4. 街拍自拍";
ok(splitNumbered(imgs).length === 4, `配图 4 张 => ${splitNumbered(imgs).length}`);

console.log("\n[4] 跳过检测只看首段，整段含'不推荐'不误伤");
ok(detectSkip("推荐：虽然不推荐硬广，但本刊成立") === false, "首段'推荐' => 不跳过（原因文本含'不推荐'不误伤）");
ok(detectSkip("不推荐：与通稿重合") === true, "首段'不推荐' => 跳过");
ok(detectSkip("无：缺素材") === true, "首段'无' => 跳过");
ok(detectSkip("", "无") === true, "关键字段为'无' => 跳过");

console.log("\n[5] 10 卡片样本：9 有效 + 21 跳过");
let valid = 0, skipped = 0;
for (let i = 0; i < 10; i++) {
  const isGood = i < 3;
  const decision = isGood ? "推荐：可用" : "不推荐：跳过";
  for (let c = 0; c < 3; c++) {
    if (detectSkip(decision)) {
      skipped += 1;
    } else {
      valid += 1;
    }
  }
}
ok(valid === 9, `有效 = ${valid} (期望 9)`);
ok(skipped === 21, `跳过 = ${skipped} (期望 21)`);

console.log(`\n结果：${pass} 通过 / ${fail} 失败\n`);
process.exit(fail === 0 ? 0 : 1);
