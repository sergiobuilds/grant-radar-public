import { randomBytes } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { createApp } from "./server.ts";

let token = process.env.GRANT_RADAR_TOKEN;
if (!token) {
  token = randomBytes(24).toString("hex");
  await appendFile(".env", `\nGRANT_RADAR_TOKEN=${token}\n`);
  console.error("GRANT_RADAR_TOKEN 미설정 → 생성해 .env에 추가함.");
}

const port = Number(process.env.PORT ?? 13280);
createApp(token).listen(port, () => {
  console.error(`grant-radar MCP/REST 기동: http://localhost:${port}  (Bearer 인증)`);
});
