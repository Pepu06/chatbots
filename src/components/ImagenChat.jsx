import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import logo from "../img/logo.png"; // Asegúrate de que la ruta sea correcta
import logo1 from "../img/logo1.png"; // Asegúrate de que la ruta sea correcta
import { OnlyImgCard } from "./OnlyImgCard";
import img1 from "../img/img1.jpg"; // Asegúrate de que la ruta sea correcta
import img2 from "../img/img2.jpg"; // Asegúrate de que la ruta sea correcta
import img3 from "../img/img3.jpg"; // Asegúrate de que la ruta sea correcta
import { Link } from "react-router-dom";

const ImagenChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);

  const handleSend = async () => {
    if (input.trim()) {
      setConversationStarted(true);
      // Añadimos el mensaje del usuario al chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, sender: "user", text: input },
      ]);
      setInput("");
      setLoading(true);

      // Agregar el mensaje de "Generando imagen..." con el logo
      const loadingMessageId = messages.length + 2;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: loadingMessageId,
          sender: "bot",
          text: "Generando imagen...",
          isLoading: true, // Para identificar que este mensaje está cargando
        },
      ]);

      // Llamamos a la API para obtener la imagen
      try {
        const response = await query({ inputs: input });

        const imageBlob = response;
        const imageObjectURL = URL.createObjectURL(imageBlob); // Creamos una URL para la imagen

        // Limpiar el intervalo de puntos y agregar el mensaje de imagen generada
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1), // Eliminamos el mensaje de "Generando imagen..."
          {
            id: prevMessages.length + 4, // Incrementamos el ID para la imagen
            sender: "bot",
            imageUrl: imageObjectURL, // Guardamos la URL de la imagen
          },
        ]);
      } catch (error) {
        // Si hay un error, mostramos un mensaje de error en el chat
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length + 5,
            sender: "bot",
            text: "Hubo un problema al generar la imagen.",
          },
        ]);
      }
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      // Limpiar el intervalo en caso de que el componente se desmonte
    };
  }, []);

  return (
    <div>
      <div className="bg-[rgb(22,24,25)] absolute m-8">
        <Link
          to="/" // Enlace a la página del generador de imágenes
          className="m-5" // Cambia el color de fondo al pasar el cursor
        >
          <img src={logo1} alt="Home" className="h-8 w-8" />
        </Link>
      </div>
      <div className="bg-[rgb(22,24,25)] flex justify-center">
        <div className="flex flex-col h-screen p-4 w-full max-w-3xl">
          {/* Chat messages container */}
          <div className="flex-grow overflow-y-auto no-scrollbar flex flex-col-reverse">
            <div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  } mb-2`}
                >
                  <div
                    className={`max-w-xs rounded-3xl px-5 py-3 ${
                      message.sender === "user"
                        ? "bg-[rgb(38,39,40)] text-white"
                        : "text-white"
                    }`}
                  >
                    {message.isLoading && (
                      <div className="flex items-center">
                        <img
                          src={logo}
                          alt="Logo girando"
                          className="w-6 h-6 mr-2 animate-spin" // Ajusta el tamaño según sea necesario
                        />
                        Generando imagen...
                      </div>
                    )}
                    {!message.isLoading && (
                      <div className="flex items-center">
                        {message.sender === "bot" && (
                          <>
                            <img
                              src={logo1} // Logo a la izquierda del texto
                              alt="Logo 1"
                              className="w-6 h-6" // Ajusta el tamaño según sea necesario
                            />
                            {message.text}
                          </>
                        )}
                        {/* Renderizamos el texto solo si no es el mensaje de imagen */}
                        {message.imageUrl ? null : message.text}
                      </div>
                    )}
                  </div>
                  {/* Si el mensaje tiene una imagen, la renderizamos */}
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Generated by AI"
                      className="rounded-lg max-w-xs"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* OnlyImgCard en el medio de la pantalla */}
          {!conversationStarted && (
            <div className=" flex-col justify-center items-center h-full mt-40">
              <h1 className="mb-10 items-center justify-center text-center">
                <span className="text-white text-2xl">
                  ¡Prueba a generar una imagen como estas!
                </span>
              </h1>
              <div className="flex space-x-4">
                {/* Añadir espacio entre las tarjetas */}
                <OnlyImgCard img={img1} text={"Una acogedora casa en un árbol, hecha de madera clara y rodeada de hojas verdes, con ventanas que dejan entrar la luz del sol."} />
                <OnlyImgCard img={img2} text={'Una cocina acogedora y rústica con gabinetes de madera, un piso de madera y una estufa azul. La luz natural entra por una ventana grande, creando una atmósfera cálida y hogareña.'}/>
                {/* Asegúrate de tener img2 definido */}
                <OnlyImgCard img={img3} text={'Un paisaje otoñal sereno con un bote de remos en el centro de un lago tranquilo. Los árboles con hojas rojizas y anaranjadas enmarcan la escena, creando una atmósfera mágica.'} />
                {/* Asegúrate de tener img3 definido */}
              </div>
            </div>
          )}
          <div className="flex items-center border rounded-2xl border-gray-800 hover:border-gray-700 bg-[rgb(27,30,31)] p-2 shadow-md mt-4">
            <input
              className="flex-grow caret-white p-3 bg-[rgb(27,30,31)] text-white focus:outline-none focus:placeholder:text-white transition-colors"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
            />
            <button
              className="ml-2 px-3 py-3 bg-[rgb(38,39,40)] text-white rounded-xl hover:bg-blue-600 transition-colors focus:outline-none"
              onClick={handleSend}
            >
              <FaArrowUp color="gray" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Función para hacer la solicitud a Hugging Face API
async function query(data) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
    {
      headers: {
        Authorization: "Bearer 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",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  const result = await response.blob();
  return result;
}

export default ImagenChat;
