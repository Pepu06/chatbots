import React, { useState, useCallback } from "react";
import { FaArrowUp, FaCopy, FaCheck } from "react-icons/fa";
import { GoogleGenerativeAI } from "@google/generative-ai";
import logo from "../img/logo.png";
import logo1 from "../img/logo1.png";
import { Link } from "react-router-dom";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const TextChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [copiedStates, setCopiedStates] = useState({});
  const [isStreaming, setIsStreaming] = useState(false);

  const genAI = new GoogleGenerativeAI(
    "AIzaSyDaByQuxXk1KhZTZGBG4wxBZNalZJxyFPs"
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const handleSend = async () => {
    if (input.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, sender: "user", text: input },
      ]);
      setInput("");

      const loadingMessageId = messages.length + 2;
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

        const result = await model.generateContentStream(input);
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

        setIsStreaming(false);
      } catch (error) {
        setIsStreaming(false);
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
    <div className="bg-[rgb(22,24,25)] min-h-screen">
      <div className="absolute sm:m-8 ml-4">
        <Link to="/" className="m-5">
          <img src={logo1} alt="Home" className="h-8 w-8" />
        </Link>
      </div>
      <div className="flex justify-center">
        <div className="flex flex-col h-screen p-4 w-full max-w-3xl">
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
                        : "text-white leading-loose"
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
                            alt="Logo 1"
                            className="w-6 h-6 mr-3 mt-1"
                          />
                        )}
                        <Markdown
                          components={MarkdownComponents}
                          className="markdown max-w-xs sm:max-w-lg prose prose-invert"
                          remarkPlugins={[remarkGfm]}
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
          <div className="flex items-center border rounded-2xl border-gray-800 hover:border-gray-700 bg-[rgb(27,30,31)] p-2 shadow-md mt-4">
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
};

export default TextChat;
