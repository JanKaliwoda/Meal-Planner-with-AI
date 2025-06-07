import React, { useState } from "react"
import api from "../api"
import ScrollVelocity from "./ScrollVelocity"

function Searchbar() {
	const [searchInput, setSearchInput] = useState("") // State for search input
	const [selectedIngredients, setSelectedIngredients] = useState([]) // State for selected ingredients
	const [recipes, setRecipes] = useState([]) // State for fetched recipes
	const [loading, setLoading] = useState(false) // Add loading state

	// Example ingredient tiles
	const allIngredients = ["egg", "milk", "cheese", "butter", "flour", "sugar"]

	// Filter ingredients based on search input
	const filteredIngredients = allIngredients.filter((ingredient) =>
		ingredient.toLowerCase().includes(searchInput.toLowerCase())
	)

	// Toggle ingredient selection
	const toggleIngredient = (ingredient) => {
		setSelectedIngredients((prev) =>
			prev.includes(ingredient)
				? prev.filter((item) => item !== ingredient)
				: [...prev, ingredient]
		)
	}

	// Handle search button click
	const handleSearch = async (e) => {
		e.preventDefault()
		if (selectedIngredients.length === 0) {
			alert("Please select at least one ingredient.")
			return
		}

		setLoading(true) // Set loading to true
		try {
			const response = await api.post("/api/ai-recipe-search/", {
				ingredients: selectedIngredients,
			})
			setRecipes(response.data) // Assuming the API returns an array of recipes
		} catch (error) {
			console.error("Error fetching recipes:", error)
			alert("Failed to fetch recipes. Please try again.")
		} finally {
			setLoading(false) // Set loading to false after fetching
		}
	}

	return (
		<div className="bg-gray-900">
			{/* Searchbar */}
			<form className="max-w-md mx-auto py-10">
				<label
					htmlFor="default-search"
					className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
				>
					Search
				</label>
				<div className="relative">
					<div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
						<svg
							className="w-4 h-4 text-gray-500 dark:text-gray-400"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 20 20"
						>
							<path
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
							/>
						</svg>
					</div>
					<input
						type="search"
						id="default-search"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)} // Update search input state
						className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						placeholder="Search Ingredients..."
					/>
				</div>
			</form>

			{/* Ingredient Tiles */}
			<div className="p-5 bg-gray-100 dark:bg-gray-900">
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
				</div>
			</div>

			{/* Search Button */}
			<div className="flex justify-center mt-4">
				<button
					onClick={handleSearch}
					className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Search
				</button>
			</div>

			{/* Recipe Tiles */}
			<div className="p-5 bg-gray-100 dark:bg-gray-800">
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
									Ingredients:{" "}
									{recipe.ingredients
										.map((ingredient) => ingredient.name)
										.join(", ")}
								</p>
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
	)
}

export default Searchbar
