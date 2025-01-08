const BACK_URL = 'http://localhost:5001/';
const EDAMAM_API_URL = 'https://api.edamam.com/search';

/**
 * Sends selected meal details to the backend for further processing.
 * @param {Array} items - List of inventory items.
 * @returns {Promise<Object>} - Backend response data.
 */
/**
 * Sends selected meal details to the backend for further processing.
 * @param {Array} items - List of inventory items.
 * @returns {Promise<Object>} - Backend response data.
 */
export const sendMealsToBackend = async (items) => {
    const token = localStorage.getItem('token');
    const payload = { items };  // Only include items

    // Log the payload being sent to the backend
    console.log("Sending payload to backend:", payload);

    try {
        const response = await fetch(`${BACK_URL}meals_generated`, {
            method: 'POST',
            credentials: "include",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Failed response from backend:", response.status, response.statusText);
            throw new Error('Failed to send meals to backend');
        }

        const data = await response.json();
        console.log("Backend response data:", data); // Log backend response for debugging
        return data;
    } catch (error) {
        console.error('Error sending meals to backend:', error);
        throw error;
    }
};

/**
 * Fetches recipes from Edamam API based on user-selected preferences.
 * @param {string} cuisineType - Selected cuisine type (e.g., Italian).
 * @param {string} diet - Selected diet preference (e.g., Balanced).
 * @param {Array<string>} allergies - List of selected allergies (e.g., Dairy-Free).
 * @param {string} calorieRange - Calorie range input by the user.
 * @returns {Promise<Object>} - Edamam API response data.
 */
export const fetchRecipesFromBackend = async ( cuisineType, diet, allergies, calorieRange) => {
    const token = localStorage.getItem('token'); // Authorization token if needed
    const payload = { cuisineType, diet, allergies, calorieRange }; // Construct request payload

    try {
        // Send preferences to backend via POST request
        const response = await fetch(`${BACK_URL}recipe_search`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload) // Send preferences in JSON format
        });

        if (!response.ok) {
            console.error("Failed response from backend:", response.status, response.statusText);
            throw new Error('Failed to fetch recipes from backend');
        }

        const data = await response.json();
        console.log("Backend response data with recipes:", data); // Log the response for debugging
        return data;
    } catch (error) {
        console.error('Error fetching recipes from backend:', error);
        throw error;
    }
};
/**
 * Fetches the user's saved recipes from the backend.
 * @returns {Promise<Object>} - Backend response data with saved recipes.
 */
export const fetchSavedRecipesData = async () => {
    try {
        const response = await fetch('/recipe_items', {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error('Failed to fetch saved recipes');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching saved recipes:', error);
        return [];
    }
};
export const fetchRecipesWithFlag1 = async () => {
    try {
        const response = await fetch('/recipe_items1', {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error('Failed to fetch recipes with flag 1');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching recipes with flag 1:', error);
        return [];
    }
};


/**
 * Adds a new recipe for the logged-in user.
 * @param {Object} recipe - The recipe details to be saved.
 * @returns {Promise<Object|null>} - Backend response data with saved recipe or null if failed.
 */
export const saveRecipe = async (recipe) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${BACK_URL}recipe_items`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: recipe.title,           // Recipe title
                link: recipe.link,             // Recipe link (URL)
                calories: recipe.calories || 0, // Default to 0 if not provided
                dietLabels: recipe.dietLabels || "", // Default to empty string
                Flag: recipe.Flag || 0,        // Include Flag (default to 0 if not provided)
            }),
        });

        if (!response.ok) throw new Error('Failed to save recipe');

        return await response.json(); // Return backend's response
    } catch (error) {
        console.error('Error saving recipe:', error);
        return null; // Return null in case of an error
    }
};



/**
 * Deletes a recipe from the backend based on its title.
 * @param {string} title - The title of the recipe to delete.
 * @returns {Promise<void>} - Resolves if the deletion is successful.
 */
export const handleDeleteRecipe = async (title) => {
    try {
        const response = await fetch(`${BACK_URL}recipe_items/${title}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete recipe');
        }
    } catch (error) {
        console.error('Error deleting recipe:', error);
    }
};


export const toggleSaveRecipe = async (index, recipes, onOptimisticUpdate, onRevertUpdate) => {
    const recipe = recipes[index]; // Get the recipe to save/un-save

    // Validate the recipe data
    if (!recipe || !recipe.title || !recipe.link) {
        console.error("Invalid recipe data for saving.");
        return { success: false, message: "Invalid recipe data." };
    }

    console.debug("Starting toggleSaveRecipe for:", recipe);

    // Perform an optimistic UI update
    if (onOptimisticUpdate) {
        console.debug("Triggering optimistic update for recipe:", recipe);
        onOptimisticUpdate(recipe);
    } else {
        console.warn("No onOptimisticUpdate provided. Skipping optimistic UI update.");
    }

    try {
        console.debug("Sending recipe to saveRecipe API:", recipe);

        // Call the API to save the recipe
        const response = await saveRecipe(recipe);

        if (response) {
            console.debug("Recipe saved successfully:", response);
            return { success: true, message: "Recipe saved successfully.", data: response };
        } else {
            console.warn("API save failed. Reverting optimistic update.");

            // Revert the optimistic update
            if (onRevertUpdate) {
                onRevertUpdate(recipe);
            } else {
                console.warn("No onRevertUpdate provided. Cannot revert UI update.");
            }

            return { success: false, message: "Failed to save the recipe." };
        }
    } catch (error) {
        console.error("Error occurred during toggleSaveRecipe operation:", error);

        // Revert the optimistic update on error
        if (onRevertUpdate) {
            onRevertUpdate(recipe);
        } else {
            console.warn("No onRevertUpdate provided. Cannot revert UI update.");
        }

        return { success: false, message: "An error occurred while saving the recipe." };
    }
};



export const toggleFavoriteRecipe = async (index, recipes, onOptimisticUpdate, onRevertUpdate) => {
    const recipe = recipes[index]; // Get the recipe to favorite/unfavorite

    // Validate the recipe data
    if (!recipe || !recipe.title || !recipe.link) {
        console.error("Invalid recipe data for favoriting.");
        return { success: false, message: "Invalid recipe data." };
    }

    console.debug("Starting toggleFavoriteRecipe for:", recipe);

    // Add or update the Flag property for favorites
    const updatedRecipe = {
        ...recipe,
        Flag: 1, // Set Flag to 1 for favorite recipes
    };

    // Perform an optimistic UI update
    if (onOptimisticUpdate) {
        console.debug("Triggering optimistic update for favorite:", updatedRecipe);
        onOptimisticUpdate(updatedRecipe);
    } else {
        console.warn("No onOptimisticUpdate provided. Skipping optimistic UI update.");
    }

    try {
        console.debug("Sending recipe to saveRecipe API for favorite:", updatedRecipe);

        // Call the API to save the recipe as a favorite
        const response = await saveRecipe(updatedRecipe);

        if (response) {
            console.debug("Recipe favorited successfully:", response);
            return { success: true, message: "Recipe favorited successfully.", data: response };
        } else {
            console.warn("API favorite failed. Reverting optimistic update.");

            // Revert the optimistic update
            if (onRevertUpdate) {
                onRevertUpdate(recipe);
            } else {
                console.warn("No onRevertUpdate provided. Cannot revert UI update.");
            }

            return { success: false, message: "Failed to favorite the recipe." };
        }
    } catch (error) {
        console.error("Error in toggleFavoriteRecipe:", error);

        // Revert the optimistic update on error
        if (onRevertUpdate) {
            onRevertUpdate(recipe);
        } else {
            console.warn("No onRevertUpdate provided. Cannot revert UI update.");
        }

        return { success: false, message: "An error occurred while favoriting the recipe." };
    }
};







export const fetchIngredients = async (title) => {
    try {
      // Call the backend's /fetch_ingredients endpoint
      const response = await fetch(`${BACK_URL}/fetch_ingredients`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }), // Send title as part of the JSON body
      });
  
      if (!response.ok) throw new Error('Failed to fetch ingredients');
  
      const data = await response.json();
  
      // Check if ingredientLines were found
      if (data.ingredientLines && data.ingredientLines.length > 0) {
        // Get the first set of ingredient lines for the title
        const rawIngredients = data.ingredientLines[0] || [];
  
        // Clean the ingredients
        const cleanedIngredients = await cleanIngredients(rawIngredients);
  
        // Return the cleaned ingredients
        return cleanedIngredients;
      } else {
        throw new Error(`No ingredients found for the given title "${title}"`);
      }
    } catch (error) {
      console.error(`Error fetching ingredients for "${title}":`, error);
      throw error;
    }
  };
  
 const cleanIngredients = async (ingredientsList) => {
    try {
        const response = await fetch(`${BACK_URL}clean_ingredients`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ingredients: ingredientsList }), // Send the full list
        });

        const data = await response.json();
        return data.cleaned_ingredients || [];
    } catch (error) {
        console.error("Error cleaning ingredients:", error);
        return [];
    }
};



export const missingIngredients = (recipeIngredients, inventoryItems) => {
    // Convert inventory items to a set for efficient lookup
    const inventorySet = new Set(inventoryItems.map(item => item.toLowerCase().trim()));

    // Filter ingredients that are not in the inventory
    const missing = recipeIngredients.filter(
        ingredient => !inventorySet.has(ingredient.toLowerCase().trim())
    );

    return missing;
};




export const handleOptimisticSaveUpdate = (recipe) => {
    setSavedRecipes((prev) => ({
        ...prev,
        [recipe.title]: recipe, // Optimistically add recipe to saved
    }));
};

export const handleRevertSaveUpdate = (recipe) => {
    setSavedRecipes((prev) => {
        const updated = { ...prev };
        delete updated[recipe.title]; // Remove recipe on failure
        return updated;
    });
};


export const handleOptimisticFavoriteUpdate = (recipe) => {
    setFavoriteRecipes((prev) => ({
        ...prev,
        [recipe.title]: recipe, // Optimistically add recipe to favorites
    }));
};

export const handleRevertFavoriteUpdate = (recipe) => {
    setFavoriteRecipes((prev) => {
        const updated = { ...prev };
        delete updated[recipe.title]; // Remove recipe on failure
        return updated;
    });
};