import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import openApiDocument from "../../src/utils/openapi.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputPath = path.join(rootDir, "openapi.json");

fs.writeFileSync(outputPath, `${JSON.stringify(openApiDocument, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);