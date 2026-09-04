/**
 * WEDDING 3D INTERACTIVE LOCATION MAP (VIBRANT & ALIVE)
 * Powered by MapLibre GL JS with 3D Buildings & Rich Street Detail
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
  constructor(containerId = "wedding-3d-map") {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.coords = [weddingLocation.longitude, weddingLocation.latitude];
    this.map = null;
    this.hasAnimated = false;
    this.isRotating = false;
    this.rotationAnimation = null;

    // Estilo vetorial completo OpenFreeMap (com ruas detalhadas, pontos de interesse e suporte a prédios 3D)
    this.vectorStyleUrl = "https://tiles.openfreemap.org/styles/liberty";
    this.darkVectorStyleUrl = "https://tiles.openfreemap.org/styles/dark";

    this.init();
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

  init() {
    if (!this.container) return;

    if (!this.isWebGLSupported() || typeof maplibregl === "undefined") {
      this.renderFallback();
      return;
    }

    try {
      // Criação do mapa com ângulo cinematográfico e iluminação 3D
      this.map = new maplibregl.Map({
        container: this.containerId,
        style: this.vectorStyleUrl,
        center: [this.coords[0] - 0.0035, this.coords[1] - 0.0025],
        zoom: 14.8,
        pitch: 52,
        bearing: -20,
        antialias: true,
        attributionControl: false,
        cooperativeGestures: true
      });

      // Controles 3D personalizados
      const navControl = new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true
      });
      this.map.addControl(navControl, "top-right");

      // Adicionar botão de modo órbita / rotação 3D ao vivo
      this.addCustomMapControls();

      this.map.on("load", () => {
        this.onMapReady();
      });

      this.map.on("error", (e) => {
        console.warn("Tentando estilo alternativo de alta compatibilidade:", e);
      });

      // Redimensionamento garantido
      setTimeout(() => {
        if (this.map) this.map.resize();
      }, 400);

      window.addEventListener("resize", () => {
        if (this.map) this.map.resize();
      });

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && this.map) {
              this.map.resize();
            }
          });
        }, { threshold: 0.05 });
        observer.observe(this.container);
      }

      document.querySelectorAll('a[href="#localizacao"]').forEach(link => {
        link.addEventListener("click", () => {
          setTimeout(() => {
            if (this.map) this.map.resize();
          }, 350);
        });
      });

    } catch (err) {
      console.warn("Erro ao iniciar MapLibre, usando fallback:", err);
      this.renderFallback();
    }
  }

  onMapReady() {
    this.map.resize();
    this.addVenueRadiusGlow();
    this.add3DBuildings();
    this.addCustomMarker();
    this.triggerCinematicFlyIn();
  }

  // Camada de edifícios 3D com alturas reais e cores elegantes
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

      // Adiciona extrusão 3D para todas as construções da região
      if (this.map.getSource("openmaptiles")) {
        this.map.addLayer(
          {
            id: "3d-buildings-extrusion",
            source: "openmaptiles",
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["get", "render_height"],
                0, "#e8dcd0",
                15, "#d9c4b0",
                30, "#c29b68",
                60, "#a8783e",
                100, "#8a1c2e"
              ],
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14, 0,
                14.5, ["coalesce", ["get", "render_height"], 8]
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14, 0,
                14.5, ["coalesce", ["get", "render_min_height"], 0]
              ],
              "fill-extrusion-opacity": 0.82
            }
          },
          labelLayerId
        );
      }
    } catch (e) {
      console.log("Nota sobre camada 3D:", e);
    }
  }

  // Raio de destaque dourado em volta do local da cerimônia
  addVenueRadiusGlow() {
    try {
      const radiusPoints = this.createGeoJSONCircle(this.coords, 0.08); // 80 metros
      this.map.addSource("venue-glow-area", {
        type: "geojson",
        data: radiusPoints
      });

      this.map.addLayer({
        id: "venue-glow-fill",
        type: "fill",
        source: "venue-glow-area",
        paint: {
          "fill-color": "#D4AF37",
          "fill-opacity": 0.22
        }
      });

      this.map.addLayer({
        id: "venue-glow-stroke",
        type: "line",
        source: "venue-glow-area",
        paint: {
          "line-color": "#D4AF37",
          "line-width": 2.5,
          "line-dasharray": [2, 2]
        }
      });
    } catch (e) {}
  }

  createGeoJSONCircle(center, radiusInKm, points = 64) {
    const coords = { latitude: center[1], longitude: center[0] };
    const km = radiusInKm;
    const ret = [];
    const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [ret]
      }
    };
  }

  // Marcador de casamento com anéis dourados e pulso suave
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

    setTimeout(() => {
      if (this.map) {
        popup.addTo(this.map);
      }
    }, 3800);
  }

  // Adiciona botão flutuante para girar / passear em 3D
  addCustomMapControls() {
    const controlsDiv = document.createElement("div");
    controlsDiv.className = "map-3d-custom-bar";
    controlsDiv.innerHTML = `
      <button id="btn-toggle-orbit" class="btn-map-quick-action" title="Girar e explorar visão 3D">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        <span>Vista 3D Dinâmica</span>
      </button>
      <button id="btn-recenter-map" class="btn-map-quick-action" title="Recentralizar no local">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
        <span>Recentralizar</span>
      </button>
    `;

    this.container.appendChild(controlsDiv);

    document.getElementById("btn-toggle-orbit")?.addEventListener("click", () => {
      this.toggleOrbit();
    });

    document.getElementById("btn-recenter-map")?.addEventListener("click", () => {
      if (!this.map) return;
      this.map.flyTo({
        center: this.coords,
        zoom: 17,
        pitch: 58,
        bearing: 15,
        speed: 0.8
      });
    });
  }

  toggleOrbit() {
    if (!this.map) return;
    this.isRotating = !this.isRotating;
    const btn = document.getElementById("btn-toggle-orbit");

    if (this.isRotating) {
      if (btn) btn.classList.add("active");
      const rotateCamera = () => {
        if (!this.isRotating || !this.map) return;
        this.map.rotateTo((this.map.getBearing() + 0.3) % 360, { duration: 0 });
        this.rotationAnimation = requestAnimationFrame(rotateCamera);
      };
      rotateCamera();
    } else {
      if (btn) btn.classList.remove("active");
      if (this.rotationAnimation) {
        cancelAnimationFrame(this.rotationAnimation);
      }
    }
  }

  triggerCinematicFlyIn() {
    if (this.hasAnimated) return;
    this.hasAnimated = true;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      this.map.jumpTo({
        center: this.coords,
        zoom: 17,
        pitch: 58,
        bearing: 15
      });
      return;
    }

    setTimeout(() => {
      if (!this.map) return;
      this.map.flyTo({
        center: this.coords,
        zoom: 17,
        pitch: 58,
        bearing: 15,
        speed: 0.6,
        curve: 1.4,
        essential: true
      });
    }, 600);
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

document.addEventListener("DOMContentLoaded", () => {
  window.weddingLocationMapInstance = new WeddingLocationMap("wedding-3d-map");
});

window.weddingLocation = weddingLocation;
window.getNavigationLinks = getNavigationLinks;
window.WeddingLocationMap = WeddingLocationMap;
