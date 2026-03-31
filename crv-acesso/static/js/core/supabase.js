// ==========================================
// SUPABASE — CLIENTE GLOBAL
// ==========================================

const SUPABASE_URL = "https://sgimbhlstkfznkkonjej.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaW1iaGxzdGtmem5ra29uamVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTMxMTksImV4cCI6MjA4ODk4OTExOX0.UEWNh1MDIRc-P6EbCs3lMJsz1g_VWYrzXvu8p46UMdI";

// Instância única
let sb = null;

// ==========================================
// INIT
// ==========================================

function initSupabase() {

  try {

    if (!window.supabase) {
      console.error("[SUPABASE] Lib não carregada");
      return null;
    }

    sb = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    console.log("[SUPABASE] Inicializado");

    return sb;

  } catch (err) {

    console.error("[SUPABASE] Erro ao iniciar:", err);

    return null;

  }

}

// ==========================================
// GET CLIENT
// ==========================================

function getSupabase() {

  if (!sb) {
    console.warn("[SUPABASE] Ainda não inicializado");
  }

  return sb;

}

// ==========================================
// TESTE DE CONEXÃO
// ==========================================

async function testarConexao() {

  if (!sb) return false;

  try {

    const { error } = await sb
      .from("empresas")
      .select("id")
      .limit(1);

    if (error) {
      console.warn("[SUPABASE] Sem conexão:", error.message);
      return false;
    }

    console.log("[SUPABASE] Conexão OK");

    return true;

  } catch (err) {

    console.error("[SUPABASE] Erro conexão:", err);

    return false;

  }

}

// ==========================================
// EXPORT GLOBAL (PADRÃO DO SISTEMA)
// ==========================================

window.initSupabase = initSupabase;
window.getSupabase = getSupabase;
window.testarConexao = testarConexao;
initSupabase();