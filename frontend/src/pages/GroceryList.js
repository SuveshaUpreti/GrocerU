import React, { useEffect, useState } from 'react';
import GroceryForm from './GroceryForm';
import { getGroceryItems, addGroceryItem, deleteGroceryItem, updateGroceryItem, transferGroceryToInventory } from '/src/api/grocery-API-calls';
import { categorizeItem, locateItem } from '/src/api/openai-api-calls.js';

const GroceryList = () => {
    const [firstName, setFirstName] = useState('');

    // const [isFormVisible, setIsFormVisible] = useState(false);
    const [showAddRow, setShowAddRow] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groceryItems, setGroceryItems] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [inventoryErrorMessage, setInventoryErrorMessage] = useState('');

    const [editingItemId, setEditingItemId] = useState(null);
    const [editedItem, setEditedItem] = useState({ item_name: '', category: '', quantity: '', item_state: 'High', location: 'Pantry' });
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedLocation, setSelectedLocation] = useState('All');
    const [selectedItems, setSelectedItems] = useState([]); 

    const [newItem, setNewItem] = useState({ item_name: '', category: '', quantity: '', location: '' });


    const categories = ['All', 'Fresh Produce', 'Dairy and Eggs', 'Pantry Staples', 'Meat, Seafood, and Alternatives', 'Frozen Foods', 'Snacks and Beverages', 'Household and Miscellaneous'];
    const locations = ['All', 'Pantry', 'Fridge', 'Freezer'];

    useEffect(() => {
        const storedFirstName = localStorage.getItem('first_name');
        if (storedFirstName) {
            setFirstName(storedFirstName);
        }
        fetchGroceries();
    }, []);

    const fetchGroceries = async () => {
        try {
            const items = await getGroceryItems();
            setGroceryItems(items ? items.map(item => ({ ...item, selected: false })) : []);
        } catch (error) {
            setErrorMessage('❌ Failed to load items. Please try again later.');
        }
    };

    const handleDeleteItem = async (item_id) => {
        try {
            await deleteGroceryItem(item_id);
            setGroceryItems(prevItems => prevItems.filter(item => item.item_id !== item_id));
            setErrorMessage('✅ Item deleted successfully!');
        } catch (error) {
            setErrorMessage('❌ Error deleting item. Please try again.');
        }
    };

    const validateNewItem = () => {
        if (!newItem.item_name.trim() && !newItem.quantity ) {
          return "🌸 Oops! It looks like you forgot to add an item name or quantity!";
        }
        if (!newItem.item_name.trim()) {
          return "🌷 Please give your item a name!";
        }
        if (!Number.isInteger(parseInt(newItem.quantity)) || parseInt(newItem.quantity) <= 0) {
          return "🔢 Please enter a positive quantity.";
        }
        return null;
    };
    
    const handleAddItem = async () => {
        const error = validateNewItem();
        if (error) {
            setErrorMessage(error);
            return;
        }

        const category = await categorizeItem(newItem.item_name);
        const location = await locateItem(newItem.item_name);
        
        const newItemToAdd = {
            ...newItem,
            item_id: groceryItems.length + 1,
            category,
            quantity: parseInt(newItem.quantity),
            location,
        };

        const addedItem = await addGroceryItem(newItemToAdd, true);

        setGroceryItems([...groceryItems, addedItem]);
        setNewItem({ item_name: '', category: '', quantity: '', location: '' });
        setErrorMessage('');
    };
   
    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const handleEditItem = (item_id) => {
        setEditingItemId(item_id);
        const itemToEdit = groceryItems.find(item => item.item_id === item_id);
        if (itemToEdit) {
          setEditedItem({
            item_name: itemToEdit.item_name,
            category: itemToEdit.category,
            quantity: itemToEdit.quantity,
            item_state: itemToEdit.item_state,
            location: itemToEdit.location
          });
        } else {
          console.error('Error: Item not found');
          setErrorWithTimer('❌ Error: Item not found. ❌');
        }
    };
    
    const handleSaveEditedItem = async () => {
        const { item_name, category, quantity, location } = editedItem;
    
        if (!item_name || !category || quantity === '' || quantity < 0 || !location) {
          setErrorWithTimer('🌟 All fields are required, and quantity must be a non-negative number! 🌟');
          return;
        }
    
        const updatedItem = {
          item_name,
          category,
          quantity: parseInt(quantity, 10),
          item_state: editedItem.item_state,
          location
        };
    
        try {
          const response = await updateGroceryItem(editingItemId, updatedItem);
          if (response) {
            console.log('Item updated successfully:', response);
            fetchGroceries(); 
            setEditingItemId(null); 
            setErrorWithTimer('✅ Item updated successfully! ✅');
          }
        } catch (error) {
          console.error('Error updating item:', error);
          setErrorWithTimer('❌ Oops! Something went wrong while updating the item. ❌');
        }
    };

    const handleAvailabilityChange = (event) => {
        setSelectedAvailability(event.target.value);
    };

    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    const handleLocationChange = (event) => {
        setSelectedLocation(event.target.value);
    };

    const handleEditedItemChange = (e, field) => {
        const { value } = e.target;
        setEditedItem((prevItem) => ({
          ...prevItem,
          [field]: field === 'quantity' ? (value < 0 ? 0 : parseInt(value, 10)) : value
        }));
    };
    
    const handleNewItemChange = (e, field) => {
        const { value } = e.target;
        setNewItem((prevItem) => ({
          ...prevItem,
          [field]: field === 'quantity' ? (value < 0 ? 0 : parseInt(value, 10)) : value
        }));
    };

    const handleCheckboxChange = (item_id) => {
        setGroceryItems(prevItems =>
            prevItems.map(item =>
                item.item_id === item_id ? { ...item, selected: !item.selected } : item
            )
        );
    };

    const setErrorWithTimer = (message, duration = 3000) => {
        setErrorMessage(message);
        setTimeout(() => {
            setErrorMessage(""); // Clear the error message
        }, duration);
    };

    const filteredItems = groceryItems.filter(item => {
        const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
        const locationMatch = selectedLocation === 'All' || item.location === selectedLocation;
        return categoryMatch && locationMatch;
    });

    const transferToInventory = async () => {
        const selectedItems = groceryItems.filter(item => item.selected);
    
        if (selectedItems.length === 0) {
            setErrorMessage('❌ No items selected to transfer to inventory.');
            return;
        }
    
        // Extract item IDs
        const itemIds = selectedItems.map(item => item.item_id);
    
        try {
            console.log("Selected item IDs to transfer:", itemIds);
    
            // Call backend API
            await transferGroceryToInventory(itemIds);
    
            // Remove transferred items from grocery list state and set `item_state` to "High"
            setGroceryItems(prevItems => 
                prevItems.filter(item => !item.selected)
            );
            setErrorMessage('✅ Items successfully transferred to inventory!');
        } catch (error) {
            console.error("Error transferring items to inventory:", error);
            setErrorMessage('❌ Failed to transfer items to inventory. Please try again.');
        }
    };            

    return (
        <div className="grocery-container">
            <div className="grocery-welcome">
                <h1>{firstName}'s Grocery List</h1>
            </div>
            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <div className="grocery-options-and-table">
                <div className="grocery-table-options">
                    <button onClick={toggleModal} className="filter-button">
                        Filter
                        <img src="/images/filter.png" alt="Filter Icon" className="filter" />
                    </button>
                </div>

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div>
                                <p>Filter by:</p>
                                <label htmlFor="category-select">Category</label>
                                <select
                                    id="category-select"
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="location-select">Location</label>
                                <select
                                    id="location-select"
                                    value={selectedLocation}
                                    onChange={handleLocationChange}
                                >
                                    {locations.map(location => (
                                        <option key={location} value={location}>
                                            {location}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grocery-table">
                    <table>
                        <thead>
                        <tr>
                            <th>Select</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Location</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                            <tr key={item.item_id}>
                                {/* Checkbox Column */}
                                <td>
                                <input
                                    type="checkbox"
                                    checked={item.selected}
                                    onChange={() => handleCheckboxChange(item.item_id)}
                                />
                                </td>

                                {/* Item Name (Editable when item is being edited) */}
                                <td>
                                {editingItemId === item.item_id ? (
                                    <input
                                    type="text"
                                    value={editedItem.item_name}
                                    onChange={(e) => handleEditedItemChange(e, 'item_name')}
                                    />
                                ) : (
                                    item.item_name
                                )}
                                </td>

                                {/* Category (Editable when item is being edited) */}
                                <td>
                                {editingItemId === item.item_id ? (
                                <select
                                    value={editedItem.category}
                                    onChange={(e) => handleEditedItemChange(e, 'category')}
                                >
                                    <option value="Fresh Produce">Fresh Produce</option>
                                    <option value="Dairy">Dairy</option>
                                    <option value="Pantry Staples">Pantry Staples</option>
                                    <option value="Meat, Seafood, and Alternatives">Meat, Seafood, and Alternatives</option>
                                    <option value="Frozen Foods">Frozen Foods</option>
                                    <option value="Snacks and Beverages">Snacks and Beverages</option>
                                    <option value="Household and Miscellaneous">Household and Miscellaneous</option>
                                </select>
                                ) : (
                                    item.category
                                )}
                                </td>

                                {/* Quantity (Editable when item is being edited) */}
                                <td>
                                {editingItemId === item.item_id ? (
                                    <input
                                    type="number"
                                    value={editedItem.quantity}
                                    onChange={(e) => handleEditedItemChange(e, 'quantity')}
                                    />
                                ) : (
                                    item.quantity
                                )}
                                </td>

                                {/* Location (Editable when item is being edited) */}
                                <td>
                                {editingItemId === item.item_id ? (
                                    <select
                                    value={editedItem.location}
                                    onChange={(e) => handleEditedItemChange(e, 'location')}
                                    >
                                        <option value="Pantry">Pantry</option>
                                        <option value="Fridge">Fridge</option>
                                        <option value="Freezer">Freezer</option>
                                    </select>
                                ) : (
                                    item.location
                                )}
                                </td>

                                {/* Actions Column (Edit, Delete, Save, Cancel buttons) */}
                                <td>
                                <div className="inventory-actions">
                                    {editingItemId === item.item_id ? (
                                    <>
                                        <button onClick={handleSaveEditedItem}>Save</button>
                                        <button onClick={() => setEditingItemId(null)}>Cancel</button>
                                    </>
                                    ) : (
                                    <>
                                        <button onClick={() => handleEditItem(item.item_id)}>Edit</button>
                                        <button onClick={() => handleDeleteItem(item.item_id)}>Delete</button>
                                    </>
                                    )}
                                </div>
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                            <td colSpan="6">No items available for this filter.</td>
                            </tr>
                        )}

                        {/* Add New Item Row */}
                        {showAddRow ? (
                            <tr>
                            <td>
                                <input
                                type="text"
                                value={newItem.item_name}
                                onChange={(e) => handleNewItemChange(e, 'item_name')}
                                placeholder="Item Name"
                                />
                            </td>
                            <td>
                                {/* Category input when adding item */}
                            </td>
                            <td></td>
                            <td>
                                <input
                                type="number"
                                value={newItem.quantity}
                                onChange={(e) => handleNewItemChange(e, 'quantity')}
                                placeholder="Quantity"
                                />
                            </td>
                            <td>
                                {/* Location input when adding item */}
                            </td>
                            <td>
                                <button onClick={handleAddItem}>Add Item</button>
                            </td>
                            <td>
                                <button onClick={() => setShowAddRow(false)} className="close-button">
                                X
                                </button>
                            </td>
                            </tr>
                        ) : (
                            <tr>
                                <td colSpan="6">
                                    <div className="inventory-add-new-row">
                                    <button onClick={() => setShowAddRow(true)}>
                                        Add Items
                                        <img src="\images\plussign.png" className="pluss-sign" alt="Add" />
                                    </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {groceryItems.some(item => item.selected) && (
                <div className="grocery-add-submit">
                    <button onClick={transferToInventory} className="grocery-submit-button">
                        Submit Selected to Inventory
                    </button>
                </div>
            )}
        </div>
    );
};

export default GroceryList;
