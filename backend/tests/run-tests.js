import assert from "node:assert/strict";
import { getServiceReadinessSnapshot } from "../src/config/env.js";

function run() {
  const services = getServiceReadinessSnapshot();

  assert.equal(typeof services.clerk.configured, "boolean");
  assert.equal(typeof services.database.configured, "boolean");
  assert.equal(typeof services.redis.configured, "boolean");
  assert.equal(typeof services.cloudinary.configured, "boolean");
  assert.equal(typeof services.resend.configured, "boolean");
  assert.equal(typeof services.gemini.configured, "boolean");
  assert.equal(typeof services.libreTranslate.configured, "boolean");

  console.log("Backend tests passed.");
}

run();
