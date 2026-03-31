/* ============================================================
   FUNCIONÁRIOS — funcionarios.js
   ============================================================ */

console.log('🚀 FUNCIONARIOS iniciado');

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initViewToggle();
  initBusca();
  initImportExport();
  carregarFuncionarios();
});

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
let funcionariosLista = [];
let funcionarioEditando = null;

/* ============================================================
   MODAL
   ============================================================ */
function initModal() {
  const overlay  = document.getElementById('modal-funcionario');
  const btnNovo  = document.getElementById('btn-novo');
  const btnNovoE = document.getElementById('btn-novo-empty');
  const btnFechar = document.getElementById('modal-fechar');
  const btnCancel = document.getElementById('btn-cancelar');
  const btnSalvar = document.getElementById('btn-salvar');

  [btnNovo, btnNovoE].forEach(btn => {
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

  if (btnSalvar) btnSalvar.addEventListener('click', salvarFuncionario);

  /* ============================================================
     FOTO PREVIEW
     ============================================================ */
  const inputFoto = document.getElementById('input-foto');
  if (inputFoto) {
    inputFoto.addEventListener('change', () => {
      const file = inputFoto.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        alert('Imagem deve ter no máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const avatar = document.getElementById('modal-avatar-preview');
        if (avatar) {
          avatar.innerHTML = `
            <img src="${e.target.result}"
              style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
          `;
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

/* ============================================================
   ABRIR MODAL
   ============================================================ */
async function abrirModal(dados = null) {
  const overlay = document.getElementById('modal-funcionario');
  const titulo  = document.getElementById('modal-titulo');
  if (!overlay) return;

  await carregarEmpresasParaSelect();

  if (dados) {
    funcionarioEditando = dados.id;

    if (titulo) titulo.textContent = 'Editar Funcionário';

    const map = {
      'f-empresa_id': dados.empresa_id,
      'f-nome': dados.nome,
      'f-cpf': dados.cpf,
      'f-matricula': dados.matricula,
      'f-cargo': dados.cargo,
    };

    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    });

    const ativo = document.getElementById('f-ativo');
    if (ativo) ativo.checked = dados.status === 'ativo';

  } else {
    funcionarioEditando = null;

    if (titulo) titulo.textContent = 'Novo Funcionário';

    limparModal();
    gerarMatricula();
  }

  overlay.classList.remove('func-table-hidden');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  const overlay = document.getElementById('modal-funcionario');
  if (overlay) overlay.classList.add('func-table-hidden');
  document.body.style.overflow = '';
}

/* ============================================================
   SALVAR FUNCIONÁRIO (COM FOTO)
   ============================================================ */
async function salvarFuncionario() {

  const sb = window.getSupabase();
  if (!sb) {
    alert('Banco de dados não conectado.');
    return;
  }

  const nome = document.getElementById('f-nome')?.value.trim();
  if (!nome) {
    alert('Nome do funcionário é obrigatório.');
    return;
  }

  const empId = document.getElementById('f-empresa_id')?.value;

  let foto_url = null;

  const file = document.getElementById('input-foto')?.files[0];

  if (file) {
    console.log('📸 Upload de foto iniciado');

    const fileName = `func_${Date.now()}.jpg`;

    const { error: uploadError } = await sb.storage
      .from('funcionarios')
      .upload(fileName, file, { upsert: true });

    if (!uploadError) {
      foto_url = `${sb.storage.from('funcionarios').getPublicUrl(fileName).data.publicUrl}`;
    } else {
      console.warn('Erro upload:', uploadError.message);
    }
  }

  const dados = {
    empresa_id: empId || null,
    nome,
    cpf: document.getElementById('f-cpf')?.value.trim() || null,
    matricula: document.getElementById('f-matricula')?.value.trim() || null,
    cargo: document.getElementById('f-cargo')?.value.trim() || null,
    status: document.getElementById('f-ativo')?.checked ? 'ativo' : 'inativo',
    foto_url
  };

  try {

    let response;

    if (funcionarioEditando) {
      response = await sb
        .from('funcionarios')
        .update(dados)
        .eq('id', funcionarioEditando);
    } else {
      response = await sb
        .from('funcionarios')
        .insert([dados]);
    }

    if (response.error) {
      console.error(response.error);
      alert('Erro ao salvar: ' + response.error.message);
      return;
    }

    console.log('✅ Funcionário salvo');

    fecharModal();
    carregarFuncionarios();

  } catch (err) {
    console.error(err);
    alert('Erro inesperado ao salvar.');
  }
}

/* ============================================================
   LIMPAR MODAL
   ============================================================ */
function limparModal() {
  ['f-empresa_id', 'f-nome', 'f-cpf', 'f-matricula', 'f-cargo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const ativo = document.getElementById('f-ativo');
  if (ativo) ativo.checked = true;

  const avatar = document.getElementById('modal-avatar-preview');
  if (avatar) avatar.innerHTML = '<i class="ph ph-user"></i>';

  const inputFoto = document.getElementById('input-foto');
  if (inputFoto) inputFoto.value = '';
}

/* ============================================================
   GERAR MATRÍCULA
   ============================================================ */
function gerarMatricula() {
  const el = document.getElementById('f-matricula');
  if (el) {
    const ano = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    el.value = `MAT${ano}${rand}`;
  }
}

/* ============================================================
   CARREGAR EMPRESAS
   ============================================================ */
async function carregarEmpresasParaSelect() {

  const select = document.getElementById('f-empresa_id');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione a empresa...</option>';

  const sb = window.getSupabase();
  if (!sb) return;

  const { data, error } = await sb
    .from('empresas')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome');

  if (error) {
    console.error('Erro empresas:', error);
    return;
  }

  data?.forEach(emp => select.add(new Option(emp.nome, emp.id)));
}
/* ============================================================
   CARREGAR FUNCIONÁRIOS (SUPABASE + MONITORAMENTO)
   ============================================================ */
async function carregarFuncionarios() {

  const sb = window.getSupabase();
  if (!sb) return;

  try {

    console.log('📡 Buscando funcionários...');

    const { data, error } = await sb
      .from('funcionarios')
      .select(`
        *,
        empresas(nome),
        acessos(data, tipo, resultado)
      `)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar funcionários', error);
      return;
    }

    funcionariosLista = data || [];

    console.log('✅ Funcionários carregados:', funcionariosLista.length);

    renderizarFuncionarios(funcionariosLista);

  } catch (err) {
    console.error('Erro carregando funcionários:', err);
  }
}

/* ============================================================
   KPIs
   ============================================================ */
function atualizarKPIs(lista) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('kpi-total', lista.length);
  set('kpi-ativos', lista.filter(f => f.status === 'ativo').length);
  set('kpi-inativos', lista.filter(f => f.status === 'inativo').length);
  set('kpi-biometria', lista.filter(f => !f.biometria_cadastrada).length);
}

/* ============================================================
   RENDERIZAR TABELA (COM MONITORAMENTO)
   ============================================================ */
function renderizarFuncionarios(lista) {

  atualizarKPIs(lista);

  const tbody     = document.getElementById('func-tbody');
  const empty     = document.getElementById('func-empty');
  const tableWrap = document.getElementById('func-table-wrap');
  const totalLabel= document.getElementById('total-label');

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

  lista.forEach(func => {

    const statusBadge = func.status === 'ativo'
      ? '<span class="badge badge-success">Ativo</span>'
      : '<span class="badge badge-danger">Inativo</span>';

    const empresa = func.empresas?.nome || '—';

    /* ============================================================
       ÚLTIMO ACESSO
       ============================================================ */
    const ultimoAcesso = func.acessos?.[0]
      ? new Date(func.acessos[0].data).toLocaleString()
      : '—';

    /* ============================================================
       BIOMETRIA
       ============================================================ */
    const biometria = func.biometria_cadastrada
      ? '<span class="badge badge-success">Cadastrada</span>'
      : '<span class="badge badge-warning">Pendente</span>';

    /* ============================================================
       FOTO
       ============================================================ */
    const avatar = func.foto_url
      ? `<img src="${func.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
      : '<i class="ph ph-user"></i>';

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td><input type="checkbox" data-id="${func.id}"></td>

      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="func-modal-avatar" style="width:36px;height:36px;font-size:16px;flex-shrink:0;">
            ${avatar}
          </div>
          <div>
            <div style="font-weight:600;">${func.nome || '—'}</div>
            <div style="font-size:11px;opacity:.6;">${func.cargo || ''}</div>
          </div>
        </div>
      </td>

      <td>${func.matricula || '—'}</td>
      <td>${empresa}</td>

      <td>${ultimoAcesso}</td>

      <td>${biometria}</td>

      <td>${statusBadge}</td>

      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm btn-icon"
            title="Editar"
            onclick="editarFuncionario('${func.id}')">
            <i class="ph ph-pencil"></i>
          </button>

          <button class="btn btn-ghost btn-sm btn-icon"
            title="Excluir"
            onclick="excluirFuncionario('${func.id}')">
            <i class="ph ph-trash"></i>
          </button>

          <button class="btn btn-primary btn-sm btn-icon"
            title="Liberar acesso"
            onclick="liberarAcesso('${func.id}')">
            <i class="ph ph-door-open"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ============================================================
   LIBERAR ACESSO MANUAL
   ============================================================ */
async function liberarAcesso(id) {

  const sb = window.getSupabase();
  if (!sb) return;

  try {

    console.log('🚪 Liberando acesso manual:', id);

    const { error } = await sb.from('acessos').insert([{
      funcionario_id: id,
      tipo: 'entrada',
      metodo: 'manual',
      resultado: 'liberado',
      data: new Date()
    }]);

    if (error) {
      console.error('Erro ao liberar acesso:', error);
      alert('Erro ao liberar acesso');
      return;
    }

    console.log('✅ Acesso liberado');

  } catch (err) {
    console.error('Erro acesso manual:', err);
  }
}

/* ============================================================
   EDITAR / EXCLUIR
   ============================================================ */
async function editarFuncionario(id) {
  const func = funcionariosLista.find(f => f.id == id);
  if (func) abrirModal(func);
}

async function excluirFuncionario(id) {
  if (!confirm('Excluir este funcionário?')) return;

  const sb = window.getSupabase();

  const { error } = await sb
    .from('funcionarios')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Erro ao excluir: ' + error.message);
    return;
  }

  carregarFuncionarios();
}

/* ============================================================
   BUSCA E FILTROS
   ============================================================ */
function initBusca() {

  const input         = document.getElementById('input-busca');
  const filtroSetor   = document.getElementById('filtro-setor');
  const filtroStatus  = document.getElementById('filtro-status');
  const filtroTurno   = document.getElementById('filtro-turno');

  const aplicar = () => {

    const termo  = input?.value.toLowerCase() || '';
    const setor  = filtroSetor?.value || '';
    const status = filtroStatus?.value || '';
    const turno  = filtroTurno?.value || '';

    const filtrada = funcionariosLista.filter(f => {

      const matchTermo =
        !termo ||
        f.nome?.toLowerCase().includes(termo) ||
        f.matricula?.toLowerCase().includes(termo) ||
        f.cargo?.toLowerCase().includes(termo);

      const matchSetor  = !setor  || f.setor  === setor;
      const matchStatus = !status || f.status === status;
      const matchTurno  = !turno  || f.turno  === turno;

      return matchTermo && matchSetor && matchStatus && matchTurno;
    });

    renderizarFuncionarios(filtrada);
  };

  input?.addEventListener('input', aplicar);
  filtroSetor?.addEventListener('change', aplicar);
  filtroStatus?.addEventListener('change', aplicar);
  filtroTurno?.addEventListener('change', aplicar);
}

/* ============================================================
   VIEW TOGGLE
   ============================================================ */
function initViewToggle() {
  const btnTabela = document.getElementById('btn-view-tabela');
  const btnCards  = document.getElementById('btn-view-cards');
  const viewTab   = document.getElementById('view-tabela');
  const viewCards = document.getElementById('view-cards');

  btnTabela?.addEventListener('click', () => {
    viewTab?.classList.remove('func-table-hidden');
    viewCards?.classList.add('func-table-hidden');
    btnTabela.classList.add('active');
    btnCards?.classList.remove('active');
  });

  btnCards?.addEventListener('click', () => {
    viewCards?.classList.remove('func-table-hidden');
    viewTab?.classList.add('func-table-hidden');
    btnCards.classList.add('active');
    btnTabela?.classList.remove('active');
  });
}

/* ============================================================
   IMPORTAR / EXPORTAR (CORRIGIDO)
   ============================================================ */
function initImportExport() {
  document.getElementById('btn-importar')?.addEventListener('click', importarPlanilha);
  document.getElementById('btn-exportar')?.addEventListener('click', exportarCSV);
}

function exportarCSV() {

  if (!funcionariosLista.length) {
    alert('Nenhum funcionário para exportar.');
    return;
  }

  const cabecalho = ['Nome', 'CPF', 'Matrícula', 'Cargo', 'Status'];

  const linhas = funcionariosLista.map(f => [
    f.nome || '',
    f.cpf  || '',
    f.matricula || '',
    f.cargo || '',
    f.status || '',
  ]);

  const csv = [cabecalho, ...linhas]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `funcionarios_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

function importarPlanilha() {

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';

  input.onchange = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const texto = await file.text();

    const linhas = texto.split('\n').filter(l => l.trim());

    const dados = linhas.slice(1).map(linha => {
      const cols = linha.split(';');
      return {
        nome: cols[0],
        cpf: cols[1],
        matricula: cols[2],
        cargo: cols[3],
        status: cols[4] || 'ativo'
      };
    });

    const sb = window.getSupabase();

    const { error } = await sb.from('funcionarios').insert(dados);

    if (error) {
      alert(error.message);
      return;
    }

    carregarFuncionarios();
  };

  input.click();
}