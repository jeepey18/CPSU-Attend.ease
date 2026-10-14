
import { useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";
export default function Login({ onLogin, onShowRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: email.trim(),
        password,
      });

      const data = response.data;
      const token = data?.token;
      const user = data?.user;

      if (typeof token !== "string" || !token) {
        setError("Login failed: the server did not return an authentication token.");
        console.error("Invalid login response:", data);
        return;
      }

      // Pass the token first and the user second.
      onLogin(token, user);
    } catch (err) {
      console.error("Login error:", err);

      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (err.response?.status === 422) {
        setError("Please check your email and password.");
      } else {
        setError(
          "Unable to connect to the server. Check that Laravel is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          
<div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center">
  <img
    src="/cpsu-logo.png"
    alt="CPSU Logo"
    className="h-full w-full object-contain"
  />
</div>

          <h1 className="text-2xl font-bold text-[#2E8B45]">
            CPSU AttendEase
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Student Records and Attendance
          </p>
        </div>

        <h2 className="mb-5 text-xl font-semibold text-slate-800">
          Sign in to your account
        </h2>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2E8B45] px-4 py-3 font-semibold text-white transition hover:bg-[#246F37] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
  <p className="text-sm text-slate-600">
    Don't have an account?{" "}
    <button
      type="button"
      onClick={onShowRegister}
      className="font-semibold text-blue-900 hover:underline"
    >
      Register as a Teacher
    </button>
  </p>

  <p className="mt-3 text-xs text-slate-500">
    CPSU AttendEase · Student Records and Attendance
  </p>
</div>
      </div>
    </div>
  );
}