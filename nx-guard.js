// =========================================================================
// 🛡️ GUDANG NUHSANTARA - 100% PURE CLOUD FIREBASE GUARD & PRO LIVE CHAT (v4.9)
// =========================================================================

const FIREBASE_DB_URL = "https://gudang-nuhsantara-auth-default-rtdb.asia-southeast1.firebasedatabase.app";
const CLOUD_LICENSE_ENDPOINT = `${FIREBASE_DB_URL}/gudang_nuhsantara/license.json`;

const ADMIN_NX_PIN = "2026";
const NX_RANDOM_CHAR_LEN = 18;
let secretClickCount = 0;
let secretClickTimer = null;
let universalChatPollInterval = null;
let staffTypingTimeout = null;
let guardToastTimeout = null;

function escapeGuardHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

function formatChatTextHtml(text) {
  let clean = escapeGuardHtml(String(text || ""));
  clean = clean.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  return clean;
}

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

    const now = new Date();
    const expiryDate = data.expiry ? new Date(data.expiry) : null;
    const isExpired = expiryDate ? (now > expiryDate) : false;

    const isPermanentLocked = data.permanent === true || data.status === "LOCKED_PERM";
    const isTempLocked = data.locked === true || data.status === "LOCKED_TEMP" || isExpired;

    if (isPermanentLocked) {
      tampilkanLayarKunciPermanen();
    } else if (isTempLocked) {
      tampilkanLayarKunciMandiri();
    } else {
      const lockScreen = document.getElementById("nx-global-lock-screen");
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
// 💬 PRO LIVE CHAT WIDGET
// =========================================================================
function getSafeStaffKeyForChat() {
  let name = localStorage.getItem("gudang_staff_name") || "Staf_General";
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function inisialisasiUniversalChatData() {
  const staffName = localStorage.getItem("gudang_staff_name") || "Staf_General";
  const safeStaffKey = getSafeStaffKeyForChat();

  await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/staffName.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffName)
  }).catch(() => {});

  const res = await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`);
  const msgs = await res.json();
  if (!msgs) {
    const botWelcome = {
      sender: "bot",
      text: `Halo ${staffName}, saya Asisten Virtual Gudang Nuhsantara. Ada kendala operasional atau token yang bisa saya bantu?`,
      time: Date.now(),
      read: true
    };
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(botWelcome)
    }).catch(() => {});
  }
}

function toggleUniversalChatWidget() {
  if (!document.getElementById("universalChatWrapper")) {
    injectUniversalChatHTML();
  }
  const box = document.getElementById("universalChatWidgetBox");
  if (!box) return;

  const isOpen = box.style.getPropertyValue("display") === "flex";
  if (isOpen) {
    box.style.setProperty("display", "none", "important");
    clearInterval(universalChatPollInterval);
  } else {
    box.style.setProperty("display", "flex", "important");
    inisialisasiUniversalChatData().then(() => {
      muatPesanUniversalChat();
      clearInterval(universalChatPollInterval);
      universalChatPollInterval = setInterval(muatPesanUniversalChat, 3000);
    });
    setTimeout(() => {
      const inputEl = document.getElementById("universalInputChat");
      if (inputEl) inputEl.focus();
    }, 100);
  }
}

async function tarikPesanUniversal(messageKey) {
  const safeStaffKey = getSafeStaffKeyForChat();
  const yakin = await tampilkanGuardConfirm({
    title: "TARIK PESAN",
    message: "Tarik atau hapus pesan ini dari percakapan?",
    confirmText: "Tarik Pesan",
    cancelText: "Batal",
    danger: true
  });
  if (!yakin) return;

  try {
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages/${messageKey}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "🚫 Pesan ini telah ditarik" })
    });
    tampilkanGuardToast("Pesan berhasil ditarik.", "info", 2000);
    muatPesanUniversalChat();
  } catch (e) {
    console.error(e);
    tampilkanGuardToast("Gagal menarik pesan.", "error");
  }
}

async function hapusSemuaChatUniversal() {
  const safeStaffKey = getSafeStaffKeyForChat();
  const yakin = await tampilkanGuardConfirm({
    title: "HAPUS RIWAYAT CHAT",
    message: "Hapus semua riwayat percakapan ini?",
    confirmText: "Hapus Semua",
    cancelText: "Batal",
    danger: true
  });
  if (!yakin) return;

  try {
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
      method: "DELETE"
    });
    const botWelcome = {
      sender: "bot",
      text: "Riwayat dibersihkan. Halo, ada yang bisa dibantu?",
      time: Date.now(),
      read: true
    };
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(botWelcome)
    });
    tampilkanGuardToast("Semua riwayat percakapan berhasil dihapus.", "success", 2200);
    muatPesanUniversalChat();
  } catch (e) {
    console.error(e);
    tampilkanGuardToast("Gagal menghapus riwayat percakapan.", "error");
  }
}

async function muatPesanUniversalChat() {
  const safeStaffKey = getSafeStaffKeyForChat();
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}.json?t=` + Date.now());
    const data = await res.json();
    if (!data) return;

    const messages = data.messages || {};
    const isSystemTyping = data.typingSystem || data.typingAdmin || false;
    const container = document.getElementById("universalChatMessagesContainer");
    const typingEl = document.getElementById("typingIndicatorUniversal");
    const badge = document.getElementById("universalChatBadge");
    const box = document.getElementById("universalChatWidgetBox");
    if (!container) return;

    const isWidgetOpen = Boolean(box && box.style.getPropertyValue("display") === "flex");

    if (typingEl) typingEl.style.display = isSystemTyping ? "block" : "none";

    let html = "";
    let unreadFromSystem = 0;
    let systemUpdates = {};

    Object.keys(messages).forEach(k => {
      const m = messages[k];
      let bubbleStyle = "";
      let deleteBtn = "";
      let chatContentHtml = "";

      const rawText = m.text || "";
      const extractedToken = (m.sender !== "staff") ? extractPureToken(rawText) : null;
      const isTokenMessage = Boolean(extractedToken);

      if (m.sender === "staff") {
        bubbleStyle = "background: #0284c7 !important; color: #fff !important; align-self: flex-end !important; border-bottom-right-radius: 2px !important;";
        if (m.text !== "🚫 Pesan ini telah ditarik") {
          deleteBtn = `<i class="fa-solid fa-trash-can" onclick="tarikPesanUniversal('${escapeGuardHtml(k)}')" style="cursor: pointer; font-size: 10px; margin-left: 6px; opacity: 0.7;" title="Tarik Pesan"></i>`;
        }
      } else if (m.sender === "bot") {
        bubbleStyle = "background: rgba(168, 85, 247, 0.15) !important; border: 1px solid rgba(168, 85, 247, 0.3) !important; color: #d8b4fe !important; align-self: flex-start !important; border-bottom-left-radius: 2px !important;";
      } else {
        bubbleStyle = "background: #1e293b !important; color: #f8fafc !important; align-self: flex-start !important; border-bottom-left-radius: 2px !important;";
        if (!m.read) {
          unreadFromSystem++;
          systemUpdates[`${k}/read`] = true;
        }
      }

      if (isTokenMessage) {
        const escapedToken = extractedToken.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const formattedMessage = formatChatTextHtml(rawText);

        chatContentHtml = `
          <div style="font-weight: 600; margin-bottom: 4px; color: #38bdf8;"><i class="fa-solid fa-key"></i> Akses Token Resmi</div>
          <div style="font-size: 11px; margin-bottom: 8px; opacity: 0.9; word-break: break-word;">${formattedMessage}</div>
          <div style="font-family: monospace; width: 100%; background: #020617; border: 1px solid #38bdf8; border-radius: 8px; padding: 8px; box-sizing: border-box;">
            <div style="color: #38bdf8; font-size: 11.5px; font-family: monospace; word-break: break-all; margin-bottom: 8px; user-select: all; background: rgba(56, 189, 248, 0.08); padding: 6px; border-radius: 6px;">
              ${escapeGuardHtml(extractedToken)}
            </div>
            <button type="button" onclick="salinTokenUniversalChat('${escapedToken}')" style="width: 100%; background: #38bdf8; border: none; color: #070b14; padding: 7px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;" title="Salin Token">
              <i class="fa-solid fa-copy"></i> Salin Token Sekarang
            </button>
          </div>
        `;
      } else {
        chatContentHtml = `<div>${formatChatTextHtml(rawText)}</div>`;
      }

      let tickMark = "";
      if (m.sender === "staff") {
        if (m.read) {
          tickMark = `<span style="color: #38bdf8; font-size: 11px; margin-left: 4px;" title="Dibaca System">✓✓</span>`;
        } else {
          tickMark = `<span style="color: #94a3b8; font-size: 11px; margin-left: 4px;" title="Terkirim">✓✓</span>`;
        }
      }

      html += `
        <div style="max-width: 85% !important; padding: 8px 11px !important; border-radius: 10px !important; ${bubbleStyle} word-break: break-word !important; box-sizing: border-box !important;">
          <div style="font-size: 9px; opacity: 0.7; margin-bottom: 2px; display: flex; justify-content: space-between; align-items: center;">
            <span>${escapeGuardHtml((m.sender || "").toUpperCase())}</span>
            ${deleteBtn}
          </div>
          ${chatContentHtml}
          <div style="font-size: 9px; text-align: right; margin-top: 3px; opacity: 0.6;">
            ${new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${tickMark}
          </div>
        </div>
      `;
    });

    container.innerHTML = html || `<div style="color: #94a3b8; text-align: center; margin: auto;">Mulai percakapan...</div>`;
    container.scrollTop = container.scrollHeight;

    if (badge) {
      if (unreadFromSystem > 0 && !isWidgetOpen) {
        badge.innerText = unreadFromSystem;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }

    if (isWidgetOpen && Object.keys(systemUpdates).length > 0) {
      await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemUpdates)
      });
    }
  } catch (e) { console.error(e); }
}

window.salinTokenUniversalChat = function(kodeToken) {
  const tokenBersih = extractPureToken(kodeToken);
  if (!tokenBersih) {
    tampilkanGuardToast("Token tidak ditemukan untuk disalin.", "error");
    return;
  }

  const beriNotifSukses = () => {
    tampilkanGuardToast(
      `<b style="color:#38bdf8;">Token berhasil disalin</b><div style="margin-top:3px; font-size:10.5px; color:#cbd5e1; word-break:break-all;">${escapeGuardHtml(tokenBersih)}</div>`,
      "info",
