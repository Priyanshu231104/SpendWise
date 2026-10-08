import AppRoutes from "./routes/AppRoutes";
import { GuestProvider } from "./context/GuestContext.jsx";

function App() {
  return (
    <GuestProvider>
      <AppRoutes />
    </GuestProvider>
  );
}

export default App;