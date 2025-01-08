from flask import Blueprint, jsonify, request, session
from services.database import get_db_connection
from utils.errorhandler import create_error_response, validate_item_data
from routes.auth import login_required
import logging

items_bp = Blueprint('items', __name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get all inventory items (in_list = 0)
@items_bp.route('/inventory_items', methods=['GET'])
@login_required
def get_inventory_items():
    user_id = session['user_id']
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM Items WHERE user_id = ? AND in_list = 0', (user_id,)).fetchall()
    conn.close()

    if not items:
        return create_error_response(404, "No inventory items found.")
    return jsonify([dict(item) for item in items])

# Delete an inventory item by ID, including `in_list`
@items_bp.route('/inventory_items/<int:item_id>', methods=['DELETE'])
@login_required
def delete_inventory_item(item_id):
    user_id = session['user_id']

    # Connect to the database
    conn = get_db_connection()
    item = conn.execute('SELECT * FROM Items WHERE user_id = ? AND item_id = ? AND in_list = 0', (user_id, item_id)).fetchone()

    # Check if the item exists
    if item is None:
        conn.close()
        return create_error_response(404, "Item not found.")

    # Delete the item
    conn.execute('DELETE FROM Items WHERE user_id = ? AND item_id = ? AND in_list = 0', (user_id, item_id))
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Item successfully deleted.",
        "item_id": item_id,
        "user_id": user_id
    }), 200


# Get all grocery items (in_list = 1)
@items_bp.route('/grocery_items', methods=['GET'])
@login_required
def get_grocery_items():
    user_id = session['user_id']
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM Items WHERE user_id = ? AND in_list = 1', (user_id,)).fetchall()
    conn.close()

    if not items:
        return create_error_response(404, "No grocery items found.")
    return jsonify([dict(item) for item in items])

# Delete a grocery item by ID, including `in_list`
@items_bp.route('/grocery_items/<int:item_id>', methods=['DELETE'])
@login_required
def delete_grocery_item(item_id):
    user_id = session['user_id']

    # Connect to the database
    conn = get_db_connection()
    item = conn.execute('SELECT * FROM Items WHERE user_id = ? AND item_id = ? AND in_list = 1', (user_id, item_id)).fetchone()

    # Check if the item exists
    if item is None:
        conn.close()
        return create_error_response(404, "Item not found.")

    # Delete the item
    conn.execute('DELETE FROM Items WHERE user_id = ? AND item_id = ? AND in_list = 1', (user_id, item_id))
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Item successfully deleted.",
        "item_id": item_id,
        "user_id": user_id
    }), 200


# Get all items regardless of `in_list`
@items_bp.route('/items', methods=['GET'])
@login_required
def get_all_items():
    user_id = session['user_id']
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM Items WHERE user_id = ?', (user_id,)).fetchall()
    conn.close()

    if not items:
        return create_error_response(404, "No items found.")
    
    logger.info("Items fetched: %s", [dict(item) for item in items])
    return jsonify([dict(item) for item in items])

# Create a new item with `in_list` field
@items_bp.route('/items', methods=['POST'])
@login_required
def create_item():
    user_id = session['user_id']
    data = request.json

    error_response = validate_item_data(data)
    if error_response:
        return error_response

    in_list = data.get('in_list', 0)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO Items (item_name, category, quantity, in_list, user_id, item_state, location) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        (data['item_name'], data['category'], data['quantity'], in_list, user_id, data.get('item_state', None), data['location'])
    )
    conn.commit()
    item_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "item_id": item_id,
        "item_name": data['item_name'],
        "category": data['category'],
        "quantity": data['quantity'],
        "in_list": in_list,
        "user_id": user_id,
        "item_state": data.get('item_state'),
        "location": data['location']
    }), 201

# Retrieve a single item by ID
@items_bp.route('/items/<int:item_id>', methods=['GET'])
@login_required
def get_item(item_id):
    conn = get_db_connection()
    item = conn.execute('SELECT * FROM Items WHERE item_id = ?', (item_id,)).fetchone()
    conn.close()

    if item is None:
        return create_error_response(404, "Item not found.")
    return jsonify(dict(item))

# Update an item by ID, including `in_list`
@items_bp.route('/items/<int:item_id>', methods=['PUT'])
@login_required
def update_item(item_id):
    data = request.json
    user_id = session['user_id']
    
    error_response = validate_item_data(data)
    if error_response:
        return error_response

    conn = get_db_connection()
    item = conn.execute('SELECT * FROM Items WHERE item_id = ?', (item_id,)).fetchone()

    if item is None:
        conn.close()
        return create_error_response(404, "Item not found.")

    conn.execute(
        'UPDATE Items SET item_name = ?, category = ?, quantity = ?, in_list = ?, item_state = ?, location = ? WHERE item_id = ?', 
        (data.get('item_name', item['item_name']),
         data.get('category', item['category']),
         data.get('quantity', item['quantity']),
         data.get('in_list', item['in_list']),
         data.get('item_state', item['item_state']),
         data.get('location', item['location']),
         item_id)
    )
    conn.commit()
    conn.close()

    return jsonify({
        "item_id": item_id,
        "item_name": data.get('item_name', item['item_name']),
        "category": data.get('category', item['category']),
        "quantity": data.get('quantity', item['quantity']),
        "in_list": data.get('in_list', item['in_list']),
        "item_state": data.get('item_state', item['item_state']),
        "location": data.get('location', item['location']),
        "user_id": user_id
    })



@items_bp.route('/send_to_list', methods=['PUT'])
@login_required
def updateItemInList():
    data = request.json
    user_id = session['user_id']
    item_ids = data.get('item_ids', [])
    new_in_list_value = data.get('in_list')

    # Ensure item_ids is always a list
    if isinstance(item_ids, int):  # If a single integer is passed, convert to list
        item_ids = [item_ids]
    
    if not item_ids or new_in_list_value is None:
        return create_error_response(400, "Invalid data. Provide item_ids and in_list value.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executemany(
        'UPDATE Items SET in_list = ? WHERE item_id = ? AND user_id = ?',
        [(new_in_list_value, item_id, user_id) for item_id in item_ids]
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Items updated successfully", "updated_item_ids": item_ids})
@items_bp.route('/transfer_to_inventory', methods=['POST'])
@login_required
def transfer_to_inventory():
    data = request.json
    user_id = session['user_id']
    item_ids = data.get('item_ids', [])  # List of item IDs to transfer

    if not item_ids:
        return create_error_response(400, "Invalid request. No item IDs provided.")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Fetch grocery items to be transferred
        grocery_items = conn.execute(
            'SELECT * FROM Items WHERE user_id = ? AND item_id IN ({}) AND in_list = 1'.format(
                ','.join(['?'] * len(item_ids))
            ),
            [user_id] + item_ids
        ).fetchall()

        if not grocery_items:
            return create_error_response(404, "No matching grocery items found.")

        for grocery_item in grocery_items:
            item_name = grocery_item["item_name"]
            location = grocery_item["location"]
            quantity = grocery_item["quantity"]

            # Check if the item already exists in the inventory
            existing_item = conn.execute(
                'SELECT * FROM Items WHERE user_id = ? AND item_name = ? AND location = ? AND in_list = 0',
                (user_id, item_name, location)
            ).fetchone()

            if existing_item:
                # Increment the quantity of the existing inventory item
                new_quantity = existing_item["quantity"] + quantity
                conn.execute(
                    'UPDATE Items SET quantity = ? WHERE item_id = ?',
                    (new_quantity, existing_item["item_id"])
                )
                # Delete the grocery item after it has been transferred
                conn.execute(
                    'DELETE FROM Items WHERE item_id = ?',
                    (grocery_item["item_id"],)
                )
            else:
                # Add the grocery item to the inventory and remove it from the grocery list
                conn.execute(
                    'UPDATE Items SET in_list = 0, item_state = ? WHERE item_id = ?',
                    ('High', grocery_item["item_id"])
                )

        conn.commit()

        return jsonify({
            "message": "Items successfully transferred to inventory",
            "transferred_item_ids": item_ids
        }), 200

    except Exception as e:
        conn.rollback()
        logger.error(f"Error transferring items to inventory: {e}")
        return create_error_response(500, "Failed to transfer items to inventory.")

    finally:
        conn.close()
