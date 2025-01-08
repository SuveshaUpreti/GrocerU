from flask import jsonify

def create_error_response(status_code, message):
    response = {
        "error": message
    }
    return jsonify(response), status_code

def validate_item_data(data):
    if not data:
        return create_error_response(400, "No data provided.")
    
    # Validate 'item_name' instead of 'name'
    if 'item_name' not in data or not isinstance(data['item_name'], str) or not data['item_name'].strip():
        return create_error_response(400, "Invalid input: 'item_name' must be a non-empty string.")
    
    # Validate 'category'
    if 'category' not in data or not isinstance(data['category'], str) or not data['category'].strip():
        return create_error_response(400, "Invalid input: 'category' must be a non-empty string.")
    
    # Validate 'quantity'
    if 'quantity' not in data:
        return create_error_response(400, "Missing required field: 'quantity'.")
    
    if not isinstance(data['quantity'], int) or data['quantity'] <= 0:  # Changed to ensure quantity is an integer
        return create_error_response(400, "Invalid input: 'quantity' must be a positive integer.")
    
    return None  # No errors
