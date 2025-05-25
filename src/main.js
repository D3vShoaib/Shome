import "./style.css";
import { initPWA } from "./pwa.js";

const app = document.querySelector("#app");
app.innerHTML = `
  <div></div>
`;
initPWA(app);
