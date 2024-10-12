import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ImageCard } from "./components/ImageCard";
import ImagenChat from "./components/ImagenChat";
import { TextCard } from "./components/TextCard";
import TextChat from "./components/TextChat";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal que muestra ImageCard */}
        <Route
          path="/"
          element={
            <div className="bg-[rgb(22,24,25)] flex justify-center items-center h-screen">
              <Link
                to="/textgenerator" // Enlace a la página del generador de imágenes
                className="m-5" // Cambia el color de fondo al pasar el cursor
              >
                <TextCard />
              </Link>
              <Link
                to="/imggenerator" // Enlace a la página del generador de imágenes
                className="m-5"
              >
                <ImageCard />
              </Link>
              <Link
                to="/textgenerator" // Enlace a la página del generador de imágenes
                className="m-5"
              >
                <TextCard />
              </Link>
            </div>
          }
        />

        {/* Ruta que muestra solo el ImagenChat */}
        <Route path="/imggenerator" element={<ImagenChat />} />
        <Route path="/textgenerator" element={<TextChat />} />
      </Routes>
    </Router>
  );
}
