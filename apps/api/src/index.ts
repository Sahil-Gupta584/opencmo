import path from "node:path";
import { config } from "dotenv";
import { createServer } from "./server";

config({ path: path.join(process.cwd(), "../../.env") });

// Top-level await ensures dotenv is loaded before env validation runs
await import("@repo/backend");

const port = process.env.API_PORT || process.env.PORT || 5001;
const server = createServer();

server.listen(port, () => {
  console.log(`api running on ${port}`);
});