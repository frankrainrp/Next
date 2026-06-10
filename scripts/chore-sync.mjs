/** One-shot housekeeping: copy framework doc into docs/, remove superseded prompt files. */
import { copyFileSync, rmSync, existsSync } from "node:fs";

copyFileSync("D:/User/asus/Desktop/framework.md", "docs/saas-blueprint-framework.md");
console.log("framework.md copied to docs/saas-blueprint-framework.md");

const stale = [
  "prompt/en/step1_requirement_capture.md",
  "prompt/en/step2_deep_discovery.md",
  "prompt/en/step3_node_breakdown.md",
  "prompt/en/step4_three_round_confirmation.md",
  "prompt/en/step5_execution_planning.md",
  "prompt/en/step6_continuous_tracking.md",
];
for (const file of stale) {
  if (existsSync(file)) {
    rmSync(file);
    console.log(`removed ${file}`);
  }
}
console.log("CHORE_SYNC_DONE");
