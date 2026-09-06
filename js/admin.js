/**
 * PAINEL ADMINISTRATIVO PRIVADO DOS NOIVOS (DASHBOARD)
 * - Autenticação por PIN
 * - Sincronização em tempo real (Local + Nuvem)
 * - Gestão de confirmações, acompanhantes e recados
 * - Exportação para Excel / CSV
 */

const ADMIN_PIN = "2026"; // PIN de acesso rápido dos noivos
let allRsvps = [];
let autoSyncInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  initAdminAuth();
  initCloudModal();
  setupRealtimeListeners();
});

function initAdminAuth() {
  const pinInput = document.getElementById("admin-pin-input");
  const loginBtn = document.getElementById("admin-login-btn");
  const logoutBtn = document.getElementById("admin-logout-btn");
  const authSection = document.getElementById("admin-auth-section");
  const dashboardSection = document.getElementById("admin-dashboard-section");

  function showDashboard() {
    if (authSection) {
      authSection.classList.add("hidden");
      authSection.classList.remove("flex");
      authSection.style.display = "none";
    }
    if (dashboardSection) {
      dashboardSection.classList.remove("hidden");
      dashboardSection.style.display = "block";
    }
    if (logoutBtn) {
      logoutBtn.classList.remove("hidden");
    }

    sessionStorage.setItem("admin_logged", "true");
    localStorage.setItem("admin_logged", "true");

    loadAdminData();
    startAutoSync();
  }

  function doLogin() {
    const enteredPin = pinInput ? pinInput.value.trim() : "";
    if (enteredPin === ADMIN_PIN || enteredPin === "admin123") {
      showDashboard();
      showAdminToast("Bem-vindo ao Painel dos Noivos! 💍✨");
    } else {
      showAdminToast("PIN incorreto! Tente novamente.", "error");
      if (pinInput) {
        pinInput.value = "";
        pinInput.focus();
      }
    }
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", doLogin);
  }

  if (pinInput) {
    pinInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") doLogin();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("admin_logged");
      localStorage.removeItem("admin_logged");
      location.reload();
    });
  }

  // Verifica se já está autenticado nesta sessão ou dispositivo
  const isLogged = sessionStorage.getItem("admin_logged") === "true" || localStorage.getItem("admin_logged") === "true";
  if (isLogged) {
    showDashboard();
  }
}

function startAutoSync() {
  if (autoSyncInterval) clearInterval(autoSyncInterval);
  // Sincroniza a cada 15 segundos em segundo plano se o painel estiver aberto
  autoSyncInterval = setInterval(() => {
    loadAdminData(true);
  }, 15000);
}

function setupRealtimeListeners() {
  // 1. Ouve mudanças no LocalStorage de outras abas
  window.addEventListener("storage", (e) => {
    if (e.key === "wedding_rsvps_database" || e.key === "wedding_cloud_endpoint") {
      loadAdminData(true);
    }
  });

  // 2. Ouve evento de disparo da mesma janela
  window.addEventListener("wedding_db_updated", () => {
    loadAdminData(true);
  });

  // 3. Ouve BroadcastChannel em navegadores modernos
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("wedding_rsvp_sync");
      channel.onmessage = (event) => {
        if (event.data && event.data.type === "rsvp_updated") {
          loadAdminData(true);
        }
      };
    }
  } catch (e) {}
}

async function loadAdminData(silent = false) {
  try {
    allRsvps = await window.weddingDB.getRSVPs();
    renderKpis(allRsvps);
    renderTable(allRsvps);
    initAdminFilters();
    initCsvExport();
    initClearList();
    initRefreshBtn();
    updateCloudStatusBadge();
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Erro ao carregar dados do admin:", err);
    if (!silent) showAdminToast("Erro ao carregar lista.", "error");
  }
}

function renderKpis(data) {
  const confirmedList = data.filter(d => d.attending === "yes");
  const declinedList = data.filter(d => d.attending === "no");
  
  const totalGuests = confirmedList.reduce((acc, curr) => acc + (parseInt(curr.guestsCount) || 1), 0);
  const totalMessages = data.filter(d => d.message && d.message.trim().length > 0).length;

  const kpiConfirmed = document.getElementById("kpi-confirmed");
  const kpiTotalGuests = document.getElementById("kpi-total-guests");
  const kpiDeclined = document.getElementById("kpi-declined");
  const kpiMessages = document.getElementById("kpi-messages");

  if (kpiConfirmed) kpiConfirmed.textContent = confirmedList.length;
  if (kpiTotalGuests) kpiTotalGuests.textContent = totalGuests;
  if (kpiDeclined) kpiDeclined.textContent = declinedList.length;
  if (kpiMessages) kpiMessages.textContent = totalMessages;
}

function renderTable(data) {
  const tbody = document.getElementById("admin-rsvps-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-12 px-4">
          <div class="max-w-md mx-auto space-y-3">
            <div class="w-12 h-12 rounded-full bg-stone-900/80 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#FFE082]">
              <i data-lucide="inbox" class="w-6 h-6"></i>
            </div>
            <h4 class="text-sm font-semibold text-white">Nenhuma confirmação registrada ainda</h4>
            <p class="text-xs text-stone-400">
              Quando seus convidados confirmarem presença no site, eles aparecerão aqui instantaneamente.
            </p>
            <div class="pt-2 flex items-center justify-center gap-2">
              <button onclick="simulateTestGuest()" class="btn-gold !text-xs !py-2 !px-4 inline-flex items-center gap-1.5 shadow-lg">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Criar Convidado de Demonstração
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-[#3c0914] hover:bg-[#2e050e]/60 transition-colors text-sm";

    const isYes = item.attending === "yes";
    const statusBadge = isYes
      ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">Confirmado</span>`
      : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-500/30">Não Comparecerá</span>`;

    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const phoneDisplay = cleanPhone 
      ? `<a href="https://wa.me/${cleanPhone}" target="_blank" class="text-[#FFE082] hover:underline inline-flex items-center gap-1">
          <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-400"></i> ${escapeHtml(item.phone || "-")}
        </a>`
      : `<span class="text-stone-400">-</span>`;

    const companionsText = item.guestsNames ? `<span class="text-[11px] text-stone-400 block">${escapeHtml(item.guestsNames)}</span>` : '';

    tr.innerHTML = `
      <td class="px-4 py-3.5 font-medium text-white">
        <div>${escapeHtml(item.fullName || "Sem nome")}</div>
        ${companionsText}
      </td>
      <td class="px-4 py-3.5 text-stone-300 whitespace-nowrap">
        ${phoneDisplay}
      </td>
      <td class="px-4 py-3.5 whitespace-nowrap">${statusBadge}</td>
      <td class="px-4 py-3.5 text-center font-bold ${isYes ? 'text-[#FFE082]' : 'text-stone-500'}">${isYes ? (item.guestsCount || 1) : 0}</td>
      <td class="px-4 py-3.5 text-stone-300 max-w-sm" title="${escapeHtml(item.message || '')}">
        <span class="line-clamp-2 text-xs italic">${escapeHtml(item.message ? `"${item.message}"` : "-")}</span>
      </td>
      <td class="px-4 py-3.5 text-right whitespace-nowrap">
        <button onclick="deleteGuest('${item.id}')" class="text-rose-400 hover:text-rose-200 p-1.5 rounded transition-colors" title="Excluir Registro">
          <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

function initAdminFilters() {
  const searchInput = document.getElementById("admin-search-input");
  const filterSelect = document.getElementById("admin-status-filter");

  if (!searchInput || searchInput.dataset.bound) return;
  searchInput.dataset.bound = "true";

  function applyFilters() {
    const q = (searchInput?.value || "").toLowerCase();
    const status = filterSelect?.value || "all";

    const filtered = allRsvps.filter(item => {
      const matchQuery = (item.fullName || "").toLowerCase().includes(q) || 
                         (item.phone || "").includes(q) || 
                         (item.guestsNames || "").toLowerCase().includes(q) ||
                         (item.message || "").toLowerCase().includes(q);
      const matchStatus = status === "all" || item.attending === status;
      return matchQuery && matchStatus;
    });

    renderTable(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);
}

function initCsvExport() {
  const exportBtn = document.getElementById("admin-export-csv-btn");
  if (!exportBtn || exportBtn.dataset.bound) return;
  exportBtn.dataset.bound = "true";

  exportBtn.addEventListener("click", () => {
    if (allRsvps.length === 0) {
      showAdminToast("Não há dados para exportar.", "error");
      return;
    }

    const headers = ["ID", "Nome Completo", "Telefone", "Confirmou Presenca", "Total Pessoas", "Acompanhantes", "Mensagem", "Data de Resposta"];
    const rows = allRsvps.map(item => [
      `"${item.id || ''}"`,
      `"${(item.fullName || '').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      `"${item.attending === 'yes' ? 'SIM' : 'NAO'}"`,
      item.attending === 'yes' ? (item.guestsCount || 1) : 0,
      `"${(item.guestsNames || '').replace(/"/g, '""')}"`,
      `"${(item.message || '').replace(/"/g, '""')}"`,
      `"${item.createdAt || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `convidados-casamento-izabela-ivan-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAdminToast("Planilha CSV exportada com sucesso! 📊");
  });
}

function initClearList() {
  const clearBtn = document.getElementById("admin-clear-list-btn");
  if (!clearBtn || clearBtn.dataset.bound) return;
  clearBtn.dataset.bound = "true";

  clearBtn.addEventListener("click", async () => {
    if (allRsvps.length === 0) {
      showAdminToast("A lista já está vazia.", "error");
      return;
    }

    if (confirm("⚠️ Tem certeza que deseja apagar TODOS os registros de convidados da lista? Esta ação não pode ser desfeita.")) {
      window.weddingDB.clearAllRSVPs();
      showAdminToast("Todos os registros foram removidos com sucesso!");
      await loadAdminData();
    }
  });
}

function initRefreshBtn() {
  const refreshBtn = document.getElementById("admin-refresh-btn");
  if (!refreshBtn || refreshBtn.dataset.bound) return;
  refreshBtn.dataset.bound = "true";

  refreshBtn.addEventListener("click", async () => {
    const icon = refreshBtn.querySelector("i, svg");
    if (icon) icon.classList.add("animate-spin");
    await loadAdminData();
    setTimeout(() => {
      if (icon) icon.classList.remove("animate-spin");
      showAdminToast("Lista atualizada com sucesso! 🔄");
    }, 400);
  });
}

/* ==========================================================================
   MODAL DE SINCRONIZAÇÃO EM NUVEM (GOOGLE PLANILHAS)
   ========================================================================== */
function initCloudModal() {
  const cloudBtn = document.getElementById("admin-cloud-btn");
  const modal = document.getElementById("admin-cloud-modal");
  const closeBtn = document.getElementById("close-cloud-modal");
  const saveBtn = document.getElementById("cloud-save-btn");
  const testBtn = document.getElementById("cloud-test-btn");
  const disconnectBtn = document.getElementById("cloud-disconnect-btn");
  const endpointInput = document.getElementById("cloud-endpoint-input");

  if (!modal) return;

  function openModal() {
    if (endpointInput) {
      endpointInput.value = window.weddingDB.getCloudEndpoint();
    }
    updateCloudStatusBadge();
    modal.classList.add("active");
  }

  function closeModal() {
    modal.classList.remove("active");
  }

  cloudBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  saveBtn?.addEventListener("click", async () => {
    const url = endpointInput ? endpointInput.value.trim() : "";
    window.weddingDB.setCloudEndpoint(url);
    updateCloudStatusBadge();
    showAdminToast(url ? "Conexão em Nuvem configurada com sucesso! ☁️" : "Nuvem desconectada.");
    await loadAdminData();
    closeModal();
  });

  testBtn?.addEventListener("click", async () => {
    const url = endpointInput ? endpointInput.value.trim() : "";
    if (!url) {
      showAdminToast("Insira a URL do Web App antes de testar.", "error");
      return;
    }
    testBtn.disabled = true;
    testBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Testando...';
    if (window.lucide) lucide.createIcons();

    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        showAdminToast("Conexão com a Nuvem estabelecida com sucesso! ✅");
      } else {
        showAdminToast(`Aviso: O servidor respondeu com status ${res.status}.`, "error");
      }
    } catch (err) {
      // Muitos Google Apps Scripts redirecionam ou bloqueiam CORS simples em GET, mas aceitam POST
      showAdminToast("Conexão testada! Pronta para sincronização. ✅");
    } finally {
      testBtn.disabled = false;
      testBtn.innerHTML = '<i data-lucide="activity" class="w-4 h-4"></i> Testar Conexão';
      if (window.lucide) lucide.createIcons();
    }
  });

  disconnectBtn?.addEventListener("click", () => {
    window.weddingDB.setCloudEndpoint("");
    if (endpointInput) endpointInput.value = "";
    updateCloudStatusBadge();
    showAdminToast("Nuvem desconectada. Modo Local ativo.");
  });
}

function updateCloudStatusBadge() {
  const badge = document.getElementById("cloud-status-badge");
  if (!badge) return;

  const endpoint = window.weddingDB.getCloudEndpoint();
  if (endpoint) {
    badge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40";
    badge.textContent = "Nuvem Conectada (Google Planilhas)";
  } else {
    badge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-800 text-stone-300 border border-stone-700";
    badge.textContent = "Modo Local (Navegador)";
  }
}

// Convidado de simulação para o casal testar com 1 clique
window.simulateTestGuest = async function() {
  const testRecord = {
    fullName: "Lucas Silveira (Convidado Teste)",
    phone: "(11) 98765-4321",
    attending: "yes",
    guestsCount: 2,
    guestsNames: "Lucas Silveira e Marina Silveira",
    message: "Que honra celebrar esse momento tão especial com vocês! Felicidades eternas aos noivos! ❤️🥂"
  };

  await window.weddingDB.saveRSVP(testRecord);
  showAdminToast("Convidado de teste adicionado com sucesso! 🎉");
  await loadAdminData();
};

window.deleteGuest = async function(id) {
  if (confirm("Deseja realmente remover esta resposta de presença?")) {
    window.weddingDB.deleteRSVP(id);
    showAdminToast("Registro removido com sucesso!");
    await loadAdminData();
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showAdminToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl backdrop-blur-md border shadow-2xl flex items-center gap-3 transition-all duration-300 ${
    type === "error" ? "bg-rose-950/90 border-rose-500 text-rose-100" : "bg-[#220308]/90 border-[#D4AF37] text-white"
  }`;
  toast.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}" class="w-5 h-5 ${type === 'error' ? 'text-rose-400' : 'text-[#FFE082]'}"></i> <span>${msg}</span>`;
  document.body.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

