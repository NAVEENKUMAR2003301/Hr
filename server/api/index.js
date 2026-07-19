// Vercel's Node runtime treats an exported Express app as a request handler
// directly — no separate adapter needed. `vercel.json` rewrites every request
// here, so this one function serves the whole API (Express does its own
// internal routing exactly as it does locally).
import app from "../src/app.js";

export default app;
