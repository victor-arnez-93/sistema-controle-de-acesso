/* ==========================================================
   CRV CONTROLE DE ACESSO
   PERMISSOES.JS — v2
   Controle de acesso por perfil + guard de telas + filtro sidebar
   ========================================================== */

/* ==========================================================
   HIERARQUIA DE PERFIS (para possuiPermissao())
   ========================================================== */

const PERFIS = {
  admin:    4,
  gerente:  3,
  operador: 2,
  portaria: 1,
};

/* ==========================================================
   MAPA DE TELAS POR PERFIL
   Lista explícita — necessária para portaria (exceção à hierarquia)
   ========================================================== */

const TELAS_PERMITIDAS = {
  'dashboard':      ['admin', 'gerente', 'operador', 'portaria'],
  'monitoramento':  ['admin', 'gerente', 'operador', 'portaria'],
  'funcionarios':   ['admin', 'gerente', 'operador'],
  'credenciais':    ['admin', 'gerente', 'operador'],
  'regras_acesso':  ['admin', 'gerente'],
  'equipamentos':   ['admin', 'gerente'],
  'ocorrencias':    ['admin', 'gerente', 'operador'],
  'relatorios':     ['admin', 'gerente'],
  'auditoria':      ['admin'],
  'configuracoes':  ['admin'],
};

// Primeira tela de cada perfil (destino após login e após acesso negado)
const TELA_INICIAL = {
  admin:    'dashboard',
  gerente:  'dashboard',
  operador: 'dashboard',
  portaria: 'monitoramento',
};

/* ==========================================================
   OBTER PERFIL ATUAL
   ========================================================== */

function obterPerfilAtual() {
  return window.usuarioLogado?.perfil || null;
}

/* ==========================================================
   VERIFICAR PERMISSÃO POR HIERARQUIA
   Uso: possuiPermissao('gerente') → true se for gerente ou admin
   ========================================================== */

function possuiPermissao(perfilNecessario) {
  const perfilUsuario = obterPerfilAtual();
  if (!perfilUsuario) return false;
  const nivelUsuario    = PERFIS[perfilUsuario]    || 0;
  const nivelNecessario = PERFIS[perfilNecessario] || 0;
  return nivelUsuario >= nivelNecessario;
}

/* ==========================================================
   VERIFICAR ACESSO À TELA ATUAL
   Usa TELAS_PERMITIDAS (lida com exceções como portaria)
   Retorna true se pode acessar, false + redireciona se não pode
   ========================================================== */

function verificarAcessoTela() {
  const usuario = window.usuarioLogado;
  if (!usuario) {
    window.location.href = 'login.html';
    return false;
  }

let pagina = window.location.pathname.toLowerCase();

// remove tudo antes da última barra
pagina = pagina.substring(pagina.lastIndexOf('/') + 1);

// remove extensão
pagina = pagina.replace('.html', '');

// fallback
if (!pagina || pagina === '') {
  pagina = 'dashboard';
}

console.log('[CRV DEBUG]', {
  pagina,
  perfil: usuario.perfil,
  permitido: TELAS_PERMITIDAS[pagina]
});

  const permitidos = TELAS_PERMITIDAS[pagina];

  // Tela não mapeada = acessível a qualquer usuário logado
  if (!permitidos) {
  console.error('[CRV] Página não mapeada:', pagina);

  // 🔥 BLOQUEIA POR SEGURANÇA
  const destino = TELA_INICIAL[usuario.perfil] || 'dashboard';
  window.location.href = destino + '.html';

  return false;
}

  if (!permitidos.includes(usuario.perfil)) {
    console.warn(`[CRV] 🚫 Perfil "${usuario.perfil}" sem acesso à tela "${pagina}"`);
    const destino = TELA_INICIAL[usuario.perfil] || 'dashboard';
    window.location.href = destino + '.html';
    return false;
  }

  return true;
}

/* ==========================================================
   PROTEGER PÁGINA
   - Sem parâmetro: apenas verifica se está logado
   - Com parâmetro: verifica hierarquia de perfil também
   Retorna o objeto usuário ou null
   ========================================================== */

function protegerPagina(perfilNecessario = null) {
  const raw = localStorage.getItem('usuario_logado');

  if (!raw) {
    console.warn('[CRV] Usuário não autenticado — redirecionando para login');
    window.location.href = 'login.html';
    return null;
  }

  let usuario;
  try {
    usuario = JSON.parse(raw);
    window.usuarioLogado = usuario;
  } catch {
    console.error('[CRV] Sessão corrompida — limpando e redirecionando');
    localStorage.removeItem('usuario_logado');
    window.location.href = 'login.html';
    return null;
  }

  // Verifica hierarquia se perfilNecessario foi informado
  if (perfilNecessario) {
    const nivelUsuario    = PERFIS[usuario.perfil]       || 0;
    const nivelNecessario = PERFIS[perfilNecessario]     || 0;
    if (nivelUsuario < nivelNecessario) {
      console.warn(`[CRV] Perfil insuficiente: "${usuario.perfil}" < "${perfilNecessario}"`);
      alert('Você não possui permissão para acessar esta página.');
      const destino = TELA_INICIAL[usuario.perfil] || 'dashboard';
      window.location.href = destino + '.html';
      return null;
    }
  }

  return usuario;
}

/* ==========================================================
   FILTRAR SIDEBAR PELO PERFIL
   Oculta itens de menu que o perfil não pode acessar.
   Funciona com atributo [data-href] nos <li> ou <a> do menu.
   ========================================================== */
function filtrarMenuPorPerfil(perfil) {
  if (!perfil) return;

  document.querySelectorAll('[data-page]').forEach(el => {
    const href  = (el.dataset.page || '').replace('.html', '');
    const telas = TELAS_PERMITIDAS[href];

    if (!telas) return;

    const visivel = telas.includes(perfil);
    el.style.display = visivel ? '' : 'none';
    el.setAttribute('aria-hidden', String(!visivel));
  });
}

/* ==========================================================
   APLICAR PERMISSÕES NA UI
   Oculta elementos com [data-permissao="perfil"] se o usuário
   não atingir o nível necessário.
   Exemplo: <button data-permissao="gerente">Excluir</button>
   ========================================================== */

function aplicarPermissoesUI() {
  document.querySelectorAll('[data-permissao]').forEach(el => {
    const perfilNecessario = el.dataset.permissao;
    if (!possuiPermissao(perfilNecessario)) {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    }
  });
}

/* ==========================================================
   AUTO APLICAR AO CARREGAR O DOM
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  try {
    aplicarPermissoesUI();
  } catch (e) {
    console.warn('[CRV] Erro ao aplicar permissões UI:', e);
  }
});

/* ==========================================================
   EXPOR GLOBALMENTE
   ========================================================== */

window.permissoesCRV = {
  obterPerfilAtual,
  possuiPermissao,
  protegerPagina,
  aplicarPermissoesUI,
  verificarAcessoTela,
  filtrarMenuPorPerfil,
};

// Atalhos diretos (usados pelo auth.js e main.js)
window.verificarAcessoTela  = verificarAcessoTela;
window.filtrarMenuPorPerfil = filtrarMenuPorPerfil;
window.protegerPagina       = protegerPagina;
window.possuiPermissao      = possuiPermissao;
window.TELAS_PERMITIDAS     = TELAS_PERMITIDAS;
window.TELA_INICIAL         = TELA_INICIAL;