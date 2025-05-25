import "./style.css";
import { initPWA } from "./pwa.js";
import { bangs } from "./bang.js";
import { getSortedSuggestions } from "./utils/googleSuggestParser.js";

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
      <div class="search-container">
        <div class="search-wrapper">
          <div class="selected-website" id="selected-website"></div>
          <input
            class="search-input"
            type="text"
            placeholder="Search with !bangs..."
            id="search-input"
            autocomplete="off"
          />
        </div>
        <div class="dropdown" id="search-dropdown">
          <div class="bangs-container" id="bangs-container"></div>
          <div class="suggestions-container" id="suggestions-container"></div>
        </div>
      </div>
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

// Initialize PWA
initPWA(app);

// Search functionality
const searchInput = document.getElementById("search-input");
const searchDropdown = document.getElementById("search-dropdown");
const bangsContainer = document.getElementById("bangs-container");
const suggestionsContainer = document.getElementById("suggestions-container");
const selectedWebsite = document.getElementById("selected-website");

// Current state
let selectedBang = null;
let currentQuery = "";

// Filter bangs based on input
function filterBangs(query) {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();
  return bangs
    .filter(
      (bang) =>
        bang.t.toLowerCase().includes(lowerQuery) ||
        bang.s.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 5); // Limit to 5 results
}

// Fetch Google suggestions
async function fetchGoogleSuggestions(query) {
  if (!query) return [];

  try {
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
        query
      )}`,
      { mode: "cors" }
    );
    const data = await response.json();
    return getSortedSuggestions(data);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}

// Update UI with bangs and suggestions
async function updateSearchResults() {
  const query = searchInput.value.trim();
  currentQuery = query;

  if (!query) {
    searchDropdown.style.display = "none";
    return;
  }

  // If a bang is already selected, only show suggestions
  if (selectedBang) {
    bangsContainer.style.display = "none";
    const suggestions = await fetchGoogleSuggestions(query);
    renderSuggestions(suggestions);
    if (suggestions.length > 0) {
      searchDropdown.style.display = "block";
    } else {
      searchDropdown.style.display = "none";
    }
    return;
  }

  // Otherwise show both bangs and suggestions
  const filteredBangs = filterBangs(query);
  const suggestions = await fetchGoogleSuggestions(query);

  renderBangs(filteredBangs);
  renderSuggestions(suggestions);

  if (filteredBangs.length > 0 || suggestions.length > 0) {
    searchDropdown.style.display = "block";
  } else {
    searchDropdown.style.display = "none";
  }
}

// Render bangs in the dropdown
function renderBangs(filteredBangs) {
  if (filteredBangs.length === 0) {
    bangsContainer.style.display = "none";
    return;
  }

  bangsContainer.style.display = "block";
  bangsContainer.innerHTML = `
    <div class="dropdown-section-title">Websites</div>
    <div class="bangs-list">
      ${filteredBangs
        .map(
          (bang) => `
        <div class="bang-item" data-bang="${bang.t}">
          <div class="bang-name">${bang.s}</div>
          <div class="bang-domain">${bang.d}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  // Add click event listeners to bang items
  document.querySelectorAll(".bang-item").forEach((item) => {
    item.addEventListener("click", () => {
      const bangKey = item.getAttribute("data-bang");
      selectBang(bangKey);
    });
  });
}

// Render suggestions in the dropdown
function renderSuggestions(suggestions) {
  if (suggestions.length === 0) {
    suggestionsContainer.style.display = "none";
    return;
  }

  suggestionsContainer.style.display = "block";
  suggestionsContainer.innerHTML = `
    <div class="dropdown-section-title">Google Suggestions</div>
    <div class="suggestions-list">
      ${suggestions
        .map(
          (suggestion) => `
        <div class="suggestion-item">
          ${suggestion.text}
        </div>
      `
        )
        .join("")}
    </div>
  `;

  // Add click event listeners to suggestion items
  document.querySelectorAll(".suggestion-item").forEach((item) => {
    item.addEventListener("click", () => {
      searchInput.value = item.textContent.trim();
      searchDropdown.style.display = "none";
      if (selectedBang) {
        performSearch();
      }
    });
  });
}

// Select a bang
function selectBang(bangKey) {
  selectedBang = bangs.find((bang) => bang.t === bangKey);
  searchInput.placeholder = `Search ${selectedBang.s}...`;
  selectedWebsite.textContent = selectedBang.s;
  selectedWebsite.style.display = "flex";
  searchInput.value = "";
  searchInput.focus();
  searchDropdown.style.display = "none";
}

// Perform the search
function performSearch() {
  if (!searchInput.value.trim()) return;

  if (selectedBang) {
    const searchTerm = encodeURIComponent(searchInput.value.trim());
    const url = selectedBang.u.replace("{{{s}}}", searchTerm);
    window.location.href = url;
  } else {
    // Default to Google search if no bang selected
    const searchTerm = encodeURIComponent(searchInput.value.trim());
    window.location.href = `https://www.google.com/search?q=${searchTerm}`;
  }
}

// Reset the search
function resetSearch() {
  selectedBang = null;
  searchInput.placeholder = "Search with !bangs...";
  selectedWebsite.textContent = "";
  selectedWebsite.style.display = "none";
  searchInput.value = "";
  searchDropdown.style.display = "none";
}

// Event listeners
searchInput.addEventListener("input", debounce(updateSearchResults, 300));
searchInput.addEventListener("focus", updateSearchResults);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    performSearch();
  } else if (e.key === "Escape") {
    if (selectedBang) {
      resetSearch();
    } else {
      searchDropdown.style.display = "none";
    }
  }
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
    searchDropdown.style.display = "none";
  }
});

// Debounce function to limit API calls
function debounce(func, delay) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}
