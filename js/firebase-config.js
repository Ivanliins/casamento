/**
 * SISTEMA UNIVERSAL DE PERSISTÊNCIA & SINCRONIZAÇÃO (WeddingDB)
 * - Persistência Local Imediata (LocalStorage + SessionStorage)
 * - Sincronização em tempo real entre abas (BroadcastChannel e eventos)
 * - Suporte opcional a Nuvem (Google Planilhas) sem bloquear a interface
 */

class WeddingDB {
  constructor() {
    this.storageKey = "wedding_rsvps_database";
    this.cloudEndpointKey = "wedding_cloud_endpoint";
    this.broadcastChannel = null;
    this.init();
  }

  init() {
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        this.broadcastChannel = new BroadcastChannel("wedding_rsvp_sync");
      }
    } catch (e) {
      console.warn("BroadcastChannel não suportado neste navegador.");
    }
  }

  notifyUpdate() {
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: "rsvp_updated", timestamp: Date.now() });
      }
    } catch (e) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("wedding_db_updated"));
    }
  }

  getCloudEndpoint() {
    try {
      return localStorage.getItem(this.cloudEndpointKey) || "";
    } catch (e) {
      return "";
    }
  }

  setCloudEndpoint(url) {
    try {
      if (!url) {
        localStorage.removeItem(this.cloudEndpointKey);
      } else {
        localStorage.setItem(this.cloudEndpointKey, url.trim());
      }
      this.notifyUpdate();
      return true;
    } catch (e) {
      return false;
    }
  }

  async saveRSVP(rsvpData) {
    const record = {
      id: 'rsvp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      fullName: rsvpData.fullName ? String(rsvpData.fullName).trim() : "Sem nome",
      phone: rsvpData.phone ? String(rsvpData.phone).trim() : "",
      attending: rsvpData.attending === "no" ? "no" : "yes",
      guestsCount: rsvpData.attending === "no" ? 0 : (parseInt(rsvpData.guestsCount) || 1),
      guestsNames: rsvpData.guestsNames ? String(rsvpData.guestsNames).trim() : "",
      message: rsvpData.message ? String(rsvpData.message).trim() : "",
      createdAt: new Date().toISOString()
    };

    // 1. Salva imediatamente no LocalStorage e SessionStorage
    const list = this.getLocalRSVPs();
    list.unshift(record);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      sessionStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {
      console.error("Erro ao salvar no storage local:", e);
    }

    this.notifyUpdate();

    // 2. Se houver nuvem configurada, despacha em segundo plano sem travar o usuário
    const cloudUrl = this.getCloudEndpoint();
    if (cloudUrl) {
      try {
        fetch(cloudUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record)
        }).catch(() => {});
      } catch (e) {}
    }

    return { success: true, id: record.id };
  }

  async getRSVPs() {
    return this.getLocalRSVPs();
  }

  getLocalRSVPs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
      
      // Fallback para sessionStorage
      const sessionData = sessionStorage.getItem(this.storageKey);
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData);
        if (Array.isArray(parsedSession)) return parsedSession;
      }
      
      return [];
    } catch (e) {
      console.error("Erro ao carregar RSVPs locais:", e);
      return [];
    }
  }

  deleteRSVP(id) {
    let list = this.getLocalRSVPs();
    list = list.filter(item => item.id !== id);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      sessionStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {}
    this.notifyUpdate();
    return true;
  }

  clearAllRSVPs() {
    try {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.storageKey);
      localStorage.setItem(this.storageKey, JSON.stringify([]));
      sessionStorage.setItem(this.storageKey, JSON.stringify([]));
    } catch (e) {}
    this.notifyUpdate();
    return true;
  }
}

window.weddingDB = new WeddingDB();
