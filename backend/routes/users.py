from flask import Blueprint, jsonify, request, session
from bcrypt import hashpw, gensalt, checkpw
from services.database import get_db_connection
from routes.auth import login_required
from time import time  # Added for lockout timing
import sqlite3

# Lockout configuration
LOCKOUT_AFTER_NUM_OF_LOGIN_ATTEMPTS = 6
LOCKOUT_TIME_SECONDS = 1 * 60  # 5 minutes lockout

users_bp = Blueprint('users', __name__)

# Register new user
@users_bp.route('/register', methods=['POST'])
def register_user():
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not first_name or not last_name or not username or not email or not password:
        return jsonify({'error': 'All fields are required.'}), 400

    password_hash = hashpw(password.encode('utf-8'), gensalt())
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            '''INSERT INTO Users (first_name, last_name, username, email, password_hash) 
            VALUES (?, ?, ?, ?, ?)''',
            (first_name, last_name, username, email, password_hash)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists.'}), 409
    except Exception as e:
        return jsonify({'error': 'An error occurred while registering the user.'}), 500
    finally:
        conn.close()

    return jsonify({'message': 'User registered successfully.'}), 201

# Login existing user
@users_bp.route('/login', methods=['POST'])
def login_user():
    # Initialize unsuccessful login attempts if not set
    if session.get('unsuccessful_login_attempts') is None:
        session['unsuccessful_login_attempts'] = 0

    # Check if the user is currently locked out
    if session['unsuccessful_login_attempts'] >= LOCKOUT_AFTER_NUM_OF_LOGIN_ATTEMPTS:
        if 'login_lockout_time' not in session:
            session['login_lockout_time'] = time()  # Start lockout timer

        # Check if the lockout time has passed
        if time() - session['login_lockout_time'] < LOCKOUT_TIME_SECONDS:
            return jsonify({"error": "Too many failed login attempts. Please try again in 1 minute."}), 401
        else:
            # Reset attempts after lockout period expires
            session['unsuccessful_login_attempts'] = 0
            session.pop('login_lockout_time', None)

    data = request.json
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor()
    user = cursor.execute('SELECT * FROM Users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if user:
        user_id = user['user_id']
        password_hash = user['password_hash']

        # Ensure password_hash is in byte format for bcrypt check
        if isinstance(password_hash, str):
            password_hash = password_hash.encode('utf-8')

        if checkpw(password.encode('utf-8'), password_hash):
            session['user_id'] = user_id
            session['username'] = username
            session['email'] = user['email']
            session['first_name'] = user['first_name']
            session['last_name'] = user['last_name']
            session['unsuccessful_login_attempts'] = 0  # Reset on successful login
            return jsonify({
                "first_name": user['first_name'], 
                "last_name": user['last_name'],
                "username": user['username'],
                "email": user['email'],
                })

    # Increment unsuccessful login attempts
    session['unsuccessful_login_attempts'] += 1
    return jsonify({"error": "Invalid username or password."}), 401

# Logout existing user
@users_bp.route('/logout', methods=['POST'])
@login_required
def logout_user():
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('first_name', None)
    session.pop('last_name', None)
    return jsonify({"msg": "Logout successful."}), 200