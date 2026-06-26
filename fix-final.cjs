const fs = require("fs");

// ── Fix job.routes.js ──
const jp = "C:/job-portal/backend/src/routes/job.routes.js";
let jl = fs.readFileSync(jp, "utf8").split(/\r?\n/);
let jo = [];
let ji = 0;
while (ji < jl.length) {
  if (jl[ji] === "const createJobSchema = baseJobSchema.refine((data) => data.salaryNegotiable || (data.salaryMin != null && data.salaryMax != null), {") {
    jo.push("const salaryCheck = (data) => {");
    jo.push("  if (data.salaryNegotiable) return true;");
    jo.push("  if (data.salaryMin == null || data.salaryMax == null) return true;");
    jo.push("  return data.salaryMin < data.salaryMax;");
    jo.push("};", "");
    jo.push("const createJobSchema = baseJobSchema.refine(salaryCheck, {");
    jo.push("  message: \"salaryMin must be less than salaryMax\",");
    jo.push("  path: [\"salaryMin\"],");
    jo.push("}).refine((data) => data.salaryNegotiable || (data.salaryMin != null && data.salaryMax != null), {");
    jo.push("  message: \"Provide salaryMin and salaryMax unless salaryNegotiable is true\",");
    jo.push("  path: [\"salaryMin\"],");
    jo.push("});");
    jo.push("const updateJobSchema = baseJobSchema.partial().refine(salaryCheck, {");
    jo.push("  message: \"salaryMin must be less than salaryMax\",");
    jo.push("  path: [\"salaryMin\"],");
    jo.push("}); // All fields are optional for update");
    ji += 5;
  } else {
    jo.push(jl[ji]);
    ji++;
  }
}
fs.writeFileSync(jp, jo.join("\n"));
console.log("Fixed job.routes.js");

// ── Fix user.service.js ──
const up = "C:/job-portal/backend/src/services/user.service.js";
let ul = fs.readFileSync(up, "utf8").split(/\r?\n/);
let uo = [];
let ui = 0;
// Restore SUPER_ADMIN_ROLE after sendSuspensionEmail line
let addedConst = false;
while (ui < ul.length) {
  if (!addedConst && ul[ui] === "import { sendSuspensionEmail } from \"./email.service.js\";") {
    uo.push(ul[ui]);
    uo.push("");
    uo.push("const SUPER_ADMIN_ROLE = \"super_admin\";");
    addedConst = true;
    ui++;
  } else if (ul[ui].includes("import dotenv")) {
    ui += 2; // skip dotenv lines
  } else if (ul[ui].trimStart().startsWith("headline: data.headline || user.headline,")) {
    uo.push(ul[ui].replace(/data\.headline \|\| user\.headline/, "data.headline !== undefined ? data.headline : user.headline"));
    ui++;
  } else if (ul[ui].trimStart().startsWith("bio: data.bio || user.bio,")) {
    uo.push(ul[ui].replace(/data\.bio \|\| user\.bio/, "data.bio !== undefined ? data.bio : user.bio"));
    ui++;
  } else if (ul[ui].trimStart().startsWith("location: data.location || user.location,")) {
    uo.push(ul[ui].replace(/data\.location \|\| user\.location/, "data.location !== undefined ? data.location : user.location"));
    ui++;
  } else if (ul[ui].trimStart().startsWith("phone: data.phone || user.phone,")) {
    uo.push(ul[ui].replace(/data\.phone \|\| user\.phone/, "data.phone !== undefined ? data.phone : user.phone"));
    ui++;
  } else if (ul[ui].trimStart().startsWith("avatar: data.avatar || user.avatar,")) {
    uo.push(ul[ui].replace(/data\.avatar \|\| user\.avatar/, "data.avatar !== undefined ? data.avatar : user.avatar"));
    ui++;
  } else if (ul[ui].trimStart().startsWith("skills: data.skills || user.skills,")) {
    uo.push(ul[ui].replace(/data\.skills \|\| user\.skills/, "data.skills !== undefined ? data.skills : user.skills"));
    ui++;
  } else if (ul[ui].trimStart().startsWith("resume: data.resume || user.resume,")) {
    uo.push(ul[ui].replace(/data\.resume \|\| user\.resume/, "data.resume !== undefined ? data.resume : user.resume"));
    ui++;
  } else if (ul[ui] === "    email: data.email || user.email,") {
    ui++; // skip email from regular updateData
  } else if (ul[ui].includes("name: data.name || user.name,")) {
    uo.push(ul[ui].replace(/data\.name \|\| user\.name/, "data.name !== undefined ? data.name : user.name"));
    ui++;
  } else if (ul[ui] === "  // Only super_admin can change role or companyId") {
    // insert the email verification block before this
    uo.push("  // Only super_admin can change email (requires re-verification)");
    uo.push("  if (currentUser.role === SUPER_ADMIN_ROLE && data.email && data.email !== user.email) {");
    uo.push("    updateData.email = data.email;");
    uo.push("    updateData.isVerified = false;");
    uo.push("    updateData.verificationToken = crypto.randomBytes(32).toString(\"hex\");");
    uo.push("    updateData.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);");
    uo.push("  }");
    uo.push("");
    uo.push(ul[ui]);
    ui++;
  } else if (ul[ui].trim() === "data: { isSuspended: !user.isSuspended },") {
    uo.push("      data: { isSuspended: suspend },");
    ui++;
  } else if (ul[ui].trim() === "const suspendUser = async (id, reasons = [], adminId) => {") {
    uo.push("const suspendUser = async (id, suspend, reasons = [], adminId) => {");
    ui++;
  } else if (ul[ui] === ") {" && ui > 0 && ul[ui-1].trim().startsWith("if (toggledUser.isSuspended")) {
    // find the closing paren of the warningLog block - keep as is
    uo.push(ul[ui]);
    ui++;
  } else {
    uo.push(ul[ui]);
    ui++;
  }
}
fs.writeFileSync(up, uo.join("\n"));
console.log("Fixed user.service.js");