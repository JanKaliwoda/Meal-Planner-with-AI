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
  const [userAllergens, setUserAllergens] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedIngredientName, setSelectedIngredientName] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  
  // Helper function to get allergen variants
  const getAllergenVariants = (allergenName) => {
    const variants = [allergenName.toLowerCase()]
    
    // Handle simple plural forms
    if (allergenName.toLowerCase().endsWith('s')) {
      // Remove 's' for singular
      const singular = allergenName.toLowerCase().slice(0, -1)
      variants.push(singular)
    } else {
      // Add 's' for plural
      const plural = allergenName.toLowerCase() + 's'
      variants.push(plural)
    }
    
    // Handle special cases
    const allergenLower = allergenName.toLowerCase()
    const specialCases = {
      'egg': ['egg', 'eggs'],
      'eggs': ['egg', 'eggs'],
      'milk': ['milk', 'dairy'],
      'dairy': ['milk', 'dairy'],
      'fish': ['fish', 'fishes'],
      'nut': ['nut', 'nuts'],
      'nuts': ['nut', 'nuts'],
      'tree nuts': ['tree nut', 'tree nuts', 'nuts', 'nut'],
      'shellfish': ['shellfish', 'seafood'],
      'seafood': ['shellfish', 'seafood'],
    }
    
    if (allergenLower in specialCases) {
      variants.push(...specialCases[allergenLower])
    }
    
    return [...new Set(variants)] // Remove duplicates
  }
  
  // Fetch user's allergens for defensive filtering
  useEffect(() => {
    const fetchAllergens = async () => {
      try {
        const res = await api.get("/api/user-profiles/");
        if (res.data.length > 0 && res.data[0].allergies) {
          const allergens = res.data[0].allergies.map(a => a.name?.toLowerCase?.() || a.name || a);
          // Get all variants for all allergens
          const allVariants = [];
          allergens.forEach(allergen => {
            allVariants.push(...getAllergenVariants(allergen));
          });
          setUserAllergens([...new Set(allVariants)]); // Remove duplicates
        }
      } catch {
        setUserAllergens([]);
      }
    };
    fetchAllergens();
  }, []);

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
        // Defensive: filter out any ingredient that matches user's allergens (including variants)
        let names = res.data.map(i => i.name)
        if (userAllergens.length > 0) {
          names = names.filter(name => {
            const nameLower = name.toLowerCase()
            return !userAllergens.some(allergen => {
              const allergenLower = allergen.toLowerCase()
              
              // Check exact match
              if (nameLower === allergenLower) return true
              
              // Check if ingredient contains allergen
              if (nameLower.includes(allergenLower)) return true
              
              // Handle plural forms
              if (allergenLower.endsWith('s')) {
                const singular = allergenLower.slice(0, -1)
                if (nameLower === singular || nameLower.includes(singular)) return true
              } else {
                const plural = allergenLower + 's'
                if (nameLower === plural || nameLower.includes(plural)) return true
              }
              
              // Handle special cases
              const specialCases = {
                'egg': ['egg', 'eggs'],
                'eggs': ['egg', 'eggs'],
                'milk': ['milk', 'dairy'],
                'dairy': ['milk', 'dairy'],
                'fish': ['fish', 'fishes'],
                'nut': ['nut', 'nuts'],
                'nuts': ['nut', 'nuts'],
                'tree nuts': ['tree nut', 'tree nuts', 'nuts', 'nut'],
                'shellfish': ['shellfish', 'seafood'],
                'seafood': ['shellfish', 'seafood'],
              }
              
              if (specialCases[allergenLower]) {
                return specialCases[allergenLower].some(variant => 
                  nameLower === variant || nameLower.includes(variant)
                )
              }
              
              return false
            })
          })
        }
        setSearchResults(names)
      } catch {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(fetch)
  }, [searchInput, userAllergens])

  useEffect(() => {
    fetchMyIngredients()
  }, [])

  // Add ingredient to storage - show modal
  const handleAdd = async (name) => {
    setSelectedIngredientName(name)
    setShowAddModal(true)
  }

  // Add ingredient with details
  const handleAddWithDetails = async () => {
    setAdding(true)
    try {
      const data = { name: selectedIngredientName, quantity }
      if (expirationDate) {
        data.expiration_date = expirationDate
      }
      if (notes.trim()) {
        data.notes = notes.trim()
      }
      
      await api.post("/api/ingredients/add_from_global/", data)
      addAlert(`Added "${selectedIngredientName}" to your storage!`)
      fetchMyIngredients()
      setSearchInput("")
      setSearchResults([])
      setShowAddModal(false)
      setExpirationDate("")
      setQuantity(1)
      setNotes("")
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

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gunmetal-300 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-spring-green-500 mb-4">
              Add "{selectedIngredientName}"
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-spring-green-400 text-sm font-bold mb-3">
                  Quantity
                </label>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-lg flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center text-2xl font-bold px-3 py-2 rounded-lg border-2 border-office-green-500 bg-gunmetal-400 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-gray-400 text-xs mt-1">units</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-spring-green-400 text-sm font-bold mb-2">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-office-green-500 bg-gunmetal-400 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-spring-green-400 text-sm font-bold mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this ingredient..."
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border-2 border-office-green-500 bg-gunmetal-400 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
                <p className="text-gray-400 text-xs mt-1">
                  e.g., "From farmer's market", "Organic", "For dinner party"
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWithDetails}
                disabled={adding}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add to Storage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage List */}
      <div className="w-full max-w-3xl">
        {loading ? (
          <div className="flex justify-center items-center">
            <span className="loading loading-dots loading-xl"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myIngredients.map(ingredient => (
              <SpotlightCard key={ingredient.id} className="w-full">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg text-spring-green-400 font-semibold">
                      {ingredient.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">Qty:</span>
                      <div className="bg-emerald-500 text-white px-2 py-1 rounded-full text-sm font-bold min-w-[2rem] text-center">
                        {ingredient.quantity || 1}
                      </div>
                    </div>
                  </div>
                  
                  {ingredient.expiration_date && (
                    <div className="text-xs p-2 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 mb-2">
                      Expires: {new Date(ingredient.expiration_date).toLocaleDateString()}
                    </div>
                  )}

                  {ingredient.notes && (
                    <div className="text-xs p-2 rounded border border-gray-500/30 bg-gray-500/10 text-gray-300 mb-2">
                      <span className="font-semibold">Notes:</span> {ingredient.notes}
                    </div>
                  )}

                  <button
                    onClick={() => handleRemove(ingredient.id)}
                    className="w-full px-3 py-1 rounded-lg border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-sm"
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