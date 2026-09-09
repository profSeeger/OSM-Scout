// OSM Scout v0.1.0
// Responsibility: initialize the map, city search, drawing workflow, Overpass queries,
// feature rendering, and the initial results summary.

(() => {
  "use strict";

  const VERSION = "0.1.0";
  const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
  const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
  const DEFAULT_CENTER = [42.02, -94.05];
  const DEFAULT_ZOOM = 9;

  const TAG_DESCRIPTIONS = {
    amenity: "Public and commercial facilities such as restaurants, schools, and parking.",
    building: "Structures and buildings such as houses, schools, and commercial buildings.",
    shop: "Retail stores where goods are sold, such as supermarkets and bakeries."
  };

  const root = document.getElementById("osmScoutApp");
  if (!root || typeof L === "undefined") return;

  root.querySelectorAll("[data-version]").forEach(el => {
    el.textContent = `v${VERSION}`;
  });

  const cityInput = document.getElementById("cityName");
  const citySearchButton = document.getElementById("citySearchButton");
  const drawAreaButton = document.getElementById("drawAreaButton");
  const clearAreaButton = document.getElementById("clearAreaButton");
  const areaStatus = document.getElementById("areaStatus");
  const tagKey = document.getElementById("tagKey");
  const tagDescription = document.getElementById("tagDescription");
  const runSearchButton = document.getElementById("runSearch");
  const clearResultsButton = document.getElementById("clearResultsButton");
  const output = document.getElementById("output");
  const mapStatus = document.getElementById("mapStatus");
  const fitResults = document.getElementById("fitResults");

  const map = L.map("map", { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  }).addTo(map);

  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  const resultsLayer = L.layerGroup().addTo(map);
  let selectedArea = null;
  let selectedAreaLabel = "";
  let lastFeatures = [];

  if (L.Control.Draw) {
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: "#2f6948", weight: 2 }
        },
        rectangle: {
          shapeOptions: { color: "#2f6948", weight: 2 }
        },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (event) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      selectedArea = event.layer;
      selectedAreaLabel = "Custom drawn area";
      cityInput.value = "";
      areaStatus.textContent = "Custom drawn area selected.";
      clearAreaButton.classList.remove("hidden");
      mapStatus.textContent = "Custom area selected. Choose a tag and run the search.";
    });

    map.on(L.Draw.Event.EDITED, () => {
      const layers = drawnItems.getLayers();
      if (layers.length) {
        selectedArea = layers[0];
        selectedAreaLabel = "Custom drawn area";
        areaStatus.textContent = "Custom drawn area updated.";
      }
    });

    map.on(L.Draw.Event.DELETED, () => {
      selectedArea = null;
      selectedAreaLabel = "";
      clearAreaButton.classList.add("hidden");
      areaStatus.textContent = "No area selected.";
      mapStatus.textContent = "Choose a city or draw an area to begin.";
    });
  }

  drawAreaButton.addEventListener("click", () => {
    if (!L.Draw || !L.Draw.Polygon) {
      mapStatus.textContent = "Drawing tools could not be loaded.";
      return;
    }
    new L.Draw.Polygon(map, {
      allowIntersection: false,
      showArea: true,
      shapeOptions: { color: "#2f6948", weight: 2 }
    }).enable();
    mapStatus.textContent = "Draw a polygon around the area to review.";
  });

  clearAreaButton.addEventListener("click", clearArea);

  tagKey.addEventListener("change", () => {
    tagDescription.textContent = TAG_DESCRIPTIONS[tagKey.value];
  });

  cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchCity();
    }
  });

  citySearchButton.addEventListener("click", searchCity);
  runSearchButton.addEventListener("click", runSearch);
  clearResultsButton.addEventListener("click", clearResults);

  async function searchCity() {
    const query = cityInput.value.trim();
    if (!query) {
      setStatus("Type a city name first.");
      return;
    }

    setBusy(true, "Finding city…");

    try {
      const params = new URLSearchParams({
        q: `${query}, Iowa, USA`,
        format: "jsonv2",
        limit: "5",
        addressdetails: "1"
      });

      const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) throw new Error(`City search returned HTTP ${response.status}.`);

      const places = await response.json();
      if (!Array.isArray(places) || places.length === 0) {
        throw new Error(`No Iowa city was found for "${query}".`);
      }

      const place = places[0];
      const bbox = place.boundingbox.map(Number); // south, north, west, east
      const south = bbox[0];
      const north = bbox[1];
      const west = bbox[2];
      const east = bbox[3];

      clearArea();
      selectedArea = { type: "bbox", south, west, north, east };
      selectedAreaLabel = place.display_name.split(",").slice(0, 2).join(",").trim();

      map.fitBounds([[south, west], [north, east]], { padding: [25, 25] });
      areaStatus.textContent = `City selected: ${selectedAreaLabel}`;
      mapStatus.textContent = "City selected. Choose a tag and run the search.";
      setBusy(false);
    } catch (error) {
      setBusy(false);
      showError(error.message || "Unable to find that city.");
    }
  }

  async function runSearch() {
    if (!selectedArea) {
      showError("Select a city or draw a custom area before running a search.");
      return;
    }

    const key = tagKey.value;
    setBusy(true, "Querying OpenStreetMap…");
    resultsLayer.clearLayers();
    output.innerHTML = `<p class="muted">Searching OpenStreetMap for <strong>${escapeHtml(key)}=*</strong>…</p>`;

    try {
      const query = buildOverpassQuery(key, selectedArea);
      const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) throw new Error(`Overpass returned HTTP ${response.status}.`);

      const data = await response.json();
      const elements = Array.isArray(data.elements) ? data.elements : [];
      lastFeatures = elements;

      renderFeatures(elements, key);
      renderSummary(elements, key);

      if (elements.length) {
        mapStatus.textContent = `${elements.length.toLocaleString()} ${key}=* feature${elements.length === 1 ? "" : "s"} found.`;
      } else {
        mapStatus.textContent = `No ${key}=* features found in the selected area.`;
      }

      setBusy(false);
    } catch (error) {
      setBusy(false);
      showError(
        `${error.message || "The feature query failed."} ` +
        "The public Overpass service can be busy; try again in a moment or use a smaller area."
      );
    }
  }

  function buildOverpassQuery(key, area) {
    const header = "[out:json][timeout:60];";
    let selector;

    if (area.type === "bbox") {
      const bbox = `${area.south},${area.west},${area.north},${area.east}`;
      selector = `nwr["${key}"](${bbox});`;
    } else {
      const latLngs = area.getLatLngs();
      const points = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
      const poly = points.map(p => `${p.lat} ${p.lng}`).join(" ");
      selector = `nwr["${key}"](poly:"${poly}");`;
    }

    return `${header}${selector}out geom tags;`;
  }

  function renderFeatures(elements, key) {
    resultsLayer.clearLayers();

    const bounds = [];
    const visibleFeatures = elements.filter(element => getElementPosition(element));

    visibleFeatures.forEach(element => {
      const position = getElementPosition(element);
      bounds.push([position.lat, position.lon]);

      const marker = createFeatureMarker(element, key, position);
      if (marker) marker.addTo(resultsLayer);
    });

    if (fitResults.checked && bounds.length) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 17 });
    }
  }

  function getElementPosition(element) {
    if (Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
      return { lat: element.lat, lon: element.lon };
    }

    if (element.center && Number.isFinite(element.center.lat) && Number.isFinite(element.center.lon)) {
      return { lat: element.center.lat, lon: element.center.lon };
    }

    return null;
  }

  function createFeatureMarker(element, key, position) {
    const tags = element.tags || {};
    const name = tags.name || "Unnamed feature";
    const value = tags[key] || "(tag value missing)";
    const type = element.type;
    const osmUrl = `https://www.openstreetmap.org/${encodeURIComponent(type)}/${encodeURIComponent(element.id)}`;

    let layer;

    if (Array.isArray(element.geometry) && element.geometry.length >= 2) {
      const coordinates = element.geometry.map(point => [point.lat, point.lon]);
      const isClosed = coordinates.length >= 4 &&
        coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
        coordinates[0][1] === coordinates[coordinates.length - 1][1];

      layer = isClosed
        ? L.polygon(coordinates, {
            color: "#173f55",
            weight: 2,
            fillColor: "#f28c28",
            fillOpacity: 0.38
          })
        : L.polyline(coordinates, {
            color: "#173f55",
            weight: 3
          });
    } else {
      layer = L.circleMarker([position.lat, position.lon], {
        radius: 6,
        weight: 2,
        color: "#173f55",
        fillColor: "#f28c28",
        fillOpacity: 0.85
      });
    }

    layer.bindPopup(`
      <strong>${escapeHtml(name)}</strong><br>
      ${escapeHtml(key)}=${escapeHtml(value)}<br>
      <span>${escapeHtml(type)} ${escapeHtml(element.id)}</span><br>
      <a href="${osmUrl}" target="_blank" rel="noopener">View in OpenStreetMap</a>
    `);

    return layer;
  }

  function renderSummary(elements, key) {
    const values = new Map();

    elements.forEach(element => {
      const value = element.tags?.[key] || "(missing value)";
      values.set(value, (values.get(value) || 0) + 1);
    });

    const sortedValues = [...values.entries()].sort((a, b) => b[1] - a[1]);
    const topValues = sortedValues.slice(0, 20);

    const cityText = selectedAreaLabel || "Custom area";

    output.innerHTML = `
      <div class="results-summary">
        <div class="summary-card">
          <span class="summary-label">Total features</span>
          <span class="summary-value">${elements.length.toLocaleString()}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Distinct ${escapeHtml(key)} values</span>
          <span class="summary-value">${values.size.toLocaleString()}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Area</span>
          <span class="summary-value" style="font-size:15px">${escapeHtml(cityText)}</span>
        </div>
      </div>

      <p class="result-note"><strong>${escapeHtml(key)}=*</strong> results from OpenStreetMap.</p>
      <p class="result-note">Top tag values:</p>
      <div class="feature-list">
        ${topValues.length
          ? topValues.map(([value, count]) => `
              <div class="feature-row">
                <span class="feature-type">${count.toLocaleString()}</span>
                <span>${escapeHtml(key)}=${escapeHtml(value)}</span>
              </div>
            `).join("")
          : `<div class="feature-row"><span class="feature-type">0</span><span>No features found.</span></div>`
        }
      </div>
    `;
  }

  function clearArea() {
    drawnItems.clearLayers();
    selectedArea = null;
    selectedAreaLabel = "";
    clearAreaButton.classList.add("hidden");
    areaStatus.textContent = "No area selected.";
    mapStatus.textContent = "Choose a city or draw an area to begin.";
  }

  function clearResults() {
    resultsLayer.clearLayers();
    lastFeatures = [];
    output.innerHTML = `
      <div class="empty-state">
        <strong>Ready to Scout</strong>
        <p>Choose a city or draw an area, select a primary tag, and run a search.</p>
        <p class="muted">The results summary will appear here below the map.</p>
      </div>
    `;
    mapStatus.textContent = selectedArea
      ? "Area selected. Choose a tag and run the search."
      : "Choose a city or draw an area to begin.";
  }

  function setBusy(isBusy, message) {
    runSearchButton.disabled = isBusy;
    citySearchButton.disabled = isBusy;
    runSearchButton.textContent = isBusy ? "Working…" : "⌕  Run Search";
    if (message) mapStatus.textContent = message;
  }

  function setStatus(message) {
    mapStatus.textContent = message;
  }

  function showError(message) {
    output.innerHTML = `<div class="results-error"><strong>Review message</strong><br>${escapeHtml(message)}</div>`;
    mapStatus.textContent = "Action could not be completed.";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  window.osmScout = {
    version: VERSION,
    getLastFeatures: () => lastFeatures
  };
})();
