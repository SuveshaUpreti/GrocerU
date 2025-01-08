import React, { useState, useEffect } from 'react';
import {
    sendMealsToBackend,
    fetchIngredients, 
    handleDeleteRecipe // Fetch ingredients by recipe title
} from '/src/api/recipe-API-calls';
import { getInventoryItems } from '/src/api/grocery-API-calls';
import RecipeBot from './RecipeBot';

const Recipes = () => {
    const [firstName, setFirstName] = useState('');
    const [inventoryItems, setInventoryItems] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [favoritedRecipes, setFavoritedRecipes] = useState([]);
    const [hoveredLink, setHoveredLink] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const BACK_URL = 'http://localhost:5001/';

    // Fetch user's first name
    useEffect(() => {
        const storedFirstName = localStorage.getItem('first_name');
        if (storedFirstName) {
            setFirstName(storedFirstName);
        }
        fetchSavedRecipes();
        fetchFavoritedRecipes();
        fetchInventory();
    }, []);

    // Fetch saved recipes
    const fetchSavedRecipes = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${BACK_URL}recipe_items`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch saved recipes');
            const data = await response.json();
            setSavedRecipes(data || []);
        } catch (error) {
            console.error('Error fetching saved recipes:', error);
        }
    };

    // Fetch favorited recipes
    const fetchFavoritedRecipes = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${BACK_URL}recipe_items1`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch favorited recipes');
            const data = await response.json();
            setFavoritedRecipes(data || []);
        } catch (error) {
            console.error('Error fetching favorited recipes:', error);
        }
    };

    // Fetch inventory items
    const fetchInventory = async () => {
        try {
            const items = await getInventoryItems();
            setInventoryItems(items || []);
        } catch (error) {
            console.error('Error fetching inventory items:', error);
        }
    };

    const handleDeleteRecipeInComponent = async (recipeTitle, isFavorite) => {
        try {
            await handleDeleteRecipe(recipeTitle); // Call the API function
            if (isFavorite) {
                setFavoritedRecipes((prev) =>
                    prev.filter((recipe) => recipe.title !== recipeTitle)
                );
            } else {
                setSavedRecipes((prev) =>
                    prev.filter((recipe) => recipe.title !== recipeTitle)
                );
            }
        } catch (error) {
            console.error(`Error deleting recipe "${recipeTitle}":`, error);
        }
    };
    

    const calculateMissingIngredients = (recipeIngredients, inventoryItems) => {
        const sanitizedInventoryItems = inventoryItems
            .filter(item => typeof item === 'string')
            .map(item => item.toLowerCase().trim());
        const inventorySet = new Set(sanitizedInventoryItems);
        return recipeIngredients.filter(
            ingredient =>
                typeof ingredient === 'string' &&
                !inventorySet.has(ingredient.toLowerCase().trim())
        );
    };

    const handleGenerateRecipes = async () => {
        if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
            console.error('Inventory items are empty or not an array.');
            return;
        }
        try {
            const backendResponse = await sendMealsToBackend(inventoryItems);
            if (backendResponse.recipes) {
                const formattedRecipes = backendResponse.recipes.map(recipe => ({
                    title: recipe.title,
                    link: recipe.link,
                    calories: recipe.calories,
                    dietLabels: recipe.dietLabels?.join(', ') || null,
                    image: recipe.image,
                }));
                setRecipes(formattedRecipes);
            }
        } catch (error) {
            console.error('Error generating recipes:', error);
        }
    };

    const handleCookNow = async title => {
        try {
            const recipeIngredients = await fetchIngredients(title);
            const missing = calculateMissingIngredients(recipeIngredients, inventoryItems);
            if (missing.length > 0) {
                alert(`Missing Ingredients for "${title}":\n${missing.join('\n')}`);
            } else {
                alert(`You have all the ingredients for "${title}"! 🎉`);
            }
        } catch (error) {
            alert(`Error fetching ingredients for "${title}": ${error.message}`);
        }
    };

    const toggleRecipe = async recipe => {
        try {
            if (savedRecipes.some(r => r.title === recipe.title)) {
                await handleDeleteRecipe(recipe.title); // Backend call to delete
                setSavedRecipes((prev) =>
                    prev.filter((r) => r.title !== recipe.title) // Remove locally
                );
            } else {
                await handleSaveRecipe(recipe); // Backend call to save
                setSavedRecipes((prev) =>
                    prev.some((r) => r.title === recipe.title)
                        ? prev // Avoid duplicates in state
                        : [...prev, recipe] // Add to state
                );
            }
        } catch (error) {
            console.error('Error toggling recipe:', error);
        }
    };

    const handleSaveRecipe = async recipe => {
        try {
            const response = await fetch(`${BACK_URL}recipe_items`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(recipe),
            });
            if (!response.ok) throw new Error('Failed to save recipe');
            const savedRecipe = await response.json();
            setSavedRecipes(prev => [...prev, savedRecipe]);
        } catch (error) {
            console.error('Error saving recipe:', error);
        }
    };

    const deleteRecipe = async recipeTitle => {
        try {
            const response = await fetch(`${BACK_URL}recipe_items`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ title: recipeTitle }),
            });
            if (!response.ok) throw new Error('Failed to delete recipe');
            setSavedRecipes(prev => prev.filter(recipe => recipe.title !== recipeTitle));
        } catch (error) {
            console.error('Error deleting recipe:', error);
        }
    };

    const handleMouseEnter = (link, event) => {
        setHoveredLink(link);
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseLeave = () => {
        setHoveredLink(null);
    };

    const getAdjustedPosition = () => {
        const previewWidth = 500;
        const previewHeight = 400;
        const offset = 10;
        let x = mousePosition.x + offset;
        let y = mousePosition.y + offset;
        if (x + previewWidth > window.innerWidth) {
            x = window.innerWidth - previewWidth - offset;
        }
        if (y + previewHeight > window.innerHeight) {
            y = window.innerHeight - previewHeight - offset;
        }
        return { x, y };
    };

    const { x, y } = getAdjustedPosition();

    const SavedRecipesSidebar = ({ savedRecipes }) => (
        <div className="saved-recipes-sidebar">
            <h2>Saved Recipes 🥘</h2>
            {savedRecipes.length > 0 ? (
                <ul>
                    {savedRecipes.map((recipe, index) => (
                        <li key={index}>
                            <a href={recipe.link} target="_blank" rel="noopener noreferrer">
                                {recipe.title}
                            </a>
                            <button
                                className="delete-button"
                                onClick={() => handleDeleteRecipe(recipe.title, false)}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No saved recipes yet!</p>
            )}
        </div>
    );

    const FavoriteRecipesSidebar = ({ favoritedRecipes }) => {
        return (
            <div className="favorite-recipes-sidebar">
                <h2>Favorite Recipes ❤️</h2>
                {favoritedRecipes.length > 0 ? (
                    <ul>
                        {favoritedRecipes.map((recipe, index) => (
                            <li key={index}>
                                <a href={recipe.link} target="_blank" rel="noopener noreferrer">
                                    {recipe.title}
                                </a>
                                <button
                                    className="cook-now-button"
                                    onClick={() => handleCookNow(recipe.title)}
                                >
                                    Cook Now
                                </button>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDeleteRecipe(recipe.title, true)}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No favorite recipes yet!</p>
                )}
            </div>
        );
    };

    return (
        <div className="grocery-container">
            <h1>{firstName}'s Recipe Journal</h1>
            <RecipeBot />
            <button className="fern-color-button" onClick={handleGenerateRecipes}>
                Generate Recipes
            </button>

            <h2>Recipes:</h2>
            {recipes.length > 0 ? (
                <table className="fern-color-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Calories</th>
                            <th>Diet Labels</th>
                            <th>Image</th>
                            <th>Favorite Recipe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipes.map((recipe, index) => (
                            <tr key={index}>
                                <td>
                                    <a href={recipe.link} target="_blank" rel="noopener noreferrer">
                                        {recipe.title}
                                    </a>
                                </td>
                                <td>{recipe.calories}</td>
                                <td>{recipe.dietLabels || 'N/A'}</td>
                                <td>
                                    {recipe.image ? (
                                        <img
                                            src={recipe.image}
                                            alt={recipe.title}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                            }}
                                        />
                                    ) : (
                                        <p>No Image Available</p>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="heart-button"
                                        onClick={() => toggleRecipe(recipe)}
                                    >
                                        {savedRecipes.some(r => r.title === recipe.title)
                                            ? '❤️'
                                            : '🩷'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No recipes available. Try generating some ✨</p>
            )}

            <SavedRecipesSidebar savedRecipes={savedRecipes} />
            <FavoriteRecipesSidebar favoritedRecipes={favoritedRecipes} />
        </div>
    );
};

export default Recipes;
