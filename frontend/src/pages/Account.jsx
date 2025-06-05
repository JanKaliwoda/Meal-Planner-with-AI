import { useState, useEffect } from "react";
import api from "../api";

function Account() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  useEffect(() => {
    api.get("/api/user/profile/")
      .then(res => {
        setEmail(res.data.email);
        setFirstName(res.data.first_name);
        setLastName(res.data.last_name);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load user", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
  e.preventDefault();

  // Simple email regex: at least one char, @, at least one char, ., at least one char
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address (example@example.example)");
    return;
  }

  await api.patch("/api/user/profile/", {
    email,
    first_name: firstName,
    last_name: lastName,
  });
  alert("Profile updated!");
};

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== newPassword2) {
      alert("New passwords do not match!");
      return;
    }
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    try {
      await api.post("/api/user/change-password/", {
        old_password: currentPassword,
        new_password: newPassword,
        new_password2: newPassword2,
      });
      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (err) {
      const detail =
      err.response?.data?.detail ||
      (typeof err.response?.data === "string" ? err.response.data : null) ||
      "Failed to change password.";
    alert(detail);
    console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <form onSubmit={handleSave} className="form-container">
        <h1>Edit Account</h1>
        <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" />
        <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" />
        <button className="form-button" type="submit">Save</button>
      </form>

      <form onSubmit={handlePasswordChange} className="form-container" style={{marginTop: 32}}>
        <h2>Change Password</h2>
        <input
          className="form-input"
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          placeholder="Current Password"
        />
        <input
          className="form-input"
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="New Password"
        />
        <input
          className="form-input"
          type="password"
          value={newPassword2}
          onChange={e => setNewPassword2(e.target.value)}
          placeholder="Repeat New Password"
        />
        <button className="form-button" type="submit">Change Password</button>
      </form>
    </>
  );
}

export default Account;