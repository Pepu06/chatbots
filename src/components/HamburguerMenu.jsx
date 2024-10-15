import { GiHamburgerMenu } from "react-icons/gi";
import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";


const HamburguerMenu = () => {
  return (
    <div>
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
    </div>
  );
};

export default HamburguerMenu;
