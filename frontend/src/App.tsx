import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Router } from "./routes/Router";
import { useAuthStore } from "./store/authStore";
import { api } from "./services/api";

function App() {
  const { token, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          setLoading(true);
          const response = await api.get("/auth/me");
          const userData = response.data;
          setUser({
            ...userData,
            name: userData.full_name || userData.name || "User",
          });
        } catch (error) {
          console.error("Failed to restore auth session:", error);
          useAuthStore.getState().logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, setUser, setLoading]);

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
