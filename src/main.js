import "./style.css";
import { initPWA } from "./pwa.js";

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="shome-container">
    <div class="box"></div>
    <div class="box-title">
      <img class="title-svg" src="/favicon.svg" alt="Shome Logo" />
    </div>
    <div class="box"></div>
    <div class="box-mid"></div>
    <div class="box-mid">
      <input
        class="search-input"
        type="text"
        placeholder="Search with !bangs..."
        id="search-input"
      />
    </div>
    <div class="box-mid"></div>
    <div class="box"></div>
    <div class="box"></div>
    <div class="box"></div>
  </div>
  <div id="pwa-toast" class="pwa-toast">
    <div class="pwa-toast-wrapper">
      <div class="pwa-toast-content">
        <div class="message">
          <span id="toast-message">hello</span>
        </div>
      </div>
      <div class="pwa-toast-actions">
        <button id="pwa-refresh">Refresh</button>
        <button id="pwa-close">Close</button>
      </div>
    </div>
  </div>
`;

initPWA(app);
