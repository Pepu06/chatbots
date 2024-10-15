import React, { useState, useCallback, useEffect } from "react";
import { FaArrowUp, FaCopy, FaCheck } from "react-icons/fa";
import { GoogleGenerativeAI } from "@google/generative-ai";
import logo from "../img/logo.png";
import logo1 from "../img/logo1.png";
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
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { FaHome } from "react-icons/fa";

export default function TextChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [copiedStates, setCopiedStates] = useState({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [menu, setMenu] = useState(false);
  const [conversations, setConversations] = useState([]);
  const userId = useAuth()["userId"];
  const [selectedConversation, setSelectedConversation] = useState(null);

  const genAI = new GoogleGenerativeAI(
    "AIzaSyDaByQuxXk1KhZTZGBG4wxBZNalZJxyFPs"
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const words = [
    { text: "How" },
    { text: "can" },
    { text: "Gemini", className: "text-blue-500 dark:text-blue-500" },
    { text: "help" },
    { text: "you" },
    { text: "today?" },
  ];

  useEffect(() => {
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
        setConversations(fetchedConversations);
      } catch (error) {
        console.error("Error fetching conversations: ", error);
      }
    };

    fetchConversations();
  }, [userId]);

  const handleSend = async () => {
    if (input.trim()) {
      const newMessage = { id: Date.now(), sender: "user", text: input };
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

        const prompt = `${context}\nUser: ${input}\nBot:`;

        const result = await model.generateContentStream(prompt);
        let botResponse = "";

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          botResponse += chunkText;

          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === loadingMessageId ? { ...msg, text: botResponse } : msg
            )
          );
        }

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

        setIsStreaming(false);
      } catch (error) {
        setIsStreaming(false);
        console.error("Error generating content:", error);
      }
    }
  };

  const handleMenu = () => {
    setMenu((prev) => !prev);
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
        <div className="relative">
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
            className="absolute top-2 left-2 p-2 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
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
  };

  return (
    <div className="bg-[rgb(22,24,25)] h-screen">
      <button onClick={handleMenu} className="absolute p-8">
        <GiHamburgerMenu size={25} color="white" />
      </button>
      <div
        className={`absolute transition-transform duration-300 ease-in-out top-0 left-0 h-full sm:w-64 w-screen bg-[rgb(22,24,25)] border-r border-gray-800 rounded-lg shadow-lg flex flex-col ${
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
        className={`absolute transition-transform duration-300 ease-in-out top-0 left-0 h-full sm:w-64 w-screen bg-[rgb(22,24,25)] border-r border-gray-800 rounded-lg shadow-lg flex flex-col ${
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
          {messages.length === 0 && (
            <div className="flex justify-center flex-col items-center h-full">
              <TypewriterEffectSmooth words={words} />
              <div className="flex items-center w-full border rounded-2xl border-gray-800 hover:border-gray-700 bg-[rgb(27,30,31)] p-2 shadow-md mt-4">
                <textarea
                  className="flex-grow caret-white p-3 bg-[rgb(27,30,31)] text-white focus:outline-none focus:placeholder:text-white transition-colors resize-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  rows={1}
                />
                <button
                  className="ml-2 px-3 py-3 bg-[rgb(38,39,40)] text-white rounded-xl hover:bg-blue-600 transition-colors focus:outline-none"
                  onClick={handleSend}
                >
                  <FaArrowUp color="gray" />
                </button>
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
                    className={`max-w-72 sm:max-w-lg rounded-3xl px-5 py-3 ${
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
                      <div className="flex items-start">
                        {message.sender === "bot" && (
                          <img
                            src={logo1}
                            alt="Logo"
                            className="w-8 h-8 mr-2"
                          />
                        )}
                        <Markdown
                          components={MarkdownComponents}
                          remarkPlugins={[remarkGfm]}
                          className="markdown"
                        >
                          {message.text}
                        </Markdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className={`items-center w-full border rounded-2xl border-gray-800 hover:border-gray-700 bg-[rgb(27,30,31)] p-2 shadow-md mt-4
              ${messages.length === 0 ? "hidden" : "flex"}`}
          >
            <textarea
              className="flex-grow caret-white p-3 bg-[rgb(27,30,31)] text-white focus:outline-none focus:placeholder:text-white transition-colors resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              rows={1}
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
}
