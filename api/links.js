// 대시보드 데이터 API.
// 슈퍼베이스로 로그인한 사람의 구글 이메일이 시트 '허용계정' 탭에 있을 때만 목록을 돌려준다.
// 시트는 '웹에 게시' 없이 비공개로 두고, 시트 읽기용 서비스 계정으로 읽는다.
import { createSign } from "node:crypto";

const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_JSON"];
const ALLOW_TAB = "허용계정";
const DATA_TAB_GID = 0; // 대시보드 목록이 있는 탭 (시트 주소의 gid=0)
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

let googleToken = null; // { value, expiresAt } — 함수 인스턴스가 살아 있는 동안 재사용

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) return res.status(500).json({ error: "server_not_configured", missing });

  const authHeader = req.headers.authorization || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!accessToken) return res.status(401).json({ error: "no_session" });

  let user;
  try {
    user = await getSupabaseUser(accessToken);
  } catch (e) {
    console.error("supabase auth check failed:", e);
    return res.status(502).json({ error: "auth_unavailable" });
  }
  if (!user) return res.status(401).json({ error: "invalid_session" });

  // 구글이 확인해 준 이메일만 인정한다 (슈퍼베이스 이메일 가입으로 남의 주소를 쓰는 경우 차단)
  const googleEmails = (user.identities || [])
    .filter((i) => i.provider === "google")
    .map((i) => normalizeEmail(i.identity_data && i.identity_data.email))
    .filter(Boolean);
  if (!googleEmails.length) return res.status(403).json({ error: "not_allowed", email: user.email || "" });

  let sheet;
  try {
    sheet = await readSheet();
  } catch (e) {
    console.error("sheet read failed:", e);
    return res.status(500).json({ error: e.code || "sheet_unavailable" });
  }

  const email = googleEmails.find((e) => sheet.allowed.has(e));
  if (!email) return res.status(403).json({ error: "not_allowed", email: googleEmails[0] });

  return res.status(200).json({ email, rows: sheet.rows });
}

async function getSupabaseUser(accessToken) {
  const r = await fetch(process.env.SUPABASE_URL.replace(/\/+$/, "") + "/auth/v1/user", {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: "Bearer " + accessToken },
  });
  if (r.status === 401 || r.status === 403) return null;
  if (!r.ok) throw new Error("supabase /auth/v1/user " + r.status);
  return r.json();
}

async function readSheet() {
  const token = await getGoogleToken();
  const base = "https://sheets.googleapis.com/v4/spreadsheets/" + encodeURIComponent(process.env.SHEET_ID);

  const meta = await googleGet(base + "?fields=sheets.properties(sheetId,title)", token);
  const tabs = (meta.sheets || []).map((s) => s.properties);
  const dataTab = tabs.find((t) => t.sheetId === DATA_TAB_GID) || tabs[0];
  const allowTab = tabs.find((t) => t.title.replace(/\s/g, "") === ALLOW_TAB);
  if (!allowTab) throw coded(new Error("'" + ALLOW_TAB + "' tab not found"), "allow_tab_missing");

  const ranges = [dataTab.title, allowTab.title]
    .map((title) => "ranges=" + encodeURIComponent("'" + title.replace(/'/g, "''") + "'!A1:Z1000"))
    .join("&");
  const batch = await googleGet(base + "/values:batchGet?" + ranges, token);
  const [data, allow] = batch.valueRanges;
  return { rows: toRows(data.values || []), allowed: collectEmails(allow.values || []) };
}

async function getGoogleToken() {
  if (googleToken && googleToken.expiresAt > Date.now() + 60_000) return googleToken.value;

  let assertion;
  try {
    const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const now = Math.floor(Date.now() / 1000);
    const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
    const unsigned =
      encode({ alg: "RS256", typ: "JWT" }) +
      "." +
      encode({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      });
    assertion = unsigned + "." + createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  } catch (e) {
    // 원래 오류 문구에는 키 내용 일부가 들어갈 수 있어 로그에 남기지 않는다
    throw coded(new Error("GOOGLE_SERVICE_ACCOUNT_JSON unusable (" + e.name + ")"), "service_account_invalid");
  }

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!r.ok) throw coded(new Error("google token " + r.status + ": " + (await r.text())), "service_account_invalid");
  const body = await r.json();
  googleToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return googleToken.value;
}

async function googleGet(url, token) {
  const r = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  if (r.ok) return r.json();
  const text = await r.text();
  const err = new Error("sheets api " + r.status + ": " + text);
  if (r.status === 404) throw coded(err, "sheet_not_found");
  if (r.status === 403 && /SERVICE_DISABLED|has not been used|is disabled/.test(text)) throw coded(err, "sheets_api_disabled");
  if (r.status === 403) throw coded(err, "sheet_not_shared");
  throw err;
}

// 첫 행을 열 이름으로 삼아 [{id, section, label, type, url, code}, ...] 로 바꾼다
function toRows(values) {
  if (!values.length) return [];
  const keys = values[0].map((k) => String(k).trim());
  return values
    .slice(1)
    .filter((row) => row.some((v) => String(v).trim()))
    .map((row) => Object.fromEntries(keys.map((k, i) => [k, String(row[i] ?? "").trim()])));
}

// '허용계정' 탭의 모든 칸에서 이메일 주소만 뽑는다 ("이름 <메일>" 형식도 허용)
function collectEmails(values) {
  const set = new Set();
  for (const row of values) for (const cell of row) for (const m of String(cell).match(EMAIL_RE) || []) set.add(normalizeEmail(m));
  return set;
}

function normalizeEmail(s) {
  return String(s || "").trim().toLowerCase();
}

function coded(err, code) {
  err.code = code;
  return err;
}
