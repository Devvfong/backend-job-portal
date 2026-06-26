const fs = require("fs");
const p = "C:/job-portal/backend/src/routes/job.routes.js";
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
const out = [];
let i = 0;
while (i < lines.length) {
  if (lines[i] === "const salaryRangeSchema = baseJobSchema.refine((data) => {") {
    out.push(lines[i]);
    i++;
    while (i < lines.length && !lines[i].includes("});")) { out.push(lines[i]); i++; }
    out.push(lines[i]); i++; // closing });
    out.push("");
    out.push("const createJobSchema = salaryRangeSchema.refine((data) => data.salaryNegotiable || (data.salaryMin != null && data.salaryMax != null), {");
    i++;
  } else if (lines[i] === "const updateJobSchema = salaryRangeSchema.partial(); // All fields are optional for update") {
    out.push("const updateJobSchema = baseJobSchema.partial().refine((data) => {");
    out.push("  if (data.salaryNegotiable) return true;");
    out.push("  if (data.salaryMin == null || data.salaryMax == null) return true;");
    out.push("  return data.salaryMin < data.salaryMax;");
    out.push("}, {");
    out.push("  message: \"salaryMin must be less than salaryMax\",");
    out.push("  path: [\"salaryMin\"],");
    out.push("}); // All fields are optional for update");
    i++;
  } else {
    out.push(lines[i]);
    i++;
  }
}
fs.writeFileSync(p, out.join("\n"));
console.log("Fixed zod partial+refine issue");