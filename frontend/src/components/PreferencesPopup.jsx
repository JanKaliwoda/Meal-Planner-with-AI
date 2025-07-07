import { useState, useEffect } from "react"
import api from "../api"

function PreferencesPopup({ isOpen, onClose, onComplete }) {
  const [availableDietaryPreferences, setAvailableDietaryPreferences] = useState([])
  const [availableAllergies, setAvailableAllergies] = useState([])
  const [selectedDietaryPreferences, setSelectedDietaryPreferences] = useState([])
  const [selectedAllergies, setSelectedAllergies] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: preferences, 2: allergies

  useEffect(() => {
    if (isOpen) {
      // Fetch dietary preferences and allergies when popup opens
      Promise.all([
        api.get("/api/dietary-preferences/"),
        api.get("/api/allergies/")
      ]).then(([prefsRes, allergiesRes]) => {
        setAvailableDietaryPreferences(prefsRes.data)
        setAvailableAllergies(allergiesRes.data)
      }).catch(err => {
        console.error("Failed to load preferences/allergies", err)
      })
    }
  }, [isOpen])

  const toggleDietaryPreference = (prefId) => {
    setSelectedDietaryPreferences(prev => 
      prev.includes(prefId) 
        ? prev.filter(id => id !== prefId)
        : [...prev, prefId]
    )
  }

  const toggleAllergy = (allergyId) => {
    setSelectedAllergies(prev => 
      prev.includes(allergyId) 
        ? prev.filter(id => id !== allergyId)
        : [...prev, allergyId]
    )
  }

  const handleNext = () => {
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      // Get or create user profile
      let userProfileId
      try {
        const userProfiles = await api.get("/api/user-profiles/")
        if (userProfiles.data.length > 0) {
          userProfileId = userProfiles.data[0].id
        } else {
          // Create a new user profile
          const newProfile = await api.post("/api/user-profiles/", {
            dietary_preferences: [],
            allergies: []
          })
          userProfileId = newProfile.data.id
        }
      } catch (error) {
        console.error("Error with user profile:", error)
        // Try to create a new profile
        const newProfile = await api.post("/api/user-profiles/", {
          dietary_preferences: [],
          allergies: []
        })
        userProfileId = newProfile.data.id
      }

      // Update user profile with selected preferences and allergies
      await api.patch(`/api/user-profiles/${userProfileId}/`, {
        dietary_preferences: selectedDietaryPreferences,
        allergies: selectedAllergies,
      })

      onComplete()
    } catch (error) {
      console.error("Failed to save preferences", error)
      alert("Failed to save preferences. You can set them later in your account settings.")
      onComplete() // Continue anyway
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (step === 1) {
      // Skip dietary preferences, go to allergies step
      setStep(2)
    } else {
      // Skip allergies, complete the popup
      onComplete()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gunmetal-300 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-spring-green-500 mb-2">
              Welcome! Let's Personalize Your Experience
            </h2>
            <p className="text-gray-300 text-sm">
              Help us recommend the perfect meals for you by setting your preferences
            </p>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-2">
                <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-spring-green-500' : 'bg-gray-500'}`}></div>
                <div className={`w-3 h-3 rounded-full ${step === 2 ? 'bg-spring-green-500' : 'bg-gray-500'}`}></div>
              </div>
            </div>
          </div>

          {/* Step 1: Dietary Preferences */}
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold text-spring-green-400 mb-4 flex items-center">
                Dietary Preferences
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Select your dietary preferences to get personalized meal recommendations (optional)
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {availableDietaryPreferences.map(pref => {
                  const isSelected = selectedDietaryPreferences.includes(pref.id)
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => toggleDietaryPreference(pref.id)}
                      className={`
                        px-4 py-3 rounded-lg border transition-all duration-200 text-sm font-medium
                        ${isSelected 
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-md' 
                          : 'bg-gunmetal-400 border-office-green-500 text-white hover:bg-emerald-500/20 hover:border-emerald-400'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center">
                        {isSelected && <span className="mr-2">✓</span>}
                        {pref.name}
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedDietaryPreferences.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <p className="text-emerald-400 text-sm">
                    <span className="font-semibold">Selected:</span> {
                      availableDietaryPreferences
                        .filter(pref => selectedDietaryPreferences.includes(pref.id))
                        .map(pref => pref.name)
                        .join(', ')
                    }
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={handleSkip}
                  className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  Next: Allergies →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Allergies */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center">
                Allergies & Intolerances
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Select your allergies and intolerances to ensure safe meal recommendations
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {availableAllergies.map(allergy => {
                  const isSelected = selectedAllergies.includes(allergy.id)
                  return (
                    <button
                      key={allergy.id}
                      type="button"
                      onClick={() => toggleAllergy(allergy.id)}
                      className={`
                        px-4 py-3 rounded-lg border transition-all duration-200 text-sm font-medium
                        ${isSelected 
                          ? 'bg-red-500 border-red-400 text-white shadow-md' 
                          : 'bg-gunmetal-400 border-red-400/50 text-white hover:bg-red-500/20 hover:border-red-400'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center">
                        {isSelected && <span className="mr-2"></span>}
                        {allergy.name}
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedAllergies.length > 0 && (
                <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                  <p className="text-red-400 text-sm">
                    <span className="font-semibold">Allergies:</span> {
                      availableAllergies
                        .filter(allergy => selectedAllergies.includes(allergy.id))
                        .map(allergy => allergy.name)
                        .join(', ')
                    }
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <div className="space-x-3">
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-spring-green-500 hover:from-emerald-600 hover:to-spring-green-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Complete Setup
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PreferencesPopup
