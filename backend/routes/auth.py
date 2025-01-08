from flask import Blueprint, jsonify, session, request, render_template, flash, redirect, url_for, current_app
from functools import wraps
from flask_mail import Message
from bcrypt import hashpw, gensalt, checkpw
from itsdangerous import URLSafeTimedSerializer
from services.database import get_db_connection


auth_bp = Blueprint('auth', __name__)

def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized access. Please log in."}), 401
        return f(*args, **kwargs)
    return wrap

# Login status route
@auth_bp.route('/login_status', methods=['GET'])
def login_status():
    if 'user_id' in session:
        return jsonify({"logged_in": True, "user_id": session['user_id']}), 200
    else:
        return jsonify({"logged_in": False}), 200


# Password recovery ########################################################################
# Helper function to generate token
def generate_confirmation_token(email):
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    token = s.dumps(email, salt=current_app.config['SECURITY_PASSWORD_SALT'])
    print(f"Generated token for {email}: {token}")
    return token

#Helper function to verify token
def verify_password_reset_token(token, expiration=3600):
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        print(f"Verifying token: {token}")
        email = s.loads(token, salt=current_app.config['SECURITY_PASSWORD_SALT'], max_age=expiration)
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None
    return email

# Helper function to send password reset link to email
def send_email(to, reset_url):
    from app import mail
    # Log the recipient and the reset URL
    print(f"Sending password reset email to: {to}")
    print(f"Reset URL: {reset_url}")
    
    msg = Message("Password Reset Request", recipients=[to])
    msg.body = f"Please click the following link to reset your password: {reset_url}"
    
    try:
        mail.send(msg)
        print("Password reset email sent successfully.")
    except Exception as e:
        print(f"Error sending email: {e}")
        
# Helper function to hash and update user password on password reset
def set_password(user_id, new_password):
    password_hash = hashpw(new_password.encode('utf-8'), gensalt())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE Users SET password_hash = ? WHERE user_id = ?', (password_hash, user_id))
    conn.commit()
    conn.close()

# Password recovery route
@auth_bp.route('/recover_password', methods=['GET', 'POST'])
def recover_password():
    if request.method == 'POST':
        data = request.json 
        email = data.get('email')  
        print(f"Password recovery request for email: {email}")

        conn = get_db_connection()
        user = conn.execute('SELECT * FROM Users WHERE email = ?', (email,)).fetchone()
        conn.close()
        if user: 
            token = generate_confirmation_token(email)
            reset_url = f"http://localhost:3000/reset_password?token={token}"  

            # Link for testing: 
            print(f"Password reset link for testing: {reset_url}")

            ######################################CHANGE BACK FOR DEPLOYMENT
            send_email(user['email'], reset_url)
            return jsonify({'message': 'A password reset link has been sent to your email.'}), 200
        else:
            return jsonify({'error': 'Email address not found.'}), 404

# Password reset view (to handle resetting the password)
@auth_bp.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    email = verify_password_reset_token(token)
    if not email:
        print(f"Invalid or expired token: {token}")
        return jsonify({'error': 'The password reset link is invalid or has expired.'}), 400

    new_password = request.json.get('password')

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM Users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if user:
        user_id = user['user_id']
        set_password(user_id, new_password)
        return jsonify({'message': 'Your password has been updated.'}), 200

    print(f"User not found for email: {email}")
    return jsonify({'error': 'User not found.'}), 404


# Password update route
@auth_bp.route('/update_password', methods=['POST'])
def update_password():
    data = request.json
    new_password = data.get('new_password')

    if not new_password:
        return jsonify({'error': 'New password is required.'}), 400

    user_id = session['user_id']  # Get the current logged-in user ID
    set_password(user_id, new_password)
    return jsonify({'message': 'Password updated successfully.'}), 200
