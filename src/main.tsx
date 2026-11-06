// Website dibuat oleh: Nicola Ananda Dwi Ervantoro
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

let reports = 0;
const report = (kind: string, value: unknown) => {
  if (reports++ >= 5) return;
  const code = value instanceof Error ? value.name : typeof value;
  const apiBase = import.meta.env.VITE_API_URL || "";
  fetch(`${apiBase}/api/client-errors`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, code: code.slice(0, 200), route: location.pathname.slice(0, 200) }), keepalive: true }).catch(() => {});
};
window.addEventListener("error", event => report("error", event.error));
window.addEventListener("unhandledrejection", event => report("unhandledrejection", event.reason));

createRoot(document.getElementById("root")!).render(<App />);
