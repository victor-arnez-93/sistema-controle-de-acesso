import os
from flask import Flask, send_from_directory, request

app = Flask(__name__, static_folder='.')

# Log simples de requisição (muito útil)
@app.before_request
def log_request():
    print(f"[REQ] {request.method} {request.path}")

# Rota principal
@app.route('/')
def index():
    return send_from_directory('.', 'dashboard.html')

# Servir arquivos + fallback SPA
@app.route('/<path:path>')
def static_files(path):
    file_path = os.path.join('.', path)

    if os.path.exists(file_path):
        return send_from_directory('.', path)
    else:
        print(f"[WARN] Arquivo não encontrado: {path}")
        return send_from_directory('.', 'dashboard.html')


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)