/*
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
*/

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ✅ Polyfills for browser
import { Buffer } from "buffer";

// Attach polyfills to window/globalThis
if (typeof global === "undefined") {
  window.global = window; // Polyfill global
}
window.Buffer = Buffer;
window.process = { env: {} }; // Minimal polyfill for process.env

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
