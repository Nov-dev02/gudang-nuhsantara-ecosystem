// =========================================================================
// 🛡️ GUDANG NUHSANTARA - 100% PURE CLOUD FIREBASE GUARD & PRO LIVE CHAT (v4.9)
// =========================================================================

// 🌐 URL FIREBASE REALTIME DATABASE MILIKMU
const FIREBASE_DB_URL = "https://gudang-nuhsantara-auth-default-rtdb.asia-southeast1.firebasedatabase.app";
const CLOUD_LICENSE_ENDPOINT = `${FIREBASE_DB_URL}/gudang_nuhsantara/license.json`;

const ADMIN_NX_PIN = "2026";
const NX_RANDOM_CHAR_LEN = 18;
let secretClickCount = 0;
let secretClickTimer = null;
let universalChatPollInterval = null;
let staffTypingTimeout = null;
let guardToastTimeout = null;

// --- HELPER ESCAPE HTML AMAN ---
function escapeGuardHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- HELPER STYLE ANIMASI MAINTENANCE (GEAR BERPUTAR + MENGAMBANG & BERDENYUT PELAN) ---
function injectMaintenanceAnimationStyle() {
  if (document.getElementById("nx-maintenance-anim-style")) return;

  const style = document.createElement("style");
  style.id = "nx-maintenance-anim-style";
  style.textContent = `
    @keyframes nxGearSpin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes nxFloatPulse {
      0%, 100% {
        transform: translateY(0px) scale(1);
        box-shadow: 0 24px 55px rgba(0, 0, 0, 0.85), 0 0 24px rgba(245, 158, 11, 0.16);
      }
      50% {
        transform: translateY(-7px) scale(1.012);
        box-shadow: 0 30px 65px rgba(0, 0, 0, 0.92), 0 0 36px rgba(245, 158, 11, 0.28);
      }
    }

    .nx-gear-spin {
      animation: nxGearSpin 4.5s linear infinite;
      transform-origin: center center;
    }

    .nx-maintenance-float-pulse {
      animation: nxFloatPulse 3.6s ease-in-out infinite;
      will-change: transform, box-shadow;
    }
  `;

  const parentTarget = document.head || document.documentElement;
  parentTarget.appendChild(style);
}

// --- HELPER TOAST ESTETIK TEMA GUDANG NUHSANTARA ---
function tampilkanGuardToast(pesan, type = "success", duration = 2600) {
  const existing = document.getElementById("nx-guard-custom-toast");
  if (existing) existing.remove();
  if (guardToastTimeout) clearTimeout(guardToastTimeout);

  const palette = {
    success: { border: "#22c55e", iconBg: "rgba(34, 197, 94, 0.16)", iconColor: "#4ade80", icon: "fa-circle-check" },
    info: { border: "#38bdf8", iconBg: "rgba(56, 189, 248, 0.16)", iconColor: "#38bdf8", icon: "fa-circle-info" },
    error: { border: "#ef4444", iconBg: "rgba(239, 68, 68, 0.16)", iconColor: "#f87171", icon: "fa-triangle-exclamation" }
  };
  const theme = palette[type] || palette.info;

  const toast = document.createElement("div");
  toast.id = "nx-guard-custom-toast";
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-14px);
    width: min(92vw, 410px);
    background: rgba(15, 23, 42, 0.97);
    border: 1.5px solid ${theme.border};
    backdrop-filter: blur(14px);
    border-radius: 14px;
    padding: 12px 14px;
    z-index: 2147483647;
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.85), 0 0 24px rgba(15, 23, 42, 0.6);
    font-family: monospace;
    color: #f8fafc;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    opacity: 0;
    transition: opacity 0.22s ease, transform 0.22s ease;
    box-sizing: border-box;
  `;

  toast.innerHTML = `
    <div style="width: 28px; height: 28px; border-radius: 8px; background: ${theme.iconBg}; color: ${theme.iconColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 13px; margin-top: 1px;">
      <i class="fa-solid ${theme.icon}"></i>
    </div>
    <div style="flex: 1; min-width: 0; font-size: 11.5px; line-height: 1.45; word-break: break-word;">
      ${pesan}
    </div>
  `;

  const parentTarget = document.body || document.documentElement;
  parentTarget.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  guardToastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-10px)";
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 220);
  }, duration);
}

// --- HELPER MODAL KONFIRMASI ESTETIK (PENGGANTI confirm() BAWAAN BROWSER) ---
function tampilkanGuardConfirm(options = {}) {
  const {
    title = "KONFIRMASI TINDAKAN",
    message = "Apakah Anda yakin ingin melanjutkan?",
    confirmText = "Ya, Hapus",
    cancelText = "Batal",
    danger = true
  } = options;

  return new Promise((resolve) => {
    const existing = document.getElementById("nx-guard-confirm-modal");
    if (existing) existing.remove();

    const accentColor = danger ? "#ef4444" : "#38bdf8";
    const confirmBg = danger
      ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
      : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)";

    const overlay = document.createElement("div");
    overlay.id = "nx-guard-confirm-modal";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(7, 11, 20, 0.78);
      backdrop-filter: blur(10px);
      z-index: 2147483647;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    const modalBox = document.createElement("div");
    modalBox.style.cssText = `
      position: relative;
      width: min(100%, 360px);
      background: #0f172a;
      border: 1.5px solid ${danger ? "rgba(239, 68, 68, 0.55)" : "rgba(56, 189, 248, 0.45)"};
      border-radius: 18px;
      padding: 22px 20px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 32px rgba(239, 68, 68, 0.14);
      font-family: monospace;
      color: #f8fafc;
      text-align: center;
      transform: scale(0.95);
      transition: transform 0.2s ease;
      box-sizing: border-box;
    `;

    modalBox.innerHTML = `
      <div style="width: 44px; height: 44px; border-radius: 50%; background: ${danger ? "rgba(239, 68, 68, 0.14)" : "rgba(56, 189, 248, 0.14)"}; border: 1px solid ${accentColor}; color: ${accentColor}; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; font-size: 18px;">
        <i class="fa-solid ${danger ? "fa-trash-can" : "fa-circle-question"}"></i>
      </div>
      <div style="font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 0.5px; margin-bottom: 8px;">
        ${escapeGuardHtml(title)}
      </div>
      <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.5; margin-bottom: 18px;">
        ${escapeGuardHtml(message)}
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="button" id="nxConfirmCancelBtn" style="flex: 1; padding: 9px 12px; background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 8px; cursor: pointer; font-family: monospace; font-size: 11.5px; font-weight: bold;">
          ${escapeGuardHtml(cancelText)}
        </button>
        <button type="button" id="nxConfirmOkBtn" style="flex: 1; padding: 9px 12px; background: ${confirmBg}; border: 1px solid ${accentColor}; color: #fff; border-radius: 8px; cursor: pointer; font-family: monospace; font-size: 11.5px; font-weight: bold; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);">
          ${escapeGuardHtml(confirmText)}
        </button>
      </div>
    `;

    overlay.appendChild(modalBox);
    const parentTarget = document.body || document.documentElement;
    parentTarget.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      modalBox.style.transform = "scale(1)";
    });

    const cleanup = (result) => {
      document.removeEventListener("keydown", onKeyDown);
      overlay.style.opacity = "0";
      modalBox.style.transform = "scale(0.95)";
      setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
        resolve(result);
      }, 180);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") cleanup(false);
    };

    document.addEventListener("keydown", onKeyDown);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });
    modalBox.querySelector("#nxConfirmCancelBtn").addEventListener("click", () => cleanup(false));
    modalBox.querySelector("#nxConfirmOkBtn").addEventListener("click", () => cleanup(true));
  });
}

// --- HELPER FORMAT TEKS CHAT (MARKDOWN SEDERHANA KE HTML BERSIH) ---
function formatChatTextHtml(text) {
  let clean = escapeGuardHtml(String(text || ""));
  clean = clean.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  return clean;
}

// --- HELPER EKSTRAK TOKEN MURNI (SESUAI POLA 18 CHAR + NX + HEX + 18 CHAR) ---
function extractPureToken(rawText) {
  if (!rawText) return null;

  const cleaned = String(rawText)
    .replace(/<[^>]*>/g, " ")
    .replace(/[`*"]/g, " ")
    .trim();

  if (!cleaned) return null;

  const nxExactMatch = cleaned.match(/[A-Za-z0-9]{18}NX[0-9a-fA-F]+[A-Za-z0-9]{18}/);
  if (nxExactMatch && nxExactMatch[0]) {
    return nxExactMatch[0].trim();
  }

  const nxLooseMatch = cleaned.match(/[A-Za-z0-9_-]{8,}NX[0-9a-fA-F]+[A-Za-z0-9_-]{6,}/);
  if (nxLooseMatch && nxLooseMatch[0]) {
    return nxLooseMatch[0].trim();
  }

  return null;
}

// --- DECODER TOKEN NX (BUANG 18 CHAR SUFFIX SETELAH "NX") ---
function decodeTokenToDate(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const cleanToken = token.trim();
    if (!cleanToken.includes("NX")) return null;

    const parts = cleanToken.split("NX");
    if (parts.length < 2) return null;

    const afterNx = parts[1];
    if (afterNx.length <= NX_RANDOM_CHAR_LEN) return null;

    const hexPart = afterNx.slice(0, -NX_RANDOM_CHAR_LEN);
    if (!/^[0-9a-fA-F]+$/.test(hexPart)) return null;

    const timestamp = parseInt(hexPart, 16);
    if (Number.isNaN(timestamp)) return null;

    const targetDate = new Date(timestamp);
    if (Number.isNaN(targetDate.getTime())) return null;

    return targetDate;
  } catch (e) {
    return null;
  }
}

// --- SINKRONISASI MUTLAK DARI CLOUD FIREBASE (POLLING TIAP 2 DETIK) ---
async function cekStatusCloud() {
  try {
    const response = await fetch(CLOUD_LICENSE_ENDPOINT + "?t=" + Date.now());
    if (!response.ok) return;

    const data = await response.json();
    if (!data) return;

    const now = Date.now();
    const decodedFromToken = data.token ? decodeTokenToDate(data.token) : null;
    const expiryMs = decodedFromToken
      ? decodedFromToken.getTime()
      : (data.expiry ? new Date(data.expiry).getTime() : null);
    const isExpired = typeof expiryMs === "number" && !Number.isNaN(expiryMs) && now > expiryMs;

    const isPermanent = data.permanent === true || data.status === "LOCKED_PERM";
    const isMaintenance = data.maintenance === true || data.status === "MAINTENANCE";
    const isTempLocked = data.locked === true || data.status === "LOCKED_TEMP";

    if (isPermanent) {
      tampilkanLayarKunciPermanen();
    } else if (isMaintenance) {
      const kodeErrorMaintenance =
        data.maintenanceCode ||
        data.errorCode ||
        data.code ||
        "ERR_SYSTEM_MAINTENANCE [ID: 503-MNT]";
      const keteranganMaintenance =
        data.maintenanceMessage ||
        data.maintenanceNote ||
        data.message ||
        data.reason ||
        "Sistem Gudang Nuhsantara sedang dalam tahap pemeliharaan rutin, pembaruan modul, atau sinkronisasi database. Mohon tunggu beberapa saat hingga layanan kembali normal.";
      tampilkanSystemMaintenance(keteranganMaintenance, kodeErrorMaintenance);
    } else if (isTempLocked || isExpired) {
      tampilkanLayarKunciMandiri();
    } else {
      const lockScreen = document.getElementById('nx-global-lock-screen');
      if (lockScreen) {
        lockScreen.remove();
        location.reload();
      }
    }
  } catch (err) {
    console.log("Menunggu koneksi cloud...");
  }
}

// =========================================================================
// 💬 PRO LIVE CHAT WIDGET (SETARA APP PO - DENGAN FITUR LENGKAP)
// =========================================================================
function getSafeStaffKeyForChat() {
  let name = localStorage.getItem('gudang_staff_name') || "Staf_General";
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function inisialisasiUniversalChatData() {
  const staffName = localStorage.getItem('gudang_staff_name') || "Staf_General";
  const safeStaffKey = getSafeStaffKeyForChat();

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/staffName.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(staffName)
  }).catch(() => {});

  const res = await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`);
  const msgs = await res.json();
  if (!msgs) {
    const botWelcome = {
      sender: 'bot',
      text: `Halo ${staffName}, saya Asisten Virtual Gudang Nuhsantara. Ada kendala operasional atau token yang bisa saya bantu?`,
      time: Date.now(),
      read: true
    };
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(botWelcome)
    });
  }
}

function renderProLiveChatWidget() {
  const existing = document.getElementById('nx-pro-live-chat-wrapper');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'nx-pro-live-chat-wrapper';
  wrapper.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 2147483640; font-family: monospace;
  `;

  wrapper.innerHTML = `
    <div id="nxProChatDrawer" style="display: none; width: 325px; height: 440px; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 16px; box-shadow: 0 25px 60px rgba(0,0,0,0.9); flex-direction: column; overflow: hidden; margin-bottom: 12px; color: #f8fafc;">
      <div style="background: #1e293b; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div>
          <b style="color: #38bdf8; font-size: 12px; display: block;">💬 LIVE CHAT BANTUAN CS</b>
          <span id="nxTypingIndicatorStaff" style="color: #fbbf24; font-size: 9.5px; display: none;">Admin mengetik...</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" onclick="mintaPerpanjanganTokenStaff()" title="Minta Perpanjangan Masa Aktif" style="background: rgba(56,189,248,0.18); border: 1px solid #38bdf8; color: #7dd3fc; padding: 4px 8px; border-radius: 6px; font-size: 9.5px; font-weight: bold; cursor: pointer;">🔑 Minta Token</button>
          <button type="button" onclick="hapusRiwayatChatStaff()" title="Hapus Riwayat Chat" style="background: none; border: none; color: #ef4444; font-size: 13px; cursor: pointer;"><i class="fa-solid fa-trash-can"></i></button>
          <button type="button" onclick="toggleProChatDrawer()" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">&times;</button>
        </div>
      </div>

      <div id="nxProChatMessagesContainer" style="flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; font-size: 11px;">
        <div style="color: #64748b; text-align: center; margin: auto;">Memuat riwayat percakapan...</div>
      </div>

      <div style="padding: 10px; background: #1e293b; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 6px;">
        <input type="text" id="nxInputStaffChat" placeholder="Ketik pesan bantuan..." oninput="handleStaffTypingIndicator()" onkeypress="if(event.key==='Enter') kirimPesanStaffPro()" style="flex: 1; padding: 8px 10px; background: #020617; border: 1px solid #334155; color: #fff; border-radius: 8px; font-size: 11px; outline: none; font-family: monospace;" />
        <button type="button" onclick="kirimPesanStaffPro()" style="background: #38bdf8; border: none; color: #020617; padding: 0 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 11px;">Kirim</button>
      </div>
    </div>

    <div style="display: flex; justify-content: flex-end;">
      <button type="button" id="nxFabChatBtn" onclick="toggleProChatDrawer()" style="background: #38bdf8; color: #020617; border: none; padding: 12px 18px; border-radius: 999px; font-weight: bold; font-family: monospace; font-size: 12px; cursor: pointer; box-shadow: 0 10px 25px rgba(56, 189, 248, 0.4); display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid fa-headset"></i> Chat CS
        <span id="nxChatUnreadBadge" style="background: #ef4444; color: #fff; font-size: 10px; padding: 1px 6px; border-radius: 10px; display: none;">0</span>
      </button>
    </div>
  `;

  const parentTarget = document.body || document.documentElement;
  parentTarget.appendChild(wrapper);

  inisialisasiUniversalChatData().then(() => {
    sinkronisasiChatStaffRealtime();
  });

  if (universalChatPollInterval) clearInterval(universalChatPollInterval);
  universalChatPollInterval = setInterval(sinkronisasiChatStaffRealtime, 3500);
}

function toggleProChatDrawer() {
  const drawer = document.getElementById('nxProChatDrawer');
  if (!drawer) return;
  const isOpen = drawer.style.display === 'flex';
  drawer.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) {
    sinkronisasiChatStaffRealtime();
    setTimeout(() => {
      const box = document.getElementById('nxProChatMessagesContainer');
      if (box) box.scrollTop = box.scrollHeight;
      document.getElementById('nxInputStaffChat')?.focus();
    }, 100);
  }
}

async function handleStaffTypingIndicator() {
  const safeStaffKey = getSafeStaffKeyForChat();
  clearTimeout(staffTypingTimeout);
  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/typing_staff.json`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: 'true'
  }).catch(() => {});

  staffTypingTimeout = setTimeout(async () => {
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/typing_staff.json`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: 'false'
    }).catch(() => {});
  }, 2000);
}

async function kirimPesanStaffPro() {
  const input = document.getElementById('nxInputStaffChat');
  const text = input.value.trim();
  if (!text) return;

  const staffName = localStorage.getItem('gudang_staff_name') || "Staf_General";
  const safeStaffKey = getSafeStaffKeyForChat();
  input.value = "";

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/staffName.json`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(staffName)
  }).catch(() => {});

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'staff', senderName: staffName, text, time: Date.now(), read: false })
  });

  if (/token|expired|masa aktif|perpanjang/i.test(text)) {
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'bot', text: "🤖 [AUTO-PILOT] Permintaan terkait token terdeteksi. Sistem memproses otomatis perpanjangan masa aktif (maksimal 1 minggu).", time: Date.now(), read: true })
    });
  }

  sinkronisasiChatStaffRealtime();
}

async function mintaPerpanjanganTokenStaff() {
  const staffName = localStorage.getItem('gudang_staff_name') || "Staf_General";
  const safeStaffKey = getSafeStaffKeyForChat();

  const yakin = await tampilkanGuardConfirm({
    title: "MINTA PERPANJANGAN TOKEN",
    message: "Ajukan perpanjangan masa aktif aplikasi otomatis (maksimal 1 minggu) ke sistem?",
    confirmText: "Ajukan Sekarang",
    cancelText: "Batal",
    danger: false
  });
  if (!yakin) return;

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/staffName.json`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(staffName)
  }).catch(() => {});

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/token_request.json`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'pending', requested_by: staffName, requested_at: Date.now() })
  });

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'staff', senderName: staffName, text: "🔑 Meminta perpanjangan masa aktif / token baru.", time: Date.now(), read: false })
  });

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'bot', text: "🤖 [AUTO-PILOT] Permintaan perpanjangan (batas 1 minggu) dikirim. Token otomatis akan muncul di chat dalam beberapa detik.", time: Date.now(), read: true })
  });

  tampilkanGuardToast("Permintaan dikirim! Auto-Pilot sedang memproses token 1 minggu.", "info");
  sinkronisasiChatStaffRealtime();
}

async function tarikPesanStaff(msgKey) {
  const safeStaffKey = getSafeStaffKeyForChat();
  const yakin = await tampilkanGuardConfirm({
    title: "TARIK PESAN",
    message: "Tarik atau hapus pesan ini dari percakapan?",
    confirmText: "Tarik Pesan",
    cancelText: "Batal",
    danger: true
  });
  if (!yakin) return;

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages/${msgKey}.json`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: "🚫 Pesan ini telah ditarik" })
  });
  sinkronisasiChatStaffRealtime();
}

async function hapusRiwayatChatStaff() {
  const safeStaffKey = getSafeStaffKeyForChat();
  const yakin = await tampilkanGuardConfirm({
    title: "HAPUS RIWAYAT CHAT",
    message: "Hapus seluruh riwayat chat kamu di room ini?",
    confirmText: "Hapus Riwayat",
    cancelText: "Batal",
    danger: true
  });
  if (!yakin) return;

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, { method: 'DELETE' });
  const staffName = localStorage.getItem('gudang_staff_name') || "Staf_General";
  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'bot', text: `Riwayat chat dibersihkan oleh ${staffName}.`, time: Date.now(), read: true })
  });
  sinkronisasiChatStaffRealtime();
  tampilkanGuardToast("Riwayat chat berhasil dibersihkan!", "success");
}

function salinTokenKeInputLisensi(rawText) {
  const tokenMurni = extractPureToken(rawText);
  if (!tokenMurni) {
    tampilkanGuardToast("Format token NX tidak ditemukan pada pesan ini!", "error");
    return;
  }

  navigator.clipboard.writeText(tokenMurni).catch(() => {});

  const inputToken = document.getElementById('nxNewTokenInput');
  if (inputToken) {
    inputToken.value = tokenMurni;
    inputToken.focus();
  }

  tampilkanGuardToast(
    `Token disalin ke clipboard & diisikan ke kolom:<br><code style="color:#38bdf8;font-size:10px;word-break:break-all;">${escapeGuardHtml(tokenMurni)}</code>`,
    "success",
    3600
  );
}

window.salinTokenDariChat = function(btnEl) {
  if (!btnEl) return;
  const encodedB64 = btnEl.getAttribute('data-payload-b64') || '';
  if (!encodedB64) return;
  try {
    const binStr = atob(encodedB64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    const rawText = new TextDecoder().decode(bytes);
    salinTokenKeInputLisensi(rawText);
  } catch (e) {
    tampilkanGuardToast("Gagal membaca data token!", "error");
  }
};

function encodeBase64Utf8(str) {
  try {
    const bytes = new TextEncoder().encode(String(str || ''));
    let binStr = '';
    for (let i = 0; i < bytes.length; i++) binStr += String.fromCharCode(bytes[i]);
    return btoa(binStr);
  } catch (e) {
    return '';
  }
}

async function sinkronisasiChatStaffRealtime() {
  const safeStaffKey = getSafeStaffKeyForChat();
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}.json?t=` + Date.now());
    const room = await res.json();
    if (!room) return;

    const typingOwnerEl = document.getElementById('nxTypingIndicatorStaff');
    if (typingOwnerEl) typingOwnerEl.style.display = room.typing_owner ? 'block' : 'none';

    const messages = room.messages || {};
    let unreadAdmin = 0;
    let html = "";

    Object.keys(messages).forEach(msgKey => {
      const m = messages[msgKey];
      if (!m) return;
      if ((m.sender === 'owner' || m.sender === 'bot') && !m.read) unreadAdmin++;

      const timeStr = m.time ? new Date(m.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "";
      const rawText = String(m.text || "");
      const payloadB64 = encodeBase64Utf8(rawText);
      const formattedText = formatChatTextHtml(rawText).replace(/\n/g, "<br>");
      const hasToken = Boolean(extractPureToken(rawText));

      if (m.sender === 'staff') {
        html += `
          <div style="background: #2563eb; color: #fff; padding: 8px 11px; border-radius: 12px 12px 2px 12px; align-self: flex-end; max-width: 82%; position: relative; padding-right: 26px; word-break: break-word;">
            <div>${formattedText}</div>
            <button type="button" onclick="tarikPesanStaff('${escapeGuardHtml(msgKey)}')" title="Tarik Pesan" style="position: absolute; top: 6px; right: 6px; background: none; border: none; color: #fecaca; cursor: pointer; font-size: 10px;"><i class="fa-solid fa-trash"></i></button>
            <div style="font-size: 8.5px; opacity: 0.8; margin-top: 3px; text-align: right;">${escapeGuardHtml(m.senderName || 'Staf')} • ${escapeGuardHtml(timeStr)}</div>
          </div>
        `;
      } else if (m.sender === 'bot') {
        html += `
          <div style="background: rgba(56,189,248,0.14); border: 1px solid rgba(56,189,248,0.4); color: #7dd3fc; padding: 8px 11px; border-radius: 12px 12px 12px 2px; align-self: flex-start; max-width: 86%; word-break: break-word;">
            <div>${formattedText}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 5px;">
              <span style="font-size: 8.5px; opacity: 0.75;">Auto-Pilot • ${escapeGuardHtml(timeStr)}</span>
              <button type="button" data-payload-b64="${escapeGuardHtml(payloadB64)}" onclick="salinTokenDariChat(this)" style="background: ${hasToken ? "#22c55e" : "rgba(56,189,248,0.22)"}; border: 1px solid ${hasToken ? "#4ade80" : "#38bdf8"}; color: ${hasToken ? "#052e16" : "#7dd3fc"}; padding: 3px 7px; border-radius: 5px; font-size: 9px; font-weight: bold; cursor: pointer; font-family: monospace;">
                <i class="fa-solid fa-copy"></i> ${hasToken ? "Salin Token" : "Salin"}
              </button>
            </div>
          </div>
        `;
      } else {
        html += `
          <div style="background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 8px 11px; border-radius: 12px 12px 12px 2px; align-self: flex-start; max-width: 84%; word-break: break-word;">
            <div>${formattedText}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 5px;">
              <span style="font-size: 8.5px; color: #94a3b8;">System • ${escapeGuardHtml(timeStr)}</span>
              ${hasToken ? `<button type="button" data-payload-b64="${escapeGuardHtml(payloadB64)}" onclick="salinTokenDariChat(this)" style="background: #22c55e; border: 1px solid #4ade80; color: #052e16; padding: 3px 7px; border-radius: 5px; font-size: 9px; font-weight: bold; cursor: pointer; font-family: monospace;"><i class="fa-solid fa-copy"></i> Salin Token</button>` : ""}
            </div>
          </div>
        `;
      }
    });

    const msgContainer = document.getElementById('nxProChatMessagesContainer');
    if (msgContainer) {
      const wasAtBottom = msgContainer.scrollHeight - msgContainer.scrollTop <= msgContainer.clientHeight + 50;
      msgContainer.innerHTML = html || `<div style="color: #64748b; text-align: center; margin: auto;">Belum ada pesan.</div>`;
      if (wasAtBottom) msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    const badge = document.getElementById('nxChatUnreadBadge');
    if (badge) {
      if (unreadAdmin > 0) {
        badge.innerText = unreadAdmin;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) {}
}

// =========================================================================
// 🔒 LAYAR KUNCI MANDIRI & MAINTENANCE SYSTEM
// =========================================================================
function tampilkanLayarKunciMandiri() {
  if (document.getElementById('nx-global-lock-screen')) return;

  const lockScreen = document.createElement('div');
  lockScreen.id = 'nx-global-lock-screen';
  lockScreen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.99); backdrop-filter: blur(18px);
    z-index: 2147483640; display: flex; justify-content: center; align-items: center;
    padding: 20px; font-family: monospace; color: #f8fafc;
  `;

  lockScreen.innerHTML = `
    <div style="max-width: 400px; width: 100%; background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 16px; padding: 26px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.8);">
      <div style="width: 50px; height: 50px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 20px; color: #ef4444;">
        <i class="fa-solid fa-lock"></i>
      </div>
      <h2 style="margin: 0 0 6px 0; font-size: 16px; color: #fff;">MASA AKTIF BERAKHIR</h2>
      <p style="font-size: 11px; color: #94a3b8; margin-bottom: 18px; line-height: 1.5;">
        Masukkan Token NX baru atau ajukan perpanjangan masa aktif otomatis (maksimal 1 minggu) melalui tombol <b>🔑 Minta Token</b> di widget Chat CS.
      </p>

      <input type="text" id="nxNewTokenInput" placeholder="Tempel Token NX Baru di sini..." style="width: 100%; padding: 11px; background: #020617; border: 1px solid #334155; border-radius: 8px; color: #38bdf8; font-size: 12px; outline: none; margin-bottom: 10px; text-align: center; box-sizing: border-box;" />
      <div id="nxLockErrorMsg" style="color: #ef4444; font-size: 10.5px; margin-bottom: 10px; display: none;"></div>

      <button type="button" id="btnActivateNxToken" onclick="prosesAktivasiTokenMandiri()" style="width: 100%; background: #38bdf8; color: #020617; border: none; padding: 11px; border-radius: 8px; font-weight: bold; font-family: monospace; font-size: 12px; cursor: pointer;">
        Aktivasi Lisensi Sekarang
      </button>
    </div>
  `;

  const parentTarget = document.body || document.documentElement;
  parentTarget.appendChild(lockScreen);
  renderProLiveChatWidget();
}

async function prosesAktivasiTokenMandiri() {
  const inputEl = document.getElementById('nxNewTokenInput');
  const errEl = document.getElementById('nxLockErrorMsg');
  const btnEl = document.getElementById('btnActivateNxToken');

  const rawVal = inputEl ? inputEl.value : "";
  const token = extractPureToken(rawVal) || String(rawVal || "").trim();
  if (!token) {
    errEl.innerText = "Silakan masukkan Token NX terlebih dahulu!";
    errEl.style.display = "block";
    return;
  }

  const decodedDate = decodeTokenToDate(token);
  if (!decodedDate) {
    errEl.innerText = "Format Token NX tidak valid! Pastikan token disalin dengan utuh.";
    errEl.style.display = "block";
    return;
  }

  const now = new Date();
  if (now > decodedDate) {
    errEl.innerText = "Token ini sudah kedaluwarsa!";
    errEl.style.display = "block";
    return;
  }

  btnEl.disabled = true;
  btnEl.innerText = "Menyimpan ke Cloud...";
  errEl.style.display = "none";

  try {
    await fetch(CLOUD_LICENSE_ENDPOINT, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        locked: false,
        permanent: false,
        maintenance: false,
        status: "ACTIVE",
        expiry: decodedDate.toISOString(),
        activated_at: Date.now()
      })
    });

    const lockScreen = document.getElementById('nx-global-lock-screen');
    if (lockScreen) lockScreen.remove();
    tampilkanGuardToast("Lisensi NX berhasil diaktifkan!", "success");
    setTimeout(() => location.reload(), 600);
  } catch (e) {
    errEl.innerText = "Gagal menyinkronkan ke server cloud!";
    errEl.style.display = "block";
    btnEl.disabled = false;
    btnEl.innerText = "Aktivasi Lisensi Sekarang";
  }
}

function tampilkanSystemMaintenance(keterangan = "", kodeError = "ERR_SYSTEM_MAINTENANCE [ID: 503-MNT]") {
  injectMaintenanceAnimationStyle();

  const existing = document.getElementById('nx-global-lock-screen');
  const safeKet = keterangan && String(keterangan).trim()
    ? String(keterangan).trim()
    : "Sistem Gudang Nuhsantara sedang dalam tahap pemeliharaan rutin, pembaruan modul, atau sinkronisasi database. Mohon tunggu beberapa saat hingga layanan kembali normal.";
  const safeCode = kodeError && String(kodeError).trim()
    ? String(kodeError).trim()
    : "ERR_SYSTEM_MAINTENANCE [ID: 503-MNT]";

  if (existing) {
    const ketEl = existing.querySelector('#nxMaintenanceReasonText');
    const codeEl = existing.querySelector('#nxMaintenanceCodeText');
    if (ketEl) ketEl.textContent = safeKet;
    if (codeEl) codeEl.textContent = safeCode;
    return;
  }

  const lockScreen = document.createElement('div');
  lockScreen.id = 'nx-global-lock-screen';
  lockScreen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(9, 13, 22, 0.99); backdrop-filter: blur(18px);
    z-index: 2147483640; display: flex; justify-content: center; align-items: center;
    padding: 20px; font-family: monospace; color: #f8fafc;
  `;

  lockScreen.innerHTML = `
    <div class="nx-maintenance-float-pulse" style="max-width: 420px; width: 100%; background: rgba(30, 41, 59, 0.96); border: 1.5px solid rgba(245, 158, 11, 0.55); border-radius: 18px; padding: 28px 24px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
      <div style="width: 56px; height: 56px; background: rgba(245, 158, 11, 0.16); border: 1px solid rgba(245, 158, 11, 0.45); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 24px; color: #f59e0b;">
        <i class="fa-solid fa-gear nx-gear-spin"></i>
      </div>
      <div style="display: inline-block; background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; font-size: 10px; font-weight: bold; padding: 3px 10px; border-radius: 999px; margin-bottom: 10px; letter-spacing: 0.6px;">
        SYSTEM MAINTENANCE
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 16.5px; color: #fff;">SISTEM SEDANG DALAM PERBAIKAN</h2>
      <div id="nxMaintenanceCodeText" style="display: inline-block; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; font-size: 10px; font-weight: bold; padding: 3px 9px; border-radius: 6px; margin-bottom: 12px; letter-spacing: 0.4px;">
        ${escapeGuardHtml(safeCode)}
      </div>
      <p id="nxMaintenanceReasonText" style="font-size: 11.5px; color: #cbd5e1; margin: 0 0 18px 0; line-height: 1.6; background: rgba(2, 6, 23, 0.55); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 10px; padding: 11px 12px; text-align: left;">
        ${escapeGuardHtml(safeKet)}
      </p>
      <div style="font-size: 10px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">
        Halaman otomatis terbuka kembali setelah status maintenance dinonaktifkan dari Dashboard.
      </div>
      <button type="button" onclick="location.reload()" style="background: rgba(245, 158, 11, 0.16); border: 1px solid rgba(245, 158, 11, 0.5); color: #fbbf24; padding: 9px 16px; border-radius: 8px; font-family: monospace; font-size: 11px; font-weight: bold; cursor: pointer;">
        <i class="fa-solid fa-rotate-right"></i> Cek Status Sekarang
      </button>
    </div>
  `;

  const parentTarget = document.body || document.documentElement;
  parentTarget.appendChild(lockScreen);
}

function tampilkanLayarKunciPermanen() {
  if (document.getElementById('nx-global-lock-screen')) return;

  const lockScreen = document.createElement('div');
  lockScreen.id = 'nx-global-lock-screen';
  lockScreen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.99); backdrop-filter: blur(18px);
    z-index: 2147483640; display: flex; justify-content: center; align-items: center;
    padding: 20px; font-family: monospace; color: #f8fafc;
  `;

  lockScreen.innerHTML = `
    <div style="max-width: 380px; width: 100%; background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 16px; padding: 26px; text-align: center;">
      <div style="width: 50px; height: 50px; background: rgba(239, 68, 68, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 20px; color: #ef4444;">
        <i class="fa-solid fa-ban"></i>
      </div>
      <h2 style="margin: 0 0 6px 0; font-size: 16px; color: #fff;">AKSES DICABUT PERMANEN</h2>
      <p style="font-size: 11px; color: #94a3b8; margin-bottom: 18px; line-height: 1.5;">
        Lisensi perangkat telah dikunci permanen oleh System.<br>Hubungi administrator untuk aktivasi ulang.
      </p>
      <div style="font-size: 10px; color: #64748b;">ID Sistem: GN-PERM-LOCKED</div>
    </div>
  `;

  const parentTarget = document.body || document.documentElement;
  parentTarget.appendChild(lockScreen);
}

// --- INISIALISASI SAAT HALAMAN DIMUAT ---
window.addEventListener('DOMContentLoaded', () => {
  cekStatusCloud();
  renderProLiveChatWidget();
  setInterval(cekStatusCloud, 2000);
});
