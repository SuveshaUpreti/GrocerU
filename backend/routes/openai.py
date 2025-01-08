from flask import Blueprint, jsonify, request, session
from utils.errorhandler import create_error_response
import logging
import os
from dotenv import load_dotenv
import openai  # import the openai library
import json
import re

# Load environment variables
load_dotenv()

# OpenAI API Key from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Check if the API key is loaded correctly
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key is not set. Please check the .env file.")

# Initialize Blueprint and Logger
openai_bp = Blueprint('openai', __name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("OpenAI blueprint initialized with API credentials.")

# Initialize OpenAI API
openai.api_key = OPENAI_API_KEY

@openai_bp.route('/categorize_item', methods=['POST'])
def categorize_item():
    data = request.json
    item_name = data.get('item_name')
    
    if not item_name:
        logger.warning("Request missing required field: item_name")
        return create_error_response(400, "Missing required field: item_name")
    
    logger.info("Categorizing item: %s", item_name)

    # Construct the OpenAI API request (chat-based API)
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": f"Out of these categories: [Fresh Produce, Dairy, Pantry Staples, Meat and Seafood, Snacks and Beverages, Household and Miscellaneous, Frozen Foods] which category does the item '{item_name}' best fit in? Respond ONLY with the category name."}
    ]

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages
        )

        # Extract the category from the OpenAI response
        category = response['choices'][0]['message']['content'].strip()

        if not category:
            logger.warning("No category predicted for the item.")
            return create_error_response(404, "No category predicted for the item.")

        logger.info("Category predicted by OpenAI: %s", category)
        
        return jsonify({
            'category': category  # Return the predicted category in the response
        }), 200

    except openai.error.OpenAIError as e:
        logger.error(f"Error communicating with OpenAI API: {str(e)}")
        return create_error_response(500, "Error predicting category.")

@openai_bp.route('/locate_item', methods=['POST'])
def locate_item():
    data = request.json
    item_name = data.get('item_name')
    
    if not item_name:
        logger.warning("Request missing required field: item_name")
        return create_error_response(400, "Missing required field: item_name")
    
    logger.info("Locating item: %s", item_name)

    # Construct the OpenAI API request (chat-based API)
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": f"Out of these locations: [Pantry, Fridge, Freezer, Misc.] which location does the item '{item_name}' most belong in? Respond ONLY with the location name."}
    ]

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages
        )

        # Extract the category from the OpenAI response
        location = response['choices'][0]['message']['content'].strip()

        if not location:
            logger.warning("No location predicted for the item.")
            return create_error_response(404, "No location predicted for the item.")

        logger.info("Location predicted by OpenAI: %s", location)
        
        return jsonify({
            'location': location  # Return the predicted category in the response
        }), 200

    except openai.error.OpenAIError as e:
        logger.error(f"Error communicating with OpenAI API: {str(e)}")
        return create_error_response(500, "Error predicting location.")
    
@openai_bp.route('/clean_ingredients', methods=['POST'])
def clean_ingredients():
    data = request.json
    ingredients = data.get('ingredients')
    
    if not ingredients or not isinstance(ingredients, list):
        logger.warning("Request missing required field: ingredients or it's not a list.")
        return create_error_response(400, "Missing required field: ingredients, or it must be a list.")
    
    logger.info("Cleaning ingredients: %s", ingredients)

    try:
        # Construct the OpenAI API request
        messages = [
            {"role": "system", "content": "You are a helpful assistant that extracts only the main food names from a list of ingredients, ignoring water and descriptors."},
            {"role": "user", "content": f"Extract the main food names from these ingredients, ignoring 'water' and any measurements or descriptors: {ingredients}. Return the result as a JSON array of food names."}
        ]

        # Log the input to OpenAI
        logger.debug("OpenAI input messages: %s", messages)

        # Use OpenAI's ChatCompletion API to process the ingredients
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages
        )

        # Extract the raw response from OpenAI
        cleaned_ingredients_raw = response['choices'][0]['message']['content'].strip()

        # Log the raw output from OpenAI
        logger.debug("OpenAI raw output: %s", cleaned_ingredients_raw)

        # Attempt to parse the response
        try:
            # Try to parse as JSON directly
            cleaned_ingredients = json.loads(cleaned_ingredients_raw)
        except json.JSONDecodeError:
            # If JSON parsing fails, evaluate it as a Python literal
            cleaned_ingredients = ast.literal_eval(cleaned_ingredients_raw)

        # Validate the cleaned ingredients
        if not isinstance(cleaned_ingredients, list):
            logger.error("Parsed response is not a valid list.")
            return create_error_response(500, "AI response format is invalid.")

        logger.info("Cleaned ingredients from OpenAI: %s", cleaned_ingredients)

        return jsonify({
            'cleaned_ingredients': cleaned_ingredients  # Return the cleaned ingredients
        }), 200

    except openai.error.OpenAIError as e:
        logger.error(f"Error communicating with OpenAI API: {str(e)}")
        return create_error_response(500, "Error cleaning ingredients with AI.")
    except Exception as e:
        logger.error(f"Unexpected error cleaning ingredients: {str(e)}")
        return create_error_response(500, "Unexpected error cleaning ingredients.")
