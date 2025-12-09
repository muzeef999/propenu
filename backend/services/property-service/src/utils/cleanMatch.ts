// src/utils/cleanMatch.ts
export default function cleanMatch(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const out: any = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (typeof v === "object") {
      // if it's an operator object like {$gte: 1} keep cleaned operator
      const cleaned = cleanMatch(v);
      if (typeof cleaned === "object") {
        // keep only if has keys
        if (Array.isArray(cleaned) ? cleaned.length > 0 : Object.keys(cleaned).length > 0) {
          out[k] = cleaned;
        } else {
          // skip empty
        }
      } else {
        out[k] = cleaned;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}
