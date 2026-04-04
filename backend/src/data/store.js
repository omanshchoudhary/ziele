import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'appData.json');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureStoreFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2));
  }
}

export function readStore() {
  ensureStoreFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function writeStore(nextState) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(nextState, null, 2));
  return clone(nextState);
}

export function withStore(mutator) {
  const current = readStore();
  const nextState = mutator(clone(current)) || current;
  return writeStore(nextState);
}
