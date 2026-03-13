/* ==========================================================
   CRV CONTROLE DE ACESSO
   SUPABASE.JS
   Inicialização do cliente Supabase
   ========================================================== */

/* ==========================================================
   CONFIGURAÇÃO
   ========================================================== */

/*
   Pegue estes valores no painel do Supabase:

   Project Settings
   → API
*/

const SUPABASE_URL = "https://SEU_PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA_PUBLIC_ANON_KEY";

/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

(function(){

    try{

        if(!window.supabase){
            console.error("Supabase JS não carregado.");
            return;
        }

        window.sb = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        console.log("🟢 Supabase inicializado");

    }catch(err){

        console.error("Erro ao iniciar Supabase:", err);

    }

})();