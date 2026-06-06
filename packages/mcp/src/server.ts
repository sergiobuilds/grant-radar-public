import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  GrantJsonCache,
  evaluateEligibility,
  buildFitPrompt,
  buildDraftPrompt,
  extractAttachmentText,
  type UserState,
  type CachedGrant,
} from "../../core/src/index.ts";

const cache = new GrantJsonCache(process.env.GRANT_CACHE ?? ".cache/grants.json");

function summarize(g: CachedGrant) {
  return {
    id: g.id,
    source: g.source,
    title: g.title,
    agency: g.agency,
    category: g.category,
    region: g.region,
    applyEnd: g.applyEnd,
    attachments: g.attachments.length,
  };
}

// ---- 순수 핸들러 (테스트·REST·MCP 공용) ----

export async function matchGrants(input: {
  state?: UserState;
  capability?: string;
  intent?: string;
}) {
  const state = input.state ?? {};
  const all = await cache.listActive();
  const grants = all
    .map((g) => {
      const eligibility = evaluateEligibility(g, state);
      return {
        ...summarize(g),
        eligibility,
        fitPrompt: buildFitPrompt({
          grant: g,
          capability: input.capability ?? "",
          intent: input.intent ?? "",
        }),
      };
    })
    .filter((g) => g.eligibility.verdict !== "불가");
  // 가능 먼저, 그다음 확인필요
  grants.sort((a, b) =>
    a.eligibility.verdict === b.eligibility.verdict ? 0 : a.eligibility.verdict === "가능" ? -1 : 1,
  );
  return { count: grants.length, grants };
}

export async function getGrant(input: { id: string }) {
  const all = await cache.listAll();
  const g = all.find((x) => x.id === input.id);
  if (!g) return { found: false as const };
  const formText = await extractAttachmentText(g);
  return { found: true as const, grant: g, formText };
}

export async function draftApplication(input: {
  id: string;
  userProfile?: string;
  capability?: string;
  intent?: string;
}) {
  const res = await getGrant({ id: input.id });
  if (!res.found) return { found: false as const };
  return {
    found: true as const,
    draftPrompt: buildDraftPrompt({
      grant: res.grant,
      formText: res.formText,
      userProfile: input.userProfile ?? "",
    }),
    formText: res.formText,
  };
}

// ---- MCP 서버 (도구 3종) ----

function buildMcpServer(): McpServer {
  const server = new McpServer({ name: "grant-radar", version: "0.1.0" });

  server.registerTool(
    "match_grants",
    {
      description: "사용자 상태·역량·의도로 자격 통과 공고와 적합 판정 프롬프트를 반환",
      inputSchema: {
        state: z
          .object({
            applicantType: z.string().optional(),
            businessAgeYears: z.number().optional(),
            region: z.string().optional(),
          })
          .optional(),
        capability: z.string().optional(),
        intent: z.string().optional(),
      },
    },
    async (args) => {
      const r = await matchGrants(args);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
    },
  );

  server.registerTool(
    "get_grant",
    {
      description: "공고 본문·첨부·양식 텍스트(공고문 추출)를 반환",
      inputSchema: { id: z.string() },
    },
    async (args) => {
      const r = await getGrant(args);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
    },
  );

  server.registerTool(
    "draft_application",
    {
      description: "공고문 양식에 맞춘 신청서 초안 작성 프롬프트를 반환(LLM은 호출자가 실행)",
      inputSchema: {
        id: z.string(),
        userProfile: z.string().optional(),
        capability: z.string().optional(),
        intent: z.string().optional(),
      },
    },
    async (args) => {
      const r = await draftApplication(args);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
    },
  );

  return server;
}

// ---- HTTP 앱 (Bearer + REST + MCP + 정적) ----

export function createApp(token: string) {
  const app = express();
  app.use(express.json());

  // CORS — 외부 브라우저(claude.ai 아티팩트 등)에서 Bearer로 붙을 수 있게.
  // 공개 commodity 표면이라 origin 제한 없음. 쓰기 경로는 토큰이 막는다.
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.header("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // 통합(MCP) surface 전용 인증. 읽기 REST는 공개 데이터라 토큰 불필요.
  const auth: express.RequestHandler = (req, res, next) => {
    const header = req.header("authorization") ?? "";
    if (header !== `Bearer ${token}`) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    next();
  };

  app.get("/api/grants", async (req, res) => {
    const state: UserState = {
      applicantType: req.query.applicantType as string | undefined,
      businessAgeYears: req.query.businessAgeYears
        ? Number(req.query.businessAgeYears)
        : undefined,
      region: req.query.region as string | undefined,
    };
    const r = await matchGrants({
      state,
      capability: (req.query.capability as string) ?? "",
      intent: (req.query.intent as string) ?? "",
    });
    res.json(r);
  });

  app.get("/api/grants/:id", async (req, res) => {
    const r = await getGrant({ id: req.params.id });
    res.status(r.found ? 200 : 404).json(r);
  });

  app.post("/mcp", auth, async (req, res) => {
    const server = buildMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.use("/", express.static(new URL("../../../web", import.meta.url).pathname));
  return app;
}
