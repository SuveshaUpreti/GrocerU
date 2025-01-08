import React, { useState, useEffect } from 'react';
import {
    fetchRecipesFromBackend,
    toggleSaveRecipe,
    toggleFavoriteRecipe
} from '/src/api/recipe-API-calls';

const RecipeBot = () => {
    const [diet, setDiet] = useState('');
    const [chatStep, setChatStep] = useState(0);
    const [allergies, setAllergies] = useState([]);
    const [calorieRange, setCalorieRange] = useState('');
    const [cuisineType, setCuisineType] = useState('');
    const [recipes, setRecipes] = useState([]);
    const [responseMessage, setResponseMessage] = useState('');
    const [showAllergies, setShowAllergies] = useState(false);
    const [showCalorieRange, setShowCalorieRange] = useState(false);
    const [showCuisineType, setShowCuisineType] = useState(false);
    const [showDietOptions, setShowDietOptions] = useState(false);
    const [savedRecipes, setSavedRecipes] = useState({});
    const [favoriteRecipes, setFavoriteRecipes] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [farewellMessage, setFarewellMessage] = useState('');

    const resetSession = () => {
        setDiet('');
        setAllergies([]);
        setCalorieRange('');
        setCuisineType('');
        setRecipes([]);
        setResponseMessage('');
        setShowAllergies(false);
        setShowCalorieRange(false);
        setShowCuisineType(false);
        setShowDietOptions(false);
        setSavedRecipes({});
        setFavoriteRecipes({});
        setFarewellMessage('');
    };

    const openChatbot = () => {
        setShowModal(true);
        resetSession();
    };

    const closeChatbotWithMessage = () => {
        setShowModal(false);
        setFarewellMessage('Goodbye! Let us know if you need recipes later! 🍊');
    };

    const handleDietClick = (selectedDiet) => {
        setDiet(selectedDiet);
        setShowAllergies(true);
    };

    const handleAllergyClick = (selectedAllergy) => {
        setAllergies((prevAllergies) =>
            prevAllergies.includes(selectedAllergy)
                ? prevAllergies.filter((allergy) => allergy !== selectedAllergy)
                : [...prevAllergies, selectedAllergy]
        );
        setShowCalorieRange(true);
    };

    const handleCalorieRangeClick = (selectedCalorieRange) => {
        setCalorieRange(selectedCalorieRange);
        setShowCuisineType(true);
    };

    const handleCuisineTypeClick = (selectedCuisineType) => setCuisineType(selectedCuisineType);

    const submitPreferences = async () => {
        if (!diet || !calorieRange || !cuisineType) {
            setResponseMessage('Please select a diet, calorie range, and cuisine type.');
            return;
        }

        const items = { diet, allergies, calorieRange, cuisineType };

        try {
            const data = await fetchRecipesFromBackend(items);
            if (Array.isArray(data.recipes)) {
                setRecipes(data.recipes);
                setResponseMessage(data.message || 'Recipes fetched successfully!');
            } else {
                setResponseMessage(data.message || 'Failed to fetch recipes.');
            }
        } catch (error) {
            console.error('Error submitting preferences:', error);
            setResponseMessage('There was an error submitting your preferences.');
        }
    };

    const handleSaveClick = async (index) => {
        const recipe = recipes[index];

        if (!recipe) {
            console.error("Recipe not found at index:", index);
            return;
        }

        setSavedRecipes((prev) => ({
            ...prev,
            [recipe.title]: { ...recipe, saved: true },
        }));

        try {
            const response = await toggleSaveRecipe(index, recipes);
            console.log("Recipe save response:", response);
            if (!response.success) {
                setSavedRecipes((prev) => {
                    const updated = { ...prev };
                    delete updated[recipe.title];
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error saving recipe:", error);
            setSavedRecipes((prev) => {
                const updated = { ...prev };
                delete updated[recipe.title];
                return updated;
            });
        }
    };

    const handleFavoriteClick = async (index) => {
        const recipe = recipes[index];

        if (!recipe) {
            console.error("Recipe not found at index:", index);
            return;
        }

        setFavoriteRecipes((prev) => ({
            ...prev,
            [recipe.title]: { ...recipe, favorited: true },
        }));

        try {
            const response = await toggleFavoriteRecipe(index, recipes);
            console.log("Recipe favorite response:", response);
            if (!response.success) {
                setFavoriteRecipes((prev) => {
                    const updated = { ...prev };
                    delete updated[recipe.title];
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error favoriting recipe:", error);
            setFavoriteRecipes((prev) => {
                const updated = { ...prev };
                delete updated[recipe.title];
                return updated;
            });
        }
    };

    const boxStyle = (isSelected) => ({
        cursor: 'pointer',
        border: '1px solid #ccc',
        backgroundColor: isSelected ? '#a3d5d3' : 'transparent',
        color: isSelected ? 'white' : 'black',
        padding: '5px 10px',
        margin: '5px 5px 0 0',
        borderRadius: '8px',
        display: 'inline-block',
        transition: 'background-color 0.3s',
    });

    useEffect(() => {
        console.log('Saved Recipes Updated:', savedRecipes);
        console.log('Favorite Recipes Updated:', favoriteRecipes);
    }, [savedRecipes, favoriteRecipes]);

    return (
        <div className="chatbot-container">
            <div className="button-container">
                <button onClick={openChatbot} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    🍊 Welcome to RecipeBot!
                </button>

                {showModal && (
                    <button
                        onClick={() => {
                            resetSession();
                            setShowModal(false);
                        }}
                        style={{ padding: '5px 10px', cursor: 'pointer', float: 'right' }}
                    >
                        ❌
                    </button>
                )}
            </div>

            {farewellMessage && <p style={{ marginTop: '10px', color: '#ff6347' }}>{farewellMessage}</p>}

            {showModal && (
                <div className="scrollable-modal">
                    <p>How are you feeling today?</p>
                    <button onClick={() => setShowDietOptions(true)}>Hungry 😋</button>
                    <button onClick={closeChatbotWithMessage}>Not Hungry 🚫</button>

                    {showDietOptions && (
                        <>
                            <h3>Select Diet Preference🥗🍽️:</h3>
                            {['vegetarian', 'vegan', 'low-sugar', 'high-protein', 'high-fiber', 'alcohol-free', 'balanced', 'None'].map((option) => (
                                <div
                                    key={option}
                                    onClick={() => handleDietClick(option)}
                                    style={boxStyle(diet === option)}
                                >
                                    {option}
                                </div>
                            ))}
                        </>
                    )}

                    {showAllergies && (
                        <>
                            <h3>Allergies🤧:</h3>
                            {['Gluten', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Fish', 'None'].map((option) => (
                                <div
                                    key={option}
                                    onClick={() => handleAllergyClick(option)}
                                    style={boxStyle(allergies.includes(option))}
                                >
                                    {option}
                                </div>
                            ))}
                        </>
                    )}

                    {showCalorieRange && (
                        <>
                            <h3>Calorie Range🔥:</h3>
                            {['0-500', '500-1000', '1000-1500', '1500-2000'].map((option) => (
                                <div
                                    key={option}
                                    onClick={() => handleCalorieRangeClick(option)}
                                    style={boxStyle(calorieRange === option)}
                                >
                                    {option}
                                </div>
                            ))}
                        </>
                    )}

                    {showCuisineType && (
                        <>
                            <h3>Cuisine Type🍴:</h3>
                            {['Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Greek', 'French', 'Thai', 'Spanish', 'Mediterranean'].map((option) => (
                                <div
                                    key={option}
                                    onClick={() => handleCuisineTypeClick(option)}
                                    style={boxStyle(cuisineType === option)}
                                >
                                    {option}
                                </div>
                            ))}
                        </>
                    )}

                    {showDietOptions && showAllergies && showCalorieRange && showCuisineType && (
                        <button onClick={submitPreferences} style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '10px' }}>
                            Fetch Recipes 🍳
                        </button>
                    )}
                    {responseMessage && <p>{responseMessage}</p>}

                    {recipes.length > 0 && (
                        <div className="recipe-list">
                            {recipes.map((recipe, index) => (
                                <div key={index} className="recipe-card">
                                    <h4>{recipe.title}</h4>
                                    <p>{recipe.description}</p>
                                    <button
                                        onClick={() => handleSaveClick(index)}
                                        style={{ padding: '5px 10px', cursor: 'pointer', margin: '5px 0' }}
                                    >
                                        {savedRecipes[recipe.title]?.saved ? 'Saved' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => handleFavoriteClick(index)}
                                        style={{ padding: '5px 10px', cursor: 'pointer', margin: '5px 0' }}
                                    >
                                        {favoriteRecipes[recipe.title]?.favorited ? 'Favorited' : 'Favorite'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecipeBot;
