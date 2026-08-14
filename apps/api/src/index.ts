import "./env-init";
import "@repo/backend";
import { createServer } from "./server";

const port = process.env.API_PORT || process.env.PORT || 5001;
const server = createServer();

server.listen(port, () => {
  console.log(`api running on ${port}`);
});
