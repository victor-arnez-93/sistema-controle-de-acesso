/* ==========================================================
   CRV CONTROLE DE ACESSO
   SESSION.JS
   Gerenciamento de sessão
   ========================================================== */

/* ==========================================================
   OBTER USUÁRIO LOGADO
   ========================================================== */

function obterUsuarioLogado(){

    const data = localStorage.getItem("usuario_logado");

    if(!data) return null;

    try{

        return JSON.parse(data);

    }catch(err){

        console.error("Erro ao ler sessão:", err);

        localStorage.removeItem("usuario_logado");

        return null;

    }

}

/* ==========================================================
   DEFINIR USUÁRIO
   ========================================================== */

function definirUsuarioSessao(usuario){

    if(!usuario) return;

    localStorage.setItem(
        "usuario_logado",
        JSON.stringify(usuario)
    );

    window.usuarioLogado = usuario;

}

/* ==========================================================
   ENCERRAR SESSÃO
   ========================================================== */

function encerrarSessao(){

    localStorage.removeItem("usuario_logado");

    window.usuarioLogado = null;

}

/* ==========================================================
   VERIFICAR LOGIN
   ========================================================== */

function usuarioEstaLogado(){

    const usuario = obterUsuarioLogado();

    return !!usuario;

}

/* ==========================================================
   EXPOR GLOBAL
   ========================================================== */

window.sessionCRV = {

    obterUsuarioLogado,
    definirUsuarioSessao,
    encerrarSessao,
    usuarioEstaLogado

};