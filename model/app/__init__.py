from flask import Flask
from .routes.chat import chat_bp
from .config import Config
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    app.register_blueprint(chat_bp, url_prefix='/api')
    
    return app