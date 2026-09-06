/**
 * FIREBASE / FIRESTORE DATA LAYER & PERSISTENCE
 * Com fallback transparente para LocalStorage / Memory Store
 */

const FIREBASE_CONFIG = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "casamento-isabella-gabriel.firebaseapp.com",
  projectId: "casamento-isabella-gabriel",
  storageBucket: "casamento-isabella-gabriel.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

class WeddingDB {
  constructor() {
    this.isFirebaseReady = false;
    this.storageKey = "wedding_rsvps_database";
    this.init();
  }

  init() {
    // Verifica se as credenciais do Firebase foram customizadas
    if (typeof firebase !== 'undefined' && FIREBASE_CONFIG.apiKey !== "SUA_API_KEY_AQUI") {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        this.db = firebase.firestore();
        this.isFirebaseReady = true;
        console.log("🔥 Firebase Firestore inicializado com sucesso.");
      } catch (err) {
        console.warn("⚠️ Não foi possível inicializar Firebase SDK, operando em modo local:", err);
      }
    } else {
      console.log("ℹ️ Operando em modo de persistência local integrada (LocalStorage). Pronto para deploy!");
    }
  }

  async saveRSVP(rsvpData) {
    const record = {
      ...rsvpData,
      id: 'rsvp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString()
    };

    if (this.isFirebaseReady) {
      try {
        const docRef = await this.db.collection("rsvps").add(record);
        return { success: true, id: docRef.id };
      } catch (e) {
        console.error("Erro ao salvar no Firestore, salvando cópia local:", e);
      }
    }

    // Salvar no LocalStorage
    const list = this.getLocalRSVPs();
    list.unshift(record);
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    return { success: true, id: record.id, local: true };
  }

  async getRSVPs() {
    if (this.isFirebaseReady) {
      try {
        const snapshot = await this.db.collection("rsvps").orderBy("createdAt", "desc").get();
        const results = [];
        snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        return results;
      } catch (e) {
        console.error("Erro ao buscar no Firestore, obtendo do local:", e);
      }
    }
    return this.getLocalRSVPs();
  }

  getLocalRSVPs() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  deleteRSVP(id) {
    let list = this.getLocalRSVPs();
    list = list.filter(item => item.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    return true;
  }

  clearAllRSVPs() {
    localStorage.setItem(this.storageKey, JSON.stringify([]));
    return true;
  }
}

window.weddingDB = new WeddingDB();
