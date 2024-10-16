import React, { useState, useRef, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import logo1 from "../img/logo1.png";
import { Link } from "react-router-dom";
import { FileUpload } from "../file/FileUpload";
import { MdRecordVoiceOver } from "react-icons/md";
import logo from "../img/logo.png";
import { useAuth } from "@clerk/clerk-react";
import db from "../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { FaHome } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { deleteDoc } from "firebase/firestore";
import Toastify from "toastify-js";
import { FaTrash, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const isViewTransitionSupported = () => "startViewTransition" in document;

const AudioToTextChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileUploadRef = useRef(null);
  const [menu, setMenu] = useState(false);
  const [conversations, setConversations] = useState([]);
  const { userId } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) return;

      try {
        const q = query(
          collection(db, "conversacionAudio"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedConversations = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConversations(fetchedConversations);

        if (fetchedConversations.length > 0) {
          setSelectedConversation(fetchedConversations[0]);
          setMessages(fetchedConversations[0].messages);
        }
      } catch (error) {
        console.error("Error fetching conversations: ", error);
      }
    };

    fetchConversations();
  }, [userId]);

  const fetchquery = async (file) => {
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

  const handleDelete = async (conversationId) => {
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
      setMessages([]);
    }

    try {
      // Eliminar la conversación de Firestore
      await deleteDoc(doc(db, "conversacionAudio", conversationId));
      // Mostrar notificacion de eliminacion exitosa

      // Actualizar el estado local
      setConversations((prevConversations) =>
        prevConversations.filter((conv) => conv.id !== conversationId)
      );

      Toastify({
        text: "Conversación eliminada",
        duration: 2000,
        destination: "https://github.com/apvarun/toastify-js",
        newWindow: true,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "red",
        },
        onClick: function () {}, // Callback after click
      }).showToast();
    } catch (error) {
      console.error("Error deleting conversation: ", error);
    }
  };

  const handleSend = async () => {
    if (audioFile) {
      const newMessage = {
        id: Date.now(),
        sender: "user",
        text: audioFile.name,
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);

      setIsTranscribing(true);
      const loadingMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: "Transcribiendo...",
      };
      setMessages((prevMessages) => [...prevMessages, loadingMessage]);

      try {
        const response = await fetchquery(audioFile);
        const text = response.text || "No se pudo transcribir el audio";

        const botMessage = { id: Date.now() + 2, sender: "bot", text: text };

        const updatedMessages = [...messages, newMessage, botMessage];

        setMessages(updatedMessages);

        // Save the conversation to Firestore
        const conversationRef = selectedConversation
          ? doc(db, "conversacionAudio", selectedConversation.id)
          : doc(collection(db, "conversacionAudio"));

        await setDoc(conversationRef, {
          userId: userId,
          messages: updatedMessages,
          timestamp: new Date(),
        });

        // Update local state
        if (selectedConversation) {
          setConversations((prevConversations) =>
            prevConversations.map((conv) =>
              conv.id === selectedConversation.id
                ? { ...conv, messages: updatedMessages, timestamp: new Date() }
                : conv
            )
          );
          setSelectedConversation({
            ...selectedConversation,
            messages: updatedMessages,
            timestamp: new Date(),
          });
        } else {
          const newConversation = {
            id: conversationRef.id,
            messages: updatedMessages,
            timestamp: new Date(),
            userId: userId,
          };
          setConversations((prevConversations) => [
            newConversation,
            ...prevConversations,
          ]);
          setSelectedConversation(newConversation);
        }
      } catch (error) {
        console.error("Error transcribing audio:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now() + 3,
            sender: "bot",
            text: "Error al transcribir el audio.",
          },
        ]);
      }

      setAudioFile(null);
      setIsTranscribing(false);
      if (fileUploadRef.current) {
        fileUploadRef.current.clearFiles();
      }
    } else {
      alert("Por favor, sube un archivo de audio.");
    }
  };

  const handleFileChange = (newFiles) => {
    setAudioFile(newFiles[0]);
  };

  const speakText = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  const handleMenu = () => {
    setMenu((prev) => !prev);
  };

  const loadConversation = (conversation) => {
    setMessages(conversation.messages);
    setSelectedConversation(conversation);
    setMenu(false);
  };

  const startNewConversation = () => {
    setMessages([]);
    setSelectedConversation(null);
    setMenu(false);
  };

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
    <div className="bg-[rgb(22,24,25)] h-screen w-full">
      {/* Flecha izquierda */}
      <button
        className="sm:flex hidden absolute left-4 top-1/2 transform -translate-y-1/2 p-4"
        onClick={() => handleNavigation("/imggenerator")}
        title="Image generation"
      >
        <FaArrowLeft size={30} color="white" />
      </button>
      <button onClick={handleMenu} className="absolute p-8">
        <GiHamburgerMenu size={25} color="white" />
      </button>
      <div
        className={`absolute transition-transform duration-300 ease-in-out top-0 left-0 h-full sm:w-64 w-screen bg-[rgb(22,24,25)] border-r border-gray-800 rounded-lg shadow-lg z-50 flex flex-col ${
          menu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleMenu}
            className="p-4 text-white hover:text-red-600"
          >
            <FaXmark size={25} />
          </button>
          <Link to="/">
            <div className="p-4 text-white hover:text-blue-600 transition-all">
              <FaHome size={25} />
            </div>
          </Link>
        </div>
        <div className="overflow-y-auto">
          {conversations.map((conversation) => (
            <div className="flex flex-row group">
              <button
                key={conversation.id}
                className={`w-11/12 text-start p-2 m-2 transition-all hover:bg-gray-700 text-white rounded-md ${
                  selectedConversation?.id === conversation.id
                    ? "bg-gray-700"
                    : ""
                }`}
                onClick={() => loadConversation(conversation)}
              >
                {conversation.messages[0]?.text.substring(0, 30) ||
                  "Nueva conversación"}
              </button>
              {/* Botón del tacho que aparece en hover */}
              <button
                className={`p-2 text-white hover:text-red-500 opacity-0 group-hover:opacity-100 duration-300 transition-all
                ${
                  selectedConversation?.id === conversation.id
                    ? "opacity-100"
                    : "opacity-0"
                }`}
                onClick={() => handleDelete(conversation.id)}
              >
                <FaTrash size={20} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-auto flex justify-center">
          <button
            className="w-11/12 p-2 m-2 border bg-[rgb(27,30,31)] border-transparent transition-all hover:border-gray-700 text-white rounded-md"
            onClick={startNewConversation}
          >
            Nueva conversación
          </button>
        </div>
      </div>
      <div
        className={`flex justify-center h-screen transition-margin duration-300 ease-in-out ${
          menu ? "ml-64" : "ml-0"
        }${messages.length === 0 ? "items-center" : "items-end"}`}
      >
        <div className="flex flex-col justify-center items-center max-w-3xl w-full p-4">
          <div className="flex-grow overflow-y-auto no-scrollbar flex flex-col-reverse w-full">
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
                        {message.sender === "bot" && (
                          <button
                            onClick={() => speakText(message.text)}
                            className="ml-4"
                          >
                            <MdRecordVoiceOver size={25} color="white" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center border rounded-2xl border-gray-800 hover:border-gray-700 bg-[rgb(27,30,31)] p-4 shadow-md mt-4 w-full">
            <FileUpload onChange={handleFileChange} ref={fileUploadRef} />
            <button
              className="mt-4 w-full flex items-center justify-center px-3 py-3 bg-[rgb(38,39,40)] text-white rounded-xl hover:bg-[rgb(22,22,23)] transition-colors focus:outline-none"
              onClick={handleSend}
              onKeyPress={handleKeyPress}
              disabled={isTranscribing}
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
