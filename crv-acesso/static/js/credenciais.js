/* ============================================================
   CREDENCIAIS — credenciais.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initTabs();
  initTipoCredencial();
  initBusca();
  carregarCredenciais();
});

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
let credenciaisLista = [];
let credencialEditando = null;

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
    if (btn) btn.addEventListener('click', () => abrirModal());
  });

  [btnFechar, btnCancel].forEach(btn => {
    if (btn) btn.addEventListener('click', fecharModal);
  });

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) fecharModal();
    });
  }

  if (btnSalvar) btnSalvar.addEventListener('click', salvarCredencial);
}

function abrirModal(dados = null) {
  carregarFuncionariosSelect();
  const overlay = document.getElementById('modal-credencial');
  const titulo  = document.getElementById('modal-titulo');
  if (!overlay) return;

  limparModal();

  if (dados) {
    credencialEditando = dados.id;
    if (titulo) titulo.textContent = 'Editar Credencial';
    document.getElementById('cred-funcionario').value = dados.funcionario_nome || '';
    document.getElementById('cred-status').value = dados.status || 'ativa';
    document.getElementById('cred-obs').value = dados.observacao || '';
    // Seleciona o tipo
    const tipoItem = document.querySelector(`.cred-tipo-item[data-tipo="${dados.tipo}"]`);
    if (tipoItem) tipoItem.click();
  } else {
    credencialEditando = null;
    if (titulo) titulo.textContent = 'Nova Credencial';
  }

  overlay.classList.remove('func-table-hidden');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  const overlay = document.getElementById('modal-credencial');
  if (overlay) overlay.classList.add('func-table-hidden');
  document.body.style.overflow = '';
}

function limparModal() {
  ['cred-funcionario', 'cred-num-cartao', 'cred-senha', 'cred-senha-conf', 'cred-obs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('cred-status').value = 'ativa';

  // Reset tipo selecionado
  document.querySelectorAll('.cred-tipo-item').forEach(i => i.classList.remove('selected'));

  // Oculta todos os campos dinâmicos
  ['cred-campos-cartao', 'cred-campos-senha', 'cred-campos-bio'].forEach(id => {
    document.getElementById(id)?.classList.add('func-table-hidden');
  });
}

/* ============================================================
   SALVAR CREDENCIAL (SUPABASE)
   ============================================================ */
async function salvarCredencial() {
  if (!window.sb) { alert('Banco de dados não conectado.'); return; }

  const funcionario = document.getElementById('cred-funcionario')?.value;
  if (!funcionario) { alert('Informe o funcionário.'); return; }

  const tipoSel = document.querySelector('.cred-tipo-item.selected');
  if (!tipoSel) { alert('Selecione o tipo de credencial.'); return; }
  const tipo = tipoSel.dataset.tipo;

  // Validação senha
  if (tipo === 'senha') {
    const s1 = document.getElementById('cred-senha')?.value;
    const s2 = document.getElementById('cred-senha-conf')?.value;
    if (!s1) { alert('Informe a senha.'); return; }
    if (s1 !== s2) { alert('As senhas não coincidem.'); return; }
  }

  const dados = {
    funcionario_id: funcionario,
    tipo,
    identificador: document.getElementById('cred-num-cartao')?.value.trim() || null,
    validade:       document.getElementById('cred-validade')?.value || null,
    status:         document.getElementById('cred-status')?.value || 'ativa',
    observacao:     document.getElementById('cred-obs')?.value.trim() || null,
  };

  try {
    let response;
    if (credencialEditando) {
      response = await window.sb.from('credenciais').update(dados).eq('id', credencialEditando);
    } else {
      response = await window.sb.from('credenciais').insert([dados]);
    }

    if (response.error) { alert('Erro ao salvar: ' + response.error.message); console.error(response.error); return; }

    fecharModal();
    carregarCredenciais();
  } catch (err) {
    console.error(err);
    alert('Erro inesperado ao salvar.');
  }
}

/* ============================================================
   TIPO DE CREDENCIAL — campos dinâmicos
   ============================================================ */
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

      Object.values(campos).forEach(id => {
        document.getElementById(id)?.classList.add('func-table-hidden');
      });

      const alvo = campos[item.dataset.tipo];
      if (alvo) document.getElementById(alvo)?.classList.remove('func-table-hidden');
    });
  });
}

/* ============================================================
   ABAS — filtrar por tipo
   ============================================================ */
function initTabs() {
  document.querySelectorAll('.cred-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cred-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tipo = tab.dataset.tab;
      const filtrada = tipo === 'todas'
        ? credenciaisLista
        : credenciaisLista.filter(c => c.tipo === tipo);

      renderizarCredenciais(filtrada);
    });
  });
}

/* ============================================================
   BUSCA
   ============================================================ */
function initBusca() {
  const input        = document.querySelector('#input-busca, .func-busca .form-control');
  const filtroStatus = document.querySelectorAll('.func-select')[0];

  const aplicar = () => {
    const termo  = input?.value.toLowerCase() || '';
    const status = filtroStatus?.value || '';

    const filtrada = credenciaisLista.filter(c => {
      const matchTermo  = !termo  || c.funcionario_nome?.toLowerCase().includes(termo) || c.identificador?.toLowerCase().includes(termo);
      const matchStatus = !status || status === 'Todos os status' || c.status === status.toLowerCase();
      return matchTermo && matchStatus;
    });

    renderizarCredenciais(filtrada);
  };

  input?.addEventListener('input', aplicar);
  filtroStatus?.addEventListener('change', aplicar);
}

async function carregarFuncionariosSelect(){

if(!window.sb) return;

const select = document.getElementById("cred-funcionario");
if(!select) return;

select.innerHTML = '<option value="">Selecione o funcionário...</option>';

const {data,error} = await window.sb
.from("funcionarios")
.select("id,nome")
.order("nome");

if(error){
console.error(error);
return;
}

data.forEach(f=>{
const opt = document.createElement("option");
opt.value = f.id;
opt.textContent = f.nome;
select.appendChild(opt);
});

}

/* ============================================================
   CARREGAR (SUPABASE)
   ============================================================ */
async function carregarCredenciais() {
  if (!window.sb) return;
  try {
    await window.sb
.from('credenciais')
.select('*, funcionarios(nome)').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    credenciaisLista = data || [];
    renderizarCredenciais(credenciaisLista);
    atualizarKPIs(credenciaisLista);
  } catch (err) {
    console.error(err);
  }
}

/* ============================================================
   KPIs
   ============================================================ */
function atualizarKPIs(lista) {
  const kpis = document.querySelectorAll('.kpi-value');
  if (kpis[0]) kpis[0].textContent = lista.length;
  if (kpis[1]) kpis[1].textContent = lista.filter(c => c.tipo === 'cartao' && c.status === 'ativa').length;
  if (kpis[2]) kpis[2].textContent = lista.filter(c => c.tipo === 'biometria' || c.tipo === 'facial').length;
  if (kpis[3]) kpis[3].textContent = lista.filter(c => c.status === 'bloqueada').length;
}

/* ============================================================
   RENDERIZAR TABELA
   ============================================================ */
const tipoIcone = { cartao: 'ph-credit-card', biometria: 'ph-fingerprint', facial: 'ph-scan', senha: 'ph-lock-key' };
const tipoLabel = { cartao: 'Cartão', biometria: 'Digital', facial: 'Facial', senha: 'Senha' };

function renderizarCredenciais(lista) {
  const tbody     = document.getElementById('cred-tbody');
  const empty     = document.getElementById('cred-empty');
  const tableWrap = document.getElementById('cred-table-wrap');
  const totalLabel= document.querySelector('.card-header .text-sm.text-muted');

  if (!tbody) return;
  tbody.innerHTML = '';

  if (!lista || lista.length === 0) {
    empty?.classList.remove('func-table-hidden');
    tableWrap?.classList.add('func-table-hidden');
    if (totalLabel) totalLabel.textContent = '0 registros';
    return;
  }

  empty?.classList.add('func-table-hidden');
  tableWrap?.classList.remove('func-table-hidden');
  if (totalLabel) totalLabel.textContent = `${lista.length} registros`;

  lista.forEach(cred => {
    const icone = tipoIcone[cred.tipo] || 'ph-key';
    const label = tipoLabel[cred.tipo] || cred.tipo;
    const statusBadge = cred.status === 'ativa'
      ? '<span class="badge badge-success">Ativa</span>'
      : cred.status === 'bloqueada'
        ? '<span class="badge badge-danger">Bloqueada</span>'
        : '<span class="badge badge-warning">Pendente</span>';

    const iniciais = (cred.funcionarios?.nome || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const validade = cred.validade ? new Date(cred.validade).toLocaleDateString('pt-BR') : '—';
    const emissao  = cred.created_at ? new Date(cred.created_at).toLocaleDateString('pt-BR') : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="cred-row-avatar">${iniciais}</div>
          <div>
            <div class="cred-row-nome">${cred.funcionarios?.nome || '—'}</div>
            <div class="cred-row-sub">${cred.identificador || ''}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="cred-tipo-badge ${cred.tipo}">
          <i class="ph ${icone}"></i> ${label}
        </span>
      </td>
      <td>${cred.identificador || '—'}</td>
      <td>${emissao}</td>
      <td>${validade}</td>
      <td>${statusBadge}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm btn-icon" title="Editar" onclick="editarCredencial('${cred.id}')">
            <i class="ph ph-pencil"></i>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon" title="Excluir" onclick="excluirCredencial('${cred.id}')">
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
function editarCredencial(id) {
  const cred = credenciaisLista.find(c => c.id == id);
  if (cred) abrirModal(cred);
}

async function excluirCredencial(id) {
  if (!confirm('Excluir esta credencial?')) return;
  const { error } = await window.sb.from('credenciais').delete().eq('id', id);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  carregarCredenciais();
}
