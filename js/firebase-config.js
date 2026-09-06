/**
 * SISTEMA UNIVERSAL DE PERSISTÊNCIA & SINCRONIZAÇÃO (WeddingDB)
 * - Persistência Local Imediata (LocalStorage)
 * - Sincronização em tempo real entre abas (BroadcastChannel)
 * - Sincronização em Nuvem (Google Planilhas / Apps Script / Firestore / REST)
 */

const FIREBASE_CONFIG = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "casamento-izabela-ivan.firebaseapp.com",
  projectId: "casamento-izabela-ivan",
  storageBucket: "casamento-izabela-ivan.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

class WeddingDB {
  constructor() {
    this.isFirebaseReady = false;
    this.storageKey = "wedding_rsvps_database";
    this.cloudEndpointKey = "wedding_cloud_endpoint";
    this.broadcastChannel = null;
    this.init();
  }

  init() {
    // Inicializa BroadcastChannel para sincronização instantânea entre abas
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        this.broadcastChannel = new BroadcastChannel("wedding_rsvp_sync");
      }
    } catch (e) {
      console.warn("BroadcastChannel não suportado neste navegador.");
    }

    // Inicializa Firebase se chaves válidas foram configuradas
    if (typeof firebase !== 'undefined' && FIREBASE_CONFIG.apiKey !== "SUA_API_KEY_AQUI") {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        this.db = firebase.firestore();
        this.isFirebaseReady = true;
        console.log("🔥 Firebase Firestore inicializado com sucesso.");
      } catch (err) {
        console.warn("⚠️ Não foi possível inicializar Firebase SDK, operando em modo local/nuvem híbrida:", err);
      }
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
      ...rsvpData,
      id: 'rsvp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString()
    };

    // 1. Salvar no LocalStorage e SessionStorage (Garante persistência em qualquer modo do navegador)
    const list = this.getLocalRSVPs();
    list.unshift(record);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      sessionStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {
      console.error("Erro ao gravar no storage:", e);
    }

    this.notifyUpdate();

    // 2. Se houver Nuvem / Google Planilhas configurada, enviar cópia assíncrona
    const cloudUrl = this.getCloudEndpoint();
    if (cloudUrl) {
      try {
        // Envia como POST sem bloquear a UI do convidado
        fetch(cloudUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record)
        }).catch(err => console.warn("Aviso ao sincronizar na nuvem:", err));
      } catch (e) {
        console.warn("Erro ao despachar requisição para nuvem:", e);
      }
    }

    // 3. Se houver Firestore configurado
    if (this.isFirebaseReady) {
      try {
        await this.db.collection("rsvps").add(record);
      } catch (e) {
        console.error("Erro ao salvar no Firestore:", e);
      }
    }

    return { success: true, id: record.id };
  }

  async getRSVPs() {
    const localList = this.getLocalRSVPs();

    // 1. Tentar buscar da Nuvem (Google Planilhas / Endpoint) se configurada
    const cloudUrl = this.getCloudEndpoint();
    if (cloudUrl) {
      try {
        const response = await fetch(cloudUrl, { method: "GET" });
        if (response.ok) {
          const cloudData = await response.json();
          if (Array.isArray(cloudData)) {
            // Mescla dados remotos com locais mantendo integridade
            const merged = this.mergeRecords(cloudData, localList);
            localStorage.setItem(this.storageKey, JSON.stringify(merged));
            return merged;
          }
        }
      } catch (err) {
        console.warn("Nuvem inacessível no momento, exibindo registros locais:", err);
      }
    }

    // 2. Tentar Firestore se configurado
    if (this.isFirebaseReady) {
      try {
        const snapshot = await this.db.collection("rsvps").orderBy("createdAt", "desc").get();
        const results = [];
        snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        if (results.length > 0) {
          const merged = this.mergeRecords(results, localList);
          localStorage.setItem(this.storageKey, JSON.stringify(merged));
          return merged;
        }
      } catch (e) {
        console.error("Erro ao buscar no Firestore, obtendo do local:", e);
      }
    }

    return localList;
  }

  mergeRecords(remoteList, localList) {
    const map = new Map();
    // Prioriza remotos
    remoteList.forEach(item => {
      const key = (item.id || item.phone || item.fullName);
      if (key) map.set(key, item);
    });
    // Adiciona locais novos que talvez ainda não foram sincronizados
    localList.forEach(item => {
      const key = (item.id || item.phone || item.fullName);
      if (key && !map.has(key)) map.set(key, item);
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  getLocalRSVPs() {
    try {
      let data = localStorage.getItem(this.storageKey);
      if (!data || data === "[]") {
        data = sessionStorage.getItem(this.storageKey);
      }
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
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

