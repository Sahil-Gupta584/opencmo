import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), "../../.env") });

await import("@repo/backend");

const { createServer } = await import("./server");
const port = process.env.API_PORT || process.env.PORT || 5001;
const server = createServer();

server.listen(port, () => {
  console.log(`api running on ${port}`);
});
