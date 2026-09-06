/**
 * SISTEMA UNIVERSAL DE PERSISTÊNCIA & SINCRONIZAÇÃO (WeddingDB)
 * - Banco de Dados em Nuvem Ativo Centralizado (Compatível com qualquer celular/computador)
 * - Persistência Local de Contingência (LocalStorage + SessionStorage)
 * - Sincronização em tempo real entre abas e aparelhos
 */

// Endpoint oficial do banco de dados na nuvem para centralizar todos os convidados
const CLOUD_MASTER_API = "https://api.restful-api.dev/objects/ff808181a067127101a0783be1252abd";

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

    // 1. Salva imediatamente no LocalStorage do aparelho
    const list = this.getLocalRSVPs();
    list.unshift(record);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      sessionStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {
      console.error("Erro ao salvar no storage local:", e);
    }

    this.notifyUpdate();

    // 2. Envia para o Banco Central em Nuvem (Centraliza com qualquer celular ou computador)
    try {
      const res = await fetch(CLOUD_MASTER_API);
      if (res.ok) {
        const remoteDoc = await res.json();
        let rsvps = (remoteDoc.data && Array.isArray(remoteDoc.data.rsvps)) ? remoteDoc.data.rsvps : [];
        
        // Remove duplicados antigos com mesmo nome e telefone
        rsvps = rsvps.filter(r => r.id !== record.id && !(r.fullName === record.fullName && r.phone === record.phone));
        rsvps.unshift(record);

        await fetch(CLOUD_MASTER_API, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "CASAMENTO_IZABELA_IVAN_RSVPS_V1",
            data: { rsvps: rsvps }
          })
        });
      }
    } catch (err) {
      console.warn("Aviso ao sincronizar no banco central:", err);
    }

    // 3. Se houver Webhook adicional (ex: Google Apps Script)
    const customEndpoint = this.getCloudEndpoint();
    if (customEndpoint) {
      try {
        fetch(customEndpoint, {
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
    const localList = this.getLocalRSVPs();

    // 1. Busca do Banco Central em Nuvem (reúne respostas de todos os celulares)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(CLOUD_MASTER_API, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const remoteDoc = await res.json();
        if (remoteDoc.data && Array.isArray(remoteDoc.data.rsvps)) {
          const merged = this.mergeRecords(remoteDoc.data.rsvps, localList);
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(merged));
          } catch (e) {}

          // Se houver itens locais que ainda não estão na nuvem, sincroniza-os em segundo plano
          if (merged.length > remoteDoc.data.rsvps.length) {
            fetch(CLOUD_MASTER_API, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: "CASAMENTO_IZABELA_IVAN_RSVPS_V1",
                data: { rsvps: merged }
              })
            }).catch(() => {});
          }

          return merged;
        }
      }
    } catch (err) {
      console.warn("Nuvem ocupada ou offline, exibindo registros locais:", err);
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
    // Adiciona locais que talvez foram criados offline
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

  async deleteRSVP(id) {
    let list = this.getLocalRSVPs();
    list = list.filter(item => item.id !== id);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      sessionStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {}
    this.notifyUpdate();

    // Remove do banco central
    try {
      fetch(CLOUD_MASTER_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "CASAMENTO_IZABELA_IVAN_RSVPS_V1",
          data: { rsvps: list }
        })
      }).catch(() => {});
    } catch (e) {}

    return true;
  }

  async clearAllRSVPs() {
    try {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.storageKey);
      localStorage.setItem(this.storageKey, JSON.stringify([]));
      sessionStorage.setItem(this.storageKey, JSON.stringify([]));
    } catch (e) {}
    this.notifyUpdate();

    // Limpa banco central
    try {
      fetch(CLOUD_MASTER_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "CASAMENTO_IZABELA_IVAN_RSVPS_V1",
          data: { rsvps: [] }
        })
      }).catch(() => {});
    } catch (e) {}

    return true;
  }
}

window.weddingDB = new WeddingDB();
