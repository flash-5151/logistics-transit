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
          if (token === "mock-bypass-token") {
            console.warn("Bypassing session restoration for mock token.");
            setUser({
              id: "1",
              email: "test@bypass.com",
              name: "Bypass User",
              role: "hospital",
              created_at: new Date().toISOString(),
            });
            setLoading(false);
            return;
          }
          const response = await api.get("/auth/me");
          setUser(response.data);
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
