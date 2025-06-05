import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google"; // 👈 Google login
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";

function Form({ route, method, onLogin }) {
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
        setLoading(false);
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
      if (onLogin) await onLogin(); // <-- Call the callback here
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
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{name}</h1>
      {method === "register" && (
        <>
          <input
            className="form-input"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
          />
          <input
            className="form-input"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
          />
        </>
      )}
      <input
        className="form-input"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />

      {method === "register" && (
        <input
          className="form-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
      )}

      <input
        className="form-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      {method === "register" && (
        <input
          className="form-input"
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="Confirm Password"
        />
      )}

      <button className="form-button" type="submit" disabled={loading}>
        {loading ? "Please wait..." : name}
      </button>

      {method === "login" && (
        <div style={{ marginTop: "20px" }}>
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
  );
}

export default Form;
