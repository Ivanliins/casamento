/**
 * SISTEMA UNIVERSAL DE PERSISTÊNCIA & SINCRONIZAÇÃO EM NUVEM (WeddingDB)
 * - Conexão Real e Ilimitada com Google Planilhas (Google Apps Script Oficial dos Noivos)
 * - Sincronização entre qualquer celular e computador do mundo
 * - Cache local para carregamento instantâneo
 */

const CLOUD_ENDPOINT_OFFICIAL = "https://script.google.com/macros/s/AKfycbwgxLnTcKUN9c2dpzrelZcxvs8DdcC0-CO-rUYo7abiTmwmhaTqnEQ94dPtQB5br3th/exec";

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
      return localStorage.getItem(this.cloudEndpointKey) || CLOUD_ENDPOINT_OFFICIAL;
    } catch (e) {
      return CLOUD_ENDPOINT_OFFICIAL;
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

    // 1. Salva imediatamente no LocalStorage e SessionStorage do navegador atual
    const list = this.getLocalRSVPs();
    const filtered = list.filter(r => !(r.fullName === record.fullName && r.phone === record.phone));
    filtered.unshift(record);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      sessionStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (e) {
      console.error("Erro ao salvar no storage local:", e);
    }

    this.notifyUpdate();

    // 2. Envia para a Planilha Google Oficial (recebe de qualquer celular do mundo)
    const cloudUrl = this.getCloudEndpoint();
    if (cloudUrl) {
      try {
        fetch(cloudUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record)
        }).catch(err => console.warn("Aviso ao enviar para Google Planilhas:", err));
      } catch (e) {
        console.warn("Erro ao despachar requisição:", e);
      }
    }

    return { success: true, id: record.id };
  }

  async getRSVPs() {
    const localList = this.getLocalRSVPs();
    const cloudUrl = this.getCloudEndpoint();

    if (cloudUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(cloudUrl, { method: "GET", redirect: "follow", signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const rawData = await res.json();
          if (Array.isArray(rawData)) {
            // Filtra linhas de cabeçalho da planilha
            const validData = rawData.filter(item => 
              item && 
              item.id !== "ID" && 
              item.fullName !== "Nome Completo" &&
              item.fullName && 
              item.fullName.trim() !== ""
            );

            const merged = this.mergeRecords(validData, localList);
            try {
              localStorage.setItem(this.storageKey, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          }
        }
      } catch (err) {
        console.warn("Nuvem inacessível no momento, exibindo registros locais:", err);
      }
    }

    return localList;
  }

  mergeRecords(remoteList, localList) {
    const map = new Map();
    // Prioriza registros remotos da planilha
    remoteList.forEach(item => {
      const key = item.id || (item.fullName + '_' + (item.phone || ''));
      if (key) map.set(key, item);
    });
    // Adiciona itens locais que ainda não sincronizaram
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
        if (Array.isArray(parsed)) return parsed.filter(i => i && i.id !== "ID" && i.fullName !== "Nome Completo");
      }
      
      const sessionData = sessionStorage.getItem(this.storageKey);
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData);
        if (Array.isArray(parsedSession)) return parsedSession.filter(i => i && i.id !== "ID" && i.fullName !== "Nome Completo");
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
      localStorage.setItem(this.storageKey, JSON.stringify([]));
      sessionStorage.setItem(this.storageKey, JSON.stringify([]));
    } catch (e) {}
    this.notifyUpdate();
    return true;
  }
}

window.weddingDB = new WeddingDB();
