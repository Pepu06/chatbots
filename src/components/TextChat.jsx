import React, { useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Importa la librería
import logo from "../img/logo.png"; // Asegúrate de que la ruta sea correcta
import logo1 from "../img/logo1.png"; // Asegúrate de que la ruta sea correcta

const TextChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const genAI = new GoogleGenerativeAI(
    "AIzaSyDaByQuxXk1KhZTZGBG4wxBZNalZJxyFPs"
  ); // Usa la variable de entorno
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const handleSend = async () => {
    if (input.trim()) {
      // Añadimos el mensaje del usuario al chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, sender: "user", text: input },
      ]);
      setInput("");

      // Agregar el mensaje de "Generando respuesta..."
      const loadingMessageId = messages.length + 2;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: loadingMessageId,
          sender: "bot",
          isLoading: true, // Para identificar que este mensaje está cargando
        },
      ]);

      // Llamamos a la API para obtener la respuesta generativa
      try {
        const result = await model.generateContent(input); // Cambia esto según la implementación de tu API
        const responseText = result.response.text(); // Asegúrate de que esta línea sea correcta

        // Limpiar el mensaje de carga y agregar la respuesta generada
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1), // Elimina el último mensaje (cargando)
          {
            id: prevMessages.length + 3,
            sender: "bot",
            text: responseText, // La respuesta de la API
          },
        ]);
      } catch (error) {
        // Si hay un error, mostramos un mensaje de error en el chat
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length + 4,
            sender: "bot",
            text: "Hubo un problema al generar la respuesta.",
          },
        ]);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="bg-[rgb(22,24,25)] flex justify-center">
      <div className="flex flex-col h-screen p-4 w-full max-w-3xl">
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
                        className="w-6 h-6 mr-3 animate-spin"
                      />
                      Generando respuesta...
                    </div>
                  )}
                  {!message.isLoading && (
                    <div className="flex items-start">
                      {message.sender === "bot" && (
                        <>
                          <img
                            src={logo1}
                            alt="Logo 1"
                            className="w-6 h-6 mr-5"
                          />
                        </>
                      )}
                      {message.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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
  );
};

export default TextChat;
