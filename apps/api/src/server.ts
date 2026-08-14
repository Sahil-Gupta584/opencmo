import bodyParser from "body-parser";
import cors from "cors";
import express, {
  type Express,
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from "express";
import morgan from "morgan";
import { handleDodoWebhook } from "./webhooks/dodo";
import {openApiHandler, rpcHandler} from "@repo/backend";
const { json, urlencoded } = bodyParser;

type OrpcFetchHandler = {
  handle(
    request: Request,
    options: { prefix?: `/${string}`; context: { headers: Headers } },
  ): Promise<{ matched: boolean; response?: Response | undefined }>;
};

type OrpcHandlers = { rpcHandler: OrpcFetchHandler; openApiHandler: OrpcFetchHandler };

let orpc: OrpcHandlers | undefined;

async function getOrpc(): Promise<OrpcHandlers> {
  if (!orpc) {
    orpc = {
      rpcHandler,
        openApiHandler,
    };
  }
  return orpc;
}

function buildRequest(req: ExpressRequest): Request {
  const url = new URL(req.originalUrl || req.url, `http://${req.headers.host || "localhost"}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  let body: RequestInit["body"] | undefined;
  if (!["GET", "HEAD"].includes(req.method) && req.body !== undefined && req.body !== null) {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    headers.set("content-type", "application/json");
  }

  return new Request(url, {
    method: req.method,
    headers,
    ...(body !== undefined ? { body } : {}),
  });
}

async function serveFetchHandler(
  handler: OrpcFetchHandler,
  prefix: `/${string}`,
  req: ExpressRequest,
  res: ExpressResponse,
) {
  const request = buildRequest(req);
  const { response } = await handler.handle(request, {
    prefix,
    context: { headers: request.headers },
  });

  if (!response) {
    res.status(404).json({ error: "Not Found" });
    return;
  }

  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.send(Buffer.from(await response.arrayBuffer()));
}

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use((req, res, next) => {
      if (req.path === "/health" || req.method === "OPTIONS") return next();
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "-";
      console.log(`→ ${req.method} ${req.originalUrl} ip=${ip} ua=${req.headers["user-agent"] || "-"} ct=${req.headers["content-type"] || "-"}`);
      const start = Date.now();
      res.on("finish", () => {
        console.log(`← ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
      });
      next();
    })
    .use(
      "/api/webhook/dodo",
      bodyParser.text({ type: () => true }),
      async (req, res, next) => {
        try {
          // Lazy import so @repo/database (which reads env at module load)
          // is only loaded after dotenv config has run in index.ts
          await handleDodoWebhook(req, res);
        } catch (error) {
          next(error);
        }
      },
    )
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(
      cors({
        origin: (origin, callback) => {
          const allowed = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) ?? [
            process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
          ];
          if (!origin || allowed.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          }
        },
        credentials: true,
      }),
    )
    .get("/message/:name", (req, res) => {
      return res.json({ message: `hello ${req.params.name}` });
    })
    .get("/health", (_, res) => {
      return res.json({ ok: true });
    });

  app.all("/api/rpc/*", async (req, res, next) => {
    try {
      const { rpcHandler } = await getOrpc();
      await serveFetchHandler(rpcHandler, "/api/rpc", req, res);
    } catch (error) {
      next(error);
    }
  });

  app.all("/api/*", async (req, res, next) => {
    try {
      const { openApiHandler } = await getOrpc();
      await serveFetchHandler(openApiHandler, "/api", req, res);
    } catch (error) {
      next(error);
    }
  });

  return app;
};