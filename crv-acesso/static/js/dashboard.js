/* ============================================================
   DASHBOARD — CRV CONTROLE DE ACESSO
   ============================================================ */

console.log("📊 DASHBOARD.JS iniciado");

// ==========================================
// INIT
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

  console.log("🚀 DASHBOARD carregando...");

  renderDataAtual();

  await inicializarDashboard();

});


// ==========================================
// INIT COMPLETO
// ==========================================

async function inicializarDashboard() {

  try {

    console.log("🔎 Verificando API...");

    const api = window.apiCRV;

    if (!api) {
      console.warn("❌ API não encontrada");
      return;
    }

    console.log("✅ API encontrada");

    if (!api.getKPIsDashboard) {
      console.warn("❌ Método getKPIsDashboard não encontrado");
      return;
    }

    console.log("📡 Carregando KPIs...");

    const kpis = await api.getKPIsDashboard();

    if (!kpis) {
      console.warn("⚠️ Nenhum dado retornado");
      limparKPIs();
      return;
    }

    console.log("✅ KPIs carregados:", kpis);

    aplicarKPIs(kpis);

  } catch (err) {

    console.error("❌ Erro no dashboard:", err);

    limparKPIs();

  }

}


// ==========================================
// DATA ATUAL
// ==========================================

function renderDataAtual() {

  const el = document.getElementById("dashboard-date");

  if (!el) {
    console.warn("⚠️ Elemento data não encontrado");
    return;
  }

  const hoje = new Date();

  el.textContent = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  console.log("📅 Data renderizada");

}


// ==========================================
// APLICAR KPIs
// ==========================================

function aplicarKPIs(kpis) {

  setValor("kpi-total", kpis.totalFuncionarios);
  setValor("kpi-ativos", kpis.ativos);
  setValor("kpi-inativos", kpis.inativos);
  setValor("kpi-acessos", kpis.acessosHoje);

  console.log("📊 KPIs aplicados na tela");

}


// ==========================================
// HELPERS
// ==========================================

function setValor(id, valor) {

  const el = document.getElementById(id);

  if (!el) {
    console.warn(`⚠️ Elemento não encontrado: ${id}`);
    return;
  }

  el.textContent = valor ?? 0;

}

function limparKPIs() {

  setValor("kpi-total", "--");
  setValor("kpi-ativos", "--");
  setValor("kpi-inativos", "--");
  setValor("kpi-acessos", "--");

  console.warn("🧹 KPIs resetados");

}