import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Custom logout function
  const logout = (reason = "Manual logout") => {
    console.warn("🔴 Logging out triggered:", reason);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    setUser(null);
    setToken(null);

    // Save return route if not on login/register/home
    if (
      router.pathname !== "/login" &&
      router.pathname !== "/register" &&
      router.pathname !== "/"
    ) {
      sessionStorage.setItem("return_route", router.asPath);
    }

    toast.success(`Logged out successfully.`, { duration: 3000 });
    router.push("/login");
  };

  // Login function
  const login = async (identifier, password) => {
    try {
      console.log("🟢 Logging in...");
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Extract token and user correctly from backend structure
        const { data: responseData } = data; // successResponse wraps the result in data
        const token = responseData?.token;
        const user = responseData;

        if (!token) {
          console.error("❌ No token returned from backend:", data);
          toast.error("Login failed: no token received from server");
          return;
        }

        console.log("✅ Token received:");
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        // Set cookie for middleware
        document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`; // 30 days
        setToken(token);
        setUser(user);

        toast.success(`Welcome back, ${user.username}!`);

        console.log("✅ User successfully logged in:", user.username);

        if (user.needsVerification) {
          router.push("/verify");
        } else {
          router.push("/dashboard");
        }
        return user;
      } else {
        throw new Error(JSON.stringify(data));
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      console.log("🟢 Registering...");
      const response = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Extract token and user correctly from backend structure
        const { data: responseData } = data; // successResponse wraps the result in data
        const token = responseData?.token;
        const user = responseData;

        if (!token) {
          console.error("❌ No token returned from backend:", data);
          toast.error("Registration failed: no token received from server");
          return null;
        }

        console.log("✅ Token received:");
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        // Set cookie for middleware
        document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`;
        setToken(token);
        setUser(user);

        console.log("✅ User successfully registered:", user.username);

        if (user.needsVerification) {
          router.push("/verify");
        } else {
          router.push("/dashboard");
        }
        return user;
      } else {
        const err = data;
        switch (err?.code) {
          case "username_exists":
            toast.error("Person don fes u use that Username!");
            break;
          case "email_exists":
            toast.error("Gadus don dey use that email!");
            break;
          case "whatsappNumber_exists":
            toast.error("this number don dey linked already, try another one!");
            break;
          case "validation_error":
            toast.error(`Validation error: ${err.message}`);
            break;
          default:
            toast.error(
              err?.message || "Registration failed. Please try again."
            );
            break;
        }
        return null;
      }
    } catch (error) {
      console.error("❌ Register error:", error);
      const message = "Network error. Please try again.";
      toast.error(message);
      throw error;
    }
  };

  // Token restoration on mount
  useEffect(() => {
    console.log("⚙️ AuthProvider initialized...");
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        const decoded = jwtDecode(savedToken);
        const now = Date.now();
        console.log("📦 Saved token detected:", decoded);
        console.log("📆 Expiration:", new Date(decoded.exp * 1000));

        if (decoded.exp * 1000 > now) {
          console.log("✅ Token still valid, restoring session...");
          setToken(savedToken);
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);

          // Re-verify with backend to ensure flags (like isEmailVerified) are fresh
          try {
            fetch("/api/auth/verify", {
              headers: { Authorization: `Bearer ${savedToken}` },
            })
              .then((res) => {
                if (!res.ok) throw new Error("Verification failed");
                return res.json();
              })
              .then((data) => {
                if (data.success) {
                  setUser(data.data);
                  localStorage.setItem("user", JSON.stringify(data.data));
                }
              })
              .catch((err) => {
                console.warn(
                  "Silent mount sync failed (can be ignored):",
                  err.message
                );
              });
          } catch (e) {
            console.error("Synchronous fetch error:", e);
          }
        } else {
          console.warn("⚠️ Token expired at:", new Date(decoded.exp * 1000));
          logout("Token expired");
        }
      } catch (err) {
        console.error("❌ Token decode error:", err);
        logout("Invalid token");
      }
    } else {
      console.log("ℹ️ No token found in storage.");
    }
    setLoading(false);
  }, []);

  // Refresh user profile
  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const updatedUser = data.data;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (error) {
      console.error("❌ Refresh user error:", error);
    }
  };

  // Sync state and localStorage
  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  };

  const value = {
    user,
    setUser: updateUser, // Replaces default setUser with our synced version
    token,
    login,
    register,
    logout,
    refreshUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
