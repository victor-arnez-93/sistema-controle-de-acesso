/* ============================================================
   RECUPERAÇÃO DE SENHA — recuperacao_senha.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initEtapas();
  initCodigo();
  initToggleSenhas();
  initForcaSenha();
  initReenviar();
});

let etapaAtual = 1;

function irParaEtapa(n) {
  document.querySelectorAll('[id^="etapa-"]').forEach(el => el.classList.add('rec-hidden'));
  document.querySelectorAll('.rec-step').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === n);
  });

  const mapa = { 1: 'etapa-email', 2: 'etapa-codigo', 3: 'etapa-nova-senha', 4: 'etapa-sucesso' };
  const el = document.getElementById(mapa[n]);
  if (el) el.classList.remove('rec-hidden');
  etapaAtual = n;
}

function initEtapas() {
  // Etapa 1 → 2
  document.getElementById('btn-enviar').addEventListener('click', () => {
    const email = document.getElementById('email-input').value.trim();
    if (!email || !email.includes('@')) {
      document.getElementById('email-input').focus();
      return;
    }
    document.getElementById('email-destino').textContent = email;
    irParaEtapa(2);
  });

  // Etapa 2 → 3
  document.getElementById('btn-verificar').addEventListener('click', () => {
    irParaEtapa(3);
  });

  // Etapa 3 → 4
  document.getElementById('btn-redefinir').addEventListener('click', () => {
    const nova = document.getElementById('nova-senha').value;
    const conf = document.getElementById('conf-senha').value;
    if (!nova || nova !== conf) {
      document.getElementById('conf-senha').focus();
      return;
    }
    irParaEtapa(4);
  });
}

// Navegação automática entre boxes do código
function initCodigo() {
  const inputs = document.querySelectorAll('.rec-codigo-input');
  inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '');
      if (input.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) inputs[i - 1].focus();
    });
  });
}

// Toggle visibilidade das senhas
function initToggleSenhas() {
  [['toggle-nova', 'nova-senha', 'olho-nova'],
   ['toggle-conf', 'conf-senha', 'olho-conf']].forEach(([btnId, inputId, iconId]) => {
    const btn   = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isPass = input.type === 'password';
      input.type     = isPass ? 'text' : 'password';
      icon.className = isPass ? 'ph ph-eye-slash' : 'ph ph-eye';
    });
  });
}

// Força da senha
function initForcaSenha() {
  document.getElementById('nova-senha').addEventListener('input', function () {
    const val   = this.value;
    const fill  = document.getElementById('forca-fill');
    const label = document.getElementById('forca-label');
    let score   = 0;

    if (val.length >= 8)              score++;
    if (/[A-Z]/.test(val))            score++;
    if (/[0-9]/.test(val))            score++;
    if (/[^A-Za-z0-9]/.test(val))     score++;

    const mapa = [
      { pct: '0%',   cor: 'transparent',    txt: '—'      },
      { pct: '25%',  cor: 'var(--danger)',   txt: 'Fraca'  },
      { pct: '50%',  cor: 'var(--warning)',  txt: 'Média'  },
      { pct: '75%',  cor: 'var(--primary)',  txt: 'Boa'    },
      { pct: '100%', cor: 'var(--success)',  txt: 'Forte'  },
    ];

    fill.style.width      = mapa[score].pct;
    fill.style.background = mapa[score].cor;
    label.textContent     = mapa[score].txt;
    label.style.color     = mapa[score].cor;
  });
}

// Contador reenviar
function initReenviar() {
  const btn = document.getElementById('btn-reenviar');
  const txt = document.getElementById('reenviar-txt');
  if (!btn) return;

  btn.addEventListener('click', () => {
    let seg = 30;
    btn.disabled = true;
    const timer = setInterval(() => {
      txt.textContent = `Reenviar em ${seg}s`;
      seg--;
      if (seg < 0) {
        clearInterval(timer);
        btn.disabled    = false;
        txt.textContent = 'Reenviar código';
      }
    }, 1000);
  });
}
