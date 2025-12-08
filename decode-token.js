#!/usr/bin/env node
// Simple JWT decoder for local debugging (DO NOT share tokens publicly)
const token = process.argv[2];
if (!token) {
  console.error("Usage: node decode-token.js <JWT_TOKEN>");
  process.exit(1);
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString("utf8");
}

try {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("Not a JWT token");
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));

  console.log("\n=== JWT Header ===");
  console.log(JSON.stringify(header, null, 2));
  console.log("\n=== JWT Payload ===");
  console.log(JSON.stringify(payload, null, 2));

  if (payload.iat)
    console.log(
      "\nissued at (iat):",
      payload.iat,
      "=>",
      new Date(payload.iat * 1000).toString()
    );
  if (payload.exp)
    console.log(
      "expires at (exp):",
      payload.exp,
      "=>",
      new Date(payload.exp * 1000).toString()
    );
  if (payload.aud) console.log("audience (aud):", payload.aud);
  if (payload.iss) console.log("issuer (iss):", payload.iss);
  if (payload.sub) console.log("subject (sub):", payload.sub);
  if (payload.user_id) console.log("user_id:", payload.user_id);

  console.log(
    "\nNote: This does NOT verify the signature; it only decodes the token payload for debugging."
  );
} catch (err) {
  console.error("Failed to decode token:", err.message || err);
  process.exit(2);
}
