/**
 * CASAMENTO IZABELA & IVAN - APP LOGIC & INTRO SIMULATOR
 */

document.addEventListener("DOMContentLoaded", () => {
  initPhoneIntro();
  initCountdown();
  initAudioPlayer();
  initScrollEffects();
  initGiftRegistry();
  initRsvpForm();
});

/* ==========================================================================
   0. SMARTPHONE PICKUP INTRO SIMULATOR
   ========================================================================== */
function initPhoneIntro() {
  const introOverlay = document.getElementById("phone-intro-overlay");
  const phoneVideo = document.getElementById("phone-intro-video");
  const openBtn = document.getElementById("phone-open-invite-btn");
  const phoneMockup = document.querySelector(".phone-mockup-frame");
  const audio = document.getElementById("wedding-ambient-audio");
  const audioBtn = document.getElementById("audio-toggle-btn");

  if (!introOverlay) return;

  // Iniciar reprodução automática do vídeo no celular do simulador
  if (phoneVideo) {
    phoneVideo.play().catch(err => {
      console.log("Autoplay aguardando interação do usuário:", err);
    });
  }

  function unlockInvite() {
    introOverlay.classList.add("unlocked");
    document.body.style.overflow = "auto";

    // Ocultar totalmente o overlay após a animação de zoom/fade
    setTimeout(() => {
      introOverlay.style.display = "none";
    }, 800);

    // Revelar e ativar seções da página
    document.querySelectorAll(".reveal-fade").forEach(el => el.classList.add("active"));

    // Iniciar vídeo de background do Hero
    const heroVideo = document.querySelector(".hero-video-bg");
    if (heroVideo) {
      heroVideo.play().catch(() => {});
    }

    // Iniciar áudio ambiente de forma robusta no mobile
    if (audio) {
      audio.muted = false;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (audioBtn) {
            audioBtn.classList.add("playing");
            audioBtn.innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
            if (window.lucide) lucide.createIcons();
          }
          showAudioBubble("Tocando: Stephen Sanchez — Until I Found You 🎵", "volume-2");
        }).catch(err => {
          console.warn("Audio autoplay blocked by mobile policy:", err);
          // Fallback: tocar no próximo toque na tela
          const touchToPlay = () => {
            audio.play().then(() => {
              if (audioBtn) {
                audioBtn.classList.add("playing");
                audioBtn.innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
                if (window.lucide) lucide.createIcons();
              }
            }).catch(() => {});
            document.removeEventListener("touchstart", touchToPlay);
            document.removeEventListener("click", touchToPlay);
          };
          document.addEventListener("touchstart", touchToPlay, { once: true });
          document.addEventListener("click", touchToPlay, { once: true });
        });
      }
    }

    if (window.showToast) {
      showToast("Bem-vindo ao Casamento de Izabela & Ivan! 💍✨");
    }
  }

  if (openBtn) {
    openBtn.addEventListener("click", unlockInvite);
    openBtn.addEventListener("touchend", unlockInvite);
  }
  if (phoneMockup) {
    phoneMockup.addEventListener("click", unlockInvite);
    phoneMockup.addEventListener("touchend", unlockInvite);
  }
}

/* ==========================================================================
   1. COUNTDOWN CONTROLLER (14 DE NOVEMBRO ÀS 14:00)
   ========================================================================== */
function initCountdown() {
  const targetDate = new Date("2026-11-14T14:00:00").getTime();

  function update() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      document.getElementById("cd-days").textContent = "00";
      document.getElementById("cd-hours").textContent = "00";
      document.getElementById("cd-minutes").textContent = "00";
      document.getElementById("cd-seconds").textContent = "00";
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    const elDays = document.getElementById("cd-days");
    const elHours = document.getElementById("cd-hours");
    const elMinutes = document.getElementById("cd-minutes");
    const elSeconds = document.getElementById("cd-seconds");

    if (elDays) elDays.textContent = String(days).padStart(2, "0");
    if (elHours) elHours.textContent = String(hours).padStart(2, "0");
    if (elMinutes) elMinutes.textContent = String(minutes).padStart(2, "0");
    if (elSeconds) elSeconds.textContent = String(seconds).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   2. AMBIENT AUDIO PLAYER & BUBBLE
   ========================================================================== */
function showAudioBubble(text, iconName = "music") {
  const bubble = document.getElementById("audio-status-bubble");
  if (!bubble) return;

  bubble.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 text-[#FFE082]"></i> <span id="audio-status-text">${text}</span>`;
  if (window.lucide) lucide.createIcons();

  bubble.classList.add("show");
  clearTimeout(window._audioBubbleTimeout);
  window._audioBubbleTimeout = setTimeout(() => {
    bubble.classList.remove("show");
  }, 4500);
}

function initAudioPlayer() {
  const audioBtn = document.getElementById("audio-toggle-btn");
  const audio = document.getElementById("wedding-ambient-audio");

  if (!audioBtn || !audio) return;

  let isPlaying = false;

  audioBtn.addEventListener("click", () => {
    if (isPlaying) {
      audio.pause();
      audioBtn.classList.remove("playing");
      audioBtn.innerHTML = '<i data-lucide="music" class="w-5 h-5"></i>';
      showAudioBubble("Música Pausada 🔇", "volume-x");
    } else {
      audio.play().then(() => {
        audioBtn.classList.add("playing");
        audioBtn.innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
        showAudioBubble("Tocando: Stephen Sanchez — Until I Found You 🎵", "volume-2");
      }).catch(err => {
        console.warn("Audio autoplay policy:", err);
        showAudioBubble("Toque para ativar o áudio 🎵", "music");
      });
    }
    isPlaying = !isPlaying;
    if (window.lucide) lucide.createIcons();
  });
}

/* ==========================================================================
   3. SCROLL & REVEAL ANIMATIONS
   ========================================================================== */
function initScrollEffects() {
  const navbar = document.querySelector(".navbar-luxury");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 80) {
      navbar?.classList.add("scrolled");
    } else {
      navbar?.classList.remove("scrolled");
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal-fade").forEach(el => observer.observe(el));
}

/* ==========================================================================
   4. PIX GIFT REGISTRY & MODAL
   ========================================================================== */
const PIX_CONFIG = {
  key: "11999998888", // Chave Pix
  name: "Izabela e Ivan",
  city: "GUARULHOS"
};

function initGiftRegistry() {
  const modal = document.getElementById("pix-gift-modal");
  const closeModalBtn = document.getElementById("close-pix-modal");
  const copyPixBtn = document.getElementById("copy-pix-btn");
  const customAmountInput = document.getElementById("custom-pix-amount");

  let currentGift = { title: "Cota de Amor", amount: 150 };

  window.openPixModal = function(title, amount) {
    currentGift = { title, amount: parseFloat(amount) || 0 };
    document.getElementById("modal-gift-title").textContent = title;
    
    if (currentGift.amount > 0) {
      document.getElementById("modal-gift-amount-display").textContent = `R$ ${currentGift.amount.toFixed(2).replace('.', ',')}`;
      customAmountInput.value = currentGift.amount;
    } else {
      document.getElementById("modal-gift-amount-display").textContent = "Valor Livre";
      customAmountInput.value = "";
    }

    renderPixQrCode(currentGift.amount);
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  function closePixModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closePixModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closePixModal();
    });
  }

  if (customAmountInput) {
    customAmountInput.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value) || 0;
      document.getElementById("modal-gift-amount-display").textContent = val > 0 ? `R$ ${val.toFixed(2).replace('.', ',')}` : "Valor Livre";
      renderPixQrCode(val);
    });
  }

  function renderPixQrCode(amount) {
    const pix = new PixPayload({
      key: PIX_CONFIG.key,
      name: PIX_CONFIG.name,
      city: PIX_CONFIG.city,
      amount: amount > 0 ? amount : 0,
      txtId: "CASAMENTO"
    });

    const payload = pix.getPayload();
    document.getElementById("pix-copia-cola-input").value = payload;

    const qrContainer = document.getElementById("pix-qrcode-container");
    qrContainer.innerHTML = "";

    if (typeof QRCode !== "undefined") {
      new QRCode(qrContainer, {
        text: payload,
        width: 180,
        height: 180,
        colorDark: "#220308",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }

  if (copyPixBtn) {
    copyPixBtn.addEventListener("click", () => {
      const input = document.getElementById("pix-copia-cola-input");
      input.select();
      input.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(input.value).then(() => {
        const originalText = copyPixBtn.innerHTML;
        copyPixBtn.innerHTML = '<i data-lucide="check"></i> Código Pix Copiado! ✓';
        copyPixBtn.style.background = "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)";
        copyPixBtn.style.color = "#052e16";
        if (window.lucide) lucide.createIcons();

        showToast("Código Pix Copia e Cola copiado com sucesso!");

        setTimeout(() => {
          copyPixBtn.innerHTML = originalText;
          copyPixBtn.style.background = "";
          copyPixBtn.style.color = "";
          if (window.lucide) lucide.createIcons();
        }, 3000);
      });
    });
  }
}

/* ==========================================================================
   5. RSVP DUAL ACTION (FIRESTORE + WHATSAPP)
   ========================================================================== */
const NOIVOS_WHATSAPP = "5511999998888"; // WhatsApp dos noivos

function initRsvpForm() {
  const form = document.getElementById("rsvp-form");
  const radioYes = document.getElementById("radio-attending-yes");
  const radioNo = document.getElementById("radio-attending-no");
  const cardYes = document.getElementById("card-attending-yes");
  const cardNo = document.getElementById("card-attending-no");
  const guestsWrapper = document.getElementById("guests-details-wrapper");

  if (!form) return;

  function updateRadioState() {
    if (radioYes.checked) {
      cardYes.classList.add("active");
      cardNo.classList.remove("active");
      if (guestsWrapper) guestsWrapper.style.display = "block";
    } else {
      cardNo.classList.add("active");
      cardYes.classList.remove("active");
      if (guestsWrapper) guestsWrapper.style.display = "none";
    }
  }

  cardYes?.addEventListener("click", () => { radioYes.checked = true; updateRadioState(); });
  cardNo?.addEventListener("click", () => { radioNo.checked = true; updateRadioState(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("rsvp-submit-btn");
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Confirmando...';
    if (window.lucide) lucide.createIcons();

    const fullName = document.getElementById("rsvp-name").value.trim();
    const phone = document.getElementById("rsvp-phone").value.trim();
    const attending = radioYes.checked ? "yes" : "no";
    const guestsCount = attending === "yes" ? parseInt(document.getElementById("rsvp-guests-count").value) || 1 : 0;
    const guestsNames = attending === "yes" ? document.getElementById("rsvp-guests-names").value.trim() : "";
    const dietary = attending === "yes" ? document.getElementById("rsvp-dietary").value.trim() : "";
    const message = document.getElementById("rsvp-message").value.trim();

    const rsvpData = {
      fullName,
      phone,
      attending,
      guestsCount,
      guestsNames,
      dietary,
      message
    };

    try {
      // 1. Salvar no Banco de Dados (Firestore / Local)
      await window.weddingDB.saveRSVP(rsvpData);

      showToast("Presença registrada com sucesso! Redirecionando...");

      // 2. Formatar Mensagem Elegante para o WhatsApp
      let whatsappText = `✨ *CONFIRMAÇÃO DE PRESENÇA - CASAMENTO* ✨\n`;
      whatsappText += `💍 *Izabela & Ivan*\n\n`;
      whatsappText += `👤 *Nome:* ${fullName}\n`;
      whatsappText += `📱 *Telefone:* ${phone}\n`;
      whatsappText += `✨ *Status:* ${attending === 'yes' ? '✅ SIM, EU VOU!' : '❌ Não poderei comparecer'}\n`;
      
      if (attending === "yes") {
        whatsappText += `👥 *Total de Pessoas:* ${guestsCount}\n`;
        if (guestsNames) whatsappText += `📝 *Acompanhantes:* ${guestsNames}\n`;
        if (dietary) whatsappText += `🥗 *Restrição Alimentar:* ${dietary}\n`;
      }
      
      if (message) {
        whatsappText += `\n💌 *Recado para os noivos:*\n"${message}"\n`;
      }
      
      whatsappText += `\n🥂 _Enviado através do site oficial do casamento._`;

      const encodedMsg = encodeURIComponent(whatsappText);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${NOIVOS_WHATSAPP}&text=${encodedMsg}`;

      form.reset();
      updateRadioState();

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        if (window.lucide) lucide.createIcons();
        window.open(whatsappUrl, "_blank");
      }, 1200);

    } catch (err) {
      console.error(err);
      showToast("Erro ao processar. Tente novamente.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      if (window.lucide) lucide.createIcons();
    }
  });
}

/* ==========================================================================
   6. TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById("luxury-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "luxury-toast";
    toast.className = "toast-luxury";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i data-lucide="sparkles" style="color: var(--gold-300);" class="w-5 h-5"></i> <span>${message}</span>`;
  if (window.lucide) lucide.createIcons();

  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

window.showToast = showToast;
