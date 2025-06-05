import Form from "../components/Form";
import api from "../api"; // Your axios instance
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.get("/api/user/profile/")
      // You can store this in context, Redux, or local state as needed
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/account"); // Redirect to account page or wherever you want
    } catch (err) {
      console.error("Failed to fetch user profile after login", err);
    }
  };

  return <Form route="/api/token/" method="login" onLogin={handleLogin} />;
}

export default Login;