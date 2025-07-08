import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"

function Account() {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPassword2, setNewPassword2] = useState("")

  // Dietary preferences and allergies state
  const [availableDietaryPreferences, setAvailableDietaryPreferences] = useState([])
  const [availableAllergies, setAvailableAllergies] = useState([])
  const [selectedDietaryPreference, setSelectedDietaryPreference] = useState(null)
  const [selectedAllergies, setSelectedAllergies] = useState([])
  const [allergySearchTerm, setAllergySearchTerm] = useState("")
  const [filteredAllergies, setFilteredAllergies] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    api
      .get("/api/user/profile/")
      .then((res) => {
        setEmail(res.data.email)
        setUsername(res.data.username)
        setFirstName(res.data.first_name)
        setLastName(res.data.last_name)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load user", err)
        setLoading(false)
      })

    // Fetch dietary preferences and allergies
    api.get("/api/dietary-preferences/").then(res => setAvailableDietaryPreferences(res.data))
    api.get("/api/allergies/").then(res => {
      setAvailableAllergies(res.data)
      setFilteredAllergies(res.data)
    })
    // Fetch user profile for preferences/allergies
    api.get("/api/user-profiles/").then(res => {
      if (res.data.length > 0) {
        setSelectedDietaryPreference(res.data[0].dietary_preference)
        setSelectedAllergies(res.data[0].allergies || [])
      }
    })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()

    // Simple email regex: at least one char, @, at least one char, ., at least one char
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address (example@example.example)")
      return
    }

    await api.patch("/api/user/profile/", {
      email,
      first_name: firstName,
      last_name: lastName,
    })
    alert("Profile updated!")
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (newPassword !== newPassword2) {
      alert("New passwords do not match!")
      return
    }
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters.")
      return
    }
    try {
      await api.post("/api/user/change-password/", {
        old_password: currentPassword,
        new_password: newPassword,
        new_password2: newPassword2,
      })
      alert("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setNewPassword2("")
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Failed to change password."
      alert(detail)
      console.error(err)
    }
  }

  // Filter allergies based on search term - search from API
  useEffect(() => {
    const searchAllergies = async () => {
      if (allergySearchTerm.trim() === "") {
        // Show default top 20 allergens when no search
        try {
          const response = await api.get("/api/allergies/")
          setFilteredAllergies(response.data)
        } catch (error) {
          console.error("Error loading default allergies:", error)
          setFilteredAllergies(availableAllergies)
        }
      } else {
        try {
          // Search within the curated list of 100 allergens
          const response = await api.get(`/api/allergies/?search=${allergySearchTerm}`)
          setFilteredAllergies(response.data)
        } catch (error) {
          console.error("Error searching allergies:", error)
          // Fallback to local allergy search
          const filtered = availableAllergies.filter(allergy =>
            allergy.name.toLowerCase().startsWith(allergySearchTerm.toLowerCase())
          )
          setFilteredAllergies(filtered)
        }
      }
    }

    const timeoutId = setTimeout(searchAllergies, 300)
    return () => clearTimeout(timeoutId)
  }, [allergySearchTerm, availableAllergies])

  const handlePreferencesSave = async (e) => {
    e.preventDefault()
    try {
      // PATCH the first user profile (assumes one per user)
      const userProfiles = await api.get("/api/user-profiles/")
      if (userProfiles.data.length > 0) {
        await api.patch(`/api/user-profiles/${userProfiles.data[0].id}/`, {
          dietary_preference: selectedDietaryPreference,
          allergies: selectedAllergies,
        })
        alert("Preferences and allergies updated!")
      }
    } catch (error) {
      console.error("Failed to update preferences", error)
      alert("Failed to update preferences. Please try again.")
    }
  }

  const toggleAllergy = (allergyItem) => {
    // Regular allergy toggle - no need to create from ingredient anymore
    setSelectedAllergies(prev => 
      prev.includes(allergyItem.id) 
        ? prev.filter(id => id !== allergyItem.id)
        : [...prev, allergyItem.id]
    )
  }

  const selectDietaryPreference = (prefId) => {
    setSelectedDietaryPreference(prev => prev === prefId ? null : prefId)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gunmetal-500 flex items-center justify-center">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Add Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/")}
              className="text-spring-green-400 hover:text-emerald-500 font-semibold transition-colors flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Main Page
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:space-x-8 md:space-y-0 space-y-8">
            {/* Profile Form */}
            <form onSubmit={handleSave} className="w-full md:w-1/2">
              <fieldset className="bg-gunmetal-300 shadow-xl rounded-lg px-8 pt-6 pb-8 h-full">
                <legend className="text-2xl font-bold text-spring-green-500 mb-6">
                  Edit Account
                </legend>
                <div className="mb-4">
                  <label className="block text-spring-green-400 text-sm font-bold mb-2">
                    Username (unchangeable)
                  </label>
                  <input
                    className="w-full px-4 py-2 rounded-full border-2 border-office-green-500/30 bg-gunmetal-400/30 text-gray-400 cursor-not-allowed select-none opacity-75"
                    value={username}
                    disabled
                    readOnly
                    title="Username cannot be changed"
                  />
                </div>
                <div className="space-y-4">
                  <div className="mb-4">
                    <label className="block text-spring-green-400 text-sm font-bold mb-2">
                      Email
                    </label>
                    <input
                      className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-spring-green-400 text-sm font-bold mb-2">
                      First Name
                    </label>
                    <input
                      className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-spring-green-400 text-sm font-bold mb-2">
                      Last Name
                    </label>
                    <input
                      className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    {loading ? "Loading..." : "Save Changes"}
                  </button>
                </div>
              </fieldset>
            </form>

            {/* Password Change Form */}
            <form onSubmit={handlePasswordChange} className="w-full md:w-1/2">
              <fieldset className="bg-gunmetal-300 shadow-xl rounded-lg px-8 pt-6 pb-8 h-full">
                <legend className="text-2xl font-bold text-spring-green-500 mb-6">
                  Change Password
                </legend>
                <div className="space-y-4">
                  <div className="mb-4">
                    <label className="block text-spring-green-400 text-sm font-bold mb-2">
                      Current Password
                    </label>
                    <input
                      className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current Password"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-spring-green-400 text-sm font-bold mb-2">
                      New Password
                    </label>
                    <input
                      className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-spring-green-400 text-sm font-bold mb-2">
                      Confirm New Password
                    </label>
                    <input
                      className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      type="password"
                      value={newPassword2}
                      onChange={(e) => setNewPassword2(e.target.value)}
                      placeholder="Repeat New Password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    {loading ? "Loading..." : "Change Password"}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>

          {/* Dietary Preferences and Allergies Form */}
          <div className="mt-6">
            <form onSubmit={handlePreferencesSave} className="w-full">
              <fieldset className="bg-gunmetal-300 shadow-xl rounded-lg px-5 pt-3 pb-5">
                <legend className="text-lg font-bold text-spring-green-500 mb-3 text-center">
                  Dietary Preferences & Allergies
                </legend>
                
                {/* Dietary Preferences Section */}
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-spring-green-400 mb-2 flex items-center">
                    Dietary Preferences
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">Choose one dietary preference to get personalized meal recommendations (optional)</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {availableDietaryPreferences.map(pref => {
                      const isSelected = selectedDietaryPreference === pref.id
                      return (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => selectDietaryPreference(pref.id)}
                          className={`
                            px-3 py-2 rounded-md border transition-all duration-200 text-sm font-medium
                            ${isSelected 
                              ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm' 
                              : 'bg-gunmetal-400 border-office-green-500 text-white hover:bg-emerald-500/20 hover:border-emerald-400'
                            }
                          `}
                        >
                          <div className="flex items-center justify-center">
                            {isSelected && <span className="mr-1">✓</span>}
                            {pref.name}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {selectedDietaryPreference && (
                    <div className="mt-2 p-1.5 bg-emerald-500/10 rounded border border-emerald-500/30">
                      <p className="text-emerald-400 text-xs">
                        <span className="font-semibold">Selected:</span> {
                          availableDietaryPreferences
                            .find(pref => pref.id === selectedDietaryPreference)?.name
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Allergies Section */}
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-red-400 mb-2 flex items-center">
                    Allergies & Intolerances
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">Select all allergies and intolerances you have (multiple selections allowed)</p>
                  
                  {/* Allergy Search */}
                  <div className="mb-4">
                    <input
                      type="text"
                      value={allergySearchTerm}
                      onChange={(e) => setAllergySearchTerm(e.target.value)}
                      placeholder="Search for allergic products..."
                      className="w-full px-4 py-2 bg-gunmetal-400 border border-office-green-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                    {filteredAllergies.map(allergy => {
                      const isSelected = selectedAllergies.includes(allergy.id)
                      return (
                        <button
                          key={allergy.id}
                          type="button"
                          onClick={() => toggleAllergy(allergy)}
                          className={`
                            px-3 py-2 rounded-md border transition-all duration-200 text-sm font-medium
                            ${isSelected 
                              ? 'bg-red-500 border-red-400 text-white shadow-sm' 
                              : 'bg-gunmetal-400 border-red-400/50 text-white hover:bg-red-500/20 hover:border-red-400'
                            }
                          `}
                        >
                          <div className="flex items-center justify-center">
                            {isSelected && <span className="mr-1">✗</span>}
                            {allergy.name}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  
                  {filteredAllergies.length === 0 && allergySearchTerm.trim() && (
                    <div className="text-center py-4 text-gray-400">
                      No allergic products found matching "{allergySearchTerm}"
                    </div>
                  )}
                  {selectedAllergies.length > 0 && (
                    <div className="mt-2 p-1.5 bg-red-500/10 rounded border border-red-500/30">
                      <p className="text-red-400 text-xs">
                        <span className="font-semibold">Allergies:</span> {
                          availableAllergies
                            .filter(allergy => selectedAllergies.includes(allergy.id))
                            .map(allergy => allergy.name)
                            .join(', ')
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-spring-green-500 hover:from-emerald-600 hover:to-spring-green-600 text-white font-semibold text-sm rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Save Preferences & Allergies
                      </div>
                    )}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Account
