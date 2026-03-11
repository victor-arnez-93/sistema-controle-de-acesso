/* ============================================================
   CRV CONTROLE DE ACESSO — main.js
   Comportamentos globais: partials, tema, relógio, sidebar
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  loadPartials().then(() => {
    initTheme();
    initClock();
    initSidebar();
    setActivePage();
    initNavegacao();
  });
});

/* ------------------------------------------------------------
   CARREGAR PARTIALS (header + sidebar)
   ------------------------------------------------------------ */
async function loadPartials() {
  const sidebarContainer = document.getElementById('sidebar-container');
  const headerContainer  = document.getElementById('header-container');
  if (!sidebarContainer || !headerContainer) return;

  try {
    const [sidebarRes, headerRes] = await Promise.all([
      fetch('static/partials/sidebar.html'),
      fetch('static/partials/header.html')
    ]);
    sidebarContainer.innerHTML = await sidebarRes.text();
    headerContainer.innerHTML  = await headerRes.text();
  } catch (e) {
    console.warn('Erro ao carregar partials:', e);
  }
}

/* ------------------------------------------------------------
   TEMA CLARO / ESCURO
   ------------------------------------------------------------ */
function initTheme() {
  const saved = localStorage.getItem('crv-theme') || 'light';
  applyTheme(saved);

  document.addEventListener('click', (e) => {
    if (e.target.closest('#theme-toggle')) {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('crv-theme', theme);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
  }
}

/* ------------------------------------------------------------
   RELÓGIO EM TEMPO REAL
   ------------------------------------------------------------ */
function initClock() {
  function tick() {
    const el = document.getElementById('header-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('pt-BR');
  }
  tick();
  setInterval(tick, 1000);
}

/* ------------------------------------------------------------
   SIDEBAR — colapsar / hamburger / mobile
   ------------------------------------------------------------ */
function initSidebar() {
  const wrapper = document.querySelector('.app-wrapper');
  if (!wrapper) return;

  // Restaurar estado salvo
  const saved = localStorage.getItem('crv-sidebar');
  if (saved === 'collapsed') wrapper.classList.add('sidebar-collapsed');

  // Botão hamburger
  document.addEventListener('click', (e) => {
    if (e.target.closest('#hamburger-btn')) {
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        toggleMobileSidebar();
      } else {
        wrapper.classList.toggle('sidebar-collapsed');
        localStorage.setItem(
          'crv-sidebar',
          wrapper.classList.contains('sidebar-collapsed') ? 'collapsed' : 'open'
        );
      }
    }

    // Fechar mobile ao clicar no overlay
    if (e.target.closest('#sidebar-overlay')) {
      closeMobileSidebar();
    }
  });

  // Fechar mobile ao redimensionar para desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMobileSidebar();
  });
}

function toggleMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('active');
  document.body.style.overflow =
    sidebar.classList.contains('mobile-open') ? 'hidden' : '';
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

/* ------------------------------------------------------------
   MARCAR ITEM ATIVO NA SIDEBAR
   ------------------------------------------------------------ */
function setActivePage() {
  const page = getCurrentPage();
  document.querySelectorAll('.sidebar-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

function getCurrentPage() {
  const path = window.location.pathname;
  const file = path.split('/').pop().replace('.html', '');
  return file || 'dashboard';
}

/* ------------------------------------------------------------
   UTILITÁRIOS GLOBAIS
   ------------------------------------------------------------ */

// Toast de notificação leve
function showToast(message, type = 'info', duration = 3500) {
  const existing = document.getElementById('crv-toast');
  if (existing) existing.remove();

  const colors = {
    success: 'var(--success)',
    danger:  'var(--danger)',
    warning: 'var(--warning)',
    info:    'var(--primary)'
  };

  const toast = document.createElement('div');
  toast.id = 'crv-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 4px solid ${colors[type] || colors.info};
    border-radius: var(--radius-md);
    padding: 14px 20px;
    font-size: 0.875rem;
    color: var(--text-primary);
    box-shadow: var(--shadow-lg);
    z-index: 9999;
    max-width: 320px;
    animation: slideInToast 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Animação do toast
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes slideInToast {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
`;
document.head.appendChild(toastStyle);


/* ------------------------------------------------------------
   NAVEGAÇÃO — mapeia sidebar e botões para suas páginas
   ------------------------------------------------------------ */

const ROTAS = {
  'dashboard':     'dashboard.html',
  'monitoramento': 'monitoramento.html',
  'funcionarios':  'funcionarios.html',
  'credenciais':   'credenciais.html',
  'regras_acesso': 'regras_acesso.html',
  'equipamentos':  'equipamentos.html',
  'ocorrencias':   'ocorrencias.html',
  'relatorios':    'relatorios.html',
  'auditoria':     'auditoria.html',
  'configuracoes': 'configuracoes.html',
};

function initNavegacao() {
  // Sidebar — já funciona pelos href nos <a>, mas garante via JS também
  document.querySelectorAll('.sidebar-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      const rota = ROTAS[item.dataset.page];
      if (rota) {
        e.preventDefault();
        window.location.href = rota;
      }
    });
  });

  // Qualquer botão/link com data-href="nome-da-pagina"
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-href]');
    if (!el) return;
    e.preventDefault();
    const rota = ROTAS[el.dataset.href];
    if (rota) window.location.href = rota;
  });
}
