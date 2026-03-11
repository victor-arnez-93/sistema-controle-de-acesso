/* ============================================================
   FUNCIONÁRIOS — funcionarios.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initViewToggle();
  initBusca();
});

/* ---- Modal ---- */
function initModal() {
  const overlay = document.getElementById('modal-funcionario');
  const btnNovo  = document.getElementById('btn-novo');
  const btnNovoE = document.getElementById('btn-novo-empty');
  const btnFechar = document.getElementById('modal-fechar');
  const btnCancel = document.getElementById('btn-cancelar');
  const btnSalvar = document.getElementById('btn-salvar');

  [btnNovo, btnNovoE].forEach(btn => {
    if (btn) btn.addEventListener('click', () => abrirModal());
  });

  [btnFechar, btnCancel].forEach(btn => {
    if (btn) btn.addEventListener('click', () => fecharModal());
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fecharModal();
  });

  btnSalvar.addEventListener('click', () => salvarFuncionario());
}

function abrirModal(dados = null) {
  const overlay = document.getElementById('modal-funcionario');
  const titulo  = document.getElementById('modal-titulo');

  if (dados) {
    titulo.innerHTML = '<i class="ph ph-pencil-simple"></i> Editar Funcionário';
    // TODO: preencher campos com dados do backend
  } else {
    titulo.innerHTML = '<i class="ph ph-user-plus"></i> Novo Funcionário';
    limparModal();
    gerarMatricula();
  }

  overlay.classList.remove('func-table-hidden');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modal-funcionario').classList.add('func-table-hidden');
  document.body.style.overflow = '';
}

function limparModal() {
  ['f-nome','f-cpf','f-email','f-telefone','f-cargo',
   'f-setor','f-turno','f-admissao','f-nivel','f-grupo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function gerarMatricula() {
  const el = document.getElementById('f-matricula');
  if (el) el.value = 'Gerada pelo sistema';
}

function salvarFuncionario() {
  const nome = document.getElementById('f-nome').value.trim();
  const cpf  = document.getElementById('f-cpf').value.trim();
  const setor = document.getElementById('f-setor').value;
  const turno = document.getElementById('f-turno').value;

  if (!nome || !cpf || !setor || !turno) {
    alert('Preencha os campos obrigatórios.');
    return;
  }

  // TODO: enviar para o backend via fetch/axios
  console.log('Salvar funcionário:', { nome, cpf, setor, turno });
  fecharModal();
}

/* ---- Alternância de view ---- */
function initViewToggle() {
  const btnTabela = document.getElementById('btn-view-tabela');
  const btnCards  = document.getElementById('btn-view-cards');
  const viewTab   = document.getElementById('view-tabela');
  const viewCards = document.getElementById('view-cards');

  btnTabela.addEventListener('click', () => {
    btnTabela.classList.add('active');
    btnCards.classList.remove('active');
    viewTab.style.display   = '';
    viewCards.classList.add('func-table-hidden');
  });

  btnCards.addEventListener('click', () => {
    btnCards.classList.add('active');
    btnTabela.classList.remove('active');
    viewTab.style.display = 'none';
    viewCards.classList.remove('func-table-hidden');
  });
}

/* ---- Busca (frontend — será substituída por API) ---- */
function initBusca() {
  document.getElementById('input-busca').addEventListener('input', function () {
    // TODO: filtrar tabela ou chamar API com debounce
    console.log('Buscar:', this.value);
  });
}
