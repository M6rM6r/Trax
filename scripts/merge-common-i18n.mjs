import fs from "fs";

function mergeCommon(path) {
  const text = fs.readFileSync(path, "utf8");
  // Parse loses duplicate keys — recover both by splitting on top-level "Common"
  const re = /"Common"\s*:\s*\{/g;
  const indices = [];
  let m;
  while ((m = re.exec(text)) !== null) indices.push(m.index);
  if (indices.length < 2) {
    console.log(path, "no duplicate Common");
    return;
  }

  // Safer: deep-merge via JSON.parse of whole file after renaming second Common temporarily
  let renamed = text;
  let count = 0;
  renamed = renamed.replace(/"Common"\s*:/g, () => {
    count += 1;
    return count === 1 ? '"Common":' : '"Common__extra":';
  });
  const data = JSON.parse(renamed);
  const a = data.Common || {};
  const b = data.Common__extra || {};
  const merge = (x, y) => {
    const out = { ...x };
    for (const [k, v] of Object.entries(y)) {
      if (v && typeof v === "object" && !Array.isArray(v) && x[k] && typeof x[k] === "object") {
        out[k] = merge(x[k], v);
      } else if (out[k] === undefined) {
        out[k] = v;
      }
    }
    return out;
  };
  data.Common = merge(a, b);
  delete data.Common__extra;
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  console.log(path, "merged Common.state keys:", Object.keys(data.Common.state || {}).length);
}

mergeCommon("messages/ar.json");
mergeCommon("messages/en.json");
