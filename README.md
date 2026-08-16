# 💍 Isabella & Gabriel — Aplicação Web de Casamento & RSVP de Alto Padrão

Aplicação web completa, responsiva (*mobile-first*), moderna e com design de luxo nobre (**Marsala & Ouro Derretido**) para Casamento com Confirmação de Presença (RSVP), Vitrine de Presentes Pix com QR Code EMV dinâmico, Integração com Calendários e Painel Administrativo VIP dos Noivos.

---

## 🎨 Identidade Visual & Design System
- **Paleta de Cores**: Marsala/Bordô Profundo (`#220308`, `#3c0914`, `#4d0e1b`) e Ouro Derretido metálico (`#FFE082`, `#D4AF37`, `#FFF6D6`, `#AA771C`).
- **Tipografia**: *Cinzel Decorative*, *Playfair Display* e *Montserrat* via Google Fonts.
- **Efeitos de Luxo**: Glassmorphism (`backdrop-filter: blur(18px)`), reflexos luminosos, bordas com shimmer dourado e microinterações táteis.

---

## 🚀 Estrutura de Arquivos

```
e:/Casamento/
│
├── index.html               # Landing page principal com as 6 seções completas
├── admin.html               # Painel Administrativo VIP protegido por PIN
│
├── css/
│   └── style.css            # Design System de Luxo & Responsividade fina
│
├── js/
│   ├── pix-generator.js     # Gerador oficial de Payload Pix EMV (BR Code) + CRC16
│   ├── calendar.js          # Utilitário para Google Calendar e download de .ICS
│   ├── firebase-config.js   # Integração Firebase Firestore com fallback para LocalStorage
│   ├── app.js               # Lógica principal (Contador, Áudio, RSVP Duplo, Modal Pix)
│   └── admin.js             # Lógica do Painel dos Noivos, Métricas e Exportação CSV
│
└── README.md                # Documentação técnica e guia de deploy
```

---

## ✨ Funcionalidades Principais

1. **Hero Section com Vídeo & Contagem Regressiva**:
   - Background em vídeo com overlay marsala elegante.
   - Contador de dias, horas, minutos e segundos em tempo real.
   - Tipografia dourada com animação metálica de brilho.

2. **Player de Vídeo Pré-Wedding**:
   - Moldura de luxo em gradiente de ouro líquido com player integrado e momentos marcantes do casal.

3. **Logística do Evento & Calendários**:
   - Cards com horários e recomendações da Cerimônia, Recepção e Dress Code.
   - Integração com Google Maps interativo e link direto de navegação (Waze / Maps).
   - Botões para adicionar à **Google Agenda** e download do arquivo **.ICS (Apple / Outlook)**.

4. **Lista de Presentes Pix com QR Code EMV Dinâmico**:
   - Vitrine de cotas para a Lua de Mel (Jantar Romântico, Passeio de Barco, Spa e Cota Livre).
   - Modal em *glassmorphism* com renderização instantânea do QR Code Pix oficial no padrão do Banco Central (BR Code com CRC16).
   - Botão **Copiar Código Pix (Copia e Cola)** com feedback visual imediato ("Copiado! ✓").

5. **Sistema RSVP com Ação Dupla**:
   - Formulário completo com Nome, WhatsApp, Confirmação (Sim/Não), Quantidade de Pessoas, Nome dos Acompanhantes, Restrições Alimentares e Recado Especial.
   - **Ação 1**: Persistência imediata no Firebase Firestore (com fallback seguro).
   - **Ação 2**: Redirecionamento automático para o WhatsApp dos noivos com a mensagem formatada com emojis e detalhes da confirmação.

6. **Painel Administrativo VIP dos Noivos (`admin.html`)**:
   - Acesso seguro protegido por PIN (PIN padrão: `2026`).
   - Métricas em tempo real: Confirmados, Total de Pessoas (com acompanhantes), Recusados, Restrições Alimentares e Mensagens carinhosas.
   - Barra de pesquisa e filtro de status reativo.
   - **Exportação para CSV / Excel** com 1 clique (formatação UTF-8 compatível).

---

## 🛠️ Como Executar e Fazer Deploy

### 1. Execução Local Imediata
Como o projeto utiliza tecnologias web nativas sem necessidade de compilação pesada, basta abrir o arquivo `index.html` diretamente em qualquer navegador moderno ou utilizar qualquer servidor estático local (como Live Server do VS Code, `npx serve .` ou `python -m http.server`).

### 2. Configurar Firebase Firestore (Opcional para Nuvem)
O sistema já funciona imediatamente em modo *Zero-Config* usando persistência local. Para sincronizar em múltiplos dispositivos via Google Cloud Firebase:
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Crie um projeto e ative o **Cloud Firestore**.
3. Copie suas credenciais para o arquivo `js/firebase-config.js`.

### 3. Deploy no Google Cloud / Firebase Hosting
```bash
# Instale a Firebase CLI
npm install -g firebase-tools

# Faça login e inicialize o hosting
firebase login
firebase init hosting

# Deploy instantâneo
firebase deploy
```
