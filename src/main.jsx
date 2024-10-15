import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

// Import your publishable key
const PUBLISHABLE_KEY =
  "pk_test_Y29zbWljLWZlcnJldC00MC5jbGVyay5hY2NvdW50cy5kZXYk";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        signIn: {
          baseTheme: dark,
        },
        signUp: {
          baseTheme: dark,
        },
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
