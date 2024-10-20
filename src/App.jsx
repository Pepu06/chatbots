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
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { IoPersonCircleOutline } from "react-icons/io5";
import SignInPage from "./components/SignInPage";

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
    <div className="flex flex-col overscroll-none items-center justify-center h-screen bg-[rgb(22,24,25)]">
      <div className="absolute top-0 right-0 m-5 flex justify-start">
        <SignedOut>
          <div
            className="cursor-pointer flex items-center justify-center text-gray-600" // Increased size
            onClick={() => handleNavigation("/signin")}
          >
            <IoPersonCircleOutline size={50} />
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8", // Increased size
              },
            }}
          />
        </SignedIn>
      </div>
      <img src={logo} alt="Logo" className="mt-24 mb-6 h-16 w-auto" />
      <h1 className="text-center hidden sm:flex text-white text-3xl font-semibold">
        All chatbots in only one site
      </h1>
      <h1 className="text-center flex mb-10 sm:hidden text-white text-4xl font-semibold">
        AI chatbots
      </h1>
      <div className="flex flex-wrap justify-center items-center h-full w-full overflow-hidden">
        {/* Card Container */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div
            className="cursor-pointer hover:scale-105 transition-all"
            onClick={() => handleNavigation("/textgenerator")}
          >
            <TextCard />
          </div>

          <div
            className="cursor-pointer hover:scale-105 transition-all"
            onClick={() => handleNavigation("/imggenerator")}
          >
            <ImageCard />
          </div>

          <div
            className="cursor-pointer hover:scale-105 transition-all"
            onClick={() => handleNavigation("/speechtotext")}
          >
            <AudioToTextCard />
          </div>
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
        <Route path="/signin" element={<SignInPage />} />
      </Routes>
    </Router>
  );
}
