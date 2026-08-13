import path from "node:path";
import { config } from "dotenv";
import { createServer } from "./server";

config({ path: path.join(process.cwd(), "../../.env") });

const port = process.env.PORT || 5001;
const server = createServer();

server.listen(port, () => {
  console.log(`api running on ${port}`);
});