/**
 * WEDDING 3D INTERACTIVE LOCATION MAP
 * Powered by MapLibre GL JS (No Mapbox, No Google Maps API required)
 */

const weddingLocation = {
  name: "Nosso grande dia",
  street: "R. Abaíra, 264",
  neighborhood: "Jardim IV Centenário",
  cityState: "Guarulhos — SP",
  postalCode: "07161-010",
  address: "R. Abaíra, 264 - Jardim IV Centenário, Guarulhos - SP, 07161-010",
  latitude: -23.398608,
  longitude: -46.4329713,
  googleMapsUrl: "https://www.google.com/maps/dir/?api=1&destination=-23.398608,-46.4329713",
  wazeUrl: "https://waze.com/ul?ll=-23.398608%2C-46.4329713&navigate=yes"
};

function getNavigationLinks() {
  return {
    googleMaps: weddingLocation.googleMapsUrl,
    waze: weddingLocation.wazeUrl
  };
}

class WeddingLocationMap {
  constructor(containerId = "wedding-3d-map", options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.coords = [weddingLocation.longitude, weddingLocation.latitude];
    this.map = null;
    this.hasAnimated = false;
    this.isInitialized = false;

    // Estilo elegante em Dark Matter compatível com WebGL e 3D
    this.mapStyle = options.styleUrl || {
      version: 8,
      name: "WeddingDarkLuxury",
      sources: {
        "carto-dark": {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
            "https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
            "https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png",
            "https://d.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors, © CARTO"
        }
      },
      layers: [
        {
          id: "carto-dark-layer",
          type: "raster",
          source: "carto-dark",
          minzoom: 0,
          maxzoom: 20
        }
      ]
    };

    this.init();
  }

  init() {
    if (!this.container) return;

    if (!this.isWebGLSupported() || typeof maplibregl === "undefined") {
      this.renderFallback();
      return;
    }

    try {
      this.map = new maplibregl.Map({
        container: this.containerId,
        style: this.mapStyle,
        center: [this.coords[0] - 0.004, this.coords[1] - 0.003],
        zoom: 14.2,
        pitch: 45,
        bearing: -15,
        antialias: true,
        attributionControl: false
      });

      // Controles 3D e Bússola
      const navControl = new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true
      });
      this.map.addControl(navControl, "top-right");

      this.map.on("load", () => {
        this.onMapReady();
      });

      // Garantir redimensionamento correto
      setTimeout(() => {
        if (this.map) this.map.resize();
      }, 500);

      window.addEventListener("resize", () => {
        if (this.map) this.map.resize();
      });

    } catch (err) {
      console.warn("Erro ao iniciar MapLibre, usando fallback:", err);
      this.renderFallback();
    }
  }

  isWebGLSupported() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  onMapReady() {
    this.map.resize();
    this.addCustomMarker();
    this.triggerCinematicFlyIn();
  }

  addCustomMarker() {
    const el = document.createElement("div");
    el.className = "wedding-map-marker";
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Local do Casamento de Izabela & Ivan");

    el.innerHTML = `
      <div class="marker-pulse-glow"></div>
      <div class="marker-pin-inner">
        <svg class="marker-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="12" r="5"></circle>
          <circle cx="15" cy="12" r="5"></circle>
        </svg>
      </div>
      <div class="marker-pin-tail"></div>
    `;

    const popupContent = `
      <div class="wedding-map-popup-card">
        <div class="popup-gold-badge">✦ Nosso grande dia ✦</div>
        <h4 class="popup-title">Izabela & Ivan</h4>
        <p class="popup-address">${weddingLocation.street}</p>
        <p class="popup-neighborhood">${weddingLocation.neighborhood}</p>
        <p class="popup-city">${weddingLocation.cityState} • ${weddingLocation.postalCode}</p>
        <div class="popup-nav-actions">
          <a href="${weddingLocation.googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-popup-nav btn-google-maps" aria-label="Abrir no Google Maps">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>Google Maps</span>
          </a>
          <a href="${weddingLocation.wazeUrl}" target="_blank" rel="noopener noreferrer" class="btn-popup-nav btn-waze" aria-label="Abrir no Waze">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0-9 9c0 3.3 1.8 6.2 4.5 7.7v1.8a1.5 1.5 0 0 0 2.2 1.3l2.8-1.5c.5.1 1 .2 1.5.2a9 9 0 0 0 9-9 9 9 0 0 0-9-9zm-2.5 7.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-6.5 4.5c.8 1.5 2.3 2.5 4 2.5s3.2-1 4-2.5h-8z"/></svg>
            <span>Waze</span>
          </a>
        </div>
      </div>
    `;

    const popup = new maplibregl.Popup({
      offset: [0, -32],
      closeButton: true,
      closeOnClick: false,
      className: "wedding-custom-popup",
      maxWidth: "310px"
    }).setHTML(popupContent);

    new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat(this.coords)
      .setPopup(popup)
      .addTo(this.map);

    // Abre o popup automaticamente após a aproximação da câmera
    setTimeout(() => {
      if (this.map) {
        popup.addTo(this.map);
      }
    }, 3800);
  }

  triggerCinematicFlyIn() {
    if (this.hasAnimated) return;
    this.hasAnimated = true;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      this.map.jumpTo({
        center: this.coords,
        zoom: 16.6,
        pitch: 52,
        bearing: 10
      });
      return;
    }

    setTimeout(() => {
      if (!this.map) return;
      this.map.flyTo({
        center: this.coords,
        zoom: 16.8,
        pitch: 55,
        bearing: 12,
        speed: 0.6,
        curve: 1.4,
        essential: true
      });
    }, 500);
  }

  renderFallback() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="wedding-map-fallback-card glass-panel p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div class="w-14 h-14 rounded-full bg-[#3c0914] border border-[#D4AF37] flex items-center justify-center text-[#FFE082] mb-4 shadow-lg">
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>
        <span class="text-xs uppercase tracking-widest text-[#FFE082] font-semibold mb-1">✦ Nosso grande dia ✦</span>
        <h3 class="font-serif text-2xl font-bold text-white mb-2">Local da Cerimônia & Recepção</h3>
        <p class="text-stone-200 text-sm font-medium mb-1">${weddingLocation.street}</p>
        <p class="text-stone-300 text-xs mb-1">${weddingLocation.neighborhood} — ${weddingLocation.cityState}</p>
        <p class="text-stone-400 text-xs font-mono mb-6">${weddingLocation.postalCode}</p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <a href="${weddingLocation.googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-nav-action btn-nav-google w-full sm:w-auto flex-1">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>Google Maps</span>
          </a>
          <a href="${weddingLocation.wazeUrl}" target="_blank" rel="noopener noreferrer" class="btn-nav-action btn-nav-waze w-full sm:w-auto flex-1">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0-9 9c0 3.3 1.8 6.2 4.5 7.7v1.8a1.5 1.5 0 0 0 2.2 1.3l2.8-1.5c.5.1 1 .2 1.5.2a9 9 0 0 0 9-9 9 9 0 0 0-9-9zm-2.5 7.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-6.5 4.5c.8 1.5 2.3 2.5 4 2.5s3.2-1 4-2.5h-8z"/></svg>
            <span>Waze</span>
          </a>
        </div>
      </div>
    `;
  }
}

// Inicializar quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  window.weddingLocationMapInstance = new WeddingLocationMap("wedding-3d-map");
});

window.weddingLocation = weddingLocation;
window.getNavigationLinks = getNavigationLinks;
window.WeddingLocationMap = WeddingLocationMap;
