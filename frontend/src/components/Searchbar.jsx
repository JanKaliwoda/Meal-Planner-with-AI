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
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const recipesPerPage = 4

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

  const filteredIngredients = allIngredients.filter((ingredient) =>
    ingredient.toLowerCase().includes(searchInput.toLowerCase())
  )

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((item) => item !== ingredient)
        : [...prev, ingredient]
    )
  }

  const handleSearch = async (e) => {
    setHasSearched(true)
    e.preventDefault()
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
              autoComplete="false"
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full p-4 ps-5 placeholder-office-green-600 text-sm text-spring-green-500 border-2 border-office-green-500 rounded-full bg-gray-50/0 focus:ring-emerald-500 focus:border-spring-green-500 [&::-webkit-search-cancel-button]:appearance-none"
              placeholder="Search Ingredients..."
            />
          </div>
        </form>

        {/* Ingredient Tiles */}
        <div className="p-5">
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
              {paginatedRecipes.map((recipe) => (
                <SpotlightCard
                  key={recipe.id}
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
                      {recipe.ingredients
                        .map((ingredient) => ingredient.name)
                        .join(", ")}
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
                <span className="text-spring-green-400 font-bold">
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
          <p className="text-spring-green-400 text-center">
            No recipes found. Try selecting different ingredients.
          </p>
        ) : null}
      </div>

      {/* Recipe Modal */}
      {isModalOpen && selectedRecipe && (
        <div
          className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300"
          onClick={closeModal}
          style={{ animation: isModalOpen ? "fadeIn 0.3s" : "fadeOut 0.3s" }}
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
    </div>
  )
}
export default Searchbar