import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { syncKeysOnLogin, restoreKeysOnNewDevice } from "../services/keySyncService.js";
import { hasLocalEncryptionKeys } from "../services/keySyncService.js";

// Backend API URL
const API = import.meta.env.VITE_API_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingKeyRestore, setPendingKeyRestore] = useState(null);

  // ✅ Logout
  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);

    // Axios response interceptor
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;

          if (data?.isBanned) {
            logout();
            alert(
              `Your account has been banned. Reason: ${
                data.reason || "Policy violation"
              }`
            );
            window.location.replace("/login");
          }

          if (data?.isActive === false) {
            logout();
            alert("Your account is deactivated. Please login again.");
            window.location.replace("/login");
          }

          if (status === 401 && data?.message === "Token expired") {
            logout();
            alert("Session expired. Please login again.");
            window.location.replace("/login");
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  /* =========================
     REGISTER
  ========================= */
  const register = async (name, email, mobile, password, role) => {
    const { data } = await axios.post(
      `${API}/api/auth/register`,
      {
        name,
        email,
        mobile, // ✅ FIXED: send mobile
        password,
        role,
      }
    );

    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  /* =========================
      LOGIN
   ========================= */
   const login = async (email, password) => {
     const { data } = await axios.post(`${API}/api/auth/login`, {
       email,
       password,
     });

     if (data.isBanned) {
       throw new Error(data.reason || "Account banned");
     }

     localStorage.setItem("user", JSON.stringify(data));
     setUser(data);

     // Handle encryption key sync on background
     setTimeout(async () => {
       try {
         // Check if device has local encryption keys
         const hasLocal = hasLocalEncryptionKeys();
         
         if (!hasLocal) {
           // Device doesn't have keys - try to restore from server
           console.log('No local encryption keys found, attempting to restore from server...');
           const restoreResult = await restoreKeysOnNewDevice(data.token);
           
           if (restoreResult.hasKeys) {
             // Server has keys, show modal to user
             setPendingKeyRestore(restoreResult.serverKeys);
             console.log('Synced keys found on server, waiting for user to restore...');
           } else {
             console.log('No synced keys on server');
           }
         } else {
           // Device has local keys - sync them to server
           console.log('Local encryption keys found, syncing to server...');
           await syncKeysOnLogin(password, data.token);
         }
       } catch (error) {
         // Key sync is not critical - log but don't fail login
         console.error('Background key sync failed:', error);
       }
     }, 500);

     return data;
   };

  // Attach token to requests
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const token = JSON.parse(storedUser)?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    return () => axios.interceptors.request.eject(reqInterceptor);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        pendingKeyRestore,
        setPendingKeyRestore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
