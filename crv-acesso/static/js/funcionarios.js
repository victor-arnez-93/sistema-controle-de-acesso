/* ============================================================
   FUNCIONÁRIOS — funcionarios.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initViewToggle();
  initBusca();
  carregarFuncionarios();
});

/* ============================================================
   LISTA GLOBAL DE FUNCIONÁRIOS
   ============================================================ */

let funcionariosLista = [];
let funcionarioEditando = null;

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

if (overlay) {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fecharModal();
  });
}

  if (btnSalvar) {
  btnSalvar.addEventListener('click', () => salvarFuncionario());
}
}

function abrirModal(dados = null) {
  const overlay = document.getElementById('modal-funcionario');
  const titulo = document.getElementById('modal-titulo');

  if (dados) {
    titulo.innerHTML = '<i class="ph ph-pencil-simple"></i> Editar Funcionário';
  } else {
    titulo.innerHTML = '<i class="ph ph-user-plus"></i> Novo Funcionário';
    limparModal();
    gerarMatricula();
    carregarEmpresasParaSelect();
  }

  overlay.classList.remove('func-table-hidden');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modal-funcionario').classList.add('func-table-hidden');
  document.body.style.overflow = '';
}

function limparModal() {
  ['f-emp_id', 'f-nome', 'f-cpf', 'f-matricula', 'f-cargo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const ativo = document.getElementById('f-ativo');
  if (ativo) ativo.checked = true;
}

function gerarMatricula() {
  const el = document.getElementById('f-matricula');
  if (el) {
    const ano = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000);
    el.value = `MAT${ano}${random.toString().padStart(4, '0')}`;
  }
}

async function carregarEmpresasParaSelect() {
  if (!window.sb) {
    console.warn('Supabase não conectado');
    return;
  }

  const select = document.getElementById('f-emp_id');
  if (!select) return;

  select.innerHTML = '<option value="">Carregando empresas...</option>';

  const { data, error } = await window.sb
    .from('empresas')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome');

  if (error) {
    console.error('Erro empresas:', error);
    select.innerHTML = '<option value="">Erro carregando empresas</option>';
    return;
  }

  select.innerHTML = '<option value="">Selecione empresa...</option>';
  data?.forEach(emp => {
    const opt = new Option(emp.nome, emp.id);
    select.add(opt);
  });
}



/* ============================================================
   CARREGAR FUNCIONÁRIOS (SUPABASE)
   ============================================================ */

async function carregarFuncionarios(){

  if(!window.sb) return;

  try{

    const { data, error } = await window.sb
      .from("funcionarios")
      .select("*")
      .order("nome");

    if(error){
      console.error("Erro ao buscar funcionários", error);
      return;
    }

    funcionariosLista = data || [];

renderizarFuncionarios(funcionariosLista);

    /* Aqui depois vamos renderizar tabela e cards */

  }catch(err){

    console.error("Erro carregando funcionários:", err);

  }

}

/* ============================================================
   KPIs FUNCIONÁRIOS
   ============================================================ */

function atualizarKPIs(lista){

  const total = lista.length;

  const ativos = lista.filter(f => f.status === "ativo").length;

  const inativos = lista.filter(f => f.status === "inativo").length;

  const semBio = lista.filter(f => !f.biometria_cadastrada).length;

  const elTotal = document.getElementById("kpi-total");
  const elAtivos = document.getElementById("kpi-ativos");
  const elInativos = document.getElementById("kpi-inativos");
  const elBio = document.getElementById("kpi-biometria");

  if(elTotal) elTotal.textContent = total;
  if(elAtivos) elAtivos.textContent = ativos;
  if(elInativos) elInativos.textContent = inativos;
  if(elBio) elBio.textContent = semBio;

}

/* ============================================================
   RENDERIZAR FUNCIONÁRIOS
   ============================================================ */

function renderizarFuncionarios(lista){
  atualizarKPIs(lista);

  const tbody = document.getElementById("func-tbody");
  const empty = document.getElementById("func-empty");
  const tableWrap = document.getElementById("func-table-wrap");
  const totalLabel = document.getElementById("total-label");

  if(!tbody) {
  console.error("Tabela de funcionários não encontrada");
  return;
}

tbody.innerHTML = "";

  if(!lista || lista.length === 0){

    if(empty) empty.classList.remove("func-table-hidden");
    if(tableWrap) tableWrap.classList.add("func-table-hidden");

    totalLabel.textContent = "0 registros";

    return;

  }

  if(empty) empty.classList.add("func-table-hidden");
  if(tableWrap) tableWrap.classList.remove("func-table-hidden");

  if(totalLabel){
  totalLabel.textContent = lista.length + " registros";
}

  lista.forEach(func => {

    const tr = document.createElement("tr");

    tr.innerHTML = `

      <td><input type="checkbox"></td>

      <td>
        <div class="flex items-center gap-2">
          <i class="ph ph-user"></i>
          ${func.nome || ""}
        </div>
      </td>

      <td>${func.matricula || "-"}</td>

      <td>${func.setor || "-"}</td>

      <td>${func.turno || "-"}</td>

      <td>
        <span class="badge badge-warning">
          Pendente
        </span>
      </td>

      <td>
        <span class="badge ${
          func.status === "ativo"
            ? "badge-success"
            : "badge-danger"
        }">
          ${func.status || "ativo"}
        </span>
      </td>

      <td>
        <button class="btn btn-ghost btn-sm btn-icon"
          onclick="editarFuncionario('${func.id}')">

          <i class="ph ph-pencil"></i>

        </button>

        <button class="btn btn-ghost btn-sm btn-icon"
          onclick="excluirFuncionario('${func.id}')">

          <i class="ph ph-trash"></i>

        </button>
      </td>

    `;

    tbody.appendChild(tr);

  });

}

/* ============================================================
   EDITAR FUNCIONÁRIO
   ============================================================ */
function editarFuncionario(id){

  const func = funcionariosLista.find(f => f.id == id);

  if(!func){
    console.warn("Funcionário não encontrado");
    return;
  }

  funcionarioEditando = func.id;

  abrirModal(func);

  const map = {
  'f-nome': func.nome,
  'f-cpf': func.cpf,
  'f-email': func.email,
  'f-telefone': func.telefone,
  'f-cargo': func.cargo,
  'f-setor': func.setor,
  'f-turno': func.turno,
  'f-admissao': func.data_admissao
};

Object.entries(map).forEach(([id,val])=>{
  const el = document.getElementById(id);
  if(el) el.value = val || "";
});
  const statusField = document.getElementById('f-status');
if(statusField){
  statusField.value = func.status || "ativo";
}

}

/* ============================================================
   EXCLUIR FUNCIONÁRIO
   ============================================================ */

async function excluirFuncionario(id){

  if(!confirm("Deseja excluir este funcionário?"))
    return;

  try{

    const { error } = await window.sb
      .from("funcionarios")
      .delete()
      .eq("id", id);

    if(error){

      console.error(error);
      alert("Erro ao excluir funcionário.");

      return;

    }

    carregarFuncionarios();

  }catch(err){

    console.error(err);

  }

}

/* ---- Alternância de view ---- */
function initViewToggle() {
  const btnTabela = document.getElementById('btn-view-tabela');
  const btnCards  = document.getElementById('btn-view-cards');
  const viewTab   = document.getElementById('view-tabela');
  const viewCards = document.getElementById('view-cards');

  if(btnTabela){
btnTabela.addEventListener('click', () => {
    btnTabela.classList.add('active');
    btnCards.classList.remove('active');
    viewTab.style.display   = '';
    viewCards.classList.add('func-table-hidden');
  });
  }

  btnCards.addEventListener('click', () => {
    btnCards.classList.add('active');
    btnTabela.classList.remove('active');
    viewTab.style.display = 'none';
    viewCards.classList.remove('func-table-hidden');
  });
}

/* ---- Busca (frontend — será substituída por API) ---- */
function initBusca() {

  const input = document.getElementById('input-busca');

  if(!input) return;

  input.addEventListener('input', function () {

    const termo = this.value.toLowerCase().trim();

    if(!termo){

      renderizarFuncionarios(funcionariosLista);
      return;

    }

    const filtrados = funcionariosLista.filter(func => {

      return (
        (func.nome || "").toLowerCase().includes(termo) ||
        (func.matricula || "").toLowerCase().includes(termo) ||
        (func.setor || "").toLowerCase().includes(termo)
      );

    });

    renderizarFuncionarios(filtrados);

  });

}
