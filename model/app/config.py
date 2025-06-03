from dotenv import load_dotenv
load_dotenv()

import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'development'
    MONGODB_URI = os.environ.get('MONGODB_URI')
    MONGODB_DB_NAME = os.environ.get('MONGODB_DB_NAME')
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    