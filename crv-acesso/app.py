import os
import requests
from flask import Flask, send_from_directory, request, jsonify
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.')

# ─── Variáveis de ambiente ───────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY", "")


# ─── CORS simples (frontend mesmo domínio + localhost) ───────────────────────
@app.after_request
def add_cors(response):
    origin  = request.headers.get("Origin", "")
    allowed = ["http://localhost", "http://127.0.0.1"]
    if any(origin.startswith(a) for a in allowed) or not origin:
        response.headers["Access-Control-Allow-Origin"]  = origin or "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    return response

@app.route("/api/<path:path>", methods=["OPTIONS"])
def options_handler(path):
    return "", 204


# ─── Guard: verifica se as envs estão configuradas ───────────────────────────
def requer_servico(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not SUPABASE_URL or not SERVICE_KEY:
            return jsonify({"erro": "Servidor sem SUPABASE_URL ou SUPABASE_SERVICE_KEY configurados."}), 500
        return f(*args, **kwargs)
    return wrapper


# ─── Headers padrão para chamadas Admin ──────────────────────────────────────
def headers_admin():
    return {
        "apikey":        SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type":  "application/json",
    }


# ─── Log de requisições ──────────────────────────────────────────────────────
@app.before_request
def log_request():
    if request.path.startswith("/api"):
        print(f"[REQ] {request.method} {request.path}")


# ════════════════════════════════════════════════════════════════════════════
#  API — USUÁRIOS
# ════════════════════════════════════════════════════════════════════════════

@app.route("/api/criar-usuario", methods=["POST"])
@requer_servico
def criar_usuario():
    """
    Cria usuário no Supabase Auth + insere na tabela `usuarios`.
    Body JSON: { nome, email, senha, perfil }
    """
    dados  = request.get_json(silent=True) or {}
    nome   = (dados.get("nome")   or "").strip()
    email  = (dados.get("email")  or "").strip()
    senha  = (dados.get("senha")  or "").strip()
    perfil = (dados.get("perfil") or "operador").strip()

    # Validação
    if not nome or not email or not senha:
        return jsonify({"erro": "nome, email e senha são obrigatórios."}), 400
    if len(senha) < 8:
        return jsonify({"erro": "A senha deve ter no mínimo 8 caracteres."}), 400
    if "@" not in email:
        return jsonify({"erro": "E-mail inválido."}), 400
    if perfil not in ("admin", "gerente", "operador", "portaria"):
        return jsonify({"erro": f"Perfil inválido: {perfil}"}), 400

    # 🔥 IDENTIFICAR USUÁRIO LOGADO
    auth_header = request.headers.get('Authorization')

    if not auth_header or auth_header == "undefined":
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    # 🔥 remove "Bearer " se vier
    user_id = auth_header.replace("Bearer ", "").strip()

    if not user_id:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    # 🔥 BUSCAR EMPRESA DO ADMIN
    user_res = requests.get(
        f"{SUPABASE_URL}/rest/v1/usuarios?id=eq.{user_id}&select=*",
        headers=headers_admin(),
        timeout=10
    )

    if user_res.status_code != 200:
        return jsonify({'erro': 'Erro ao buscar usuário'}), 500

    usuarios = user_res.json()

    if not usuarios:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    usuario = usuarios[0]
    empresa_id = usuario.get("empresa_id")

    if not empresa_id:
        return jsonify({'erro': 'Usuário sem empresa vinculada'}), 400

    # 1️⃣ Cria no Supabase Auth
    auth_resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=headers_admin(),
        json={
            "email":         email,
            "password":      senha,
            "email_confirm": True,
            "user_metadata": {"nome": nome, "perfil": perfil},
        },
        timeout=10,
    )

    if auth_resp.status_code not in (200, 201):
        body = auth_resp.json()
        msg  = body.get("msg") or body.get("message") or body.get("error_description") or "Erro no Auth"
        print(f"[ERRO] criar-usuario Auth: {auth_resp.status_code} — {msg}")
        return jsonify({"erro": msg}), 400

    user_id = auth_resp.json().get("id")
    if not user_id:
        return jsonify({"erro": "Auth não retornou ID do usuário."}), 500

    # 2️⃣ Insere na tabela `usuarios`
    db_resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/usuarios",
        headers={**headers_admin(), "Prefer": "return=minimal"},
        json={
            "id":              user_id,
            "nome":            nome,
            "email":           email,
            "perfil":          perfil,
            "ativo":           True,
            "primeiro_acesso": True,
            "empresa_id": empresa_id
        },
        timeout=10,
    )

    if db_resp.status_code not in (200, 201):
        # Auth criado mas tabela falhou — tenta desfazer o Auth para não ficar órfão
        requests.delete(
            f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
            headers=headers_admin(),
            timeout=10,
        )
        print(f"[ERRO] criar-usuario tabela: {db_resp.status_code} — {db_resp.text}")
        return jsonify({
            "erro":    "Falha ao salvar na tabela `usuarios`. Verifique as políticas RLS.",
            "detalhe": db_resp.text,
        }), 500

    print(f"[OK] Usuário criado: {email} ({perfil}) — id: {user_id}")
    return jsonify({"ok": True, "id": user_id}), 201


@app.route("/api/editar-usuario", methods=["POST"])
@requer_servico
def editar_usuario():
    """
    Atualiza nome e perfil de um usuário existente.
    Body JSON: { id, nome, perfil }
    """
    dados  = request.get_json(silent=True) or {}
    uid    = (dados.get("id")     or "").strip()
    nome   = (dados.get("nome")   or "").strip()
    perfil = (dados.get("perfil") or "").strip()

    if not uid or not nome or not perfil:
        return jsonify({"erro": "id, nome e perfil são obrigatórios."}), 400
    if perfil not in ("admin", "gerente", "operador", "portaria"):
        return jsonify({"erro": f"Perfil inválido: {perfil}"}), 400

    # Atualiza metadados no Auth
    requests.put(
        f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
        headers=headers_admin(),
        json={"user_metadata": {"nome": nome, "perfil": perfil}},
        timeout=10,
    )

    # Atualiza na tabela
    db_resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/usuarios?id=eq.{uid}",
        headers={**headers_admin(), "Prefer": "return=minimal"},
        json={"nome": nome, "perfil": perfil},
        timeout=10,
    )

    if db_resp.status_code not in (200, 204):
        return jsonify({"erro": "Falha ao atualizar na tabela.", "detalhe": db_resp.text}), 500

    print(f"[OK] Usuário editado: id={uid} nome={nome} perfil={perfil}")
    return jsonify({"ok": True}), 200


@app.route("/api/desativar-usuario", methods=["POST"])
@requer_servico
def desativar_usuario():
    """
    Bane no Auth (~100 anos) + marca ativo=false na tabela.
    Body JSON: { id }
    """
    dados = request.get_json(silent=True) or {}
    uid   = (dados.get("id") or "").strip()

    if not uid:
        return jsonify({"erro": "id é obrigatório."}), 400

    auth_resp = requests.put(
        f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
        headers=headers_admin(),
        json={"ban_duration": "876600h"},
        timeout=10,
    )

    requests.patch(
        f"{SUPABASE_URL}/rest/v1/usuarios?id=eq.{uid}",
        headers={**headers_admin(), "Prefer": "return=minimal"},
        json={"ativo": False},
        timeout=10,
    )

    if auth_resp.status_code not in (200, 204):
        return jsonify({"erro": "Falha ao banir no Auth.", "detalhe": auth_resp.text}), 400

    print(f"[OK] Usuário desativado: id={uid}")
    return jsonify({"ok": True}), 200


@app.route("/api/reativar-usuario", methods=["POST"])
@requer_servico
def reativar_usuario():
    """
    Remove o ban do Auth + marca ativo=true na tabela.
    Body JSON: { id }
    """
    dados = request.get_json(silent=True) or {}
    uid   = (dados.get("id") or "").strip()

    if not uid:
        return jsonify({"erro": "id é obrigatório."}), 400

    auth_resp = requests.put(
        f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
        headers=headers_admin(),
        json={"ban_duration": "none"},
        timeout=10,
    )

    requests.patch(
        f"{SUPABASE_URL}/rest/v1/usuarios?id=eq.{uid}",
        headers={**headers_admin(), "Prefer": "return=minimal"},
        json={"ativo": True},
        timeout=10,
    )

    if auth_resp.status_code not in (200, 204):
        return jsonify({"erro": "Falha ao reativar no Auth.", "detalhe": auth_resp.text}), 400

    print(f"[OK] Usuário reativado: id={uid}")
    return jsonify({"ok": True}), 200


@app.route("/api/alterar-senha", methods=["POST"])
@requer_servico
def alterar_senha():
    """
    Altera a senha de um usuário via service_role (sem precisar da senha atual).
    Body JSON: { id, nova_senha }
    """
    dados      = request.get_json(silent=True) or {}
    uid        = (dados.get("id")         or "").strip()
    nova_senha = (dados.get("nova_senha") or "").strip()

    if not uid or not nova_senha:
        return jsonify({"erro": "id e nova_senha são obrigatórios."}), 400
    if len(nova_senha) < 8:
        return jsonify({"erro": "A senha deve ter no mínimo 8 caracteres."}), 400

    auth_resp = requests.put(
        f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
        headers=headers_admin(),
        json={"password": nova_senha},
        timeout=10,
    )

    if auth_resp.status_code not in (200, 204):
        body = auth_resp.json()
        msg  = body.get("msg") or body.get("message") or "Erro ao alterar senha"
        return jsonify({"erro": msg}), 400

    print(f"[OK] Senha alterada para usuário: id={uid}")
    return jsonify({"ok": True}), 200


@app.route("/api/excluir-usuario", methods=["POST"])
@requer_servico
def excluir_usuario():
    """
    Remove permanentemente do Auth e da tabela `usuarios`.
    Body JSON: { id }
    ⚠️  Use com cuidado — preferir desativar em vez de excluir.
    """
    dados = request.get_json(silent=True) or {}
    uid   = (dados.get("id") or "").strip()

    if not uid:
        return jsonify({"erro": "id é obrigatório."}), 400

    # Remove da tabela primeiro (FK)
    requests.delete(
        f"{SUPABASE_URL}/rest/v1/usuarios?id=eq.{uid}",
        headers={**headers_admin(), "Prefer": "return=minimal"},
        timeout=10,
    )

    # Remove do Auth
    auth_resp = requests.delete(
        f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
        headers=headers_admin(),
        timeout=10,
    )

    if auth_resp.status_code not in (200, 204):
        return jsonify({"erro": "Falha ao excluir do Auth.", "detalhe": auth_resp.text}), 400

    print(f"[OK] Usuário excluído permanentemente: id={uid}")
    return jsonify({"ok": True}), 200

# ════════════════════════════════════════════════════════════════════════════
#  API — EMPRESA (MULTIEMPRESA REAL)
# ════════════════════════════════════════════════════════════════════════════

@app.route("/api/empresa", methods=["GET"])
@requer_servico
def obter_empresa():
    """
    Retorna dados da empresa do usuário atual
    """

    # 🔥 IDENTIFICAR USUÁRIO
    auth_header = request.headers.get('Authorization')

    if not auth_header or auth_header == "undefined":
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    user_id = auth_header.replace("Bearer ", "").strip()

    if not user_id:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    # 🔥 BUSCAR USUÁRIO
    user_res = requests.get(
        f"{SUPABASE_URL}/rest/v1/usuarios?id=eq.{user_id}&select=*",
        headers=headers_admin(),
        timeout=10
    )

    if user_res.status_code != 200:
        print("[ERRO] buscar usuario:", user_res.text)
        return jsonify({'erro': 'Erro ao buscar usuário'}), 500

    usuarios = user_res.json()

    if not usuarios:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    usuario = usuarios[0]
    empresa_id = usuario.get('empresa_id')

    if not empresa_id:
        return jsonify({'erro': 'Usuário sem empresa vinculada'}), 400

    # 🔥 BUSCAR EMPRESA CORRETA
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/empresas?id=eq.{empresa_id}&select=*",
        headers=headers_admin(),
        timeout=10,
    )

    if resp.status_code != 200:
        print("[ERRO] obter_empresa:", resp.text)
        return jsonify({"erro": "Erro ao buscar empresa"}), 500

    data = resp.json()

    if not data:
        return jsonify({})

    return jsonify(data[0])


@app.route("/api/atualizar-empresa", methods=["POST"])
@requer_servico
def atualizar_empresa():
    """
    Atualiza dados da empresa
    Body: { nome, cnpj, endereco, tel }
    """

    dados = request.get_json(silent=True) or {}

    nome     = (dados.get("nome")     or "").strip()
    cnpj     = (dados.get("cnpj")     or "").strip()
    endereco = (dados.get("endereco") or "").strip()
    tel      = (dados.get("tel")      or "").strip()

    if not nome:
        return jsonify({"erro": "Nome da empresa é obrigatório"}), 400

    # 🔥 IDENTIFICAR USUÁRIO
    auth_header = request.headers.get('Authorization')

    if not auth_header or auth_header == "undefined":
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    user_id = auth_header.replace("Bearer ", "").strip()

    if not user_id:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    # 🔥 BUSCAR USUÁRIO
    user_res = requests.get(
        f"{SUPABASE_URL}/rest/v1/usuarios?id=eq.{user_id}&select=*",
        headers=headers_admin(),
        timeout=10
    )

    if user_res.status_code != 200:
        print("[ERRO] buscar usuario:", user_res.text)
        return jsonify({'erro': 'Erro ao buscar usuário'}), 500

    usuarios = user_res.json()

    if not usuarios:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    usuario = usuarios[0]
    empresa_id = usuario.get('empresa_id')

    if not empresa_id:
        return jsonify({'erro': 'Usuário sem empresa vinculada'}), 400

    # 🔥 ATUALIZAR EMPRESA CORRETA
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/empresas?id=eq.{empresa_id}",
        headers={**headers_admin(), "Prefer": "return=minimal"},
        json={
            "nome": nome,
            "cnpj": cnpj,
            "endereco": endereco,
            "tel": tel,
        },
        timeout=10,
    )

    # 🔥 VALIDAÇÃO FINAL
    if resp.status_code not in (200, 201, 204):
        print("[ERRO] atualizar_empresa:", resp.text)
        return jsonify({"erro": "Erro ao salvar empresa"}), 500

    print(f"[OK] Empresa salva/atualizada: {nome}")
    return jsonify({"ok": True})

# ════════════════════════════════════════════════════════════════════════════
#  STATIC + SPA FALLBACK
# ════════════════════════════════════════════════════════════════════════════

@app.route("/")
def index():
    return send_from_directory(".", "login.html")

@app.route("/<path:path>")
def static_files(path):
    file_path = os.path.join(".", path)
    if os.path.exists(file_path):
        return send_from_directory(".", path)
    print(f"[WARN] Arquivo não encontrado: {path}")
    return send_from_directory(".", "login.html")


if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 10000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)