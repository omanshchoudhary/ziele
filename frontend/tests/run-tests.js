import assert from "node:assert/strict";
import { formatCompactNumber } from "../src/lib/formatters.js";

function run() {
  assert.equal(formatCompactNumber(950), "950");
  assert.equal(formatCompactNumber(1500), "1.5k");
  assert.equal(formatCompactNumber(2300000), "2.3m");

  console.log("Frontend tests passed.");
}

run();
