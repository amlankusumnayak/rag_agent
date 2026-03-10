// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global reset & base styles
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; width: 100%; overflow: hidden; }
  body { background: #050b15; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #334155; }

  /* Spinner */
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* Markdown tables */
  .prose table { width: 100%; border-collapse: collapse; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
