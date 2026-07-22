const { cpSync, existsSync, mkdirSync } = require("node:fs");
const { resolve } = require("node:path");

const source = resolve(__dirname, "../src/assets");
const destination = resolve(__dirname, "../dist/assets");

if (existsSync(source)) {
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}
