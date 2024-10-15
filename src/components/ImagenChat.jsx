import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import logo from "../img/logo.png";
import logo1 from "../img/logo1.png";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import db from "../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { uploadImage } from "../firebase/config";
import { InfiniteMovingCardsDemo } from "./InfiniteMovingCardsDemo";
import { FaHome } from "react-icons/fa";

const ImagenChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [menu, setMenu] = useState(false);
  const [conversations, setConversations] = useState([]);
  const { userId } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) return;

      try {
        const q = query(
          collection(db, "conversacionImg"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedConversations = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConversations(fetchedConversations);
      } catch (error) {
        console.error("Error fetching conversations: ", error);
      }
    };

    fetchConversations();
  }, [userId]);

  const handleSend = async () => {
    if (input.trim()) {
      setConversationStarted(true);
      const newMessage = { id: Date.now(), sender: "user", text: input };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput("");
      setLoading(true);

      const loadingMessageId = Date.now() + 1;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: loadingMessageId,
          sender: "bot",
          text: "Generando imagen...",
          isLoading: true,
        },
      ]);

      try {
        const response = await fetchImage({ inputs: input });
        const imageBlob = response;
        const imageUrl = await uploadImage(imageBlob); // Subir el blob y obtener la URL

        const botMessage = {
          id: Date.now() + 2,
          sender: "bot",
          imageUrl: imageUrl,
        };

        const updatedMessages = [...messages, newMessage, botMessage];

        setMessages(updatedMessages);

        // Save the conversation to Firestore
        const conversationRef = selectedConversation
          ? doc(db, "conversacionImg", selectedConversation.id)
          : doc(collection(db, "conversacionImg"));

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
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now() + 3,
            sender: "bot",
            text: "Hubo un problema al generar la imagen.",
          },
        ]);
        console.error("Error generating image: ", error);
      }
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleMenu = () => {
    setMenu((prev) => !prev);
  };

  const loadConversation = (conversation) => {
    setMessages(conversation.messages);
    setSelectedConversation(conversation);
    setConversationStarted(true);
    setMenu(false); // Cerrar el menú al seleccionar una conversación
  };

  const startNewConversation = () => {
    setMessages([]);
    setSelectedConversation(null);
    setConversationStarted(false);
  };

  return (
    <div className="bg-[rgb(22,24,25)] h-screen">
      <button onClick={handleMenu} className="absolute p-8">
        <GiHamburgerMenu size={25} color="white" />
      </button>
      <div
        className={`absolute transition-transform duration-300 ease-in-out top-0 left-0 h-full sm:w-64 w-screen bg-[rgb(22,24,25)] border-r border-gray-800 rounded-lg shadow-lg z-50 flex flex-col ${
          menu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <button onClick={handleMenu} className="p-4">
            <GiHamburgerMenu size={25} color="white" />
          </button>
          <Link to="/">
            <div className="p-4">
              <FaHome color="white" size={25} />
            </div>
          </Link>
        </div>
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className={`w-11/12 text-start p-2 m-2 transition-all hover:bg-gray-700 text-white rounded-md ${
              selectedConversation?.id === conversation.id ? "bg-gray-700" : ""
            }`}
            onClick={() => loadConversation(conversation)}
          >
            {conversation.messages[0]?.text.substring(0, 30) ||
              "Nueva conversación"}
          </button>
        ))}
        <div className="mt-auto flex justify-center">
          <button
            className="w-11/12 p-2 m-2 border bg-gray-700 border-gray-800 text-white rounded-md"
            onClick={startNewConversation}
          >
            Nueva conversación
          </button>
        </div>
      </div>
      <div
        className={`flex justify-center h-screen transition-margin duration-300 ease-in-out ${
          menu ? "ml-64" : "ml-0"
        }`}
      >
        <div className="flex flex-col p-4 w-full max-w-3xl">
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
                          className="w-6 h-6 mr-2 animate-spin"
                        />
                        Generando imagen...
                      </div>
                    )}
                    {!message.isLoading && (
                      <div className="flex items-center">
                        {message.sender === "bot" && (
                          <>
                            <img src={logo1} alt="Logo 1" className="w-6 h-6" />
                            {message.text}
                          </>
                        )}
                        {message.imageUrl ? null : message.text}
                      </div>
                    )}
                  </div>
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
          {!conversationStarted && (
            <div className="flex-col justify-center items-center h-full mt-32 sm:mt-40">
              <h1 className="items-center justify-center text-center">
                <span className="text-white text-2xl">
                  ¡Prueba a generar una imagen como estas!
                </span>
              </h1>
              <InfiniteMovingCardsDemo />
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

async function fetchImage(data) {
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
