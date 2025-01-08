from flask import jsonify

def validate_item_data(data):
    """
    Validate the input data for grocery items.
    Ensures required fields are present and that data types are correct.
    """
    if not data or 'item_name' not in data or 'category' not in data or 'quantity' not in data:
        return create_error_response(400, "Missing required fields: 'item_name', 'category', or 'quantity'.")
    
    if not isinstance(data['item_name'], str) or not isinstance(data['category'], str):
        return create_error_response(400, "'item_name' and 'category' must be strings.")
    
    if not isinstance(data['quantity'], int):
        return create_error_response(400, "'quantity' must be an integer.")
    
    return None  # No errors

def validate_user_data(data):
    """
    Validate the input data for user registration and login.
    Ensures required fields are present and that they follow the correct format.
    """
    if not data or 'username' not in data or 'email' not in data or 'password' not in data:
        return create_error_response(400, "Missing required fields: 'username', 'email', or 'password'.")

    if not isinstance(data['username'], str) or not isinstance(data['email'], str) or not isinstance(data['password'], str):
        return create_error_response(400, "'username', 'email', and 'password' must be strings.")
    
    # Add further validations like password length, valid email format, etc.
    
    return None  # No errors

def create_error_response(status_code, message):
    """
    Utility function to create consistent error responses.
    Returns a JSON error message with a status code.
    """
    response = jsonify({"error": message})
    response.status_code = status_code
    return response
