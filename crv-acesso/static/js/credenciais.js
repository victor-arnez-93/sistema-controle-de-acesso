/* ============================================================
   CREDENCIAIS — credenciais.js (CORRIGIDO PROFISSIONAL)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  console.log('🚀 CREDENCIAIS iniciado');

  // 🔥 GARANTE QUE O SUPABASE EXISTE
const sb = window.getSupabase();

if (!sb) {
  console.error('[CREDENCIAIS] Supabase não inicializado');
  return;
}

  initModal();
  initTabs();
  initBusca();
  initTipoCredencial();

  carregarCredenciais();

});

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
let credenciaisLista = [];
let credencialEditando = null;

/* ============================================================
   BUSCA (CORREÇÃO DO ERRO)
   ============================================================ */
function initBusca() {

  console.log('[CREDENCIAIS] Busca iniciada');

  const input = document.getElementById('input-busca');

  if (!input) return;

  input.addEventListener('input', () => {

    const termo = input.value.toLowerCase();

    const filtradas = credenciaisLista.filter(c =>
      c.funcionarios?.nome?.toLowerCase().includes(termo) ||
      (c.codigo || '').toLowerCase().includes(termo)
    );

    renderizarCredenciais(filtradas);

  });

}

/* ============================================================
   MODAL
   ============================================================ */
function initModal() {

  const overlay   = document.getElementById('modal-credencial');
  const btnNova   = document.getElementById('btn-nova');
  const btnNovaE  = document.getElementById('btn-nova-empty');
  const btnFechar = document.getElementById('cred-modal-fechar');
  const btnCancel = document.getElementById('cred-btn-cancelar');
  const btnSalvar = document.getElementById('cred-btn-salvar');

  [btnNova, btnNovaE].forEach(btn => {
    btn?.addEventListener('click', () => abrirModal());
  });

  [btnFechar, btnCancel].forEach(btn => {
    btn?.addEventListener('click', fecharModal);
  });

  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) fecharModal();
  });

  btnSalvar?.addEventListener('click', salvarCredencial);

}

/* ============================================================
   ABRIR / FECHAR
   ============================================================ */
async function abrirModal(dados = null) {

  await carregarFuncionariosSelect();

  const overlay = document.getElementById('modal-credencial');
  const titulo  = document.getElementById('modal-titulo');

  limparModal();

if (dados) {

  credencialEditando = dados.id;

  titulo.textContent = 'Editar Credencial';

  document.getElementById('cred-funcionario').value = dados.funcionario_id;

  // 🔥 PREENCHE CAMPOS
  document.getElementById('cred-num-cartao').value = dados.codigo || '';
  document.getElementById('cred-status').value = dados.status || 'ativa';

  // 🔥 SELECIONA TIPO VISUAL
  const tipoItem = document.querySelector(`.cred-tipo-item[data-tipo="${dados.tipo}"]`);
  tipoItem?.click();

} else {

    credencialEditando = null;
    titulo.textContent = 'Nova Credencial';

  }

  overlay.classList.remove('func-table-hidden');
  document.body.style.overflow = 'hidden';

}

function fecharModal() {
  document.getElementById('modal-credencial')?.classList.add('func-table-hidden');
  document.body.style.overflow = '';
}

/* ============================================================
   LIMPAR MODAL
   ============================================================ */
function limparModal() {

  ['cred-funcionario','cred-num-cartao','cred-senha','cred-senha-conf']
  .forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.querySelectorAll('.cred-tipo-item')
    .forEach(i => i.classList.remove('selected'));

}

/* ============================================================
   SALVAR (CORRIGIDO BANCO)
   ============================================================ */
async function salvarCredencial() {

  const sb = window.getSupabase();

  if (!sb) {
    console.error('[CREDENCIAIS] Supabase não inicializado');
    return;
  }

  const funcionarioId = document.getElementById('cred-funcionario').value;

  if (!funcionarioId) return alert('Selecione funcionário');

  const tipo = document.querySelector('.cred-tipo-item.selected')?.dataset.tipo;

  if (!tipo) return alert('Selecione tipo');

  // 🔐 VALIDAÇÃO DE SENHA
  if (tipo === 'senha') {

    const senha = document.getElementById('cred-senha')?.value;
    const conf  = document.getElementById('cred-senha-conf')?.value;

    if (!senha || senha.length < 4) {
      alert('Senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (senha !== conf) {
      alert('As senhas não coincidem.');
      return;
    }

  }

  // 🚨 VALIDAÇÃO DE CARTÃO (CÓDIGO ÚNICO)
  if (tipo === 'cartao') {

    const codigo = document.getElementById('cred-num-cartao')?.value;

    if (!codigo) {
      alert('Informe o código do cartão.');
      return;
    }

    const { data: existentes } = await sb
      .from('credenciais')
      .select('id')
      .eq('codigo', codigo)
      .eq('ativo', true);

if (existentes && existentes.length > 0) {

  if (
    !credencialEditando ||
    !existentes.find(e => e.id === credencialEditando)
  ) {
    alert('Já existe uma credencial ativa com esse código.');
    return;
  }

}

  // 🔥 STATUS
  const status = document.getElementById('cred-status')?.value || 'ativa';

  // 🔐 HASH DE SENHA (SHA-256)
  let senhaHash = null;

  if (tipo === 'senha') {
    const senha = document.getElementById('cred-senha')?.value;
    senhaHash = await gerarHash(senha);
  }

  // 🔥 DADOS
  const dados = {
    funcionario_id: funcionarioId,
    tipo,
    codigo: document.getElementById('cred-num-cartao')?.value || null,
    senha_hash: senhaHash,
    validade: document.getElementById('cred-validade')?.value || null,
    ativo: status === 'ativa',
    status: status
  };

  // 🚨 BLOQUEAR DUPLICIDADE POR FUNCIONÁRIO + TIPO
  const { data: existenteFunc } = await sb
    .from('credenciais')
    .select('id')
    .eq('funcionario_id', funcionarioId)
    .eq('tipo', tipo)
    .eq('ativo', true)
    .maybeSingle();

  if (existenteFunc && existenteFunc.id !== credencialEditando) {
    alert('Este funcionário já possui uma credencial ativa desse tipo.');
    return;
  }

  let response;

  if (credencialEditando) {
    response = await sb
      .from('credenciais')
      .update(dados)
      .eq('id', credencialEditando);
  } else {
    response = await sb
      .from('credenciais')
      .insert([dados]);
  }

  if (response.error) {
    alert(response.error.message);
    return;
  }

  console.log('✅ Credencial salva');

  fecharModal();
  carregarCredenciais();

}

  // 🔥 STATUS CORRETO (FORA DO OBJETO)
  const status = document.getElementById('cred-status')?.value || 'ativa';

  // 🔥 OBJETO LIMPO E CORRETO
let senhaHash = null;

if (tipo === 'senha') {
  const senha = document.getElementById('cred-senha')?.value;
  senhaHash = await gerarHash(senha);
}

const dados = {
  funcionario_id: funcionarioId,
  tipo,
  codigo: document.getElementById('cred-num-cartao')?.value || null,
  senha_hash: senhaHash,
  ativo: status === 'ativa',
  status: status
};

  // 🚨 BLOQUEAR DUPLICIDADE POR FUNCIONÁRIO + TIPO
const { data: existenteFunc } = await sb
  .from('credenciais')
  .select('id')
  .eq('funcionario_id', funcionarioId)
  .eq('tipo', tipo)
  .eq('ativo', true)
  .maybeSingle();

if (existenteFunc && existenteFunc.id !== credencialEditando) {
  alert('Este funcionário já possui uma credencial ativa desse tipo.');
  return;
}

  let response;

  if (credencialEditando) {
    response = await sb
      .from('credenciais')
      .update(dados)
      .eq('id', credencialEditando);
  } else {
    response = await sb
      .from('credenciais')
      .insert([dados]);
  }

  if (response.error) {
    alert(response.error.message);
    return;
  }

  console.log('✅ Credencial salva');

  fecharModal();
  carregarCredenciais();

}

/* ============================================================
   FUNCIONÁRIOS SELECT
   ============================================================ */
async function carregarFuncionariosSelect(){

  const sb = window.getSupabase();

  if (!sb) {
    console.error('[CREDENCIAIS] Supabase não inicializado');
    return;
  }

  const select = document.getElementById("cred-funcionario");

  select.innerHTML = '<option value="">Selecione...</option>';

  // 🔥 BUSCA USUÁRIO LOGADO
  const { data: sessionData } = await sb.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user?.id) {
    console.error('[CREDENCIAIS] Usuário não identificado');
    return;
  }

  // 🔥 BUSCA EMPRESA DO USUÁRIO
  const { data: userData, error: userError } = await sb
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.empresa_id) {
    console.error('[CREDENCIAIS] Erro ao obter empresa', userError);
    return;
  }

  const empId = userData.empresa_id;

  // 🔥 AGORA SIM — FILTRADO POR EMPRESA
  const { data, error } = await sb
    .from("funcionarios")
    .select("id,nome")
    .eq('empresa_id', empId);

  if (error) {
    console.error('[CREDENCIAIS] Erro ao carregar funcionários', error);
    return;
  }

  data?.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.nome;
    select.appendChild(opt);
  });

}

/* ============================================================
   TABS
   ============================================================ */
function initTabs() {

  const tabs = document.querySelectorAll('.cred-tab');

  tabs.forEach(tab => {

    tab.addEventListener('click', () => {

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      aplicarFiltroTipo(tab.dataset.tab);

    });

  });

}

function aplicarFiltroTipo(tipo) {

  if (tipo === 'todas') return renderizarCredenciais(credenciaisLista);

  const filtradas = credenciaisLista.filter(c => c.tipo === tipo);

  renderizarCredenciais(filtradas);

}

/* ============================================================
   CARREGAR
   ============================================================ */
async function carregarCredenciais() {

  const sb = window.getSupabase();

if (!sb) {
  console.error('[CREDENCIAIS] Supabase não inicializado');
  return;
}

  console.log('📡 Buscando credenciais...');

  const { data } = await sb
    .from('credenciais')
    .select('*, funcionarios(nome)')
    .order('created_at', { ascending: false });

  credenciaisLista = data || [];

  console.log('✅ Credenciais carregadas:', credenciaisLista.length);

  renderizarCredenciais(credenciaisLista);
  atualizarKPIs(credenciaisLista);

}

/* ============================================================
   KPIs (CORRIGIDO)
   ============================================================ */
function atualizarKPIs(lista) {

  const ativos = lista.filter(c => c.ativo).length;

  document.querySelectorAll('.kpi-value')[0].textContent = lista.length;
  document.querySelectorAll('.kpi-value')[1].textContent = ativos;
  document.querySelectorAll('.kpi-value')[2].textContent = lista.filter(c => c.tipo === 'biometria').length;
  document.querySelectorAll('.kpi-value')[3].textContent = lista.filter(c => !c.ativo).length;

}

/* ============================================================
   RENDER
   ============================================================ */
function renderizarCredenciais(lista){

  const tbody = document.getElementById('cred-tbody');
  const empty = document.getElementById('cred-empty');
  const table = document.getElementById('cred-table-wrap');

  tbody.innerHTML='';

  if (!lista || lista.length === 0) {
    empty?.classList.remove('func-table-hidden');
    table?.classList.add('func-table-hidden');
    return;
  }

  empty?.classList.add('func-table-hidden');
  table?.classList.remove('func-table-hidden');

  lista.forEach(c=>{

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${c.funcionarios?.nome || '-'}</td>
      <td>${c.tipo}</td>
      <td>${c.codigo || '-'}</td>
      <td>
          ${c.validade
            ? new Date(c.validade).toLocaleDateString()
            : 'Sem validade'}
      </td>
      <td>-</td>
      <td>${c.ativo ? 'Ativo' : 'Bloqueado'}</td>
      <td>
  <div style="display:flex;gap:6px;">

    <button class="btn btn-ghost btn-sm btn-icon"
      title="Editar"
      onclick="editarCredencial('${c.id}')">
      <i class="ph ph-pencil"></i>
    </button>

    <button class="btn btn-secondary btn-sm btn-icon"
      title="${c.ativo ? 'Bloquear' : 'Ativar'}"
      onclick="toggleCredencial('${c.id}', ${c.ativo})">
      <i class="ph ${c.ativo ? 'ph-lock' : 'ph-lock-open'}"></i>
    </button>

    <button class="btn btn-danger btn-sm btn-icon"
      title="Excluir"
      onclick="excluirCredencial('${c.id}')">
      <i class="ph ph-trash"></i>
    </button>

  </div>
</td>
    `;

    tbody.appendChild(tr);
  });

}

/* ============================================================
   EDITAR / EXCLUIR
   ============================================================ */
function editarCredencial(id){
  const cred = credenciaisLista.find(c=>c.id==id);
  abrirModal(cred);
}

async function excluirCredencial(id){

  const sb = window.getSupabase();

if (!sb) {
  console.error('[CREDENCIAIS] Supabase não inicializado');
  return;
}

  if(!confirm('Excluir?')) return;

  await sb.from('credenciais').delete().eq('id',id);

  carregarCredenciais();

}

function initTipoCredencial() {

  const itens = document.querySelectorAll('.cred-tipo-item');

  itens.forEach(item => {

    item.addEventListener('click', () => {

      itens.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      const tipo = item.dataset.tipo;

      // esconde todos
      document.getElementById('cred-campos-cartao')?.classList.add('func-table-hidden');
      document.getElementById('cred-campos-senha')?.classList.add('func-table-hidden');
      document.getElementById('cred-campos-bio')?.classList.add('func-table-hidden');

      // mostra conforme tipo
      if (tipo === 'cartao') {
        document.getElementById('cred-campos-cartao')?.classList.remove('func-table-hidden');
      }

      if (tipo === 'senha') {
        document.getElementById('cred-campos-senha')?.classList.remove('func-table-hidden');
      }

      if (tipo === 'biometria' || tipo === 'facial') {
        document.getElementById('cred-campos-bio')?.classList.remove('func-table-hidden');
      }

    });

  });

}

async function toggleCredencial(id, ativoAtual){

  const sb = window.getSupabase();

  if (!sb) return;

  const novoStatus = !ativoAtual;

  const { error } = await sb
    .from('credenciais')
    .update({
      ativo: novoStatus,
      status: novoStatus ? 'ativa' : 'bloqueada'
    })
    .eq('id', id);

  if (error) {
    alert('Erro ao atualizar credencial');
    return;
  }

  carregarCredenciais();

}

async function gerarHash(texto) {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}