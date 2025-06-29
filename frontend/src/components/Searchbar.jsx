import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ACCESS_TOKEN } from "../constants"
import api from "../api"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import "../assets/layered-waves-haikei.svg"
import SpotlightCard from "./SpotlightCard"

function Searchbar() {
  const [searchInput, setSearchInput] = useState("")
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [dynamicIngredients, setDynamicIngredients] = useState([])
  const [filteredIngredients, setFilteredIngredients] = useState([])
  const [showNoIngredientsMessage, setShowNoIngredientsMessage] = useState(false)
  const [showAddMealModal, setShowAddMealModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isAddingMeal, setIsAddingMeal] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState('dinner')
  const recipesPerPage = 4

  const staticIngredients = [
    "egg",
    "milk",
    "cheese",
    "butter",
    "flour",
    "sugar",
    "tomato",
    "onion",
    "chicken",
    "beef",
    "pasta",
    "rice",
    "carrot",
    "potato",
    "garlic",
  ]

  // Fetch ingredients from API when searchInput changes
  useEffect(() => {
    const fetchIngredients = async () => {
      if (searchInput.trim() === "") {
        setDynamicIngredients([])
        return
      }
      try {
        // Get 100 ingredients from API
        const response = await api.get(`/api/ingredient-all-data/?search=${searchInput}&limit=100`)
        
        if (response.data && Array.isArray(response.data)) {
          // Process ingredients: get names, filter single words, limit to 12
          const processedIngredients = response.data
            .map(item => item.name)
            .filter(name => !name.includes(' '))
            .slice(0, 12)

          setDynamicIngredients(processedIngredients)
        }
      } catch (error) {
        console.error("Error fetching ingredients:", error)
        setDynamicIngredients([])
      }
    }

    // Add debounce to prevent too many API calls
    const timeoutId = setTimeout(fetchIngredients, 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  // Determine which ingredients to display
  useEffect(() => {
    const ingredients = searchInput.trim() === "" ? staticIngredients : dynamicIngredients

    const combinedIngredients = Array.from(new Set([...selectedIngredients, ...ingredients]))

    const sortedIngredients = [...combinedIngredients].sort((a, b) => {
      const isASelected = selectedIngredients.includes(a)
      const isBSelected = selectedIngredients.includes(b)
      if (isASelected && !isBSelected) return -1
      if (!isASelected && isBSelected) return 1
      return 0
    })

    setFilteredIngredients(sortedIngredients)
  }, [searchInput, dynamicIngredients, selectedIngredients])

  // Show "No ingredients found" message after a delay if no ingredients are available
  useEffect(() => {
    if (filteredIngredients.length === 0) {
      const timeout = setTimeout(() => {
        setShowNoIngredientsMessage(true)
      }, 200)

      return () => clearTimeout(timeout)
    } else {
      setShowNoIngredientsMessage(false)
    }
  }, [filteredIngredients])

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((item) => item !== ingredient)
        : [...prev, ingredient]
    )
  }

  const handleSearch = async (e) => {
    setHasSearched(true)
    if (e) e.preventDefault()
    setCurrentPage(1)
    if (selectedIngredients.length === 0) {
      addAlert("Please select at least one ingredient!")
      return
    }

    setLoading(true)
    try {
      const response = await api.post("/api/ai-recipe-search/", {
        ingredients: selectedIngredients,
      })
      setRecipes(response.data)
    } catch (error) {
      console.error("Error fetching recipes:", error)
      alert("Failed to fetch recipes. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Search recipes by storage ingredients
  const handleStorageSearch = async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/ingredients/")
      const storageIngredients = res.data.map(i => i.name)
      if (storageIngredients.length === 0) {
        addAlert("You have no ingredients in storage!")
        setLoading(false)
        return
      }
      setSelectedIngredients(storageIngredients)
      setSearchInput("")
      setHasSearched(true)
      setCurrentPage(1)
      const response = await api.post("/api/ai-recipe-search/", {
        ingredients: storageIngredients,
      })
      setRecipes(response.data)
    } catch (error) {
      addAlert("Failed to fetch your storage ingredients.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

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

        {/* Ingredient Tiles */}
        <div className="p-5">
          <div className="max-w-4xl mx-auto w-full">
            <div className="h-66 overflow-y-auto rounded-lg p-4">
              {filteredIngredients.length === 0 && showNoIngredientsMessage ? (
                <div className="text-center text-gray-500">No ingredients found.</div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-6 gap-4"
                  transition={{ duration: 0.5 }}
                >
                  <AnimatePresence>
                    {filteredIngredients.map((ingredient) => (
                      <motion.div
                        key={ingredient}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        onClick={() => toggleIngredient(ingredient)}
                        className={`flex items-center justify-center px-6 py-2 border-2 rounded-3xl text-center cursor-pointer ${
                          selectedIngredients.includes(ingredient)
                            ? "bg-emerald-500 text-white border-emerald-500"
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

        {/* Search Button */}
        <div className="flex justify-center mt-4 px-5 mb-6">
          <button
            onClick={handleSearch}
            className="w-full max-w-md px-6 py-3 rounded-full border-2 border-spring-green-400 bg-gunmetal-400 text-spring-green-400 font-bold hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-lg hover:shadow-emerald-500/20"
          >
            Search Recipes
          </button>
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
            <div className="flex flex-wrap justify-center gap-6">
              {paginatedRecipes.slice(0, 4).map((recipe, idx) => (
                <SpotlightCard
                  key={recipe.id ? `${recipe.id}-${idx}` : idx}
                  className="custom-spotlight-card"
                  spotlightColor="rgba(0, 229, 255, 0.2)"
                >
                  <div
                    className="bg-gunmetal-300 border-2 border-office-green-500 rounded-lg p-4 w-80 h-34 flex flex-col justify-between cursor-pointer hover:bg-emerald-500/20 transition-colors"
                    onClick={() => openModal(recipe)}
                  >
                    <h3 className="text-lg font-bold text-spring-green-400 mb-2">
                      {recipe.name}
                    </h3>
                    <p className="text-white mb-4 truncate">
                      Ingredients:{" "}
                      {recipe.ingredients.map((ingredient) => ingredient.name).join(", ")}
                    </p>
                  </div>
                </SpotlightCard>
              ))}
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white font-bold transition-colors ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-emerald-500 hover:border-emerald-500"
                  }`}
                >
                  Prev
                </button>
                <span className="text-spring-white-400 font-bold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white font-bold transition-colors ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-emerald-500 hover:border-emerald-500"
                  }`}
                >
                  Next
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
                <h2 className="text-xl font-bold text-spring-green-400">
                  {selectedRecipe.name}
                </h2>
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
    </div>
  )
}

export default Searchbar