from flask import Flask
from flask_cors import CORS
from routes.items import items_bp
from routes.users import users_bp
from routes.auth import auth_bp
from routes.shelf_life import shelf_life_bp
from routes.openai import openai_bp
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os
from routes.recipes import recipes_bp

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Set configuration from environment variables
app.secret_key = os.getenv('SECRET_KEY')
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = os.getenv('MAIL_PORT')
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
app.config['SECURITY_PASSWORD_SALT'] = os.getenv('SECURITY_PASSWORD_SALT')
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')

mail = Mail(app)

# Register blueprints
app.register_blueprint(items_bp)
app.register_blueprint(users_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(shelf_life_bp)
app.register_blueprint(recipes_bp)
app.register_blueprint(openai_bp)

# Root route for testing
@app.route('/home')
def home():
    return "Hello, Flask is working!"

# Error handling for 500 - Internal Server Error
@app.errorhandler(500)
def internal_error(e):
    return {"error": "An internal server error occurred."}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
