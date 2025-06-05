import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google"; // 👈 Google login
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/index.css";

function Form({ route, method }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const name = method === "login" ? "Login" : "Register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let payload;

      if (method === "login") {
        payload = { username, password };
      } else {
        if (password !== password2) {
          alert("Passwords do not match");
          return;
        }
        payload = {
          username,
          email,
          password: password,
          password2: password2,
          first_name: firstName,
          last_name: lastName,
        };
      }

      const res = await api.post(route, payload);

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Form error:", error);
      alert("Error: " + (error.response?.data?.detail || "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800">{name}</h1>
  
        {method === "register" && (
          <>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </>
        )}
  
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
  
        {method === "register" && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        )}
  
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
  
        {method === "register" && (
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Confirm Password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        )}
  
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
        >
          {loading ? "Please wait..." : name}
        </button>
  
        {method === "login" && (
          <div className="mt-4 flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const res = await api.post("/api/user/google-login/", {
                    token: credentialResponse.credential,
                  });
  
                  localStorage.setItem(ACCESS_TOKEN, res.data.access);
                  localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                  navigate("/");
                } catch (err) {
                  console.error("Google login error", err);
                  alert("Google login failed");
                }
              }}
              onError={() => {
                alert("Google Sign In was unsuccessful. Try again later");
              }}
            />
          </div>
        )}
      </form>
    </div>
  );
}

export default Form;
