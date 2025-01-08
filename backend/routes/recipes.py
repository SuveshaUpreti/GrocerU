from flask import Blueprint, jsonify, request, session
from utils.errorhandler import create_error_response
from services.database import get_db_connection
from routes.auth import login_required
from services.database import get_db_connection
import logging
from dotenv import load_dotenv
import requests
import os
import re



# Load environment variables from .env file
load_dotenv()


# Load Edamam API credentials from environment variables
EDAMAM_APP_ID = os.getenv('EDAMAM_APP_ID')
EDAMAM_APP_KEY = os.getenv('EDAMAM_APP_KEY')

# Check if credentials are loaded correctly
if not EDAMAM_APP_ID or not EDAMAM_APP_KEY:
    raise ValueError("Edamam API credentials are not set. Please check the .env file.")

# Initialize Blueprint and Logger
recipes_bp = Blueprint('recipes', __name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Recipes blueprint initialized with Edamam API credentials.")


@recipes_bp.route('/meals_generated', methods=['POST'])
@login_required
def receive_meals():
    user_id = session.get('user_id')
    if not user_id:
        logger.warning("User ID missing in session.")
        return create_error_response(401, "Unauthorized access. User ID is missing.")

    data = request.json
    logger.info("Received JSON payload: %s", data)

    items = data.get('items', [])
    logger.info("Extracted items: %s", items)

    if not items:
        logger.warning("Request missing required fields: items")
        return create_error_response(400, "Missing required field: items")

    # Construct the item_query using item names
    item_query = ','.join(item['item_name'].strip() for item in items)
    logger.info("Constructed item query: %s", item_query)

    # Construct the recipe URL
    recipe_url = (
        f"https://api.edamam.com/search?q={item_query}"
        f"&app_id={EDAMAM_APP_ID}&app_key={EDAMAM_APP_KEY}"
    )
    # Print the constructed URL for debugging
    print("Constructed Edamam API URL:", recipe_url)  # Add this line for debugging
    # Or you can use logging if preferred:
    logger.info("Constructed Edamam API URL: %s", recipe_url)

    try:
        # Make the request to the Edamam API
        response = requests.get(recipe_url)
        response.raise_for_status()
        recipes = response.json().get('hits', [])[:5]

        if not recipes:
            logger.info("No recipes found for the given criteria.")
            return create_error_response(404, "No recipes found with the specified criteria.")

        # Format recipes for response, including images
        recipe_links = [
            {
                "title": recipe['recipe']['label'],
                "link": recipe['recipe']['url'],
                "calories": recipe['recipe']['calories'],
                "dietLabels": recipe['recipe']['dietLabels'] if recipe['recipe']['dietLabels'] else None,
                "image": recipe['recipe']['image']  # Include image URL
            }
            for recipe in recipes
        ]
        # Remove dietLabels from response if None
        for recipe in recipe_links:
            if recipe['dietLabels'] is None:
                del recipe['dietLabels']  # Remove the dietLabels key if it's None

        logger.info("Fetched %d recipes from Edamam API.", len(recipe_links))

        return jsonify({
            'message': 'Recipes fetched successfully',
            'recipes': recipe_links
        }), 200

    except requests.exceptions.RequestException as e:
        logger.error("Error fetching recipes from Edamam API: %s", e)
        return create_error_response(500, "Error fetching recipes from Edamam API.")

@recipes_bp.route('/recipe_search', methods=['POST'])
@login_required
def search_recipes():
    """Endpoint for recipe search based on criteria from RecipeBot.js."""
    
    user_id = session.get('user_id')
    if not user_id:
        logger.warning("User ID missing in session.")
        return create_error_response(401, "Unauthorized access. User ID is missing.")

    data = request.json
    logger.info("Received JSON payload for recipe search: %s", data)

    payload = data.get('cuisineType', {})
    cuisine_type = payload.get('cuisineType', '')
    health = payload.get('diet', '') if payload.get('diet') != 'None' else ''
    allergies = payload.get('allergies', [])
    calories = payload.get('calorieRange', '')

    logger.info(f"Extracted values - cuisineType: {cuisine_type}, diet: {health}, allergies: {allergies}, calorieRange: {calories}")

    allergies_params = ''.join(f"&allergies={item}" for item in allergies if item and item != 'None')
    recipe_url = f"https://api.edamam.com/search?q={cuisine_type}"
    
    if calories:
        recipe_url += f"&calories={calories}"
    if health:
        recipe_url += f"&health={health}"
    if allergies_params:
        recipe_url += allergies_params
    recipe_url += f"&app_id={EDAMAM_APP_ID}&app_key={EDAMAM_APP_KEY}"

    logger.info("Querying Edamam API with URL: %s", recipe_url)

    try:
        response = requests.get(recipe_url)
        response.raise_for_status()
        recipes = response.json().get('hits', [])[:5]
        
        if not recipes:
            logger.info("No recipes found for the specified criteria.")
            return create_error_response(404, "No recipes found with the specified criteria.")

        # Group ingredients by recipe
        def extract_clean_ingredients_by_recipe(recipes):
            """
            Extract and clean ingredients grouped by recipe.

            Args:
                recipes (list): List of recipes from the API response.

            Returns:
                dict: A dictionary with recipe titles as keys and lists of unique cleaned ingredients as values.
            """
            result = {}

            for recipe_data in recipes:
                recipe = recipe_data['recipe']
                title = recipe['label']
                ingredients = recipe.get('ingredientLines', [])

                # Clean ingredients
                def clean_ingredient(item):
                    item = re.sub(r'[\d/]+(\s?[a-z]+)?(\s?[a-z]+)?', '', item)  # Remove measurements
                    item = re.sub(r'\(.*?\)|,.*$', '', item)  # Remove parentheses and descriptions
                    return item.strip().lower()

                cleaned_ingredients = [clean_ingredient(ingredient) for ingredient in ingredients]
                unique_ingredients = list(set(cleaned_ingredients))
                result[title] = unique_ingredients

            return result

        # Extract and clean ingredients grouped by recipe
        ingredients_by_recipe = extract_clean_ingredients_by_recipe(recipes)
        logger.info("Ingredients grouped by recipe: %s", ingredients_by_recipe)

        # Prepare the recipe links
        recipe_links = [
            {
                "title": recipe['recipe']['label'],
                "link": recipe['recipe']['url'],
                "calories": recipe['recipe']['calories'],
                "dietLabels": recipe['recipe'].get('dietLabels', [])
            } for recipe in recipes
        ]

        logger.info("Fetched %d recipes from Edamam API.", len(recipe_links))
        return jsonify({
            'message': 'Cool! Here are your recipes! Happy cooking 🍳🍝🎉',
            'recipes': recipe_links,
            'ingredients_by_recipe': ingredients_by_recipe  # Include grouped ingredients in the response
        }), 200

    except requests.exceptions.RequestException as e:
        logger.error("Error fetching recipes from Edamam API: %s", e)
        return create_error_response(500, "Error fetching recipes from Edamam API.")


    
@recipes_bp.route('/save_recipe', methods=['POST'])
@login_required
def save_recipe():
    """Endpoint for saving recipes to the SavedRecipes table in the database."""
    
    user_id = session.get('user_id')
    if not user_id:
        logger.warning("User ID missing in session.")
        return create_error_response(401, "Unauthorized access. User ID is missing.")




@recipes_bp.route('/recipe_items', methods=['POST'])
@login_required
def add_recipe_item():
    try:
        logging.info("Incoming POST request with data: %s", request.json)
        user_id = session['user_id']
        new_recipe = request.get_json()
        new_recipe['user_id'] = user_id

        # Extract only the first diet label
        if 'dietLabels' in new_recipe and new_recipe['dietLabels']:
            new_recipe['dietLabels'] = new_recipe['dietLabels'][0]  # Keep only the first label
        else:
            new_recipe['dietLabels'] = None  # Set to None if no diet labels are provided

        # Set the Flag field to 1 if provided, otherwise default to 0
        flag_value = new_recipe.get('Flag', 0)

        # Insert into the database
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO SavedRecipes (title, link, calories, diet_labels, user_id, Flag) VALUES (?, ?, ?, ?, ?, ?)',
            (new_recipe['title'], new_recipe['link'], new_recipe['calories'], new_recipe['dietLabels'], new_recipe['user_id'], flag_value)
        )
        conn.commit()
        conn.close()

        logging.info("Recipe successfully saved.")
        logging.info("Received Flag value: %s", new_recipe.get('Flag'))

        return jsonify(new_recipe), 201

    except Exception as e:
        logging.error("Error occurred in add_recipe_item: %s", str(e))
        return jsonify({"error": str(e)}), 500
    
@recipes_bp.route('/recipe_items1', methods=['GET'])
@login_required
def fetch_favorite_recipes():
    try:
        user_id = session['user_id']
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401
        
        # Fetch recipes with Flag = 1 (favorited) for the user
        conn = get_db_connection()
        recipes = conn.execute(
            'SELECT * FROM SavedRecipes WHERE user_id = ? AND Flag = 1',
            (user_id,)
        ).fetchall()
        conn.close()

        # Convert recipes to a list of dictionaries
        recipe_list = [
            {
                "title": row["title"],
                "link": row["link"],
                "calories": row["calories"],
                "diet_labels": row["diet_labels"],
                "user_id": row["user_id"],
                "Flag": row["Flag"]
            } for row in recipes
        ]

        return jsonify(recipe_list), 200
    except Exception as e:
        logging.error("Error fetching favorite recipes: %s", str(e))
        return jsonify({"error": str(e)}), 500
    



@recipes_bp.route('/recipe_items', methods=['GET'])
@login_required
def fetch_saved_recipes():
    try:
        user_id = session['user_id']
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401
        
        # Fetch recipes with Flag = 1 (favorited) for the user
        conn = get_db_connection()
        recipes = conn.execute(
            'SELECT * FROM SavedRecipes WHERE user_id = ?',
            (user_id,)
        ).fetchall()
        conn.close()

        # Convert recipes to a list of dictionaries
        recipe_list = [
            {
                "title": row["title"],
                "link": row["link"],
                "calories": row["calories"],
                "diet_labels": row["diet_labels"],
                "user_id": row["user_id"],
                "Flag": row["Flag"]
            } for row in recipes
        ]

        return jsonify(recipe_list), 200
    except Exception as e:
        logging.error("Error fetching favorite recipes: %s", str(e))
        return jsonify({"error": str(e)}), 500




@recipes_bp.route('/fetch_ingredients', methods=['POST'])
@login_required
def fetch_ingredients():
    try:
        user_id = session['user_id']
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        # Assuming the title is passed in the request payload
        data = request.json
        title = data.get('title')
        if not title:
            return create_error_response(400, "The field 'title' is required.")

        # Construct the API URL
        recipe_url = f"https://api.edamam.com/search?q={title}&app_id={EDAMAM_APP_ID}&app_key={EDAMAM_APP_KEY}"

        # Log the URL for debugging
        logger.info("Constructed Edamam API URL: %s", recipe_url)

        # Call the Edamam API
        response = requests.get(recipe_url)
        response.raise_for_status()

        # Extract the relevant recipes
        recipes = response.json().get('hits', [])

        if not recipes:
            return create_error_response(404, "No recipes found for the given title.")

        # Extract only the ingredientLines
        ingredient_lines = [
            recipe['recipe']['ingredientLines']
            for recipe in recipes
        ]

        # Return the ingredientLines
        return jsonify({
            'title': title,
            'ingredientLines': ingredient_lines
        }), 200

    except requests.exceptions.RequestException as e:
        logger.error("Error fetching recipes from Edamam API: %s", e)
        return create_error_response(500, "Error fetching recipes from Edamam API.")
    

@recipes_bp.route('/recipe_items/<string:title>', methods=['DELETE'])
@login_required
def delete_recipe(title):
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "User not logged in"}), 401

        conn = get_db_connection()
        cursor = conn.execute(
            'DELETE FROM SavedRecipes WHERE title = ? AND user_id = ?',
            (title, user_id)
        )
        conn.commit()
        conn.close()

        # Check if any rows were deleted
        if cursor.rowcount == 0:
            return jsonify({"error": f"Recipe '{title}' not found or not authorized"}), 404

        return jsonify({"message": f"Recipe '{title}' successfully deleted"}), 200
    except Exception as e:
        logging.error("Error deleting recipe '%s': %s", title, str(e))
        return jsonify({"error": str(e)}), 500

