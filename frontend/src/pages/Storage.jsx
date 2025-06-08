import { useState, useEffect } from "react"
import api from "../api"
import SpotlightCard from "../components/SpotlightCard"

function Storage() {
  const [myIngredients, setMyIngredients] = useState([])
  const [searchInput, setSearchInput] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [alerts, setAlerts] = useState([])

  // Fetch user's storage ingredients
  const fetchMyIngredients = async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/ingredients/")
      setMyIngredients(res.data)
    } catch (err) {
      addAlert("Failed to load your storage.")
    } finally {
      setLoading(false)
    }
  }

  // Search global ingredients
  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([])
      return
    }
    const fetch = setTimeout(async () => {
      try {
        const res = await api.get(`/api/ingredient-all-data/?search=${searchInput}`)
        setSearchResults(res.data.map(i => i.name))
      } catch {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(fetch)
  }, [searchInput])

  useEffect(() => {
    fetchMyIngredients()
  }, [])

  // Add ingredient to storage
  const handleAdd = async (name) => {
    setAdding(true)
    try {
      await api.post("/api/ingredients/add_from_global/", { name })
      addAlert(`Added "${name}" to your storage!`)
      fetchMyIngredients()
      setSearchInput("")
      setSearchResults([])
    } catch {
      addAlert("Failed to add ingredient.")
    } finally {
      setAdding(false)
    }
  }

  // Remove ingredient from storage
  const handleRemove = async (id) => {
    try {
      await api.delete(`/api/ingredients/${id}/`)
      addAlert("Removed ingredient.")
      fetchMyIngredients()
    } catch {
      addAlert("Failed to remove ingredient.")
    }
  }

  const addAlert = (message) => {
    const id = Date.now()
    setAlerts((prev) => [...prev, { id, message, visible: true }])
    setTimeout(() => {
      setAlerts((prev) => prev.map(a => a.id === id ? { ...a, visible: false } : a))
    }, 500)
    setTimeout(() => {
      setAlerts((prev) => prev.filter(a => a.id !== id))
    }, 2500)
  }

  return (
    <div className="min-h-screen bg-gunmetal-500 flex flex-col items-center py-8">
      
      {/* Alerts */}
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`alert alert-warning fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center gap-2 p-4 text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg transition-opacity duration-500 ${
            alert.visible ? "opacity-80" : "opacity-0"
          }`}
        >
          <span>{alert.message}</span>
        </div>
      ))}

      <h1 className="text-3xl font-bold text-spring-green-400 mb-8">My Storage</h1>

      {/* Add Ingredient */}
      <div className="w-full max-w-md mb-8">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search ingredients to add..."
          className="block w-full p-4 ps-5 mb-2 placeholder-office-green-600 text-sm text-spring-green-500 border-2 border-office-green-500 rounded-full bg-gray-50/0 focus:ring-emerald-500 focus:border-spring-green-500"
        />
        {searchResults.length > 0 && (
          <div className="bg-gunmetal-400 border border-office-green-500 rounded-lg shadow-lg mt-2">
            {searchResults.map(name => (
              <div
                key={name}
                className="px-4 py-2 cursor-pointer hover:bg-emerald-500/20 text-white"
                onClick={() => handleAdd(name)}
              >
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage List */}
      <div className="w-full max-w-3xl">
        {loading ? (
          <div className="flex justify-center items-center">
            <span className="loading loading-dots loading-xl"></span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {myIngredients.map(ingredient => (
              <SpotlightCard key={ingredient.id} className="w-full">
                <div className="flex items-center justify-between p-4">
                  <span className="text-lg text-spring-green-400 font-semibold">{ingredient.name}</span>
                  <button
                    onClick={() => handleRemove(ingredient.id)}
                    className="px-3 py-1 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </SpotlightCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Storage