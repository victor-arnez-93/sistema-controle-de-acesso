/* ============================================================
   CREDENCIAIS — credenciais.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initTabs();
  initTipoCredencial();
});

/* ---- Modal ---- */
function initModal() {
  const overlay   = document.getElementById('modal-credencial');
  const btnNova   = document.getElementById('btn-nova');
  const btnNovaE  = document.getElementById('btn-nova-empty');
  const btnFechar = document.getElementById('modal-fechar');
  const btnCancel = document.getElementById('btn-cancelar');

  [btnNova, btnNovaE].forEach(btn => {
    if (btn) btn.addEventListener('click', () => abrirModal());
  });

  [btnFechar, btnCancel].forEach(btn => {
    if (btn) btn.addEventListener('click', () => fecharModal());
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fecharModal();
  });

  document.getElementById('btn-salvar').addEventListener('click', () => {
    // TODO: enviar ao backend
    console.log('Salvar credencial');
    fecharModal();
  });
}

function abrirModal() {
  document.getElementById('modal-credencial').classList.remove('func-table-hidden');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modal-credencial').classList.add('func-table-hidden');
  document.body.style.overflow = '';
}

/* ---- Abas ---- */
function initTabs() {
  document.querySelectorAll('.cred-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cred-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // TODO: filtrar tabela por tipo
    });
  });
}

/* ---- Seleção de tipo de credencial no modal ---- */
function initTipoCredencial() {
  const campos = {
    cartao:    'cred-campos-cartao',
    biometria: 'cred-campos-bio',
    facial:    'cred-campos-bio',
    senha:     'cred-campos-senha',
  };

  document.querySelectorAll('.cred-tipo-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.cred-tipo-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      // Oculta todos os campos dinâmicos
      Object.values(campos).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('func-table-hidden');
      });

      // Mostra o correspondente
      const alvo = campos[item.dataset.tipo];
      if (alvo) document.getElementById(alvo).classList.remove('func-table-hidden');
    });
  });
}
