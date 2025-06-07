import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import profilePic from "../assets/profile_picture.jpg"
import api from "../api"

function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")

  useEffect(() => {
    // Fetch user profile when component mounts
    api
      .get("/api/user/profile/")
      .then((res) => {
        setUsername(res.data.username)
        setFirstName(res.data.first_name)
      })
      .catch((err) => {
        console.error("Failed to load user profile", err)
      })
  }, [])

  // Display first name if available, otherwise username
  const displayName = firstName || username

  return (
    <>
      {/* Navbar */}
      <div className="navbar bg-gunmetal-500 flex items-center px-2">
        <div className="flex-none">
          <button
            className="btn btn-square btn-ghost w-12 h-12 hover:bg-emerald-500/50"
            onClick={() => setSidebarOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-8 w-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
        <div className="ml-auto mr-2">
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar w-12 h-12"
            >
              <div className="w-12 h-12 rounded-full">
                <img alt="Tailwind CSS Navbar component" src={profilePic} />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-gunmetal-300 rounded-lg shadow-xl mt-3 w-64 p-4"
            >
              <li className="mb-4">
                <span className="text-spring-green-400 text-base py-2 pointer-events-none font-bold">
                  {displayName}
                </span>
              </li>
              <li className="mb-2">
                <Link
                  to="/account"
                  className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
                >
                  Edit Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/logout"
                  className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
                >
                  Logout
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gunmetal-100/80 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gunmetal-300 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="btn btn-square btn-ghost w-12 h-12 hover:bg-emerald-500/50 mt-4 ml-4"
          onClick={() => setSidebarOpen(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block h-6 w-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <nav className="flex flex-col mt-10 gap-4 px-6">
          <Link
            to="/fridge"
            className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            My Fridge
          </Link>
          <Link
            to="/calendar"
            className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            Calendar
          </Link>
        </nav>
      </div>
    </>
  )
}

export default Navbar
