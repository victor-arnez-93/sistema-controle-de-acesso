/* ==========================================================
   CRV CONTROLE DE ACESSO
   AUTH.JS
   Login local + preparado para Supabase
   ========================================================== */

/* ==========================================================
   CONFIGURAÇÕES
   ========================================================== */

const ROTA_DASHBOARD = "dashboard.html";
const ROTA_LOGIN = "login.html";

/* ==========================================================
   USUÁRIO DE TESTE
   ========================================================== */

const USUARIO_TESTE = {
    id: "admin-local",
    email: "login@sistema.com",
    senha: "admin123",
    nome: "Administrador",
    perfil: "admin"
};

/* ==========================================================
   HELPERS
   ========================================================== */

function mostrarErro(msg){

    const box = document.getElementById("login-error");
    const text = document.getElementById("login-error-message");

    if(!box || !text){
        alert(msg);
        return;
    }

    text.textContent = msg;
    box.style.display = "flex";

}

function esconderErro(){

    const box = document.getElementById("login-error");

    if(box) box.style.display = "none";

}

function salvarUsuarioLocal(usuario){

    localStorage.setItem(
        "usuario_logado",
        JSON.stringify(usuario)
    );

    window.usuarioLogado = usuario;

}

function limparUsuarioLocal(){

    localStorage.removeItem("usuario_logado");

}

/* ==========================================================
   LOGIN LOCAL (TESTE)
   ========================================================== */

async function fazerLogin(email, senha, lembrar){

    try{

        esconderErro();

        console.log("🔐 Tentando login...");

        /* LOGIN DE TESTE */

        if(
            email === USUARIO_TESTE.email &&
            senha === USUARIO_TESTE.senha
        ){

            const usuario = {
                id: USUARIO_TESTE.id,
                email: USUARIO_TESTE.email,
                nome: USUARIO_TESTE.nome,
                perfil: USUARIO_TESTE.perfil
            };

            salvarUsuarioLocal(usuario);

            if(lembrar){
                localStorage.setItem("lembrar_me","true");
            }

            console.log("✅ Login local OK");

            window.location.href = ROTA_DASHBOARD;

            return;

        }

        throw new Error("Email ou senha inválidos.");

    }catch(err){

        console.error("❌ Erro login:", err);

        mostrarErro(
            err.message || "Erro ao fazer login."
        );

    }

}

/* ==========================================================
   LOGOUT GLOBAL
   ========================================================== */

function fazerLogout(){

    limparUsuarioLocal();

    window.location.href = ROTA_LOGIN;

}

/* ==========================================================
   PROTEGER PÁGINAS (SE NÃO ESTIVER LOGADO)
   ========================================================== */

function protegerPagina(){

    const usuario = localStorage.getItem("usuario_logado");

    if(!usuario){

        console.warn("⚠️ Usuário não autenticado");

        window.location.href = ROTA_LOGIN;

        return;

    }

    try{

        window.usuarioLogado = JSON.parse(usuario);

    }catch(e){

        console.error("Erro ao ler usuário");

        limparUsuarioLocal();

        window.location.href = ROTA_LOGIN;

    }

}

/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

document.addEventListener("DOMContentLoaded", ()=>{

    const path = window.location.pathname;

    const paginaLogin =
        path.includes("login");

    /* SE NÃO FOR LOGIN -> PROTEGER */

    if(!paginaLogin){

        protegerPagina();

        return;

    }

    /* LOGIN */

    const form = document.getElementById("loginForm");

    if(!form){

        console.warn("Form login não encontrado");

        return;

    }

    const usuarioLogado = localStorage.getItem("usuario_logado");

    if(usuarioLogado){

        window.location.href = ROTA_DASHBOARD;

        return;

    }

    form.addEventListener("submit", async (e)=>{

        e.preventDefault();

        const email =
            document.getElementById("email")?.value.trim();

        const senha =
            document.getElementById("senha")?.value;

        const lembrar =
            document.getElementById("lembrar-me")?.checked || false;

        if(!email || !senha){

            mostrarErro("Preencha email e senha.");

            return;

        }

        await fazerLogin(email, senha, lembrar);

    });

});