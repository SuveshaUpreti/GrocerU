const BACK_URL = 'http://localhost:5001/';

export const categorizeItem = async (itemName) => {
    try {
        const response = await fetch(`${BACK_URL}categorize_item`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_name: itemName }), // Send item_name directly
        });
        
        const data = await response.json();
        return data.category || "";
    } catch (error) {
        console.error("Error categorizing item:", error);
        return "";
    }
};

export const locateItem = async (itemName) => {
    try {
        const response = await fetch(`${BACK_URL}locate_item`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_name: itemName }), // Send item_name directly
        });
        
        const data = await response.json();
        return data.location || "";
    } catch (error) {
        console.error("Error categorizing item:", error);
        return "";
    }
};


export const cleanIngredients = async (ingredientsList) => {
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