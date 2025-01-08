import React, { useState, useEffect } from 'react';
import { getInventoryItems, addGroceryItem, deleteInventoryItem, updateGroceryItem, checkLoginStatus, updateItemInList, fetchShelfLife} from '/src/api/grocery-API-calls';
import { categorizeItem, locateItem } from '/src/api/openai-api-calls.js';

const Inventory = () => {
  const [groceryItems, setGroceryItems] = useState([]);

  const [showAddRow, setShowAddRow] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [anySelected, setAnySelected] = useState(false);

  const [newItem, setNewItem] = useState({ item_name: '', category: '', quantity: '', item_state: 'High', location: 'Pantry' });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedItem, setEditedItem] = useState({ item_name: '', category: '', quantity: '', item_state: 'High', location: 'Pantry' });
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');
  const [selectedItems, setSelectedItems] = useState([]); 
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [firstName, setFirstName] = useState('');

  const [shelfLifeData, setShelfLifeData] = useState(null);
  const [hoveredItemId, setHoveredItemId] = useState(null);

  useEffect(() => {
    checkLoginStatus();
    const storedFirstName = localStorage.getItem('first_name');
        if (storedFirstName) {
            setFirstName(storedFirstName);
        }
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
        const data = await getInventoryItems(); 
        if (Array.isArray(data)) {
            const updatedData = data.map(item => ({
                ...item,
                item_state: item.item_state || 'High', // Default to 'High' if not set
            }));
            setGroceryItems(updatedData); 
        } else {
            setGroceryItems([]);
            console.error('Unexpected data format:', data);
        }
    } catch (error) {
        console.error('Error fetching items:', error);
        setGroceryItems([]);
    }
};

  const handleCheckboxChange = (item_id) => {
    setSelectedItems((prevSelectedItems) => {
        const newSelectedItems = prevSelectedItems.includes(item_id)
            ? prevSelectedItems.filter(id => id !== item_id)
            : [...prevSelectedItems, item_id];

        const isAnySelected = newSelectedItems.length > 0;
        setAnySelected(isAnySelected);

        return newSelectedItems; 
    });
};

const setErrorWithTimer = (message, duration = 3000) => {
  setErrorMessage(message);
  setTimeout(() => {
      setErrorMessage(""); // Clear the error message
  }, duration);
};
  
  const checkboxSubmit = async () => {
    console.log('Submit button clicked. Selected items:', selectedItems);
    try {
      if (selectedItems.length === 0) {
        setErrorWithTimer('❌ No items selected to update.');
        return;
      }
  
      console.log('Sending bulk update for items:', selectedItems);
      await updateItemInList(selectedItems, 1); 
  
      setErrorWithTimer('✅ Selected items have been added to grocery list!');
      setSelectedItems([]); 
      fetchItems();
    } catch (error) {
      console.error('Error updating selected items:', error);
      setErrorWithTimer('❌ Oops! Something went wrong while updating the items.');
    }
  };
  
  
  const handleAddItem = async () => {
    const { item_name, quantity, location } = newItem;

    // Specific validation for required fields
    if (!item_name) {
        setErrorWithTimer('❌ Item Name is required.');
        return;
    }

    if (quantity === '') {
        setErrorWithTimer('❌ Quantity is required.');
        return;
    }

    if (quantity <= 0) {
        setErrorWithTimer('❌ Quantity must be a non-negative number and over 0.');
        return;
    }

    // Check if the item already exists in the inventory
    const existingItem = groceryItems.find(
        (item) =>
            item.item_name.toLowerCase() === item_name.toLowerCase() &&
            item.location === location
    );

    if (existingItem) {
        // Increment the quantity of the existing item
        const updatedQuantity = parseInt(existingItem.quantity, 10) + parseInt(quantity, 10);
        const updatedItem = { ...existingItem, quantity: updatedQuantity };

        try {
            // Update the existing item in the backend
            await updateGroceryItem(existingItem.item_id, updatedItem);

            // Update the item in the local state
            setGroceryItems((prevItems) =>
                prevItems.map((item) =>
                    item.item_id === existingItem.item_id ? updatedItem : item
                )
            );

            // Reset the new item input fields
            setNewItem({ item_name: '', category: '', quantity: '', item_state: 'High', location: 'Pantry' });
            setErrorWithTimer('✅ Quantity updated successfully! ✅');
        } catch (error) {
            console.error('Error updating item quantity:', error);
            setErrorWithTimer('❌ Oops! Something went wrong while updating the item. ❌');
        }
        return;
    }

    try {
        // Categorize and locate the item
        const category = await categorizeItem(item_name);
        const location = await locateItem(item_name);

        // Add the new item to the inventory
        const newItemWithCategoryandLocation = { ...newItem, category, location };
        const addedItem = await addGroceryItem(newItemWithCategoryandLocation, false);

        // Update the state to include the newly added item
        setGroceryItems([...groceryItems, addedItem]);

        // Reset the new item input fields
        setNewItem({ item_name: '', category: '', quantity: '', item_state: 'High', location: '' });
        setErrorWithTimer('✅ Item added successfully! ✅');
    } catch (error) {
        console.error('Error adding item:', error);
        setErrorWithTimer('❌ Oops! Something went wrong while adding the item. ❌');
    }
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
        fetchItems(); 
        setEditingItemId(null); 
        setErrorWithTimer('✅ Item updated successfully! ✅');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      setErrorWithTimer('❌ Oops! Something went wrong while updating the item. ❌');
    }
  };

  const handleDeleteItem = async (item_id) => {
    try {
      await deleteInventoryItem(item_id);
      setGroceryItems(groceryItems.filter(item => item.item_id !== item_id));
      setErrorWithTimer('✅ Item deleted successfully! ✅');
    } catch (error) {
      console.error('Error deleting item:', error);
      setErrorWithTimer('❌ Oops! Something went wrong while deleting the item. ❌');
    }
  };

  const handleNewItemChange = (e, field) => {
    const { value } = e.target;
    setNewItem((prevItem) => ({
      ...prevItem,
      [field]: field === 'quantity' ? (value < 0 ? 0 : parseInt(value, 10)) : value
    }));
  };

  const handleEditedItemChange = (e, field) => {
    const { value } = e.target;
    setEditedItem((prevItem) => ({
      ...prevItem,
      [field]: field === 'quantity' ? (value < 0 ? 0 : parseInt(value, 10)) : value
    }));
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleAvailabilityChange = (event) => {
    setSelectedAvailability(event.target.value);
  };

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
  };  

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const toggleCheckboxes = () => {
    setShowCheckboxes(!showCheckboxes);
  };

  const filteredItems = Array.isArray(groceryItems) ? groceryItems.filter(item => {
    const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
    const availabilityMatch = selectedAvailability === 'All' || item.item_state === selectedAvailability;
    const locationMatch = selectedLocation === 'All' || item.location === selectedLocation;
    return categoryMatch && availabilityMatch && locationMatch;
  }) : [];  

  const getShelfLifeInfo = async (itemName, itemId, location) => {
    try {
      setShelfLifeData(null); // Clear previous data
      const response = await fetchShelfLife(itemName, location);
  
      if (response.message) {
        // Handle single message (e.g., "Not recommended to store in fridge")
        setShelfLifeData(response.message);
      } else if (response.options) {
        // Handle multiple matches for ambiguous names
        setShelfLifeData({
          type: "options",
          data: response.options,
        });
      } else {
        // Handle specific shelf life information
        setShelfLifeData(response);
      }
  
      setHoveredItemId(itemId); // Track which item is hovered
    } catch (error) {
      console.error("Error fetching shelf life data:", error);
      setShelfLifeData("Could not retrieve shelf life data.");
    }
  };  

  return (
    <div className="inventory-container">
        <div className="inventory-welcome">
          <h1>Welcome to your current inventory, {firstName}!</h1>
          {errorMessage && <div className="error-message-wrap"><div className="error-message">{errorMessage}</div></div>}
        </div>

        <div className="inventory-options-and-table">
          <div className="inventory-table-options">
            {/* Filter Button */}
            <button onClick={toggleModal} className="filter-button">
              Filter
              <img src="\images\filter.png" className="filter"></img>
            </button>

            {/* Toggle Checkboxes Button */}
            <button onClick={toggleCheckboxes} className="toggle-checkboxes-button">
              {showCheckboxes} Add to Grocery List
              <img src="\images\plussign.png" className="pluss-sign"></img>
            </button>
          </div>

        {/* Filter Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div>
                <p>Filter by:</p>
                <label htmlFor="category-select">Category</label>
                <select id="category-select" value={selectedCategory} onChange={handleCategoryChange}>
                  <option value="All">All</option>
                  <option value="Fresh Produce">Fresh Produce</option>
                  <option value="Dairy and Eggs">Dairy and Eggs</option>
                  <option value="Pantry Staples">Pantry Staples</option>
                  <option value="Meat, Seafood, and Alternatives">Meat, Seafood, and Alternatives</option>
                  <option value="Frozen Foods">Frozen Foods</option>
                  <option value="Snacks and Beverages">Snacks and Beverages</option>
                  <option value="Household and Miscellaneous">Household and Miscellaneous</option>
                </select>
              </div>
              <div>
                <label htmlFor="availability-select">Availability</label>
                <select id="availability-select" value={selectedAvailability} onChange={handleAvailabilityChange}>
                  <option value="All">All</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="location-select">Location</label>
                <select id="location-select" value={selectedLocation} onChange={handleLocationChange}>
                  <option value="All">All</option>
                  <option value="Pantry">Pantry</option>
                  <option value="Fridge">Fridge</option>
                  <option value="Freezer">Freezer</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                {showCheckboxes && <th>Select</th>} {/* Conditional checkbox column */}
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Stock</th>
                <th>Location</th>
                <th>Info</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems && filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.item_id || Math.random()}>
                    {editingItemId === item.item_id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editedItem.item_name}
                            onChange={(e) => handleEditedItemChange(e, 'item_name')}
                          />
                        </td>
                        <td>
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
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editedItem.quantity}
                            onChange={(e) => handleEditedItemChange(e, 'quantity')}
                          />
                        </td>
                        <td>
                          <select
                            value={editedItem.item_state}
                            onChange={(e) => handleEditedItemChange(e, 'item_state')}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                      </td>
                      <td>
                      <select
                        value={editedItem.location}
                        onChange={(e) => handleEditedItemChange(e, 'location')}
                      >
                        <option value="Pantry">Pantry</option>
                        <option value="Fridge">Fridge</option>
                        <option value="Freezer">Freezer</option>
                      </select>
                      </td>
                        <td>
                          <div className="inventory-edit-buttons">
                              <button onClick={handleSaveEditedItem}>Save</button>
                              <button onClick={() => setEditingItemId(null)}>Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {showCheckboxes && (
                          <td>
                            <input
                            type="checkbox"
                            checked={selectedItems.includes(item.item_id)} 
                            onChange={() => handleCheckboxChange(item.item_id)} 
                          />
                          </td>
                        )}
                        <td>{item.item_name}</td>
                        <td>{item.category}</td>
                        <td>{item.quantity}</td>
                        <td>{item.item_state}</td>
                        <td>{item.location}</td>
                        <td>
                          <div className="shelf-life">
                            <button
                              className="shelf-life-button"
                              onClick={() => getShelfLifeInfo(item.item_name, item.item_id, item.location)}
                            >
                              Shelf Life Info
                            </button>
                            {shelfLifeData && hoveredItemId === item.item_id && (
                              <div className="shelf-life-content">
                                {typeof shelfLifeData === "string" ? (
                                  <p>{shelfLifeData}</p> // Display single message or string response
                                ) : shelfLifeData.type === "options" ? (
                                  <ul>
                                    {shelfLifeData.data.map((option, index) => (
                                      <li key={index}>
                                        <strong>{option.Name}</strong>: {option.Name_subtitle} (Keywords: {option.Keywords})
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  // Display specific shelf life information
                                  <div>
                                    {Object.entries(shelfLifeData).map(([key, value]) => (
                                      <p key={key}>
                                        <strong>{key.replace(/_/g, " ")}:</strong> 
                                        {typeof value === "object" ? JSON.stringify(value) : value}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        {/* Actions */}
                        <td>
                          <div className="inventory-actions">
                            <button onClick={() => handleEditItem(item.item_id)}>Edit</button>
                            <button onClick={() => handleDeleteItem(item.item_id)}>Delete</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No items found.</td>
                </tr>
              )}

            {/* Toggle the add row based on showAddRow state */}
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
                    {/*Where category would be*/}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => handleNewItemChange(e, 'quantity')}
                      placeholder="Quantity"
                    />
                  </td>
                  <td>
                    <select
                      value={newItem.item_state}
                      onChange={(e) => handleNewItemChange(e, 'item_state')}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </td>
                  <td>
                    {/* Where pantry would be */}
                  </td>
                  <td>
                      <button onClick={handleAddItem}>Add Item</button>
                  </td>
                  <td>
                      <button onClick={() => setShowAddRow(false)} className="close-button">X</button>
                  </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="7">
                  <div className="inventory-add-new-row">
                      <button onClick={() => setShowAddRow(true)}>Add Items<img src="\images\plussign.png" className="pluss-sign"></img></button>
                  </div>
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
        <div className="inventory-add-submit">
          {anySelected && (
            <button onClick={checkboxSubmit}>Submit Selected</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
