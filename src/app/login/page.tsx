"use client";

import { useEffect, useState } from "react";
import { login } from "@/firebase/authFunctions";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import PublicRoute from "@/components/PublicRoute";

export default function LoginForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingLogin(true);
    try {
      await login(email, password);
      router.push("/dashboard/items");
      setEmail("");
      setPassword("");
    } catch (err) {
      alert("Login failed");
      console.error(err);
    } finally {
      setLoadingLogin(false);
    }
  };

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, []);

  return (
    <PublicRoute>
      <div className="flex flex-col h-screen items-center justify-center bg-orange-100/70">
        <div className="flex flex-col items-center justify-center h-full bg-white min-w-[400px] max-w-[75%] min-h-[550px] max-h-[650px] rounded-xl shadow-xl">
          <img
            src="/logo-text.png"
            alt="logo-text"
            className="w-[150px] mb-12"
          />
          <form
            onSubmit={handleLogin}
            className="flex flex-col items-center justify-center"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-200 p-2 mb-3 w-[280px] rounded-md text-sm"
              required
              disabled={loadingLogin}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-200 p-2 mb-10 w-[280px] rounded-md text-sm"
              required
              disabled={loadingLogin}
            />
            <button
              type="submit"
              className="border w-[280px] bg-blue-500 text-white p-2 cursor-pointer rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingLogin}
            >
              {loadingLogin ? "Loading..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </PublicRoute>
  );
}
