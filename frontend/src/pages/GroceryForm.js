import React, { useState } from 'react';
import { addGroceryItem } from '/src/api/grocery-API-calls';
import { categorizeItem, locateItem } from '/src/api/openai-api-calls.js';

const GroceryForm = ({ onSubmit }) => {
  const [groceryItems, setGroceryItems] = useState([]);
  const [newItem, setNewItem] = useState({ item_name: '', category: '', quantity: '', location: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const handleNewItemChange = (e, field) => {
    const { value } = e.target;
    setNewItem((prevItem) => ({
      ...prevItem,
      [field]: value
    }));
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

    setGroceryItems([...groceryItems, newItemToAdd]);
    setNewItem({ item_name: '', category: '', quantity: '', location: '' });
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    // Check if no items have been added to the list before submitting
    if (groceryItems.length === 0) {
      setErrorMessage("⚠️ Please add items to the list before submitting.");
      return;
    }

    try {
      const newItems = await Promise.all(groceryItems.map(async (item) => {
        return await addGroceryItem(item);
      }));
      onSubmit(newItems); // Transfer items to GroceryList
      setGroceryItems([]); // Clear form items
      alert("Grocery items submitted successfully!");
    } catch (error) {
      console.error('Error submitting items:', error);
      alert("There was an error submitting your grocery items.");
    }
  };

  const handleDeleteItem = (item_id) => {
    setGroceryItems(groceryItems.filter(item => item.item_id !== item_id));
  };

  return (
    <div>
      <h2>Add Items to Your Grocery List</h2>
      {errorMessage && <div>{errorMessage}</div>}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Location</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {groceryItems.length > 0 ? (
            groceryItems.map(item => (
              <tr key={item.item_id}>
                <td>{item.item_name}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td>{item.location}</td>
                <td>
                  <button onClick={() => handleDeleteItem(item.item_id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No items added yet!</td>
            </tr>
          )}
        </tbody>
      </table>

      <div>
        <input
          type="text"
          placeholder="Item Name"
          value={newItem.item_name}
          onChange={(e) => handleNewItemChange(e, 'item_name')}
        />
        {/* <select
          value={newItem.category}
          onChange={(e) => handleNewItemChange(e, 'category')}
        >
          <option value="">Select Category</option>
          <option value="Fresh Produce">Fresh Produce</option>
          <option value="Dairy and Eggs">Dairy and Eggs</option>
          <option value="Pantry Staples">Pantry Staples</option>
          <option value="Meat, Seafood, and Alternatives">Meat, Seafood, and Alternatives</option>
          <option value="Frozen Foods">Frozen Foods</option>
          <option value="Snacks and Beverages">Snacks and Beverages</option>
          <option value="Household and Miscellaneous">Household and Miscellaneous</option>
        </select> */}
        <input
          type="number"
          placeholder="Quantity"
          value={newItem.quantity}
          onChange={(e) => handleNewItemChange(e, 'quantity')}
        />
        {/* <select
          value={newItem.location}
          onChange={(e) => handleNewItemChange(e, 'location')}
        >
          <option value="">Select Location</option>
          <option value="Pantry">Pantry</option>
          <option value="Fridge">Fridge</option>
          <option value="Freezer">Freezer</option>
        </select> */}
      </div>

      <div>
        <button onClick={handleAddItem}>Add to List</button>
        <button onClick={handleSubmit}>Submit Groceries</button>
      </div>
    </div>
  );
};

export default GroceryForm;