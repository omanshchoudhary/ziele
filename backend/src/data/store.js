import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedData } from "./seedData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "appData.json");

const REQUIRED_ARRAY_KEYS = [
  "posts",
  "profiles",
  "comments",
  "notifications",
  "users",
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStoreShape(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const normalized = { ...source };

  for (const key of REQUIRED_ARRAY_KEYS) {
    if (!Array.isArray(normalized[key])) {
      normalized[key] = [];
    }
  }

  return normalized;
}

function getInitialSeedState() {
  return normalizeStoreShape(seedData);
}

function ensureStoreFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(getInitialSeedState(), null, 2));
    return;
  }

  const raw = fs.readFileSync(DATA_FILE, "utf-8");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fs.writeFileSync(DATA_FILE, JSON.stringify(getInitialSeedState(), null, 2));
    return;
  }

  const normalized = normalizeStoreShape(parsed);
  if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2));
  }
}

export function readStore() {
  ensureStoreFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = getInitialSeedState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2));
  }

  return normalizeStoreShape(parsed);
}

export function writeStore(nextState) {
  const normalized = normalizeStoreShape(nextState);
  fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2));
  return clone(normalized);
}

export function withStore(mutator) {
  const current = readStore();
  const draft = clone(current);
  const maybeNext = mutator(draft);
  const nextState = maybeNext ?? draft;
  return writeStore(nextState);
}
