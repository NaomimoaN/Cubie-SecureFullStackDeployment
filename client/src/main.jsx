/**
 * @purpose Serves as the entry point of the React application.
 * It renders the root component (`App`) into the DOM, ensuring strict mode for development.
 * This sets up the initial rendering and environment for the entire application.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
