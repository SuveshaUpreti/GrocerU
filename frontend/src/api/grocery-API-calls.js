const BACK_URL = 'http://localhost:5001/';
const FRONT_URL = 'http://localhost:3000/';

// Fetch groceries from inventory (GET request)
export const getInventoryItems = async () => {
  try {
    const response = await fetch(`${BACK_URL}inventory_items`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch inventory items');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching inventory items:', error);
  }
};

// Fetch groceries from grocery (GET request)
export const getGroceryItems = async () => {
  try {
    const response = await fetch(`${BACK_URL}grocery_items`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch grocery items');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching grocery items:', error);
  }
};

export const addGroceryItem = async (newItem, fromGroceryPage = true) => {
  try {
    // Set the in_list flag based on the source of the item
    const itemWithFlag = {
      ...newItem,
      in_list: fromGroceryPage ? 1 : 0 // Use 1 if from the grocery page, otherwise 0
    };

    const response = await fetch(`${BACK_URL}items`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemWithFlag), // Use the modified item
    });

    if (!response.ok) {
      throw new Error('Failed to add grocery item');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding grocery item:', error);
  }
};


// Delete an inventory item (DELETE request)
export const deleteInventoryItem = async (id) => {
  try {
    const response = await fetch(`${BACK_URL}inventory_items/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete inventory item');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting inventory item:', error);
  }
};

// Delete a grocery list item (DELETE request)
export const deleteGroceryItem = async (id) => {
  try {
    const response = await fetch(`${BACK_URL}grocery_items/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete grocery item');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting grocery item:', error);
  }
};

// Update a grocery item (PUT)
export const updateGroceryItem = async (id, updatedItem) => {
  try {
    const response = await fetch(`${BACK_URL}items/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedItem),
    });

    if (!response.ok) {
      throw new Error('Failed to update grocery item');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating grocery item:', error);
  }
};

// Register new user
export const register = async (formData) => {
  try {
      // Adjusting formData to match backend expectations
      const adjustedFormData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
      };

      const response = await fetch(`${BACK_URL}register`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(adjustedFormData), // Use adjustedFormData
      });
      

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

      // Optional: Display a success message or notification before redirecting
      alert('Registration successful! Redirecting to login...'); // Optional alert

      window.location.href = `${FRONT_URL}login`; // Route user to login on registration
  } catch (error) {
    throw error;
  }
};

export const transferGroceryToInventory = async (itemIds) => {
  try {
      const response = await fetch(`${BACK_URL}transfer_to_inventory`, {
          method: 'POST',
          credentials: 'include',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_ids: itemIds }), // Send selected item IDs
      });

      if (!response.ok) {
          throw new Error('Failed to transfer items to inventory');
      }

      return await response.json();
  } catch (error) {
      console.error('Error transferring items to inventory:', error);
      throw error;
  }
};

// Log in user
export const login = async (formData) => {
  try {
    const response = await fetch(`${BACK_URL}login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
    }

    const userData = await response.json();
    localStorage.setItem('first_name', userData.first_name);
    localStorage.setItem('last_name', userData.last_name);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('email', userData.email);
    
    return userData;

  } catch (error) {
    throw error;
  }
};

// Logout logged in user
export const Logout = async () => {
  try {
    const response = await fetch(`${BACK_URL}logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      window.location.href = `${FRONT_URL}`; // route user to landing page on logout
    } else {
      console.error('Logout failed.');
    }
  } catch (error) {
    console.error('An error occurred while logging out:', error);
  }
};

// Trigger server to send the recovery email
export const SendRecoveryEmail = async (email) => {
  const response = await fetch(`${BACK_URL}recover_password`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        credentials: 'include',
    },
    body: JSON.stringify({ email }),  
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send recovery email');
  }

  const data = await response.json(); 
  return data; 
} 

// Trigger server to update user's password
export const resetPassword = async (token, newPassword) => {
  const response = await fetch(`${BACK_URL}reset_password/${token}`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          credentials: 'include', 
      },
      body: JSON.stringify({ password: newPassword }), 
  });

  if (!response.ok) {
      throw new Error('Failed to reset password'); 
  }
  
  return response.json();
};

// Check login status for debugging
export const checkLoginStatus = async () => {
  try {
    const response = await fetch(`${BACK_URL}login_status`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.logged_in) {
        console.log("You are logged in as user ID:", data.user_id);
      } else {
        console.log("You are not logged in.");
      }
    } else {
      console.log("Failed to check login status. Status code:", response.status);
    }
  } catch (error) {
    console.error("Error checking login status:", error);
  }
};

export const updateItemInList = async (itemIds, inListValue) => {
  console.log('Sending bulk update request for items:', itemIds, 'with in_list value:', inListValue);
  try {
    const response = await fetch(`${BACK_URL}send_to_list`, {
      method: 'PUT',
      credentials :  'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item_ids: itemIds, // Array of item IDs
        in_list: inListValue // New in_list value
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update items');
    }

    console.log('Bulk update successful for items:', itemIds);
    return await response.json();
  } catch (error) {
    console.error('Error updating items:', error);
    throw error;
  }
};

export const fetchShelfLife = async (productName, location) => {
  try {
    const response = await fetch(`http://localhost:5001/shelf_life?name=${productName}&location=${location}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    
    const data = await response.json();

    if (data.message) {
      // Case: Item not in dataset 
      return { message: data.message }; 
    }

    if (typeof data === 'string') {
      // Case: Not recommended to store in location (string response)
      return { message: data }; 
    }

    // Case: Shelf life info returned as an object
    return { shelfLife: data }; 
  } catch (error) {
    console.error("Error fetching shelf life data:", error);
    return { error: "Could not retrieve shelf life data." };
  }
};
