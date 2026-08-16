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

    // Configuração isolada de estilo (sem Mapbox, livre de chaves pagas)
    this.mapStyle = options.styleUrl || "https://tiles.openfreemap.org/styles/dark";
    this.fallbackStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

    this.initObserver();
  }

  // Lazy loading com IntersectionObserver para máxima performance
  initObserver() {
    if (!this.container) return;

    // Se IntersectionObserver não existir, carrega direto
    if (!("IntersectionObserver" in window)) {
      this.initMap();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isInitialized) {
            this.isInitialized = true;
            this.initMap();
            observer.disconnect();
          }
        });
      },
      { rootMargin: "250px 0px" } // Inicia antes de entrar completamente na tela
    );

    observer.observe(this.container);
  }

  // Verificação de suporte a WebGL
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

  initMap() {
    if (typeof maplibregl === "undefined" || !this.isWebGLSupported()) {
      this.renderFallback();
      return;
    }

    try {
      // Criação da instância do MapLibre com câmera inicial cinematográfica
      this.map = new maplibregl.Map({
        container: this.containerId,
        style: this.mapStyle,
        center: [this.coords[0] - 0.006, this.coords[1] - 0.004], // Ponto de partida cinematográfico
        zoom: 13.8,
        pitch: 40,
        bearing: -20,
        antialias: true,
        attributionControl: false,
        cooperativeGestures: true // Não bloqueia o scroll suave no celular
      });

      // Controles 3D personalizados elegantes
      const navControl = new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true
      });
      this.map.addControl(navControl, "top-right");

      this.map.on("load", () => {
        this.onMapLoaded();
      });

      this.map.on("error", (e) => {
        console.warn("MapLibre tile fallback:", e);
        if (this.map.getStyle().name !== "dark-matter") {
          try {
            this.map.setStyle(this.fallbackStyle);
          } catch (err) {
            this.renderFallback();
          }
        }
      });
    } catch (err) {
      console.error("Erro ao inicializar MapLibre:", err);
      this.renderFallback();
    }
  }

  onMapLoaded() {
    this.add3DBuildings();
    this.addCustomMarker();
    this.triggerCinematicFlyIn();
  }

  // Camada de edifícios 3D se a fonte vetorial suportar
  add3DBuildings() {
    try {
      const layers = this.map.getStyle().layers;
      let labelLayerId;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === "symbol" && layers[i].layout && layers[i].layout["text-field"]) {
          labelLayerId = layers[i].id;
          break;
        }
      }

      if (this.map.getSource("openmaptiles")) {
        this.map.addLayer(
          {
            id: "3d-buildings",
            source: "openmaptiles",
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": "#42101b",
              "fill-extrusion-height": ["get", "render_height"],
              "fill-extrusion-base": ["get", "render_min_height"],
              "fill-extrusion-opacity": 0.65
            }
          },
          labelLayerId
        );
      }
    } catch (e) {
      // 3D buildings opcional se a camada não estiver presente
    }
  }

  // Marcador personalizado de alto luxo com anéis de casamento e pulso dourado
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

    // Popup em glassmorphism refinado
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

    // Abrir popup automaticamente ao aproximar a câmera
    setTimeout(() => {
      if (this.map && !this.map.isMoving()) {
        popup.addTo(this.map);
      }
    }, 4200);
  }

  // Animação cinematográfica de aproximação
  triggerCinematicFlyIn() {
    if (this.hasAnimated) return;
    this.hasAnimated = true;

    // Respeita prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      this.map.jumpTo({
        center: this.coords,
        zoom: 16.6,
        pitch: 55,
        bearing: 15
      });
      return;
    }

    setTimeout(() => {
      if (!this.map) return;
      this.map.flyTo({
        center: this.coords,
        zoom: 16.8,
        pitch: 58,
        bearing: 15,
        speed: 0.65, // Aproximação lenta, elegante e nobre
        curve: 1.42,
        essential: true
      });
    }, 600);
  }

  // Fallback elegante caso WebGL ou tiles falhem
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

// Inicialização automática quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  window.weddingLocationMapInstance = new WeddingLocationMap("wedding-3d-map");
});

window.weddingLocation = weddingLocation;
window.getNavigationLinks = getNavigationLinks;
window.WeddingLocationMap = WeddingLocationMap;
