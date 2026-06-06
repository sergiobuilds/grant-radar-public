import { GrantJsonCache } from "../packages/core/src/cache.ts";
import { extractAttachmentText, buildFitPrompt } from "../packages/core/src/harness.ts";
const cache = new GrantJsonCache(".cache/grants.json");
const all = await cache.listActive();
const g = all.find((x) => x.source === "kstartup" && x.attachments.length > 0);
if (!g) { console.log("첨부 있는 K-Startup 공고 없음"); process.exit(0); }
console.log("공고:", g.title.slice(0, 40), "| 첨부", g.attachments.length, "개");
const text = await extractAttachmentText(g);
console.log("추출 길이:", text.length, "자");
console.log("앞 160자:", text.slice(0, 160).replace(/\s+/g, " "));
console.log("--- fit 프롬프트 미리보기 ---");
console.log(buildFitPrompt({ grant: g, capability: "AI/소프트웨어", intent: "AI 물류 SaaS" }).slice(0, 200));
