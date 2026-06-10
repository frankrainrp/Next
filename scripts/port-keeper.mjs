/** Keeps a trivial HTTP port open so one-shot chores can run through the preview runner. */
import { createServer } from "node:http";
createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("chore done");
}).listen(3998, () => console.log("CHORE_COMPLETE — port-keeper on 3998"));
