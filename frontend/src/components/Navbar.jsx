import React, { useState } from "react";
import { Link } from "react-router-dom";
import profilePic from "../assets/profile_picture.jpg";

function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      {/* Navbar */}
      <div className="navbar bg-gunmetal-300 shadow-sm flex items-center mt-2 px-2">
        <div className="flex-none">
          <button
            className="btn btn-square btn-ghost w-12 h-12"
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
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-64 p-4 shadow"
            >
              <li>
                <Link className="justify-between text-base py-2" to="/account">
                  Edit Profile
                </Link>
              </li>
              <li>
                <Link className="text-base py-2" to="/logout">
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
          className="fixed inset-0 bg-gray-900/80 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-base-200 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="btn btn-square btn-ghost mt-4 ml-4"
          onClick={() => setSidebarOpen(false)}
        >
          ✕
        </button>
        <nav className="flex flex-col mt-10 gap-4 px-6">
          <Link
            to="/fridge"
            className="btn btn-outline"
            onClick={() => setSidebarOpen(false)}
          >
            My Fridge
          </Link>
          <Link
            to="/calendar"
            className="btn btn-outline"
            onClick={() => setSidebarOpen(false)}
          >
            Calendar
          </Link>
        </nav>
      </div>
    </>
  );
}

export default Navbar;
