import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ACCESS_TOKEN } from "../constants"
import api from "../api"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import "../assets/layered-waves-haikei.svg"
import SpotlightCard from "./SpotlightCard"

function Searchbar() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dynamicIngredients, setDynamicIngredients] = useState([]);
  const [filteredIngredients, setFilteredIngredients] = useState([]);
  const [showNoIngredientsMessage, setShowNoIngredientsMessage] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('dinner');
  const [userAllergens, setUserAllergens] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [showAllRecipes, setShowAllRecipes] = useState(false);
  const [allAvailableIngredients, setAllAvailableIngredients] = useState([]);
  const [userDietaryPreference, setUserDietaryPreference] = useState(null);
  const [useDietFilter, setUseDietFilter] = useState(false);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [dietFilterDebounce, setDietFilterDebounce] = useState(false);
  const recipesPerPage = 4;

  // Shopping list state
  const [shoppingList, setShoppingList] = useState([]);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [storageIngredients, setStorageIngredients] = useState([]);
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState(false);

  // Handle diet filter toggle with debounce
  const handleDietFilterToggle = (checked) => {
    setDietFilterDebounce(true);
    setUseDietFilter(checked);
    // Small delay to prevent rapid toggling
    setTimeout(() => setDietFilterDebounce(false), 300);
  };

  // 20 most popular ingredients - shown when no search is entered
  const popularIngredients = [
    'salt', 'pepper', 'olive oil', 'garlic', 'onion',
    'butter', 'flour', 'eggs', 'milk', 'cheese',
    'tomato', 'chicken', 'beef', 'rice', 'pasta',
    'sugar', 'lemon', 'herbs', 'potatoes', 'carrots'
  ];
  // Fetch user allergens and dietary preference on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get("/api/user-profiles/");
        if (res.data && res.data.length > 0) {
          const userProfile = res.data[0];
          
          // Handle allergens
          if (userProfile.allergies && Array.isArray(userProfile.allergies)) {
            // Get allergy details to get names
            const allergyPromises = userProfile.allergies.map(async (allergyId) => {
              try {
                const allergyRes = await api.get(`/api/allergies/${allergyId}/`);
                return allergyRes.data.name.toLowerCase();
              } catch (err) {
                return null;
              }
            });
            const allergenNames = (await Promise.all(allergyPromises)).filter(name => name !== null);
            setUserAllergens(allergenNames);
          }
          
          // Handle dietary preference
          if (userProfile.dietary_preference) {
            setUserDietaryPreference(userProfile.dietary_preference);
            setUseDietFilter(true);
          }
        }
      } catch (err) {
        // fail silently, fallback to backend filtering
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch all available ingredients on mount
  useEffect(() => {
    const fetchAllIngredients = async () => {
      try {
        // Use the appropriate endpoint based on diet filter preference
        const endpoint = useDietFilter ? 
          "/api/ingredient-all-data/?limit=1000" : 
          "/api/ingredient-all-data-unfiltered/?limit=1000";
        
        const response = await api.get(endpoint);
        if (response.data && Array.isArray(response.data)) {
          const ingredients = response.data.map(item => item.name);
          setAllAvailableIngredients(ingredients);
        }
      } catch (error) {
        console.error("Error fetching all ingredients:", error);
      }
    };
    fetchAllIngredients();
  }, [useDietFilter]); // Re-fetch when diet filter changes

  // Fetch ingredients from API when searchInput changes
  useEffect(() => {
    const fetchIngredients = async () => {
      setIsLoadingIngredients(true);
      try {
        // If no search input, show appropriate ingredients based on diet filter
        if (searchInput.trim() === "") {
          let baseIngredients = [];
          
          if (useDietFilter && allAvailableIngredients.length > 0) {
            // If diet filter is on, use random ingredients from the diet-filtered set
            baseIngredients = [...allAvailableIngredients];
          } else {
            // Otherwise, use the popular ingredients
            baseIngredients = [...popularIngredients];
          }
          
          // Filter out user's allergens
          const filteredIngredients = baseIngredients.filter(ingredient => 
            !userAllergens.includes(ingredient.toLowerCase())
          );
          
          // Add random ingredients from all available ingredients to replace any allergens that were selected
          const additionalCount = selectedAllergens.length;
          if (additionalCount > 0 && allAvailableIngredients.length > 0) {
            const availableForReplacement = allAvailableIngredients.filter(ingredient => 
              !userAllergens.includes(ingredient.toLowerCase()) &&
              !filteredIngredients.includes(ingredient) &&
              !selectedIngredients.includes(ingredient)
            );
            
            // Randomly select additional ingredients to replace selected allergens
            const shuffled = availableForReplacement.sort(() => 0.5 - Math.random());
            const additionalIngredients = shuffled.slice(0, additionalCount);
            filteredIngredients.push(...additionalIngredients);
          }
          
          // For diet-filtered ingredients, shuffle them to show random ones
          if (useDietFilter && filteredIngredients.length > 20) {
            const shuffled = filteredIngredients.sort(() => 0.5 - Math.random());
            setDynamicIngredients(shuffled.slice(0, 20));
            setIsLoadingIngredients(false);
            return;
          }
          
          // Always ensure we have exactly 20 ingredients if possible
          if (filteredIngredients.length < 20 && allAvailableIngredients.length > 0) {
            const needed = 20 - filteredIngredients.length;
            const availableForFilling = allAvailableIngredients.filter(ingredient => 
              !userAllergens.includes(ingredient.toLowerCase()) &&
              !filteredIngredients.includes(ingredient) &&
              !selectedIngredients.includes(ingredient)
            );
            
            const shuffled = availableForFilling.sort(() => 0.5 - Math.random());
            const fillerIngredients = shuffled.slice(0, needed);
            filteredIngredients.push(...fillerIngredients);
          }
          
          setDynamicIngredients(filteredIngredients.slice(0, 20));
          setIsLoadingIngredients(false);
          return;
        }

        // Otherwise, search for ingredients using the appropriate endpoint
        const endpoint = useDietFilter ? 
          `/api/ingredient-all-data/?search=${searchInput}&limit=50` : 
          `/api/ingredient-all-data-unfiltered/?search=${searchInput}&limit=50`;
        
        const response = await api.get(endpoint);
        
        if (response.data && Array.isArray(response.data)) {
          // Process ingredients: get names, limit to 50 for search results
          const processedIngredients = response.data
            .map(item => item.name)
            .slice(0, 50)

          setDynamicIngredients(processedIngredients)
        }
      } catch (error) {
        console.error("Error fetching ingredients:", error)
        // Fallback to popular ingredients filtered by allergens
        const fallbackIngredients = useDietFilter && allAvailableIngredients.length > 0 
          ? allAvailableIngredients.filter(ingredient => 
              !userAllergens.includes(ingredient.toLowerCase())
            ).sort(() => 0.5 - Math.random()).slice(0, 20)
          : popularIngredients.filter(ingredient => 
              !userAllergens.includes(ingredient.toLowerCase())
            );
        setDynamicIngredients(fallbackIngredients)
      } finally {
        setIsLoadingIngredients(false);
      }
    }

    // Add debounce to prevent too many API calls
    const timeoutId = setTimeout(fetchIngredients, 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput, userAllergens, selectedAllergens, selectedIngredients, allAvailableIngredients, useDietFilter]) // Added useDietFilter as dependency

  // Determine which ingredients to display (only use API results)
  useEffect(() => {
    // Only use ingredients from the API, which are already filtered by dietary preference and allergies
    const ingredients = dynamicIngredients

    const combinedIngredients = Array.from(new Set([...selectedIngredients, ...selectedAllergens, ...ingredients]))

    const sortedIngredients = [...combinedIngredients].sort((a, b) => {
      const isASelected = selectedIngredients.includes(a) || selectedAllergens.includes(a)
      const isBSelected = selectedIngredients.includes(b) || selectedAllergens.includes(b)
      if (isASelected && !isBSelected) return -1
      if (!isASelected && isBSelected) return 1
      return 0
    })

    setFilteredIngredients(sortedIngredients)
  }, [dynamicIngredients, selectedIngredients, selectedAllergens])

  // Show "No ingredients found" message after a delay if no ingredients are available
  useEffect(() => {
    if (filteredIngredients.length === 0 && searchInput.trim() !== "") {
      const timeout = setTimeout(() => {
        setShowNoIngredientsMessage(true)
      }, 500)

      return () => clearTimeout(timeout)
    } else {
      setShowNoIngredientsMessage(false)
    }
  }, [filteredIngredients, searchInput])

  const toggleIngredient = (ingredient) => {
    // Check if this ingredient is an allergen
    const isAllergen = userAllergens.includes(ingredient.toLowerCase());
    
    if (isAllergen) {
      // Handle allergen selection
      setSelectedAllergens((prev) =>
        prev.includes(ingredient)
          ? prev.filter((item) => item !== ingredient)
          : [...prev, ingredient]
      );
    } else {
      // Handle regular ingredient selection
      setSelectedIngredients((prev) =>
        prev.includes(ingredient)
          ? prev.filter((item) => item !== ingredient)
          : [...prev, ingredient]
      );
    }
  }

  // Helper: filter recipes by user allergens (frontend double-check)
  const filterRecipesByAllergens = (recipesList) => {
    if (!userAllergens.length) return recipesList;
    return recipesList.filter(recipe => {
      // Check ingredients
      const ingredientNames = (recipe.ingredients || []).map(i => i.name?.toLowerCase?.() || "");
      // Check contains_allergens field if present
      const containsAllergens = (recipe.contains_allergens || []).map(a => a.name?.toLowerCase?.() || "");
      // If any allergen is present, filter out
      return !userAllergens.some(allergen =>
        ingredientNames.some(ing => ing.includes(allergen)) ||
        containsAllergens.some(ca => ca.includes(allergen))
      );
    });
  };

  const handleSearch = async (e) => {
    setHasSearched(true);
    if (e) e.preventDefault();
    setCurrentPage(1);
    if (selectedIngredients.length === 0) {
      addAlert("Please select at least one ingredient!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/recipe-search/", {
        ingredients: selectedIngredients,
      });
      const filtered = filterRecipesByAllergens(response.data);
      setRecipes(filtered);
      if (response.data.length > 0 && filtered.length === 0) {
        addAlert("All found recipes contained your allergens and were filtered out.");
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
      alert("Failed to fetch recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Search recipes by storage ingredients
  const handleStorageSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/ingredients/");
      const storageIngredients = res.data.map(i => i.name);
      if (storageIngredients.length === 0) {
        addAlert("You have no ingredients in storage!");
        setLoading(false);
        return;
      }
      
      // Filter out allergens from storage ingredients
      const safeStorageIngredients = storageIngredients.filter(ingredient => 
        !userAllergens.includes(ingredient.toLowerCase())
      );
      
      if (safeStorageIngredients.length === 0) {
        addAlert("All your storage ingredients are allergens!");
        setLoading(false);
        return;
      }
      
      setSelectedIngredients(safeStorageIngredients);
      setSearchInput("");
      setHasSearched(true);
      setCurrentPage(1);
      const response = await api.post("/api/recipe-search/", {
        ingredients: safeStorageIngredients,
      });
      const filtered = filterRecipesByAllergens(response.data);
      setRecipes(filtered);
      if (response.data.length > 0 && filtered.length === 0) {
        addAlert("All found recipes contained your allergens and were filtered out.");
      }
    } catch (error) {
      addAlert("Failed to fetch your storage ingredients.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addAlert = (message) => {
    const id = Date.now()
    setAlerts((prevAlerts) => [...prevAlerts, { id, message, visible: true }])

    setTimeout(() => {
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.id === id ? { ...alert, visible: false } : alert
        )
      )
    }, 500)

    setTimeout(() => {
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id))
    }, 2500)
  }

  const openModal = (recipe) => {
    setSelectedRecipe(recipe)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedRecipe(null)
    setIsModalOpen(false)
  }

  // Pagination logic
  const totalPages = Math.ceil(recipes.length / recipesPerPage)
  const paginatedRecipes = recipes.slice(
    (currentPage - 1) * recipesPerPage,
    currentPage * recipesPerPage
  )

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  // Add function to handle meal creation
  const handleAddMeal = async () => {
    setIsAddingMeal(true)
    try {
      const token = localStorage.getItem(ACCESS_TOKEN)
      if (!token) {
        navigate('/login')
        return
      }

      const response = await api.post('/api/meals/', {
        recipe_id: selectedRecipe.id,
        date: selectedDate.toISOString().split('T')[0],
        meal_type: selectedMealType
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 201) {
        setShowAddMealModal(false)
        alert('Meal added successfully!')
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN)
        navigate('/login')
      } else {
        console.error('Error adding meal:', error)
        alert('Failed to add meal')
      }
    } finally {
      setIsAddingMeal(false)
    }
  }

  // Fetch user's storage ingredients
  const fetchStorageIngredients = async () => {
    try {
      const res = await api.get("/api/ingredients/");
      const ingredients = res.data.map(i => i.name.toLowerCase());
      setStorageIngredients(ingredients);
      return ingredients;
    } catch (error) {
      console.error("Error fetching storage ingredients:", error);
      return [];
    }
  };

  // Load storage ingredients on mount
  useEffect(() => {
    fetchStorageIngredients();
  }, []);

  // Get missing ingredients from a recipe
  const getMissingIngredients = (recipe) => {
    const recipeIngredients = recipe.ingredients.map(ing => ing.name.toLowerCase());
    return recipeIngredients.filter(ingredient => 
      !storageIngredients.includes(ingredient)
    );
  };

  // Add missing ingredients to shopping list
  const addMissingIngredientsToShoppingList = async (recipe) => {
    setIsAddingToShoppingList(true);
    try {
      const missingIngredients = getMissingIngredients(recipe);
      
      if (missingIngredients.length === 0) {
        addAlert("You have all ingredients for this recipe!");
        return;
      }

      // Add ingredients to shopping list, avoiding duplicates
      const newIngredients = missingIngredients.filter(ingredient => 
        !shoppingList.some(item => item.name.toLowerCase() === ingredient)
      );

      if (newIngredients.length === 0) {
        addAlert("All missing ingredients are already in your shopping list!");
        return;
      }

      const shoppingListItems = newIngredients.map(ingredient => ({
        id: Date.now() + Math.random(),
        name: ingredient,
        recipe: recipe.name,
        completed: false
      }));

      setShoppingList(prev => [...prev, ...shoppingListItems]);
      addAlert(`Added ${newIngredients.length} ingredients to shopping list!`);
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      addAlert("Failed to add ingredients to shopping list.");
    } finally {
      setIsAddingToShoppingList(false);
    }
  };

  // Remove item from shopping list
  const removeFromShoppingList = (itemId) => {
    setShoppingList(prev => prev.filter(item => item.id !== itemId));
  };

  // Toggle shopping list item completion
  const toggleShoppingListItem = (itemId) => {
    setShoppingList(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

  // Clear completed items from shopping list
  const clearCompletedItems = () => {
    setShoppingList(prev => prev.filter(item => !item.completed));
  };

  // Clear entire shopping list
  const clearShoppingList = () => {
    setShoppingList([]);
  };

  // Helper function to get country flag emoji
  const getCountryFlag = (nationality) => {
    if (!nationality) return '🌍'; // Default fallback
    
    const countryFlags = {
      // Match the exact cuisine types from the AI categorization script
      'italian': '🇮🇹',
      'mexican': '🇲🇽',
      'asian': '🥢',
      'american': '🇺🇸',
      'mediterranean': '🌊',
      'indian': '🇮🇳',
      'thai': '🇹🇭',
      'chinese': '🇨🇳',
      'french': '🇫🇷',
      'greek': '🇬🇷',
      'middle eastern': '🕌',
      'japanese': '🇯🇵',
      'korean': '🇰🇷',
      'spanish': '🇪🇸',
      'british': '🇬🇧',
      'german': '🇩🇪',
      'other': '🌍',
    };
    
    const normalizedNationality = nationality.toLowerCase().trim();
    return countryFlags[normalizedNationality] || '🌍'; // Always return a flag
  };

  // Helper function to get difficulty stars
  const getDifficultyStars = (difficulty) => {
    const level = difficulty?.toLowerCase();
    switch(level) {
      case 'easy': 
      case 'beginner':
      case '1': return '⭐';
      case 'medium': 
      case 'intermediate':
      case '2': return '⭐⭐';
      case 'hard': 
      case 'difficult':
      case 'advanced':
      case '3': return '⭐⭐⭐';
      default: return '⭐';
    }
  };


// Helper function to format cooking time
const formatCookingTime = (time) => {
  if (!time) return null;
  
  if (typeof time === 'string') {
    // Handle different string formats
    const lowerTime = time.toLowerCase();
    
    // Check for hour patterns first
    const hourMatch = lowerTime.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/);
    if (hourMatch) {
      const hours = parseFloat(hourMatch[1]);
      if (hours >= 1) {
        return hours % 1 === 0 ? `${hours}h` : `${hours}h`;
      }
    }
    
    // Check for minute patterns
    const minuteMatch = lowerTime.match(/(\d+)\s*(?:minutes?|mins?|m)/);
    if (minuteMatch) {
      const minutes = parseInt(minuteMatch[1]);
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
      }
      return `${minutes}m`;
    }
    
    // Check for combined format like "1h 30m" or "1 hour 30 minutes"
    const combinedMatch = lowerTime.match(/(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)/);
    if (combinedMatch) {
      const hours = parseInt(combinedMatch[1]);
      const minutes = parseInt(combinedMatch[2]);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    
    // Fallback: extract just numbers and assume minutes if under 10, hours if over
    const numberMatch = time.match(/\d+/);
    if (numberMatch) {
      const num = parseInt(numberMatch[0]);
      if (num >= 60) {
        const hours = Math.floor(num / 60);
        const remainingMins = num % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
      }
      return `${num}m`;
    }
  }
  
  // Handle numeric values (assume minutes)
  if (typeof time === 'number') {
    if (time >= 60) {
      const hours = Math.floor(time / 60);
      const remainingMins = time % 60;
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }
    return `${time}m`;
  }
  
  return null;
};

  // Helper function to get recipe metadata with actual database fields
  const getRecipeMetadata = (recipe) => {
    // Check multiple possible field names for nationality/cuisine
    const nationality = recipe.nationality || recipe.cuisine_type || recipe.cuisineType || null;
    const cookingTime = recipe.cooking_time || recipe.cookingTime || null;
    const difficulty = recipe.difficulty || null;
    
    return {
      nationality,
      cookingTime,
      difficulty
    };
  };

  return (
    <div className="bg-gunmetal-500/0">
      <div className="">
        {/* Alerts */}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            role="alert"
            className={`alert alert-warning fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center gap-2 p-4 text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg transition-opacity duration-500 ${
              alert.visible ? "opacity-80" : "opacity-0"
            }`}
          >
            <span>{alert.message}</span>
          </div>
        ))}

        {/* Searchbar */}
        <form className="max-w-md mx-auto pt-10">
          <label
            htmlFor="default-search"
            className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
          >
            Search
          </label>
          <div className="relative flex items-center">
            <input
              type="search"
              id="default-search"
              value={searchInput}
              autoComplete="off"
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full p-4 ps-5 placeholder-office-green-600 text-sm text-spring-green-500 border-2 border-office-green-500 rounded-full bg-gray-50/0 focus:ring-emerald-500 focus:border-spring-green-500 [&::-webkit-search-cancel-button]:appearance-none"
              placeholder="Search Ingredients..."
            />
            <button
              type="button"
              onClick={handleStorageSearch}
              className="ml-2 px-3 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-xs absolute right-2 top-1/2 -translate-y-1/2"
              style={{ fontSize: "0.85rem" }}
              title="Search recipes with your storage"
            >
              My Storage
            </button>
          </div>
        </form>

        {/* Diet Filter Toggle */}
        {userDietaryPreference && (
          <div className="max-w-md mx-auto mt-4 flex items-center justify-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useDietFilter}
                onChange={(e) => handleDietFilterToggle(e.target.checked)}
                disabled={dietFilterDebounce}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-spring-green-500">
                Filter by my diet preferences
              </span>
            </label>
          </div>
        )}

        {/* Ingredient Tiles */}
        <div className="p-5">
          <div className="max-w-4xl mx-auto w-full">
            <div className="min-h-[320px] rounded-lg p-4">
              {isLoadingIngredients || dietFilterDebounce ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
              ) : filteredIngredients.length === 0 && showNoIngredientsMessage ? (
                <div className="text-center text-gray-500">No ingredients found.</div>
              ) : (
                <motion.div
                  key={`ingredient-grid-${useDietFilter ? 'diet' : 'default'}`}
                  layout
                  className="grid grid-cols-5 gap-4 justify-items-center"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <AnimatePresence mode="wait">
                    {filteredIngredients.map((ingredient, index) => (
                      <motion.div
                        key={`${ingredient}-${useDietFilter ? 'diet' : 'default'}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1, 
                          y: 0,
                          transition: { 
                            delay: index * 0.05, 
                            duration: 0.3, 
                            ease: "easeInOut" 
                          }
                        }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        onClick={() => toggleIngredient(ingredient)}
                        className={`flex items-center justify-center px-4 py-3 border-2 rounded-3xl text-center cursor-pointer min-w-[140px] max-w-[140px] h-[50px] text-sm font-medium ${
                          selectedIngredients.includes(ingredient)
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : selectedAllergens.includes(ingredient)
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-gunmetal-400 text-white border-office-green-500 hover:bg-emerald-500/20"
                        }`}
                      >
                        {ingredient}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Allergies Section */}
        {selectedAllergens.length > 0 && (
          <div className="p-5 pt-0">
            <div className="max-w-4xl mx-auto w-full">
              <h3 className="text-lg font-semibold text-red-400 mb-3 text-center">
                Selected Allergies ({selectedAllergens.length})
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedAllergens.map((allergen) => (
                  <div
                    key={allergen}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-sm border-2 border-red-500 flex items-center gap-2"
                  >
                    {allergen}
                    <button
                      onClick={() => toggleIngredient(allergen)}
                      className="hover:bg-red-600 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Button */}
        <div className="flex justify-center mt-4 px-5 mb-6">
          <div className="w-full max-w-md flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-6 py-3 rounded-full border-2 border-spring-green-400 bg-gunmetal-400 text-spring-green-400 font-bold hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-lg hover:shadow-emerald-500/20"
            >
              Search Recipes
            </button>
            <button
              onClick={() => setShowShoppingList(true)}
              className="px-4 py-3 rounded-full border-2 border-blue-400 bg-gunmetal-400 text-blue-400 font-bold hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 relative"
            >
              🛒
              {shoppingList.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {shoppingList.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recipe Tiles */}
      <div className="p-5 pb-100">
        {loading ? (
          <div className="flex justify-center items-center">
            <span className="loading loading-dots loading-xl"></span>
          </div>
        ) : recipes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {recipes.slice(0, 3).map((recipe, idx) => {
                const missingIngredients = getMissingIngredients(recipe);
                const hasAllIngredients = missingIngredients.length === 0;
                const metadata = getRecipeMetadata(recipe);
                
                return (
                  <SpotlightCard
                    key={recipe.id ? `${recipe.id}-${idx}` : idx}
                    className="custom-spotlight-card"
                    spotlightColor="rgba(0, 229, 255, 0.2)"
                  >
                    <div className="bg-gunmetal-300 border-2 border-office-green-500 rounded-lg p-4 h-80 flex flex-col">
                      <div className="flex-1 flex flex-col">
                        {/* Header with title and status */}
                        <div className="flex justify-between items-start mb-3">
                          <h3 
                            className="text-lg font-bold text-spring-green-400 cursor-pointer hover:text-emerald-400 transition-colors flex-1 line-clamp-2 min-h-[3.5rem]"
                            onClick={() => openModal(recipe)}
                          >
                            {recipe.name}
                          </h3>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            {hasAllIngredients ? (
                              <span className="text-green-400 text-xs font-medium bg-green-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                                ✓ Ready
                              </span>
                            ) : (
                              <span className="text-orange-400 text-xs font-medium bg-orange-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                                {missingIngredients.length} missing
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Recipe Metadata Row - Always show nationality if it exists */}
                        <div className="flex items-center gap-2 mb-3 text-sm flex-wrap min-h-[2rem]">
                          {/* Nationality - show if exists or if we want to debug */}
                          {metadata.nationality && (
                            <div 
                              className="flex items-center gap-1 bg-gunmetal-400/50 px-2 py-1 rounded-full cursor-help hover:bg-gunmetal-400/70 transition-colors"
                              title={`Cuisine: ${metadata.nationality}`}
                            >
                              <span className="text-lg">{getCountryFlag(metadata.nationality)}</span>
                              <span className="text-gray-300 text-xs capitalize">{metadata.nationality}</span>
                            </div>
                          )}
                          
                          {/* Cooking Time - only show if exists */}
                          {metadata.cookingTime && (
                            <div 
                              className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded-full"
                              title={`Cooking time: ${formatCookingTime(metadata.cookingTime)}`}
                            >
                              <span className="text-sm">🕐</span>
                              <span className="text-blue-300 text-xs">{formatCookingTime(metadata.cookingTime)}</span>
                            </div>
                          )}
                          
                          {/* Difficulty - only show if exists */}
                          {metadata.difficulty && (
                            <div 
                              className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full cursor-help hover:bg-yellow-500/30 transition-colors"
                              title={`Difficulty: ${metadata.difficulty}`}
                            >
                              <span className="text-yellow-400">{getDifficultyStars(metadata.difficulty)}</span>
                              <span className="text-yellow-300 text-xs capitalize">{metadata.difficulty}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Ingredients */}
                        <p className="text-white mb-3 text-sm line-clamp-2 flex-shrink-0">
                          <span className="font-medium">Ingredients:</span> {recipe.ingredients?.map((ingredient) => ingredient.name).join(", ") || "No ingredients listed"}
                        </p>

                        {/* Missing Ingredients Display */}
                        <div className="flex-1 min-h-[4rem]">
                          {!hasAllIngredients && missingIngredients.length > 0 && (
                            <div className="p-2 bg-gunmetal-400/50 rounded-lg">
                              <h4 className="text-orange-400 text-xs font-medium mb-1">Missing:</h4>
                              <div className="flex items-center gap-1 overflow-hidden">
                                {missingIngredients.slice(0, 2).map((ingredient, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs border border-red-500/30 whitespace-nowrap flex-shrink-0"
                                  >
                                    {ingredient}
                                  </span>
                                ))}
                                {missingIngredients.length > 2 && (
                                  <span className="text-gray-400 text-xs px-2 py-1 flex-shrink-0">
                                    +{missingIngredients.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons - Always at bottom */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gunmetal-400/30">
                        <button
                          onClick={() => openModal(recipe)}
                          className="flex-1 px-3 py-2 rounded-full border-2 border-spring-green-400 bg-gunmetal-400 text-spring-green-400 text-sm font-medium hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300"
                        >
                          View Recipe
                        </button>
                        {!hasAllIngredients && (
                          <button
                            onClick={() => addMissingIngredientsToShoppingList(recipe)}
                            disabled={isAddingToShoppingList}
                            className="px-3 py-2 rounded-full border-2 border-blue-400 bg-gunmetal-400 text-blue-400 text-sm font-medium hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors disabled:opacity-50"
                            title="Add missing ingredients to shopping list"
                          >
                            🛒
                          </button>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
            
            {/* Show All Recipes Button */}
            {recipes.length > 3 && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowAllRecipes(true)}
                  className="px-6 py-3 rounded-full border-2 border-spring-green-400 bg-gunmetal-400 text-spring-green-400 font-bold hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-lg hover:shadow-emerald-500/20"
                >
                  Show All {recipes.length} Recipes
                </button>
              </div>
            )}
          </>
        ) : hasSearched ? (
          <p className="text-white text-center">
            No recipes found. Try selecting different ingredients.
          </p>
        ) : null}
      </div>

      {/* Recipe Modal */}
      {isModalOpen && selectedRecipe && (
        <div
          className="fixed inset-0 bg-gunmetal-500/80 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <SpotlightCard>
            <div
              className="bg-gunmetal-300 rounded-lg shadow-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-spring-green-400 mb-3">
                    {selectedRecipe.name}
                  </h2>
                  
                  {/* Recipe Info in Modal */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {(() => {
                      const metadata = getRecipeMetadata(selectedRecipe);
                      return (
                        <>
                          {/* Nationality */}
                          {metadata.nationality && (
                            <div 
                              className="flex items-center gap-2 bg-gunmetal-400/50 px-3 py-2 rounded-full cursor-help hover:bg-gunmetal-400/70 transition-colors"
                              title={`Cuisine: ${metadata.nationality}`}
                            >
                              <span className="text-xl">{getCountryFlag(metadata.nationality)}</span>
                              <span className="text-gray-300 text-sm capitalize font-medium">{metadata.nationality}</span>
                            </div>
                          )}
                          
                          {/* Cooking Time */}
                          {metadata.cookingTime && (
                            <div 
                              className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-full"
                              title={`Cooking time: ${formatCookingTime(metadata.cookingTime)}`}
                            >
                              <span className="text-lg">🕐</span>
                              <span className="text-blue-300 text-sm font-medium">{formatCookingTime(metadata.cookingTime)}</span>
                            </div>
                          )}
                          
                          {/* Difficulty */}
                          {metadata.difficulty && (
                            <div 
                              className="flex items-center gap-2 bg-yellow-500/20 px-3 py-2 rounded-full cursor-help hover:bg-yellow-500/30 transition-colors"
                              title={`Difficulty Level: ${metadata.difficulty}`}
                            >
                              <span className="text-yellow-400 text-lg">{getDifficultyStars(metadata.difficulty)}</span>
                              <span className="text-yellow-300 text-sm capitalize font-medium">{metadata.difficulty}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">

                <div className="bg-gunmetal-400/50 rounded-lg p-4">
                  <h3 className="text-spring-green-400 font-medium mb-2">Ingredients</h3>
                  <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-office-green-500 scrollbar-track-gunmetal-400">
                    <ul className="list-disc list-inside">
                      {selectedRecipe.description
                        ? selectedRecipe.description
                            .replace(/[\[\]"]+/g, "")
                            .split(",")
                            .map((ing, idx) => <li key={idx}>{ing.trim()}</li>)
                        : <li>No ingredients listed.</li>}
                    </ul>
                  </div>
                </div>

                <div className="bg-gunmetal-400/50 rounded-lg p-4">
                  <h3 className="text-spring-green-400 font-medium mb-2">Steps</h3>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-office-green-500 scrollbar-track-gunmetal-400">
                    <div className="whitespace-pre-line">
                      {selectedRecipe.steps
                        ? selectedRecipe.steps
                            .split(/;\s*|\n/)
                            .filter((line) => line.trim() !== "")
                            .map((line, idx) => <div key={idx}>{line.trim()}</div>)
                        : "No description available."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => addMissingIngredientsToShoppingList(selectedRecipe)}
                  disabled={isAddingToShoppingList}
                  className="px-4 py-2 rounded-full border-2 border-blue-400 bg-gunmetal-400 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors disabled:opacity-50"
                >
                  {isAddingToShoppingList ? 'Adding...' : 'Add to Shopping List'}
                </button>
                <button
                  onClick={() => setShowAddMealModal(true)}
                  className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
                >
                  Add Recipe
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Show missing ingredients */}
              {selectedRecipe && (
                <div className="mt-4 p-3 bg-gunmetal-400/30 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">Missing Ingredients:</h4>
                  {getMissingIngredients(selectedRecipe).length === 0 ? (
                    <p className="text-green-400 text-sm">✓ You have all ingredients!</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {getMissingIngredients(selectedRecipe).map((ingredient, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm border border-red-500/30"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </SpotlightCard>
        </div>
      )}

      {/* Add Meal Modal */}
      {showAddMealModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setShowAddMealModal(false)}
        >
          <div
            className="bg-gunmetal-300 rounded-lg shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-spring-green-400 mb-4">
              Add Recipe to Calendar
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-spring-green-400 text-sm font-bold mb-2">
                  Select Date
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white"
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              <div>
                <label className="block text-spring-green-400 text-sm font-bold mb-2">
                  Select Meal Type
                </label>
                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value)}
                  className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowAddMealModal(false)}
                className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMeal}
                disabled={isAddingMeal}
                className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors disabled:opacity-50"
              >
                {isAddingMeal ? 'Adding...' : 'Add to Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show All Recipes Modal */}
      {showAllRecipes && (
        <div
          className="fixed inset-0 bg-gunmetal-500/80 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setShowAllRecipes(false)}
        >
          <div
            className="bg-gunmetal-300 rounded-lg shadow-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-spring-green-400">
                All Recipes ({recipes.length})
              </h2>
              <button
                onClick={() => setShowAllRecipes(false)}
                className="text-white hover:text-spring-green-400 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe, idx) => {
                const missingIngredients = getMissingIngredients(recipe);
                const hasAllIngredients = missingIngredients.length === 0;
                const metadata = getRecipeMetadata(recipe);
                
                return (
                  <SpotlightCard
                    key={recipe.id ? `${recipe.id}-${idx}` : idx}
                    className="custom-spotlight-card"
                    spotlightColor="rgba(0, 229, 255, 0.2)"
                  >
                    <div className="bg-gunmetal-400 border-2 border-office-green-500 rounded-lg p-4 h-80 flex flex-col cursor-pointer hover:bg-emerald-500/20 transition-colors">
                      <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                          <h3 
                            className="text-lg font-bold text-spring-green-400 flex-1 line-clamp-2 min-h-[3.5rem]"
                            onClick={() => {
                              setShowAllRecipes(false);
                              openModal(recipe);
                            }}
                          >
                            {recipe.name}
                          </h3>
                          <div className="ml-2 flex-shrink-0">
                            {hasAllIngredients ? (
                              <span className="text-green-400 text-xs font-medium bg-green-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                                ✓
                              </span>
                            ) : (
                              <span className="text-orange-400 text-xs font-medium bg-orange-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                                {missingIngredients.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Recipe Metadata Row */}
                        <div className="flex items-center gap-2 mb-3 text-xs flex-wrap min-h-[2rem]">
                          {/* Nationality */}
                          {metadata.nationality && (
                            <div 
                              className="flex items-center gap-1 bg-gunmetal-500/50 px-2 py-1 rounded-full cursor-help hover:bg-gunmetal-500/70 transition-colors"
                              title={`Cuisine: ${metadata.nationality}`}
                            >
                              <span className="text-sm">{getCountryFlag(metadata.nationality)}</span>
                              <span className="text-gray-300 text-xs capitalize">{metadata.nationality}</span>
                            </div>
                          )}
                          
                          {/* Cooking Time */}
                          {metadata.cookingTime && (
                            <div 
                              className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded-full"
                              title={`Cooking time: ${formatCookingTime(metadata.cookingTime)}`}
                            >
                              <span className="text-sm">🕐</span>
                              <span className="text-blue-300 text-xs">{formatCookingTime(metadata.cookingTime)}</span>
                            </div>
                          )}
                          
                          {/* Difficulty */}
                          {metadata.difficulty && (
                            <div 
                              className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full cursor-help hover:bg-yellow-500/30 transition-colors"
                              title={`Difficulty: ${metadata.difficulty}`}
                            >
                              <span className="text-yellow-400 text-sm">{getDifficultyStars(metadata.difficulty)}</span>
                              <span className="text-yellow-300 text-xs capitalize">{metadata.difficulty}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Ingredients */}
                        <p className="text-white text-sm line-clamp-2 mb-3">
                          <span className="font-medium">Ingredients:</span> {recipe.ingredients?.map((ingredient) => ingredient.name).join(", ") || "No ingredients listed"}
                        </p>

                        {/* Missing Ingredients */}
                        <div className="flex-1 min-h-[3rem]">
                          {!hasAllIngredients && missingIngredients.length > 0 && (
                            <div className="p-2 bg-gunmetal-500/50 rounded-lg">
                              <h4 className="text-orange-400 text-xs font-medium mb-1">Missing:</h4>
                              <div className="flex items-center gap-1 overflow-hidden">
                                {missingIngredients.slice(0, 2).map((ingredient, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs border border-red-500/30 whitespace-nowrap flex-shrink-0"
                                  >
                                    {ingredient}
                                  </span>
                                ))}
                                {missingIngredients.length > 2 && (
                                  <span className="text-gray-400 text-xs px-2 py-1 flex-shrink-0">
                                    +{missingIngredients.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gunmetal-500/30">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAllRecipes(false);
                            openModal(recipe);
                          }}
                          className="flex-1 px-3 py-2 rounded-full border-2 border-spring-green-400 bg-gunmetal-500 text-spring-green-400 text-xs font-medium hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300"
                        >
                          View
                        </button>
                        {!hasAllIngredients && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addMissingIngredientsToShoppingList(recipe);
                            }}
                            disabled={isAddingToShoppingList}
                            className="px-3 py-2 rounded-full border-2 border-blue-400 bg-gunmetal-500 text-blue-400 text-xs font-medium hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors disabled:opacity-50"
                            title="Add missing ingredients to shopping list"
                          >
                            🛒
                          </button>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingList && (
        <div
          className="fixed inset-0 bg-gunmetal-500/80 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setShowShoppingList(false)}
        >
          <SpotlightCard>
            <div
              className="bg-gunmetal-300 rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-400">
                  Shopping List ({shoppingList.length})
                </h2>
                <button
                  onClick={() => setShowShoppingList(false)}
                  className="text-white hover:text-blue-400 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {shoppingList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Your shopping list is empty</p>
                  <p className="text-sm text-gray-500">Add ingredients from recipes to get started!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {shoppingList.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                          item.completed 
                            ? 'bg-green-500/20 border-green-500/30' 
                            : 'bg-gunmetal-400/50 border-office-green-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleShoppingListItem(item.id)}
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium truncate ${item.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">From: {item.recipe}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromShoppingList(item.id)}
                          className="text-red-400 hover:text-red-300 font-bold text-lg ml-2 flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={clearCompletedItems}
                      disabled={!shoppingList.some(item => item.completed)}
                      className="px-4 py-2 rounded-full border-2 border-green-400 bg-gunmetal-400 text-green-400 hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors disabled:opacity-50"
                    >
                      Clear Completed
                    </button>
                    <button
                      onClick={clearShoppingList}
                      className="px-4 py-2 rounded-full border-2 border-red-400 bg-gunmetal-400 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </>
              )}
            </div>
          </SpotlightCard>
        </div>
      )}
    </div>
  )
}

export default Searchbar