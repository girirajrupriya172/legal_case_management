import { createContext, useContext, useState, useEffect } from "react";
import { 
  login as apiLogin, 
  getCurrentUser as apiGetCurrentUser,
  logout as apiLogout 
} from "../services/authService";

// Create the Auth Context channel
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token and restore session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (storedToken) {
        try {
          // Fetch current profile from backend to verify token validity
          const currentUser = await apiGetCurrentUser(storedToken);
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(currentUser);
        } catch (error) {
          // Token is expired or corrupt, clear session
          console.warn("Session restore failed, clearing stale auth data:", error.message);
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          setToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      } else {
        // Ensure no orphaned refresh token remains in storage
        if (storedRefreshToken) {
          localStorage.removeItem("refreshToken");
        }
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Action: Authenticate credentials and store dual-token session
  const loginUser = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      
      // Persist access token and refresh token in client storage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);
      
      // Fetch fully hydrated user object
      const currentUser = await apiGetCurrentUser(data.access_token);
      
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setUser(currentUser);
      return true;
    } catch (error) {
      console.error("Login failed:", error.message);
      throw error;
    }
  };

  // Action: Notify backend to invalidate refresh token, clear storage, and sign out
  const logoutUser = async () => {
    const storedRefreshToken = refreshToken || localStorage.getItem("refreshToken");
    try {
      if (storedRefreshToken) {
        await apiLogout(storedRefreshToken);
      }
    } catch (err) {
      console.warn("Backend logout error:", err.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the Auth Context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

