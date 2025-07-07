import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GoogleLogin } from "@react-oauth/google" // 👈 Google login
import api from "../api"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"
import PreferencesPopup from "./PreferencesPopup"
import "../styles/index.css"

function Form({ route, method, onLogin }) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPreferencesPopup, setShowPreferencesPopup] = useState(false)
  const navigate = useNavigate()

  const name = method === "login" ? "Login" : "Register"

  // Handle form submission

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let payload

      if (method === "login") {
        payload = { username, password }
      } else {
        if (password !== password2) {
          alert("Passwords do not match")
          setLoading(false)
          return
        }
        payload = {
          username,
          email,
          password: password,
          password2: password2,
          first_name: firstName,
          last_name: lastName,
        }
      }

      const res = await api.post(route, payload)

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access)
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh)
        if (onLogin) await onLogin() // <-- Call the callback here
        navigate("/")
      } else {
        // For registration, automatically log in the user and show preferences popup
        try {
          const loginRes = await api.post("/api/token/", {
            username,
            password
          })
          localStorage.setItem(ACCESS_TOKEN, loginRes.data.access)
          localStorage.setItem(REFRESH_TOKEN, loginRes.data.refresh)
          setShowPreferencesPopup(true)
        } catch (loginError) {
          console.error("Auto-login after registration failed:", loginError)
          navigate("/login")
        }
      }
    } catch (error) {
      console.error("Form error:", error)
      alert(
        "Error: " + (error.response?.data?.detail || "Something went wrong")
      )
    } finally {
      setLoading(false)
    }
  }

  // Handle preferences popup
  const handlePreferencesComplete = () => {
    setShowPreferencesPopup(false)
    navigate("/")
  }

  const handlePreferencesClose = () => {
    setShowPreferencesPopup(false)
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-gunmetal-500 flex items-center justify-center">
      <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="w-full">
          <fieldset className="bg-gunmetal-300 shadow-xl rounded-lg px-8 pt-6 pb-8">
            <legend className="text-2xl font-bold text-spring-green-500 mb-6 ">
              {name}
            </legend>

            {/* If register, show email field */}

            {method === "register" && (
              <>
                <div className="mb-4">
                  <label className="block text-spring-green-400 text-sm font-bold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </>
            )}

            {/* Show Username and password fields */}

            <div className="mb-4">
              <label className="block text-spring-green-400 text-sm font-bold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="mb-4">
              <label className="block text-spring-green-400 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* If register, show confirm password field */}

            {method === "register" && (
              <div className="mb-6">
                <label className="block text-spring-green-400 text-sm font-bold mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            )}

            {/* Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? "Loading..." : name}
            </button>

            {/* Add Register/Login link */}
            {method === "login" ? (
              <div className="text-center mb-4">
                <span className="text-spring-green-400 text-sm">
                  Don't have an account?{" "}
                  <a
                    href="/register"
                    className="text-emerald-500 hover:text-emerald-600 font-semibold transition-colors"
                  >
                    Register
                  </a>
                </span>
              </div>
            ) : (
              <div className="text-center mb-4">
                <span className="text-spring-green-400 text-sm">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="text-emerald-500 hover:text-emerald-600 font-semibold transition-colors"
                  >
                    Login
                  </a>
                </span>
              </div>
            )}

            {/* Google login button */}

            <div className="mt-6 flex justify-center border-t border-gunmetal-400 pt-6">
              <GoogleLogin
                theme="filled_black"
                text="signin_with"
                shape="pill"
                size="large"
                locale="en"
                useOneTap={false}
                onSuccess={async (credentialResponse) => {
                  try {
                    const res = await api.post("/api/user/google-login/", {
                      token: credentialResponse.credential,
                    })

                    localStorage.setItem(ACCESS_TOKEN, res.data.access)
                    localStorage.setItem(REFRESH_TOKEN, res.data.refresh)
                    
                    // Check if user has preferences set (to determine if they're new)
                    try {
                      const userProfiles = await api.get("/api/user-profiles/")
                      console.log("User profiles response:", userProfiles.data) // Debug log
                      
                      // Get current user info to find their profile
                      const userInfo = await api.get("/api/user/profile/")
                      console.log("Current user info:", userInfo.data) // Debug log
                      
                      // Find the profile that belongs to the current user
                      const currentUserProfile = userProfiles.data.find(profile => 
                        profile.user.id === userInfo.data.id
                      )
                      
                      console.log("Current user profile:", currentUserProfile) // Debug log
                      
                      if (currentUserProfile) {
                        console.log("Dietary preferences:", currentUserProfile.dietary_preferences) // Debug log
                        console.log("Allergies:", currentUserProfile.allergies) // Debug log
                        
                        // If user has no preferences/allergies set, show the popup
                        if ((!currentUserProfile.dietary_preferences || currentUserProfile.dietary_preferences.length === 0) && 
                            (!currentUserProfile.allergies || currentUserProfile.allergies.length === 0)) {
                          console.log("Showing preferences popup") // Debug log
                          setShowPreferencesPopup(true)
                          return // Don't navigate yet, wait for popup completion
                        } else {
                          console.log("User has preferences, skipping popup") // Debug log
                        }
                      } else {
                        // No profile found for current user, definitely a new user
                        console.log("No profile found for current user, showing popup") // Debug log
                        setShowPreferencesPopup(true)
                        return
                      }
                    } catch (profileError) {
                      console.error("Error checking user profile:", profileError)
                      // If we can't check, assume they're new and show popup
                      console.log("Error checking profile, showing popup") // Debug log
                      setShowPreferencesPopup(true)
                      return
                    }
                    
                    navigate("/")
                  } catch (err) {
                    console.error("Google login error", err)
                    alert("Google login failed")
                  }
                }}
                onError={() => {
                  alert("Google Sign In was unsuccessful. Try again later")
                }}
              />
            </div>
          </fieldset>
        </form>
      </div>

      {/* Render the preferences popup */}
      {showPreferencesPopup && (
        <PreferencesPopup
          isOpen={showPreferencesPopup}
          onComplete={handlePreferencesComplete}
          onClose={handlePreferencesClose}
        />
      )}
    </div>
  )
}

export default Form
