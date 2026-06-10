/** Commit and push current work. Run through the preview runner. */
import { execFileSync } from "node:child_process";

const run = (args) => {
  console.log(`$ git ${args.join(" ")}`);
  console.log(execFileSync("git", args, { encoding: "utf8" }));
};

run(["add", "-A"]);
try {
  run([
    "commit",
    "-m",
    "feat: six-stage product agent for solo SaaS builders (framework rework) + UI polish",
    "-m",
    "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>",
  ]);
} catch (e) {
  console.log("commit:", e.stdout?.toString() ?? e.message);
}
run(["push", "origin", "master"]);
run(["log", "--oneline", "-3"]);
console.log("PUSH_DONE");
