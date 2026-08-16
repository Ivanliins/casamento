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
        // Dados de demonstração elegantes iniciais se vazio
        const initialData = [
          {
            id: 'rsvp_demo_1',
            fullName: "Mariana & Carlos Silveira",
            phone: "+55 11 98888-7777",
            attending: "yes",
            guestsCount: 2,
            guestsNames: "Mariana Silveira, Carlos Silveira",
            dietary: "Nenhuma",
            message: "Que alegria imensa celebrar essa união! Estaremos lá com certeza para brindar com vocês. ❤️",
            createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
          },
          {
            id: 'rsvp_demo_2',
            fullName: "Lucas Albuquerque",
            phone: "+55 11 97777-6666",
            attending: "yes",
            guestsCount: 1,
            guestsNames: "Lucas Albuquerque",
            dietary: "Vegetariano",
            message: "Parabéns ao casal mais lindo! Muito amor e cumplicidade sempre.",
            createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
          },
          {
            id: 'rsvp_demo_3',
            fullName: "Fernanda Costa",
            phone: "+55 21 99999-5555",
            attending: "no",
            guestsCount: 0,
            guestsNames: "",
            dietary: "",
            message: "Infelizmente estarei em viagem a trabalho, mas meu coração estará com vocês! Toda felicidade do mundo!",
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
          }
        ];
        localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        return initialData;
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
}

window.weddingDB = new WeddingDB();
