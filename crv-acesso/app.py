import os
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='.')

# Rota principal
@app.route('/')
def index():
    return send_from_directory('.', 'dashboard.html')

# Servir arquivos estáticos corretamente
@app.route('/<path:path>')
def static_files(path):
    file_path = os.path.join('.', path)

    if os.path.exists(file_path):
        return send_from_directory('.', path)
    else:
        # fallback importante (SPA / navegação interna)
        return send_from_directory('.', 'dashboard.html')


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)