/**
 * PAINEL ADMINISTRATIVO PRIVADO DOS NOIVOS (DASHBOARD)
 */

document.addEventListener("DOMContentLoaded", () => {
  initAdminAuth();
});

const ADMIN_PIN = "2026"; // PIN de acesso rápido dos noivos

function initAdminAuth() {
  const pinInput = document.getElementById("admin-pin-input");
  const loginBtn = document.getElementById("admin-login-btn");
  const authSection = document.getElementById("admin-auth-section");
  const dashboardSection = document.getElementById("admin-dashboard-section");

  if (!loginBtn) return;

  function doLogin() {
    const enteredPin = pinInput.value.trim();
    if (enteredPin === ADMIN_PIN || enteredPin === "admin123") {
      sessionStorage.setItem("admin_logged", "true");
      authSection.style.display = "none";
      dashboardSection.style.display = "block";
      loadAdminData();
    } else {
      showAdminToast("PIN incorreto! Tente novamente.", "error");
      pinInput.value = "";
      pinInput.focus();
    }
  }

  loginBtn.addEventListener("click", doLogin);
  pinInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") doLogin();
  });

  if (sessionStorage.getItem("admin_logged") === "true") {
    if (authSection) authSection.style.display = "none";
    if (dashboardSection) dashboardSection.style.display = "block";
    loadAdminData();
  }
}

let allRsvps = [];

async function loadAdminData() {
  allRsvps = await window.weddingDB.getRSVPs();
  renderKpis(allRsvps);
  renderTable(allRsvps);
  initAdminFilters();
  initCsvExport();
  if (window.lucide) lucide.createIcons();
}

function renderKpis(data) {
  const totalResponses = data.length;
  const confirmedList = data.filter(d => d.attending === "yes");
  const declinedList = data.filter(d => d.attending === "no");
  
  const totalGuests = confirmedList.reduce((acc, curr) => acc + (parseInt(curr.guestsCount) || 1), 0);
  const totalMessages = data.filter(d => d.message && d.message.trim().length > 0).length;
  const totalDietary = confirmedList.filter(d => d.dietary && d.dietary.trim().length > 0 && d.dietary.toLowerCase() !== "nenhuma").length;

  document.getElementById("kpi-confirmed").textContent = confirmedList.length;
  document.getElementById("kpi-total-guests").textContent = totalGuests;
  document.getElementById("kpi-declined").textContent = declinedList.length;
  document.getElementById("kpi-dietary").textContent = totalDietary;
  document.getElementById("kpi-messages").textContent = totalMessages;
}

function renderTable(data) {
  const tbody = document.getElementById("admin-rsvps-tbody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-stone-400">Nenhuma confirmação encontrada.</td></tr>`;
    return;
  }

  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-[#3c0914] hover:bg-[#2e050e]/60 transition-colors text-sm";

    const isYes = item.attending === "yes";
    const statusBadge = isYes
      ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">Confirmado</span>`
      : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-500/30">Não Comparecerá</span>`;

    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : "-";

    tr.innerHTML = `
      <td class="px-4 py-3.5 font-medium text-white">${escapeHtml(item.fullName || "")}</td>
      <td class="px-4 py-3.5 text-stone-300 whitespace-nowrap">
        <a href="https://wa.me/${(item.phone || '').replace(/\D/g, '')}" target="_blank" class="text-[#FFE082] hover:underline inline-flex items-center gap-1">
          ${escapeHtml(item.phone || "-")}
        </a>
      </td>
      <td class="px-4 py-3.5 whitespace-nowrap">${statusBadge}</td>
      <td class="px-4 py-3.5 text-center font-bold ${isYes ? 'text-[#FFE082]' : 'text-stone-500'}">${isYes ? (item.guestsCount || 1) : 0}</td>
      <td class="px-4 py-3.5 text-stone-300 max-w-xs truncate" title="${escapeHtml(item.dietary || 'Nenhuma')}">${escapeHtml(item.dietary || "-")}</td>
      <td class="px-4 py-3.5 text-stone-300 max-w-sm truncate" title="${escapeHtml(item.message || '')}">${escapeHtml(item.message || "-")}</td>
      <td class="px-4 py-3.5 text-right whitespace-nowrap">
        <button onclick="deleteGuest('${item.id}')" class="text-rose-400 hover:text-rose-200 p-1 rounded transition-colors" title="Excluir">
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

  function applyFilters() {
    const q = (searchInput?.value || "").toLowerCase();
    const status = filterSelect?.value || "all";

    const filtered = allRsvps.filter(item => {
      const matchQuery = (item.fullName || "").toLowerCase().includes(q) || (item.phone || "").includes(q) || (item.message || "").toLowerCase().includes(q);
      const matchStatus = status === "all" || item.attending === status;
      return matchQuery && matchStatus;
    });

    renderTable(filtered);
  }

  searchInput?.addEventListener("input", applyFilters);
  filterSelect?.addEventListener("change", applyFilters);
}

function initCsvExport() {
  const exportBtn = document.getElementById("admin-export-csv-btn");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", () => {
    if (allRsvps.length === 0) {
      showAdminToast("Não há dados para exportar.", "error");
      return;
    }

    const headers = ["ID", "Nome Completo", "Telefone", "Confirmou Presenca", "Total Pessoas", "Acompanhantes", "Restricao Alimentar", "Mensagem", "Data de Resposta"];
    const rows = allRsvps.map(item => [
      `"${item.id || ''}"`,
      `"${(item.fullName || '').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      `"${item.attending === 'yes' ? 'SIM' : 'NAO'}"`,
      item.attending === 'yes' ? (item.guestsCount || 1) : 0,
      `"${(item.guestsNames || '').replace(/"/g, '""')}"`,
      `"${(item.dietary || '').replace(/"/g, '""')}"`,
      `"${(item.message || '').replace(/"/g, '""')}"`,
      `"${item.createdAt || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `lista-casamento-izabela-ivan-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAdminToast("Planilha CSV exportada com sucesso! 📊");
  });
}

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
