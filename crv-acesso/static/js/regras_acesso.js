/* ============================================================
   REGRAS DE ACESSO — regras_acesso.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModal();
});

/* ---- Abas ---- */
function initTabs() {
  const paineis = {
    regras:   'tab-regras',
    grupos:   'tab-grupos',
    horarios: 'tab-horarios',
    areas:    'tab-areas',
  };

  document.querySelectorAll('.cred-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cred-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      Object.values(paineis).forEach(id => {
        document.getElementById(id).classList.add('regra-tab-hidden');
      });

      const alvo = paineis[tab.dataset.tab];
      if (alvo) document.getElementById(alvo).classList.remove('regra-tab-hidden');
    });
  });
}

/* ---- Modal ---- */
function initModal() {
  const overlay = document.getElementById('modal-regra');
  const abrir   = () => {
    overlay.classList.remove('func-table-hidden');
    document.body.style.overflow = 'hidden';
  };
  const fechar  = () => {
    overlay.classList.add('func-table-hidden');
    document.body.style.overflow = '';
  };

  document.getElementById('btn-nova-regra').addEventListener('click', abrir);

  const btnEmpty = document.getElementById('btn-nova-regra-empty');
  if (btnEmpty) btnEmpty.addEventListener('click', abrir);

  document.getElementById('modal-fechar').addEventListener('click', fechar);
  document.getElementById('btn-cancelar').addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });

  document.getElementById('btn-salvar').addEventListener('click', () => {
    // TODO: enviar ao backend
    console.log('Salvar regra de acesso');
    fechar();
  });
}
