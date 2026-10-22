
import AppRoutes from "./routes/AppRoutes";
import { GuestProvider } from "./context/GuestContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

function App() {
  return (
    <AuthProvider>
      <GuestProvider>
        <AppRoutes />
      </GuestProvider>
    </AuthProvider>
  );
}

export default App;
