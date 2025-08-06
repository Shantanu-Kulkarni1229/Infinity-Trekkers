// src/Admin/pages/AdminLogin.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const adminKey = import.meta.env.VITE_ADMIN_KEY as string;

    if (!adminKey) {
      setError("Admin key not configured");
      return;
    }

    if (token === adminKey) {
      localStorage.setItem("adminKey", token); // store in localStorage
      navigate("/admin/dashboard");
    } else {
      setError("Invalid admin token");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-96"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">Admin Login</h2>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter Admin Token"
          className="w-full px-4 py-2 border rounded-md mb-4"
        />
        {error && (
          <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;