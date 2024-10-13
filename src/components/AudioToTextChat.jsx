import React, { useState, useRef } from "react";
import { FaArrowUp } from "react-icons/fa";
import logo1 from "../img/logo1.png";
import { Link } from "react-router-dom";
import { FileUpload } from "../file/FileUpload"; // Importa el componente FileUpload
import { MdRecordVoiceOver } from "react-icons/md";
import logo from "../img/logo.png";

const AudioToTextChat = () => {
  const [messages, setMessages] = useState([]);
  const [audioFile, setAudioFile] = useState(null); // Estado para manejar el archivo de audio
  const [isTranscribing, setIsTranscribing] = useState(false); // Estado para indicar si está transcribiendo
  const fileUploadRef = useRef(null); // Referencia para el componente FileUpload

  // Función para hacer la consulta a la API
  const query = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/openai/whisper-small",
      {
        headers: {
          Authorization: "Bearer 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",
        },
        method: "POST",
        body: formData,
      }
    );
    const result = await response.json();
    return result;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleSend = async () => {
    if (audioFile) {
      // Agregar el mensaje del usuario con el nombre del archivo
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, sender: "user", text: audioFile.name },
      ]);

      // Indicar que se está transcribiendo
      setIsTranscribing(true);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 2,
          sender: "bot",
          text: "Transcribiendo...",
        }, // Mensaje de transcripción
      ]);

      const response = await query(audioFile);
      const text = response.text || "No se pudo transcribir el audio";

      // Agregar el mensaje de respuesta del bot
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1), // Eliminar el mensaje de "Transcribiendo..."
        { id: prevMessages.length + 3, sender: "bot", text: text }, // Mensaje del bot con la transcripción
      ]);

      // Limpiar el archivo después de enviar y restablecer el estado de transcripción
      setAudioFile(null);
      setIsTranscribing(false);

      // Limpiar el input de archivo
      if (fileUploadRef.current) {
        fileUploadRef.current.clearFiles(); // Llama a la función para limpiar los archivos
      }
    } else {
      alert("Por favor, sube un archivo de audio.");
    }
  };

  // Manejar el cambio de archivos desde el componente FileUpload
  const handleFileChange = (newFiles) => {
    setAudioFile(newFiles[0]); // Establecer el primer archivo subido
  };

  const speakText = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  return (
    <div>
      <div className="bg-[rgb(22,24,25)] absolute m-8">
        <Link to="/" className="m-5">
          <img src={logo1} alt="Home" className="h-8 w-8" />
        </Link>
      </div>
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
                    <div className="flex items-start">
                      {message.sender === "bot" && (
                        <>
                          {isTranscribing &&
                          message.text === "Transcribiendo..." ? (
                            <img
                              src={logo}
                              alt="Logo girando"
                              className="w-6 h-6 animate-spin"
                            />
                          ) : (
                            <img src={logo1} alt="Logo 1" className="w-6 h-6" />
                          )}
                        </>
                      )}
                      <div className="ml-5">{message.text}</div>
                      <div className="flex items-end">
                        {message.sender === "bot" && ( // Flecha solo en el mensaje del bot
                          <button
                            onClick={() => speakText(message.text)}
                            className="ml-1"
                          >
                            <MdRecordVoiceOver color="grey" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center border rounded-2xl border-gray-800 hover:border-gray-700 bg-[rgb(27,30,31)] p-2 shadow-md mt-4">
            <FileUpload onChange={handleFileChange} ref={fileUploadRef} />{" "}
            {/* Pasa la referencia */}
            <button
              className="ml-2 w-full flex items-center justify-center px-3 py-3 bg-[rgb(38,39,40)] text-white rounded-xl hover:bg-[rgb(22,22,23)] transition-colors focus:outline-none"
              onClick={handleSend}
              onKeyPress={handleKeyPress}
              disabled={isTranscribing} // Desactivar botón mientras se transcribe
            >
              {isTranscribing ? "Transcribiendo..." : "Subir archivo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioToTextChat;
