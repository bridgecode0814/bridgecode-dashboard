// 화면이 슈퍼베이스 로그인을 시작하는 데 필요한 공개 설정값을 버셀 환경 변수에서 넘겨준다.
// SUPABASE_ANON_KEY 는 브라우저에 공개되도록 만들어진 키라 내보내도 된다.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: "server_not_configured" });
  return res.status(200).json({ supabaseUrl, supabaseAnonKey });
}
