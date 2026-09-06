/**
 * SISTEMA UNIVERSAL DE PERSISTÊNCIA & SINCRONIZAÇÃO (WeddingDB)
 * - Persistência Local Imediata (LocalStorage + SessionStorage)
 * - Sincronização em tempo real entre abas (BroadcastChannel e eventos)
 * - Sincronização em Nuvem Multi-Dispositivos (Google Planilhas / Google Apps Script)
 */

// ==========================================================================
// CONFIGURAÇÃO DA NUVEM (COMPARTILHADA POR TODOS OS CELULARES E COMPUTADORES)
// Cole a URL do seu Web App do Google Apps Script aqui para centralizar todos os convidados!
// ==========================================================================
const CLOUD_ENDPOINT_SHARED = ""; 

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
      return localStorage.getItem(this.cloudEndpointKey) || CLOUD_ENDPOINT_SHARED || "";
    } catch (e) {
      return CLOUD_ENDPOINT_SHARED || "";
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

    // 1. Salva imediatamente no LocalStorage e SessionStorage do aparelho atual
    const list = this.getLocalRSVPs();
    list.unshift(record);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      sessionStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {
      console.error("Erro ao salvar no storage local:", e);
    }

    this.notifyUpdate();

    // 2. Se houver nuvem configurada (Google Planilhas), despacha para centralizar em todos os celulares
    const cloudUrl = this.getCloudEndpoint();
    if (cloudUrl) {
      try {
        fetch(cloudUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record)
        }).catch(err => console.warn("Aviso ao despachar para a nuvem:", err));
      } catch (e) {
        console.warn("Erro na sincronização em nuvem:", e);
      }
    }

    return { success: true, id: record.id };
  }

  async getRSVPs() {
    const localList = this.getLocalRSVPs();
    const cloudUrl = this.getCloudEndpoint();

    // Se houver nuvem configurada, busca as respostas de todos os convidados
    if (cloudUrl) {
      try {
        const response = await fetch(cloudUrl, { method: "GET" });
        if (response.ok) {
          const cloudData = await response.json();
          if (Array.isArray(cloudData)) {
            const merged = this.mergeRecords(cloudData, localList);
            try {
              localStorage.setItem(this.storageKey, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          }
        }
      } catch (err) {
        console.warn("Nuvem temporariamente inacessível, exibindo registros locais:", err);
      }
    }

    return localList;
  }

  mergeRecords(remoteList, localList) {
    const map = new Map();
    // Prioriza remotos
    remoteList.forEach(item => {
      const key = item.id || (item.fullName + '_' + (item.phone || ''));
      if (key) map.set(key, item);
    });
    // Adiciona locais novos que ainda não foram sincronizados
    localList.forEach(item => {
      const key = item.id || (item.fullName + '_' + (item.phone || ''));
      if (key && !map.has(key)) map.set(key, item);
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  getLocalRSVPs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
      
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
