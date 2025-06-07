<<<<<<< Updated upstream
{
  /* <script src="frontend\node_modules\flowbite\dist\flowbite.min.js"></script> */
}
import React from "react"
import { useState } from "react"
import api from "../api" // Adjust the import path as necessary
import "../assets/layered-waves-haikei.svg" // Ensure this path is correct
import ScrollVelocity from "./ScrollVelocity"

function Searchbar() {
  const [searchInput, setSearchInput] = useState("") // State for search input
  const [selectedIngredients, setSelectedIngredients] = useState([]) // State for selected ingredients
  const [recipes, setRecipes] = useState([]) // State for fetched recipes
  const [loading, setLoading] = useState(false) // Add loading state

  // Example ingredient tiles
  const allIngredients = ["egg", "milk", "cheese", "butter", "flour", "sugar"]

  // Filter ingredients based on search input
=======
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import api from "../api"
import "../assets/layered-waves-haikei.svg"
import SpotlightCard from "./SpotlightCard"

function Searchbar() {
  const [searchInput, setSearchInput] = useState("")
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null) // State for selected recipe
  const [isModalOpen, setIsModalOpen] = useState(false) // State for modal visibility
  const [hasSearched, setHasSearched] = useState(false)

  const allIngredients = [
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
  ]

>>>>>>> Stashed changes
  const filteredIngredients = allIngredients.filter((ingredient) =>
    ingredient.toLowerCase().includes(searchInput.toLowerCase())
  )

<<<<<<< Updated upstream
  // Toggle ingredient selection
=======
>>>>>>> Stashed changes
  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((item) => item !== ingredient)
        : [...prev, ingredient]
    )
  }

<<<<<<< Updated upstream
  // Handle search button click
  const handleSearch = async (e) => {
    e.preventDefault()
    if (selectedIngredients.length === 0) {
      alert("Please select at least one ingredient.")
      return
    }

    setLoading(true) // Set loading to true
=======
  const handleSearch = async (e) => {
    setHasSearched(true)
    e.preventDefault()
    if (selectedIngredients.length === 0) {
      addAlert("Please select at least one ingredient!")
      return
    }

    setLoading(true)
>>>>>>> Stashed changes
    try {
      const response = await api.post("/api/ai-recipe-search/", {
        ingredients: selectedIngredients,
      })
<<<<<<< Updated upstream
      setRecipes(response.data) // Assuming the API returns an array of recipes
=======
      setRecipes(response.data)
>>>>>>> Stashed changes
    } catch (error) {
      console.error("Error fetching recipes:", error)
      alert("Failed to fetch recipes. Please try again.")
    } finally {
<<<<<<< Updated upstream
      setLoading(false) // Set loading to false after fetching
    }
  }

  return (
    <div className="bg-gunmetal-500/0">
      <div className="">
=======
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

>>>>>>> Stashed changes
        {/* Searchbar */}
        <form className="max-w-md mx-auto py-10">
          <label
            htmlFor="default-search"
            className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
          >
            Search
          </label>
          <div className="relative">
            <input
              type="search"
              id="default-search"
              value={searchInput}
<<<<<<< Updated upstream
              onChange={(e) => setSearchInput(e.target.value)} // Update search input state
              autoComplete="off"
              className="block w-full p-4 ps-5 placeholder-office-green-600 text-sm text-spring-green-500 border-2 border-office-green-500 rounded-full bg-gray-50/0 focus:ring-emerald-500 focus:border-spring-green-500 [&::-webkit-search-cancel-button]:appearance-none"
              placeholder="Search Ingredients..."
            />
            <button
              type="submit"
              class="absolute end-3 top-1/2 -translate-y-1/2 p-2 hover:bg-emerald-500 rounded-full"
            >
              {" "}
              <svg
                class="w-4 h-4 text-office-green-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </button>
=======
              autoComplete="false"
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full p-4 ps-5 placeholder-office-green-600 text-sm text-spring-green-500 border-2 border-office-green-500 rounded-full bg-gray-50/0 focus:ring-emerald-500 focus:border-spring-green-500 [&::-webkit-search-cancel-button]:appearance-none"
              placeholder="Search Ingredients..."
            />
>>>>>>> Stashed changes
          </div>
        </form>

        {/* Ingredient Tiles */}
        <div className="p-5">
<<<<<<< Updated upstream
          <div className="flex flex-wrap justify-center gap-4">
            {filteredIngredients.map((ingredient) => (
              <div
                key={ingredient}
                onClick={() => toggleIngredient(ingredient)}
                className={`px-6 py-2 border-2 rounded-3xl text-center cursor-pointer ${
                  selectedIngredients.includes(ingredient)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-500 dark:border-gray-600"
                }`}
              >
                {ingredient}
              </div>
            ))}
=======
          <div className="max-w-4xl mx-auto w-full">
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
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
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
>>>>>>> Stashed changes
          </div>
        </div>

        {/* Search Button */}
<<<<<<< Updated upstream
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSearch}
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Search
          </button>
        </div>

        {/* Recipe Tiles */}
        <div className="p-5 pb-100">
          {loading ? (
            <div className="flex justify-center items-center">
              <span className="loading loading-dots loading-xl"></span>
            </div>
          ) : recipes.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-md p-4 dark:bg-gray-800 dark:border-gray-700 max-w-xs"
                >
                  {/* <ScrollVelocity
									texts={[recipe.name]}
									velocity={-40}
									className="custom-scroll-text text-2xl"
								/> */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {recipe.name}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-400 mb-4 truncate">
=======
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
          <div className="flex flex-wrap justify-center gap-6">
            {recipes.map((recipe) => (
              <SpotlightCard
                key={recipe.id}
                className="custom-spotlight-card"
                spotlightColor="rgba(0, 229, 255, 0.2)"
              >
                <div
                  className="bg-gunmetal-300 border-2 border-office-green-500 rounded-lg p-4 max-w-xs cursor-pointer hover:bg-emerald-500/20 transition-colors"
                  onClick={() => openModal(recipe)}
                >
                  <h3 className="text-lg font-bold text-spring-green-400 mb-2">
                    {recipe.name}
                  </h3>
                  <p className="text-white mb-4 truncate">
>>>>>>> Stashed changes
                    Ingredients:{" "}
                    {recipe.ingredients
                      .map((ingredient) => ingredient.name)
                      .join(", ")}
                  </p>
<<<<<<< Updated upstream
                  <button
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={() => alert(`Opening recipe: ${recipe.name}`)}
                  >
                    View Recipe
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300 text-center">
              No recipes found. Try selecting different ingredients.
            </p>
          )}
        </div>
      </div>
=======
                </div>
              </SpotlightCard>
            ))}
          </div>
        ) : hasSearched ? (
          <p className="text-spring-green-400 text-center">
            No recipes found. Try selecting different ingredients.
          </p>
        ) : null}
      </div>

      {/* Recipe Modal */}
      {isModalOpen && selectedRecipe && (
        <div
          className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300"
          onClick={closeModal} // Close modal when clicking outside
          style={{ animation: isModalOpen ? "fadeIn 0.3s" : "fadeOut 0.3s" }} // Fade effect
        >
          <SpotlightCard>
            <div
              className="bg-gunmetal-300 rounded-lg shadow-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-spring-green-400 mb-4">
                {selectedRecipe.name}
              </h2>
              <p className="text-white mb-4">
                <strong className="text-spring-green-400">Ingredients:</strong>{" "}
                {selectedRecipe.ingredients
                  .map((ingredient) => ingredient.name)
                  .join(", ")}
              </p>
              <p className="text-white mb-4">
                <strong className="text-spring-green-400">Description:</strong>{" "}
                {selectedRecipe.description || "No description available."}
              </p>
              <div className="flex justify-end">
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
>>>>>>> Stashed changes
    </div>
  )
}

export default Searchbar
