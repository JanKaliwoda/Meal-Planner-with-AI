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
        </div>
      </div>
    </div>
  )
}

export default Account
