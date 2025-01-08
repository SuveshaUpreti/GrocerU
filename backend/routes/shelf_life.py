from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
import os

shelf_life_bp = Blueprint('shelf_life', __name__)

csv_path = "/app/database/FoodKeeper-Data.csv"

# Check if file exists
if not os.path.isfile(csv_path):
    raise FileNotFoundError(f"CSV file not found at path: {csv_path}")

# List of columns to consider, excluding Category_ID and ID
valid_columns = [
    "Name", "Name_subtitle", "Keywords", 
    "Pantry_Min", "Pantry_Max", "Pantry_Metric", "Pantry_tips", 
    "DOP_Pantry_Min", "DOP_Pantry_Max", "DOP_Pantry_Metric", "DOP_Pantry_tips", 
    "Pantry_After_Opening_Min", "Pantry_After_Opening_Max", "Pantry_After_Opening_Metric", 
    "Refrigerate_Min", "Refrigerate_Max", "Refrigerate_Metric", "Refrigerate_tips", 
    "DOP_Refrigerate_Min", "DOP_Refrigerate_Max", "DOP_Refrigerate_Metric", "DOP_Refrigerate_tips", 
    "Refrigerate_After_Opening_Min", "Refrigerate_After_Opening_Max", "Refrigerate_After_Opening_Metric", 
    "Refrigerate_After_Thawing_Min", "Refrigerate_After_Thawing_Max", "Refrigerate_After_Thawing_Metric", 
    "Freeze_Min", "Freeze_Max", "Freeze_Metric", "Freeze_Tips", 
    "DOP_Freeze_Min", "DOP_Freeze_Max", "DOP_Freeze_Metric", "DOP_Freeze_Tips"
]

# Load the CSV data into a DataFrame when the server starts, with only the relevant columns
data = pd.read_csv(csv_path, usecols=valid_columns)

# Helper function to get shelf life information for a specific location
def get_shelf_life_info(row, location):
    location_columns_map = {
        'pantry': [
            'Pantry_Min', 'Pantry_Max', 'Pantry_Metric', 'Pantry_tips',
            'DOP_Pantry_Min', 'DOP_Pantry_Max', 'DOP_Pantry_Metric', 'DOP_Pantry_tips',
            'Pantry_After_Opening_Min', 'Pantry_After_Opening_Max', 'Pantry_After_Opening_Metric'
        ],
        'fridge': [
            'Refrigerate_Min', 'Refrigerate_Max', 'Refrigerate_Metric', 'Refrigerate_tips',
            'DOP_Refrigerate_Min', 'DOP_Refrigerate_Max', 'DOP_Refrigerate_Metric', 'DOP_Refrigerate_tips',
            'Refrigerate_After_Opening_Min', 'Refrigerate_After_Opening_Max', 'Refrigerate_After_Opening_Metric',
            'Refrigerate_After_Thawing_Min', 'Refrigerate_After_Thawing_Max', 'Refrigerate_After_Thawing_Metric'
        ],
        'freezer': [
            'Freeze_Min', 'Freeze_Max', 'Freeze_Metric', 'Freeze_Tips',
            'DOP_Freeze_Min', 'DOP_Freeze_Max', 'DOP_Freeze_Metric', 'DOP_Freeze_Tips'
        ]
    }

    try:
        cols = location_columns_map[location]
        storage_info = row[cols].dropna().to_dict()
        return storage_info if storage_info else f"Not recommended to store in {location}"
    except KeyError:
        raise ValueError(f"Invalid location: {location}")

# API endpoint to retrieve shelf life information for a product by name and location
@shelf_life_bp.route('/shelf_life', methods=['GET'])
def get_shelf_life():
    product_name = request.args.get('name', '').strip().lower()
    location = request.args.get('location', '').strip().lower()

    if not product_name:
        return jsonify({"error": "Product name is required"}), 400
    if not location:
        return jsonify({"error": "Location is required"}), 400

    product_data = data[data['Name'].str.lower() == product_name]

    if product_data.empty:
        return jsonify({"message": f"The item '{product_name}' is not currently in our shelf life dataset."}), 200

    # Handle single match case
    if len(product_data) == 1:
        selected_item = product_data.iloc[0]
        shelf_life_info = get_shelf_life_info(selected_item, location)
        if "error" in shelf_life_info:
            return jsonify(shelf_life_info), 400

        return jsonify(shelf_life_info)

    # Handle multiple matches case
    selection_summary = [
        {
            "Name": row["Name"],
            "Name_subtitle": row.get("Name_subtitle"),  
            "Keywords": row.get("Keywords")          
        }
        for _, row in product_data.iterrows()
    ]
    return jsonify({"options": selection_summary}), 200