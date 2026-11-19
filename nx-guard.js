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

// --- HELPER FORMAT TEKS CHAT (MARKDOWN SEDERHANA KE HTML BERSIH) ---
function formatChatTextHtml(text) {
  let clean = String(text || "");
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

  // Pola token NX: 18 char prefix + NX + timeHex + 18 char suffix
  const nxExactMatch = cleaned.match(/[A-Za-z0-9]{18}NX[0-9a-fA-F]+[A-Za-z0-9]{18}/);
  if (nxExactMatch && nxExactMatch[0]) {
    return nxExactMatch[0].trim();
  }

  // Fallback jika ada variasi karakter _ atau - pada prefix/suffix
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

    const now = new Date();
    const expiryDate = data.expiry ? new Date(data.expiry) : null;
    const isExpired = expiryDate ? (now > expiryDate) : false;

    // 1. Prioritas Utama: Cek apakah dikunci permanen
    if (data.permanent === true) {
      tampilkanLayarKunciPermanen();
    }
    // 2. Cek apakah dikunci sementara atau kedaluwarsa
    else if (data.locked === true || isExpired) {
      tampilkanLayarKunciMandiri();
    }
    // 3. Jika normal, hapus layar kunci & reload jika sebelumnya terkunci
    else {
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
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(staffName)
  }).catch(e => {});

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
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(botWelcome)
    }).catch(e => {});
  }
}

function toggleUniversalChatWidget() {
  if (!document.getElementById('universalChatWrapper')) {
    injectUniversalChatHTML();
  }
  const box = document.getElementById('universalChatWidgetBox');
  if (!box) return;

  if (box.style.display === 'flex') {
    box.style.display = 'none';
    clearInterval(universalChatPollInterval);
  } else {
    box.style.display = 'flex';
    inisialisasiUniversalChatData().then(() => {
      muatPesanUniversalChat();
      universalChatPollInterval = setInterval(muatPesanUniversalChat, 3000);
    });
    setTimeout(() => {
      const inputEl = document.getElementById('universalInputChat');
      if (inputEl) inputEl.focus();
    }, 100);
  }
}

async function tarikPesanUniversal(messageKey) {
  const safeStaffKey = getSafeStaffKeyForChat();
  if (!confirm("Tarik/hapus pesan ini?")) return;
  try {
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages/${messageKey}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: "🚫 Pesan ini telah ditarik" })
    });
    muatPesanUniversalChat();
  } catch (e) { console.error(e); }
}

async function hapusSemuaChatUniversal() {
  const safeStaffKey = getSafeStaffKeyForChat();
  if (!confirm("Hapus semua riwayat percakapan ini?")) return;
  try {
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
      method: 'DELETE'
    });
    const botWelcome = {
      sender: 'bot',
      text: `Riwayat dibersihkan. Halo, ada yang bisa dibantu?`,
      time: Date.now(),
      read: true
    };
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(botWelcome)
    });
    muatPesanUniversalChat();
  } catch (e) { console.error(e); }
}

async function muatPesanUniversalChat() {
  const safeStaffKey = getSafeStaffKeyForChat();
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}.json?t=` + Date.now());
    const data = await res.json();
    if (!data) return;

    const messages = data.messages || {};
    const isSystemTyping = data.typingSystem || data.typingAdmin || false;
    const container = document.getElementById('universalChatMessagesContainer');
    const typingEl = document.getElementById('typingIndicatorUniversal');
    const badge = document.getElementById('universalChatBadge');
    if (!container) return;

    if (typingEl) typingEl.style.display = isSystemTyping ? 'block' : 'none';

    let html = "";
    let unreadFromSystem = 0;
    let systemUpdates = {};

    Object.keys(messages).forEach(k => {
      const m = messages[k];
      let bubbleStyle = "";
      let deleteBtn = "";
      let chatContentHtml = "";

      const rawText = m.text || "";
      const extractedToken = (m.sender !== 'staff') ? extractPureToken(rawText) : null;
      const isTokenMessage = Boolean(extractedToken);

      if (m.sender === 'staff') {
        bubbleStyle = "background: #0284c7 !important; color: #fff !important; align-self: flex-end !important; border-bottom-right-radius: 2px !important;";
        if (m.text !== "🚫 Pesan ini telah ditarik") {
          deleteBtn = `<i class="fa-solid fa-trash-can" onclick="tarikPesanUniversal('${k}')" style="cursor: pointer; font-size: 10px; margin-left: 6px; opacity: 0.7;" title="Tarik Pesan"></i>`;
        }
      } else if (m.sender === 'bot') {
        bubbleStyle = "background: rgba(168, 85, 247, 0.15) !important; border: 1px solid rgba(168, 85, 247, 0.3) !important; color: #d8b4fe !important; align-self: flex-start !important; border-bottom-left-radius: 2px !important;";
      } else {
        bubbleStyle = "background: #1e293b !important; color: #f8fafc !important; align-self: flex-start !important; border-bottom-left-radius: 2px !important;";
        if (!m.read) {
          unreadFromSystem++;
          systemUpdates[`${k}/read`] = true;
        }
      }

      if (isTokenMessage) {
        const escapedToken = extractedToken.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const formattedMessage = formatChatTextHtml(rawText);

        chatContentHtml = `
          <div style="font-weight: 600; margin-bottom: 4px; color: #38bdf8;"><i class="fa-solid fa-key"></i> Akses Token Resmi</div>
          <div style="font-size: 11px; margin-bottom: 8px; opacity: 0.9; word-break: break-word;">${formattedMessage}</div>
          <div style="font-family: monospace; width: 100%; background: #020617; border: 1px solid #38bdf8; border-radius: 8px; padding: 8px; box-sizing: border-box;">
            <div style="color: #38bdf8; font-size: 11.5px; font-family: monospace; word-break: break-all; margin-bottom: 8px; user-select: all; background: rgba(56, 189, 248, 0.08); padding: 6px; border-radius: 6px;">
              ${extractedToken}
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
      if (m.sender === 'staff') {
        if (m.read) {
          tickMark = `<span style="color: #38bdf8; font-size: 11px; margin-left: 4px;" title="Dibaca System">✓✓</span>`;
        } else {
          tickMark = `<span style="color: #94a3b8; font-size: 11px; margin-left: 4px;" title="Terkirim">✓✓</span>`;
        }
      }

      html += `
        <div style="max-width: 85% !important; padding: 8px 11px !important; border-radius: 10px !important; ${bubbleStyle} word-break: break-word !important; box-sizing: border-box !important;">
          <div style="font-size: 9px; opacity: 0.7; margin-bottom: 2px; display: flex; justify-content: space-between; align-items: center;">
            <span>${m.sender.toUpperCase()}</span>
            ${deleteBtn}
          </div>
          ${chatContentHtml}
          <div style="font-size: 9px; text-align: right; margin-top: 3px; opacity: 0.6;">
            ${new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${tickMark}
          </div>
        </div>
      `;
    });

    container.innerHTML = html || `<div style="color: #94a3b8; text-align: center; margin: auto;">Mulai percakapan...</div>`;
    container.scrollTop = container.scrollHeight;

    if (badge) {
      if (unreadFromSystem > 0 && document.getElementById('universalChatWidgetBox').style.display !== 'flex') {
        badge.innerText = unreadFromSystem;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    if (document.getElementById('universalChatWidgetBox').style.display === 'flex' && Object.keys(systemUpdates).length > 0) {
      await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(systemUpdates)
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
      `<b style="color:#38bdf8;">Token berhasil disalin</b><div style="margin-top:3px; font-size:10.5px; color:#cbd5e1; word-break:break-all;">${tokenBersih}</div>`,
      "info",
      2800
    );
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(tokenBersih).then(beriNotifSukses).catch(() => {
      const tempInput = document.createElement("textarea");
      tempInput.value = tokenBersih;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      tempInput.remove();
      beriNotifSukses();
    });
  } else {
    const tempInput = document.createElement("textarea");
    tempInput.value = tokenBersih;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    tempInput.remove();
    beriNotifSukses();
  }
};

async function kirimPesanurUniversalChatBotLogic(textPesan, currentStaffName) {
  const textLower = textPesan.toLowerCase();
  const isKeywordKendala = textLower.includes("token") || textLower.includes("expired") || textLower.includes("habis") || textLower.includes("terkunci") || textLower.includes("mati");
  const safeStaffKey = getSafeStaffKeyForChat();

  try {
    const reqRes = await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/token_request.json`);
    const currentReq = await reqRes.json();

    if (isKeywordKendala) {
      setTimeout(async () => {
        const botReply = {
          sender: 'bot',
          text: `Halo ${currentStaffName}, terdeteksi kendala token/aplikasi terkunci. Butuh perpanjangan masa aktif berapa lama? (Contoh: 1 Minggu, 1 Bulan, atau 1 Tahun)`,
          time: Date.now(),
          read: true
        };
        await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(botReply)
        });

        await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/token_request.json`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "waiting_duration", timestamp: Date.now() })
        });
        muatPesanUniversalChat();
      }, 800);

    } else if (currentReq && currentReq.status === "waiting_duration") {
      const durasiDiminta = textPesan;
      setTimeout(async () => {
        await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/token_request.json`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "pending", requested_duration: durasiDiminta, timestamp: Date.now() })
        });

        const botConfirm = {
          sender: 'bot',
          text: `Permintaan durasi <b>${durasiDiminta}</b> sudah dikirim ke System. Mohon tunggu sebentar, System sedang meninjau dan memproses persetujuannya ya...`,
          time: Date.now(),
          read: true
        };
        await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(botConfirm)
        });
        muatPesanUniversalChat();
      }, 800);
    }
  } catch (err) {}
}

async function kirimPesanUniversalChat() {
  const input = document.getElementById('universalInputChat');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const safeStaffKey = getSafeStaffKeyForChat();
  const staffName = localStorage.getItem('gudang_staff_name') || "Staf_General";

  const newMsg = {
    sender: 'staff',
    text: text,
    time: Date.now(),
    read: false
  };

  try {
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/messages.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg)
    });
    input.value = "";
    muatPesanUniversalChat();
    kirimPesanurUniversalChatBotLogic(text, staffName);
  } catch (e) { tampilkanGuardToast("Gagal mengirim pesan!", "error"); }
}

async function handleStaffTypingUniversal() {
  const safeStaffKey = getSafeStaffKeyForChat();
  try {
    await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/typingStaff.json`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(true)
    });
    clearTimeout(staffTypingTimeout);
    staffTypingTimeout = setTimeout(async () => {
      await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${safeStaffKey}/typingStaff.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(false)
      });
    }, 1500);
  } catch (e) {}
}

function injectUniversalChatHTML() {
  if (document.getElementById('universalChatWrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'universalChatWrapper';
  wrapper.style.cssText = "position: relative; z-Index: 2147483647 !important;";
  wrapper.innerHTML = `
    <!-- FLOATING CHAT BUTTON UNIVERSAL -->
    <div id="universalFloatingChatBtn" style="position: fixed !important; bottom: 24px !important; right: 24px !important; width: 56px !important; height: 56px !important; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important; border: 1px solid #38bdf8 !important; border-radius: 50% !important; display: flex !important; justify-content: center !important; align-items: center !important; color: #fff !important; font-size: 24px !important; cursor: pointer !important; z-index: 2147483647 !important; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.5) !important;" onclick="toggleUniversalChatWidget()">
      <i class="fa-solid fa-headset"></i>
      <span id="universalChatBadge" style="position: absolute !important; top: -2px !important; right: -2px !important; background: #ef4444 !important; color: #fff !important; font-size: 10px !important; font-weight: bold !important; padding: 2px 6px !important; border-radius: 10px !important; display: none; font-family: monospace !important; border: 1px solid #0f172a !important;">0</span>
    </div>

    <!-- KOTAK WIDGET CHAT UNIVERSAL (PRO VERSION) -->
    <div id="universalChatWidgetBox" style="position: fixed !important; bottom: 90px !important; right: 24px !important; width: 350px !important; max-width: calc(100vw - 48px) !important; height: 420px !important; background: #0f172a !important; border: 1px solid rgba(56, 189, 248, 0.4) !important; border-radius: 16px !important; box-shadow: 0 25px 50px rgba(0,0,0,0.9) !important; z-index: 2147483648 !important; display: none; flex-direction: column !important; overflow: hidden !important; font-family: monospace !important; box-sizing: border-box !important;">
      <div style="background: rgba(15, 23, 42, 0.95) !important; padding: 10px 14px !important; border-bottom: 1px solid rgba(56, 189, 248, 0.2) !important; display: flex !important; justify-content: space-between !important; align-items: center !important; box-sizing: border-box !important; flex-shrink: 0 !important;">
        <div>
          <b style="color: #fff; font-size: 12px;"><i class="fa-solid fa-robot" style="color: #38bdf8;"></i> CS Asisten Nuhsantara</b>
          <div style="font-size: 9.5px; color: #94a3b8;">Live Chat Staf & System</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button onclick="hapusSemuaChatUniversal()" title="Hapus Semua Percakapan" style="background: none; border: none; color: #ef4444; font-size: 14px; cursor: pointer;"><i class="fa-solid fa-trash-can"></i></button>
          <button onclick="toggleUniversalChatWidget()" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">&times;</button>
        </div>
      </div>

      <div id="universalChatMessagesContainer" style="flex: 1 1 auto !important; padding: 12px !important; overflow-y: auto !important; display: flex !important; flex-direction: column !important; gap: 8px !important; font-size: 11.5px !important; background: #070b14; box-sizing: border-box !important; min-height: 0 !important;">
        <div style="color: #94a3b8; text-align: center; margin: auto;">Memuat pesan...</div>
      </div>

      <div style="padding: 4px 12px; background: rgba(15, 23, 42, 0.95); flex-shrink: 0;">
        <span id="typingIndicatorUniversal" style="color: #38bdf8; font-size: 10px; font-style: italic; display: none;">System sedang mengetik...</span>
      </div>

      <div style="display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; padding: 10px !important; background: rgba(15, 23, 42, 0.95) !important; border-top: 1px solid rgba(56, 189, 248, 0.2) !important; box-sizing: border-box !important; width: 100% !important; flex-shrink: 0 !important;">
        <input type="text" id="universalInputChat" placeholder="Ketik pesan atau kendala..." style="flex: 1 1 auto !important; width: auto !important; min-width: 0 !important; padding: 9px 10px !important; background: #020617 !important; border: 1px solid #334155 !important; color: #fff !important; border-radius: 7px !important; font-size: 11.5px !important; outline: none !important; font-family: monospace !important; box-sizing: border-box !important;" oninput="handleStaffTypingUniversal()" onkeypress="if(event.key === 'Enter') kirimPesanUniversalChat()" />
        <button type="button" onclick="kirimPesanUniversalChat()" style="flex: 0 0 auto !important; width: auto !important; min-width: 65px !important; padding: 9px 12px !important; background: #0284c7 !important; border: 1px solid #38bdf8 !important; color: white !important; border-radius: 7px !important; cursor: pointer !important; font-family: monospace !important; font-weight: bold !important; font-size: 11.5px !important; box-sizing: border-box !important;">Kirim</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);
}

document.addEventListener("DOMContentLoaded", () => {
  injectUniversalChatHTML();
});

// --- TAMPILKAN LAYAR KUNCI PERMANEN (KILL SWITCH) ---
function tampilkanLayarKunciPermanen() {
  const existing = document.getElementById('nx-global-lock-screen');
  if (existing && existing.dataset.mode === 'permanent') return;
  if (existing) existing.remove();

  document.title = "403 Access Forbidden - Permanent Revocation";

  const lockScreen = document.createElement('div');
  lockScreen.id = 'nx-global-lock-screen';
  lockScreen.dataset.mode = 'permanent';
  lockScreen.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(7, 11, 20, 0.75); backdrop-filter: blur(12px); z-index: 2147483640; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;";

  const box = document.createElement('div');
  box.style.cssText = "position: relative; background: #1a0f0f; border: 2px solid rgba(239, 68, 68, 0.6); padding: 32px 24px; border-radius: 20px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(239, 68, 68, 0.3); font-family: monospace;";

  box.innerHTML = `
    <div style="position: absolute; top: 16px; left: 18px; display: flex; align-items: center; gap: 6px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); padding: 3px 8px; border-radius: 20px;">
      <span style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%; display: inline-block;"></span>
      <span style="font-size: 9.5px; color: #ef4444; font-weight: bold; letter-spacing: 0.5px;">PERMANENT_REVOCATION</span>
    </div>
    <div style="width: 50px; height: 50px; background: rgba(239, 68, 68, 0.2); border: 1.5px solid #ef4444; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 12px auto; box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    </div>
    <h3 style="color: #ef4444; margin: 0 0 6px 0; font-size: 15px; font-weight: 700; letter-spacing: 1px;">AKSES DICABUT PERMANEN</h3>
    <div style="font-size: 10.5px; color: #f87171; margin-bottom: 12px; background: rgba(239, 68, 68, 0.1); padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3);">ERR_LICENSE_REVOKED [ID: 403-REV]</div>
    <p style="color: #cbd5e1; font-size: 12px; margin-bottom: 20px; line-height: 1.4; text-align: left;">Lisensi ekosistem Gudang Nuhsantara pada modul ini telah dinonaktifkan secara permanen oleh Administrator Pusat. Form input token dinonaktifkan.</p>
    
    <button type="button" id="btnHubungiAdminPerm" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; border: 1px solid #22c55e; padding: 10px 16px; font-size: 11.5px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; font-family: monospace; margin-bottom: 8px;">💬 HUBUNGI ADMINISTRATOR</button>
    
    <div style="font-size: 9.5px; color: #64748b; margin-top: 10px;">Gudang Nuhsantara Cloud Core</div>
  `;

  lockScreen.appendChild(box);
  if (document.body) {
    document.body.appendChild(lockScreen);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(lockScreen));
  }

  setTimeout(() => {
    const btnAdmin = document.getElementById('btnHubungiAdminPerm');
    if (btnAdmin) {
      btnAdmin.onclick = function() {
        toggleUniversalChatWidget();
      };
    }
  }, 100);
}

// --- TAMPILKAN MODAL LAYAR KUNCI SEMENTARA ---
function tampilkanLayarKunciMandiri() {
  const existing = document.getElementById('nx-global-lock-screen');
  if (existing && existing.dataset.mode === 'temporary') return;
  if (existing) existing.remove();

  document.title = "503 Service Unavailable - Gateway Timeout";

  const lockScreen = document.createElement('div');
  lockScreen.id = 'nx-global-lock-screen';
  lockScreen.dataset.mode = 'temporary';
  lockScreen.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(7, 11, 20, 0.75); backdrop-filter: blur(12px); z-index: 2147483640; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;";

  const box = document.createElement('div');
  box.style.cssText = "position: relative; background: #0f172a; border: 1px solid rgba(239, 68, 68, 0.4); padding: 32px 24px; border-radius: 20px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(239, 68, 68, 0.15); font-family: monospace;";

  box.innerHTML = `
    <div style="position: absolute; top: 16px; left: 18px; display: flex; align-items: center; gap: 6px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 8px; border-radius: 20px;">
      <span style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%; display: inline-block;"></span>
      <span style="font-size: 9.5px; color: #ef4444; font-weight: bold; letter-spacing: 0.5px;">PURE_CLOUD_LOCKED</span>
    </div>
    <div style="width: 50px; height: 50px; background: rgba(239, 68, 68, 0.12); border: 1.5px solid rgba(239, 68, 68, 0.4); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 12px auto; box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
    </div>
    <h3 style="color: #ef4444; margin: 0 0 6px 0; font-size: 15px; font-weight: 700; letter-spacing: 1px;">GATEWAY TOKEN EXPIRED</h3>
    <div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 12px; background: rgba(239, 68, 68, 0.08); padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.2);">ERR_CLOUD_AUTH_LOCKED [ID: 503-GW]</div>
    <p style="color: #cbd5e1; font-size: 12px; margin-bottom: 16px; line-height: 1.4; text-align: left;">Sesi token otorisasi cloud telah berakhir atau sistem dikunci oleh pusat. Masukkan token valid untuk membuka akses.</p>
    <div style="margin-bottom: 12px;">
      <input type="text" id="inputTokenLisensi" placeholder="Masukkan token lisensi..." style="width: 100%; padding: 10px 12px; background: #020617; border: 1px solid #334155; color: #38bdf8; font-size: 11.5px; border-radius: 8px; outline: none; font-family: monospace; text-align: center; box-sizing: border-box;" />
      <div id="tokenErrorMsg" style="color: #ef4444; font-size: 10px; margin-top: 4px; display: none;">Token tidak valid atau format salah!</div>
    </div>
    <button id="btnRedeemToken" type="button" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; border: 1px solid #38bdf8; padding: 10px 16px; font-size: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.3); font-family: monospace; letter-spacing: 0.5px; margin-bottom: 8px; z-index: 2147483648;">AKTIFKAN TOKEN</button>
    
    <button type="button" id="btnHubungiAdminTemp" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; border: 1px solid #22c55e; padding: 10px 16px; font-size: 11.5px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; font-family: monospace; margin-bottom: 8px;">💬 HUBUNGI ADMINISTRATOR</button>
    
    <div style="font-size: 9.5px; color: #64748b; margin-top: 10px;">Gudang Nuhsantara Cloud Core</div>
  `;

  lockScreen.appendChild(box);
  if (document.body) {
    document.body.appendChild(lockScreen);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(lockScreen));
  }

  setTimeout(() => {
    const btnAdminTemp = document.getElementById('btnHubungiAdminTemp');
    if (btnAdminTemp) {
      btnAdminTemp.onclick = function() {
        toggleUniversalChatWidget();
      };
    }

    const btnRedeem = document.getElementById('btnRedeemToken');
    if (btnRedeem) {
      btnRedeem.onclick = async function() {
        const valToken = document.getElementById('inputTokenLisensi').value;
        const decodedDate = decodeTokenToDate(valToken);
        const errorMsg = document.getElementById('tokenErrorMsg');

        if (decodedDate && decodedDate > new Date()) {
          this.style.opacity = "0.8";
          this.style.pointerEvents = "none";

          let dotCount = 0;
          let loadingInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            this.innerText = "MENYINKRONKAN CLOUD" + ".".repeat(dotCount);
          }, 300);

          try {
            await fetch(CLOUD_LICENSE_ENDPOINT, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                locked: false,
                permanent: false,
                expiry: decodedDate.toISOString(),
                updatedAt: new Date().toISOString()
              })
            });

            clearInterval(loadingInterval);
            this.innerText = "TERAKTIVASI";
            tampilkanGuardToast(
              `<b style="color:#4ade80;">Aktivasi Berhasil!</b><div style="margin-top:2px; font-size:10.5px; color:#cbd5e1;">Masa aktif lisensi telah diperbarui. Memuat ulang...</div>`,
              "success",
              1200
            );
            setTimeout(() => {
              location.reload(true);
            }, 900);
          } catch (e) {
            clearInterval(loadingInterval);
            tampilkanGuardToast("Gagal terhubung ke Cloud. Periksa koneksi internet.", "error");
            this.style.opacity = "1";
            this.style.pointerEvents = "auto";
            this.innerText = "AKTIFKAN TOKEN";
          }

        } else {
          errorMsg.style.display = 'block';
          document.getElementById('inputTokenLisensi').style.border = "1px solid #ef4444";

          this.style.transform = "translateX(5px)";
          setTimeout(() => this.style.transform = "translateX(-5px)", 100);
          setTimeout(() => this.style.transform = "translateX(0)", 200);
        }
      };
    }
  }, 100);
}

// --- EKSEKUSI CEK CLOUD PERTAMA & POLLING TIAP 2 DETIK ---
cekStatusCloud();
setInterval(cekStatusCloud, 2000);
