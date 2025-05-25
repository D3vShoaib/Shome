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
let emptyBackspaceCount = 0;

// Default Google search bang
const defaultGoogleBang = {
  s: "Google",
  t: "google",
  u: "https://www.google.com/search?q={{{s}}}",
};

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
    // Using AllOrigins CORS proxy
    const corsProxy = "https://api.allorigins.win/raw?url=";

    // Use standard Google suggest API parameters
    // - client=chrome: Chrome client for better suggestions format
    // - hl=en: Language hint (change as needed)
    // - gl=us: Geolocation hint (change as needed)
    const googleSuggestUrl = `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&gl=us&q=${encodeURIComponent(
      query
    )}`;

    try {
      const response = await fetch(
        `${corsProxy}${encodeURIComponent(googleSuggestUrl)}`
      );

      if (response.ok) {
        const data = await response.json();
        return getSortedSuggestions(data);
      }
    } catch (proxyError) {
      console.warn(`AllOrigins proxy failed:`, proxyError);
      // Fall through to the fallback
    }

    // If proxy fails, return fallback suggestions based on the query
    console.warn("AllOrigins proxy failed, using fallback suggestions");
    return createFallbackSuggestions(query);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}

// Create fallback suggestions when proxies fail
function createFallbackSuggestions(query) {
  // Simple fallback that creates variations of the query
  const suggestions = [
    { text: query, relevance: 100 },
    { text: query + " tutorial", relevance: 90 },
    { text: query + " examples", relevance: 80 },
    { text: query + " meaning", relevance: 70 },
    { text: "how to " + query, relevance: 60 },
  ];

  return suggestions;
}

// Update UI with bangs and suggestions
async function updateSearchResults() {
  const fullValue = searchInput.value.trim();
  let query = fullValue;

  if (!fullValue) {
    searchDropdown.style.display = "none";
    return;
  }

  // If a bang is already selected, only show suggestions for the query part
  if (selectedBang) {
    const parts = fullValue.split(" | ");
    query = parts.length > 1 ? parts[1].trim() : "";
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

  // Always render bangs first, then suggestions below
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
      const suggestionText = item.textContent.trim();
      if (selectedBang) {
        searchInput.value = `${selectedBang.s} | ${suggestionText}`;
      } else {
        searchInput.value = suggestionText;
      }
      searchDropdown.style.display = "none";
      performSearch();
    });
  });
}

// Select a bang
function selectBang(bangKey) {
  selectedBang = bangs.find((bang) => bang.t === bangKey);
  searchInput.placeholder = "Type to search...";
  searchInput.value = `${selectedBang.s} | `;
  searchInput.focus();
  searchDropdown.style.display = "none";
  // Place cursor after the separator
  const cursorPosition = searchInput.value.length;
  searchInput.setSelectionRange(cursorPosition, cursorPosition);
}

// Perform the search
function performSearch() {
  if (!searchInput.value.trim()) return;
  let searchTerm;
  if (selectedBang) {
    // Extract query part after the separator
    const parts = searchInput.value.split(" | ");
    searchTerm = parts.length > 1 ? parts[1].trim() : "";
    if (!searchTerm) return;

    // Use selected bang
    const url = selectedBang.u.replace(
      "{{{s}}}",
      encodeURIComponent(searchTerm)
    );
    window.location.href = url;
  } else {
    // Use default Google search
    searchTerm = searchInput.value.trim();
    const url = defaultGoogleBang.u.replace(
      "{{{s}}}",
      encodeURIComponent(searchTerm)
    );
    window.location.href = url;
  }
}

// Reset the search
function resetSearch() {
  selectedBang = null;
  searchInput.placeholder = "Search with !bangs...";
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
  } else if (e.key === "Backspace" && selectedBang) {
    const parts = searchInput.value.split(" | ");
    const query = parts.length > 1 ? parts[1].trim() : "";
    if (!query) {
      emptyBackspaceCount++;
      if (emptyBackspaceCount === 2) {
        // Second backspace with no query - reset the search
        e.preventDefault();
        resetSearch();
        emptyBackspaceCount = 0;
      }
    } else {
      emptyBackspaceCount = 0;
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
