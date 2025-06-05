import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GoogleLogin } from "@react-oauth/google" // 👈 Google login
import api from "../api"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"
import "../styles/index.css"

function Form({ route, method }) {
	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [username, setUsername] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [password2, setPassword2] = useState("")
	const [loading, setLoading] = useState(false)
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
				navigate("/")
			} else {
				navigate("/login")
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

	// Render the form

	return (
		<div className="min-h-screen flex items-center justify-center">
			<form onSubmit={handleSubmit}>
				<fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
					<legend className="fieldset-legend">{name}</legend>

					{/* If register, show email field */}

					{method === "register" && (
						<>
							<label className="label">Email</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Email"
								className="input"
							/>
						</>
					)}

					{/* Show Username and password fields */}

					<label className="label">Username</label>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Username"
						className="input"
					/>

					<label className="label">Password</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						className="input"
					/>

					{/* If register, show confirm password field */}

					{method === "register" && (
						<>
							<label className="label">Confirm Password</label>
							<input
								type="password"
								value={password2}
								onChange={(e) => setPassword2(e.target.value)}
								placeholder="Confirm Password"
								className="input"
							/>
						</>
					)}

					{/* Button */}

					<button
						type="submit"
						disabled={loading}
						className="btn btn-neutral mt-4 transition duration-200 disabled:opacity-50"
					>
						{loading ? "Loading..." : name}
					</button>

					{/* Google login button */}

					<div className="mt-4 flex justify-center">
						<GoogleLogin
							onSuccess={async (credentialResponse) => {
								try {
									const res = await api.post("/api/user/google-login/", {
										token: credentialResponse.credential,
									})

									localStorage.setItem(ACCESS_TOKEN, res.data.access)
									localStorage.setItem(REFRESH_TOKEN, res.data.refresh)
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
	)
}

export default Form
