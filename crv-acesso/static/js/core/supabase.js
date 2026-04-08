/* ==========================================
   SUPABASE — CLIENTE GLOBAL
   ========================================== */

const SUPABASE_URL      = "https://sgimbhlstkfznkkonjej.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaW1iaGxzdGtmem5ra29uamVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTMxMTksImV4cCI6MjA4ODk4OTExOX0.UEWNh1MDIRc-P6EbCs3lMJsz1g_VWYrzXvu8p46UMdI";

/* ── Guard: uma única instância em toda a página ── */
if (!window._sbClient) {
  if (!window.supabase) {
    console.error("[SUPABASE] Lib CDN não carregada. Verifique o <script> do CDN.");
  } else {
    window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
    console.log("[SUPABASE] Inicializado");
  }
}

/* ==========================================
   FUNÇÕES GLOBAIS
   ========================================== */

window.getSupabase = function () {
  if (!window._sbClient) console.warn("[SUPABASE] Cliente não disponível.");
  return window._sbClient || null;
};

window.initSupabase = function () {
  return window._sbClient || null;
};

window.testarConexao = async function () {
  const sb = window._sbClient;
  if (!sb) return false;
  try {
    const { error } = await sb.from("usuarios").select("id").limit(1);
    if (error) { console.warn("[SUPABASE] Sem conexão:", error.message); return false; }
    console.log("[SUPABASE] Conexão OK");
    return true;
  } catch (err) {
    console.error("[SUPABASE] Erro conexão:", err);
    return false;
  }
};