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

// 1️⃣ Polyfills must be first
import { Buffer } from "buffer";
import process from "process"; // ✅ just "process", no "/browser"

// 2️⃣ Attach to global/window
if (typeof global === "undefined") window.global = window;
window.Buffer = Buffer;
window.process = process;

// 3️⃣ Normal React imports
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

