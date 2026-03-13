/* ==========================================================
   CRV CONTROLE DE ACESSO
   PERMISSOES.JS
   Controle de acesso por perfil
   ========================================================== */

/* ==========================================================
   PERFIS DO SISTEMA
   ========================================================== */

const PERFIS = {

    admin: 4,
    gerente: 3,
    operador: 2,
    portaria: 1

};

/* ==========================================================
   OBTER PERFIL ATUAL
   ========================================================== */

function obterPerfilAtual(){

    if(!window.usuarioLogado) return null;

    return window.usuarioLogado.perfil;

}

/* ==========================================================
   VERIFICAR PERMISSÃO
   ========================================================== */

function possuiPermissao(perfilNecessario){

    const perfilUsuario = obterPerfilAtual();

    if(!perfilUsuario) return false;

    const nivelUsuario = PERFIS[perfilUsuario] || 0;
    const nivelNecessario = PERFIS[perfilNecessario] || 0;

    return nivelUsuario >= nivelNecessario;

}

/* ==========================================================
   BLOQUEAR ELEMENTOS SEM PERMISSÃO
   ========================================================== */

function aplicarPermissoesUI(){

    const elementos = document.querySelectorAll("[data-permissao]");

    elementos.forEach(el => {

        const perfilNecessario = el.dataset.permissao;

        if(!possuiPermissao(perfilNecessario)){

            el.style.display = "none";

        }

    });

}

/* ==========================================================
   EXPOR GLOBAL
   ========================================================== */

window.permissoesCRV = {

    obterPerfilAtual,
    possuiPermissao,
    aplicarPermissoesUI

};