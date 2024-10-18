import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  FaArrowUp,
  FaCopy,
  FaCheck,
  FaPaperclip,
  FaHome,
  FaImage,
  FaTrash,
} from "react-icons/fa";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { TypewriterEffectSmooth } from "../acernity/TypingEffect";
import { GiHamburgerMenu } from "react-icons/gi";
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
  deleteDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import logo from "../img/logo.png";
import logo1 from "../img/logo1.png";
import Toastify from "toastify-js";
import { FaXmark } from "react-icons/fa6";
import { FaArrowRight } from "react-icons/fa";

const genAI = new GoogleGenerativeAI("AIzaSyDu9bI10L_Ueuq2iY8pe0E8xqoEZVDSaws");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const isViewTransitionSupported = () => "startViewTransition" in document;

export default function TextChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [copiedStates, setCopiedStates] = useState({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [menu, setMenu] = useState(false);
  const [conversations, setConversations] = useState([]);
  const { userId } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const fileInputRef1 = useRef(null);

  const words = [
    { text: "How" },
    { text: "can" },
    { text: "Gemini", className: "text-blue-500 dark:text-blue-500" },
    { text: "help" },
    { text: "you" },
    { text: "today?" },
  ];

  useEffect(() => {
    if (fileInputRef.current === null) {
      console.error(
        "El fileInputRef está en null después de montarse el componente."
      );
    } else {
      console.log("El fileInputRef está correctamente asignado.");
    }
    if (fileInputRef1.current === null) {
      console.error(
        "El fileInputRef está en null después de montarse el componente."
      );
    } else {
      console.log("El fileInputRef está correctamente asignado.");
    }

    const fetchConversations = async () => {
      if (!userId) return;

      try {
        const q = query(
          collection(db, "conversations"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedConversations = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (fetchedConversations.length > 0) {
          setMessages(fetchedConversations[0].messages);
          setSelectedConversation(fetchedConversations[0]);
        }

        setConversations(fetchedConversations);
      } catch (error) {
        console.error("Error fetching conversations: ", error);
      }
    };

    fetchConversations();
  }, [userId]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const fileContent = await readFileAsBase64(file);
        setSelectedFile({
          name: file.name,
          type: file.type,
          content: fileContent,
        });
      } catch (error) {
        console.error("Error reading file:", error);
        showToast("Error reading file. Please try again.", "error");
      }
    }
  };

  const handleFileSelect1 = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const fileContent = await readFileAsBase64(file);
        setSelectedFile({
          name: file.name,
          type: file.type,
          content: fileContent,
        });
      } catch (error) {
        console.error("Error reading file:", error);
        showToast("Error reading file. Please try again.", "error");
      }
    }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    if (input.trim() || selectedFile) {
      const newMessage = {
        id: Date.now(),
        sender: "user",
        text: input,
        fileName: selectedFile ? selectedFile.name : null,
        fileType: selectedFile ? selectedFile.type : null,
        fileContent: selectedFile ? selectedFile.content : null,
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput("");

      const loadingMessageId = Date.now() + 1;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: loadingMessageId,
          sender: "bot",
          text: "",
          isLoading: true,
        },
      ]);

      try {
        setIsStreaming(true);

        const context = messages
          .map(
            (msg) => `${msg.sender === "user" ? "User" : "Bot"}: ${msg.text}`
          )
          .join("\n");

        const prompt = `${context}\nUser: ${input}`;
        const parts = [{ text: prompt }];

        if (selectedFile) {
          parts.push({
            inlineData: {
              mimeType: selectedFile.type,
              data: selectedFile.content,
            },
          });
        }

        let retries = 0;
        let success = false;

        while (retries < MAX_RETRIES && !success) {
          try {
            const result = await model.generateContentStream(parts);
            let botResponse = "";

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              botResponse += chunkText;

              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === loadingMessageId
                    ? { ...msg, text: botResponse }
                    : msg
                )
              );
            }

            success = true;

            const updatedMessages = [
              ...messages,
              newMessage,
              { id: loadingMessageId, sender: "bot", text: botResponse },
            ];

            // Save the conversation to Firestore
            const conversationRef = selectedConversation
              ? doc(db, "conversations", selectedConversation.id)
              : doc(collection(db, "conversations"));

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
                    ? {
                        ...conv,
                        messages: updatedMessages,
                        timestamp: new Date(),
                      }
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
            console.error("Error generating content:", error);
            retries++;
            if (retries < MAX_RETRIES) {
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            } else {
              throw error;
            }
          }
        }

        setIsStreaming(false);
        setSelectedFile(null);
      } catch (error) {
        setIsStreaming(false);
        console.error("Error generating content:", error);
        showToast(
          "An error occurred while generating content. Please try again later.",
          "error"
        );
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === loadingMessageId
              ? {
                  ...msg,
                  text: "An error occurred. Please try again.",
                  isLoading: false,
                }
              : msg
          )
        );
      }
    }
  };

  const handleMenu = () => {
    setMenu((prev) => !prev);
  };

  const showToast = (message, type = "info") => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "center",
      style: {
        background:
          type === "error"
            ? "linear-gradient(to right, #ff5f6d, #ffc371)"
            : "linear-gradient(to right, #00b09b, #96c93d)",
      },
    }).showToast();
  };

  const handleDelete = async (conversationId) => {
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
      setMessages([]);
    }

    try {
      await deleteDoc(doc(db, "conversations", conversationId));
      setConversations((prevConversations) =>
        prevConversations.filter((conv) => conv.id !== conversationId)
      );

      Toastify({
        text: "Conversación eliminada",
        duration: 2000,
        destination: "https://github.com/apvarun/toastify-js",
        newWindow: true,
        close: true,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
          background: "red",
        },
        onClick: function () {},
      }).showToast();
    } catch (error) {
      console.error("Error deleting conversation: ", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  const copyToClipboard = useCallback((text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    });
  }, []);

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const id = Math.random().toString(36).substr(2, 9);

      return !inline && match ? (
        <div className="relative max-w-3xl">
          <SyntaxHighlighter
            style={atomDark}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
          <button
            onClick={() => copyToClipboard(String(children), id)}
            className="absolute top-2 right-2 p-2 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            aria-label="Copiar código"
          >
            {copiedStates[id] ? (
              <FaCheck className="text-green-400" />
            ) : (
              <FaCopy className="text-gray-300" />
            )}
          </button>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    img({ src, alt }) {
      return (
        <img
          src={src}
          alt={alt}
          className="rounded-lg my-4 max-w-full h-auto"
        />
      );
    },
  };

  const renderAttachment = (message) => {
    if (message.fileType?.startsWith("image/")) {
      return (
        <img
          src={`data:${message.fileType};base64,${message.fileContent}`}
          alt="Attached image"
          className="rounded-lg mb-2 w-72"
        />
      );
    } else if (message.fileName) {
      return (
        <div className="text-sm text-gray-400 mb-1 flex items-center">
          <FaPaperclip className="mr-1" />
          Archivo adjunto: {message.fileName}
        </div>
      );
    }
    return null;
  };

  const handleNavigation = (path) => {
    if (isViewTransitionSupported()) {
      document.startViewTransition(() => {
        navigate(path);
      });
    } else {
      navigate(path);
    }
  };

  return (
    <div className="bg-[rgb(22,24,25)] h-screen">
      <button
        className="sm:flex hidden absolute right-4 top-1/2 transform -translate-y-1/2 p-4"
        onClick={() => handleNavigation("/imggenerator")}
        title="Image Generator"
      >
        <FaArrowRight size={30} color="white" />
      </button>
      <button onClick={handleMenu} className="absolute p-8">
        <GiHamburgerMenu size={25} color="white" />
      </button>
      <div
        className={`absolute transition-transform duration-300 ease-in-out top-0 left-0 h-full sm:w-64 w-screen bg-[rgb(22,24,25)] border-r border-gray-800 rounded-lg shadow-lg flex flex-col ${
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
            <div key={conversation.id} className="flex flex-row group">
              <button
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
        className={`justify-center h-screen transition-margin duration-300 ease-in-out ${
          menu ? "ml-64 hidden sm:flex" : "flex ml-0"
        }`}
      >
        <div className="flex flex-col p-4 w-full max-w-3xl">
          {messages.length === 0 && (
            <div className="flex justify-center flex-col items-center h-full">
              <TypewriterEffectSmooth words={words} />
              <div className="flex flex-col items-center w-full border rounded-2xl border-gray-800 hover:border-gray-700 bg-[rgb(27,30,31)] p-2 shadow-md mt-4">
                {selectedFile && (
                  <div className="text-white text-sm mb-2">
                    Archivo seleccionado: {selectedFile.name}
                  </div>
                )}
                <div className="flex w-full">
                  <button
                    className="ml-2 mr-1 rotate-pedro text-white rounded-xl focus:outline-none"
                    onClick={() => fileInputRef.current.click()}
                    title="Adjuntar archivo"
                  >
                    <FaPaperclip size={18} color="gray" />
                  </button>
                  <textarea
                    className="flex-grow caret-white p-3 bg-[rgb(27,30,31)] text-white focus:outline-none focus:placeholder:text-white transition-colors resize-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    rows={1}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.txt,.pdf,.doc,.docx"
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
          )}
          <div className="flex-grow overflow-y-auto no-scrollbar flex flex-col-reverse">
            <div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  } mb-4`}
                >
                  <div
                    className={`max-w-72 sm:max-w-3xl rounded-3xl px-5 py-3 ${
                      message.sender === "user"
                        ? "bg-[rgb(38,39,40)] text-white"
                        : "text-white leading-loose bot-message"
                    }`}
                  >
                    {message.isLoading && isStreaming ? (
                      <div className="flex items-center">
                        <img
                          src={logo}
                          alt="Logo girando"
                          className="w-6 h-6 mr-3 animate-spin"
                        />
                        {message.text}
                      </div>
                    ) : (
                      <div className="flex items-start flex-col">
                        {message.sender === "bot" ? (
                          <img
                            src={logo1}
                            alt="Logo"
                            className="w-8 h-8 mb-2"
                          />
                        ) : (
                          renderAttachment(message)
                        )}
                        {message.sender === "bot" ? (
                          <div className="max-w-2xl">
                            <Markdown
                              components={MarkdownComponents}
                              remarkPlugins={[remarkGfm]}
                              className="markdown"
                            >
                              {message.text}
                            </Markdown>
                          </div>
                        ) : (
                          <div>{message.text}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className={`flex flex-col items-center w-full border rounded-2xl border-gray-800 hover:border-gray-700 bg-[rgb(27,30,31)] p-2 shadow-md mt-4
              ${messages.length === 0 ? "hidden" : "flex"}`}
          >
            {selectedFile && (
              <div className="text-white text-sm mb-2">
                Archivo seleccionado: {selectedFile.name}
              </div>
            )}
            <div className="flex w-full">
              <button
                className="ml-2 mr-1 relative rotate-pedro text-white rounded-xl focus:outline-none"
                onClick={() => fileInputRef1.current?.click()}
                title="Adjuntar archivo"
              >
                <FaPaperclip size={18} color="gray" />
              </button>
              <textarea
                className="flex-grow caret-white p-3 bg-[rgb(27,30,31)] text-white focus:outline-none focus:placeholder:text-white transition-colors resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                rows={1}
              />
              <input
                type="file"
                ref={fileInputRef1}
                onChange={handleFileSelect1}
                className="hidden"
                accept="image/*,.txt,.pdf,.doc,.docx"
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
    </div>
  );
}
