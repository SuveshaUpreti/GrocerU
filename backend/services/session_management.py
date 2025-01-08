from flask import jsonify, session
from functools import wraps

def login_required(f):
    """
    Middleware to ensure a user is logged in.
    If the user is not logged in, an unauthorized error is returned.
    Otherwise, the original function is called.
    """
    @wraps(f)  # Preserve the original function's name and metadata
    def wrap(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized access. Please log in."}), 401
        return f(*args, **kwargs)
    return wrap
