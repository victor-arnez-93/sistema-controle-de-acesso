/* ==========================================================
   CRV CONTROLE DE ACESSO — AUTH.JS
   ========================================================== */

const ROTA_DASHBOARD = "dashboard.html";
const ROTA_LOGIN     = "login.html";

/* ==========================================================
   HELPERS DE UI
   ========================================================== */

function mostrarErro(msg) {
  const box  = document.getElementById("login-error");
  const text = document.getElementById("login-error-message");
  if (!box || !text) { alert(msg); return; }
  text.textContent = msg;
  box.style.display = "flex";
}

function esconderErro() {
  const box = document.getElementById("login-error");
  if (box) box.style.display = "none";
}

function setBtnLoading(loading) {
  const btn = document.getElementById("btn-login");
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<i class="ph ph-circle-notch"></i> Entrando...'
    : '<i class="ph ph-sign-in"></i> Entrar';
}

/* ==========================================================
   SESSÃO LOCAL
   ========================================================== */

function salvarUsuarioLocal(usuario) {
  localStorage.setItem("usuario_logado", JSON.stringify(usuario));
  window.usuarioLogado = usuario;
}

function limparUsuarioLocal() {
  localStorage.removeItem("usuario_logado");
  localStorage.removeItem("lembrar_me");
  window.usuarioLogado = null;
}

/* ==========================================================
   LOGIN
   ========================================================== */

async function fazerLogin(email, senha, lembrar) {
  esconderErro();
  setBtnLoading(true);

  try {
    // ── Pega o cliente Supabase (mesmo padrão do resto do sistema)
    const supabase = window.getSupabase?.();

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado. Verifique o supabase.js.");
    }

    // ── 1. Autenticar no Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (authError) {
      // Traduz os erros mais comuns para português
      const erros = {
        "Invalid login credentials":  "E-mail ou senha inválidos.",
        "Email not confirmed":         "E-mail ainda não confirmado. Contate o administrador.",
        "User not found":              "Usuário não encontrado.",
        "Too many requests":           "Muitas tentativas. Aguarde alguns minutos.",
      };
      throw new Error(erros[authError.message] || authError.message);
    }

    const authUser = data.user;
    console.log("✅ Auth OK:", authUser.email);

    // ── 2. Buscar perfil na tabela usuarios
    //    O id da tabela usuarios É o mesmo UUID do auth.users (sem coluna auth_id separada)
    const { data: perfil, error: perfilError } = await supabase
      .from("usuarios")
      .select("id, nome, perfil, ativo")
      .eq("id", authUser.id)   // ← corrigido: id direto, não auth_id
      .maybeSingle();

    if (perfilError) {
      throw new Error("Erro ao buscar perfil: " + perfilError.message);
    }

    if (!perfil) {
      // Auth existe mas tabela não tem o registro — admin precisa cadastrar
      await supabase.auth.signOut();
      throw new Error("Usuário autenticado mas sem perfil no sistema. Contate o administrador.");
    }

    if (!perfil.ativo) {
      await supabase.auth.signOut();
      throw new Error("Usuário desativado. Contate o administrador.");
    }

    // ── 3. Salvar sessão e redirecionar
    const usuario = {
      id:     perfil.id,
      email:  authUser.email,
      nome:   perfil.nome,
      perfil: perfil.perfil,
    };

    salvarUsuarioLocal(usuario);
    if (lembrar) localStorage.setItem("lembrar_me", "true");

    // Atualiza ultimo_login na tabela (fire-and-forget)
    supabase
      .from("usuarios")
      .update({ ultimo_login: new Date().toISOString() })
      .eq("id", perfil.id)
      .then(() => {});

    console.log("✅ Login completo:", usuario.nome, `(${usuario.perfil})`);
    window.location.href = ROTA_DASHBOARD;

  } catch (err) {
    console.error("❌ Erro login:", err.message);
    mostrarErro(err.message || "Erro ao fazer login.");
  } finally {
    setBtnLoading(false);
  }
}

/* ==========================================================
   LOGOUT
   ========================================================== */

async function fazerLogout() {
  try {
    const supabase = window.getSupabase?.();
    if (supabase) await supabase.auth.signOut();
  } catch (e) {
    console.warn("Erro ao encerrar sessão Supabase:", e);
  } finally {
    limparUsuarioLocal();
    window.location.href = ROTA_LOGIN;
  }
}

/* ==========================================================
   PROTEGER PÁGINAS
   ========================================================== */

function protegerPagina() {
  const raw = localStorage.getItem("usuario_logado");
  if (!raw) {
    window.location.href = ROTA_LOGIN;
    return null;
  }
  try {
    const usuario = JSON.parse(raw);
    window.usuarioLogado = usuario;
    return usuario;
  } catch {
    limparUsuarioLocal();
    window.location.href = ROTA_LOGIN;
    return null;
  }
}

/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const pagina     = window.location.pathname.split("/").pop();
  const ehLogin    = pagina === "login.html" || pagina === "";
  const ehRecupera = pagina === "recuperacao_senha.html";

  // Páginas públicas — não proteger
  if (ehLogin || ehRecupera) {

    // Se já está logado, vai direto pro dashboard
    if (localStorage.getItem("usuario_logado")) {
      window.location.href = ROTA_DASHBOARD;
      return;
    }

    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email   = document.getElementById("email")?.value.trim();
      const senha   = document.getElementById("senha")?.value;
      const lembrar = document.getElementById("lembrar-me")?.checked || false;

      if (!email || !senha) {
        mostrarErro("Preencha e-mail e senha.");
        return;
      }

      await fazerLogin(email, senha, lembrar);
    });

    return;
  }

  // Todas as outras páginas — proteger
// Todas as outras páginas — proteger e verificar permissão
const usuario = protegerPagina();
if (usuario) {
  // Verifica se o perfil tem acesso a esta tela específica
  window.verificarAcessoTela?.();
  // Filtra o menu da sidebar pelo perfil
  // (chamado após a sidebar ser montada pelo main.js)
  document.addEventListener('sidebar-ready', () => {
    window.filtrarMenuPorPerfil?.(usuario.perfil);
  });
  // Fallback: tenta filtrar após 300ms se o evento não disparar
  setTimeout(() => window.filtrarMenuPorPerfil?.(usuario.perfil), 300);
}
});