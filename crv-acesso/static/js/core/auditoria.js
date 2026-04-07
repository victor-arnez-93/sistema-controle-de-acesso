/* =====================================================
   CRV — MÓDULO CORE: AUDITORIA
   Registra ações do sistema na tabela `auditoria`.
   Usado por todas as telas via registrarAuditoria().
   ===================================================== */

/**
 * Registra uma ação de auditoria no Supabase.
 *
 * Aceita dois formatos:
 *   1. Objeto:     registrarAuditoria({ acao, modulo, descricao, extra, nivel })
 *   2. Parâmetros: registrarAuditoria('criar', 'Módulo', 'Descrição', extra, nivel)
 *
 * @param {string|object} acaoOuObj
 * @param {string}  [modulo]
 * @param {string}  [descricao]
 * @param {object}  [extra]   - Dados adicionais opcionais (payload JSON)
 * @param {string}  [nivel]   - 'info' | 'aviso' | 'critico' (padrão: 'info')
 */
async function registrarAuditoria(acaoOuObj, modulo, descricao, extra = null, nivel = 'info') {

  try {

    let acao = acaoOuObj;

    if (acaoOuObj && typeof acaoOuObj === 'object') {
      acao      = acaoOuObj.acao      || '';
      modulo    = acaoOuObj.modulo    || '';
      descricao = acaoOuObj.descricao || '';
      extra     = acaoOuObj.extra     || null;
      nivel     = acaoOuObj.nivel     || 'info';
    }

    const supabase = window.getSupabase();
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    const usuario_id = session?.user?.id || null;

    let ip_origem = null;
    try {
      const res  = await fetch('https://api.ipify.org?format=json');
      const json = await res.json();
      ip_origem  = json.ip;
    } catch (_) {}

    const { error } = await supabase.from('auditoria').insert({
      acao,
      modulo,
      descricao,
      nivel,
      usuario_id,
      ip_origem,
      extra: extra ? JSON.stringify(extra) : null,
      data:  new Date().toISOString(),
    });

    if (error) console.warn('[AUDITORIA] Falha ao registrar:', error.message);

  } catch (err) {
    console.warn('[AUDITORIA] Erro silencioso:', err.message);
  }

}

window.registrarAuditoria = registrarAuditoria;