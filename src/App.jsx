import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { ImageCard } from "./components/ImageCard";
import ImagenChat from "./components/ImagenChat";
import { TextCard } from "./components/TextCard";
import TextChat from "./components/TextChat";
import logo from "./img/logo.png";
import { AudioToTextCard } from "./components/AudioToTextCard";
import AudioToTextChat from "./components/AudioToTextChat";

// Verificar si la API de View Transitions es soportada
const isViewTransitionSupported = () => "startViewTransition" in document;

function App() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    if (isViewTransitionSupported()) {
      // Usar la API View Transition si está disponible
      document.startViewTransition(() => {
        navigate(path);
      });
    } else {
      // Fallback si la API no está disponible
      navigate(path);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[rgb(22,24,25)]">
      <img src={logo} alt="Logo" className="mt-24 mb-6 h-16 w-auto" />
      <h1 className="text-center text-white text-3xl font-semibold">
        All AI models in only one site
      </h1>
      <div className="flex justify-center items-center h-full">
        <div
          className="mx-5 cursor-pointer"
          onClick={() => handleNavigation("/textgenerator")}
        >
          <TextCard />
        </div>

        <div
          className="mx-5 cursor-pointer"
          onClick={() => handleNavigation("/imggenerator")}
        >
          <ImageCard />
        </div>

        <div
          className="mx-5 cursor-pointer"
          onClick={() => handleNavigation("/speechtotext")}
        >
          <AudioToTextCard />
        </div>
      </div>
    </div>
  );
}

export default function AppRouter() {
  useEffect(() => {
    if (!isViewTransitionSupported()) {
      console.warn("View Transitions API is not supported in this browser.");
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/imggenerator" element={<ImagenChat />} />
        <Route path="/textgenerator" element={<TextChat />} />
        <Route path="/speechtotext" element={<AudioToTextChat />} />
      </Routes>
    </Router>
  );
}
