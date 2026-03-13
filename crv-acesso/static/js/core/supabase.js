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

const SUPABASE_URL = "https://sgimbhlstkfznkkonjej.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaW1iaGxzdGtmem5ra29uamVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTMxMTksImV4cCI6MjA4ODk4OTExOX0.UEWNh1MDIRc-P6EbCs3lMJsz1g_VWYrzXvu8p46UMdI";

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