// =========================================================================
// 🛡️ GUDANG NUHSANTARA - 100% PURE CLOUD FIREBASE GUARD (v4.3 WITH LOCK SCREEN CHAT)
// =========================================================================

// 🌐 URL FIREBASE REALTIME DATABASE MILIKMU
const FIREBASE_DB_URL = "https://gudang-nuhsantara-auth-default-rtdb.asia-southeast1.firebasedatabase.app";
const CLOUD_LICENSE_ENDPOINT = `${FIREBASE_DB_URL}/gudang_nuhsantara/license.json`;

const ADMIN_NX_PIN = "2026";
let secretClickCount = 0;
let secretClickTimer = null;
let lockChatPollInterval = null;

// --- DECODER TOKEN NX ---
function decodeTokenToDate(token) {
  try {
    if (!token || token.length < 15) return null;
    let cleanToken = token.trim();
    if (!cleanToken.includes('NX')) return null;
    
    let parts = cleanToken.split('NX');
    if (parts.length < 2) return null;
    
    let hexPart = parts[1].match(/^[0-9a-fA-F]+/);
    if (!hexPart) return null;
    
    let timestamp = parseInt(hexPart[0], 16);
    if (isNaN(timestamp)) return null;
    
    let targetDate = new Date(timestamp);
    if (isNaN(targetDate.getTime())) return null;
    
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
        tutupLockChatWidget();
        location.reload();
      }
    }
  } catch (err) {
    console.log("Menunggu koneksi cloud...");
  }
}

// --- PENDUKUNG WIDGET CHAT DI LAYAR TERKUNCI ---
function getSafeStaffKeyForLock() {
    let name = localStorage.getItem('gudang_staff_name') || "Staf_LockScreen";
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function toggleLockChatWidget() {
    const box = document.getElementById('lockChatWidgetBox');
    if (!box) return;
    if (box.style.display === 'flex') {
        box.style.display = 'none';
        clearInterval(lockChatPollInterval);
    } else {
        box.style.display = 'flex';
        muatPesanLockChat();
        lockChatPollInterval = setInterval(muatPesanLockChat, 3000);
        setTimeout(() => {
            const inputEl = document.getElementById('lockInputChat');
            if (inputEl) inputEl.focus();
        }, 100);
    }
}

function tutupLockChatWidget() {
    const box = document.getElementById('lockChatWidgetBox');
    if (box) box.style.display = 'none';
    clearInterval(lockChatPollInterval);
}

async function muatPesanLockChat() {
    const staffKey = getSafeStaffKeyForLock();
    try {
        const res = await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${staffKey}.json?t=` + Date.now());
        const data = await res.json();
        const container = document.getElementById('lockChatMessagesContainer');
        const badge = document.getElementById('lockChatBadge');
        if (!container) return;

        if (!data || !data.messages) {
            container.innerHTML = `<div style="color: #94a3b8; text-align: center; margin: auto;">Halo, ada kendala token? Kirim pesan ke owner di sini.</div>`;
            if (badge) badge.style.display = 'none';
            return;
        }

        const messages = data.messages;
        let html = "";
        let unread = 0;

        Object.keys(messages).forEach(k => {
            const m = messages[k];
            let bubbleStyle = m.sender === 'staff' 
                ? "background: #0284c7; color: #fff; align-self: flex-end;" 
                : "background: #1e293b; color: #f8fafc; align-self: flex-start;";

            if (m.sender === 'owner' && !m.read) unread++;

            html += `
                <div style="max-width: 80%; padding: 8px 11px; border-radius: 10px; ${bubbleStyle} word-break: break-word;">
                    <div style="font-size: 9px; opacity: 0.7; margin-bottom: 2px;">${m.sender.toUpperCase()}</div>
                    <div>${m.text}</div>
                    <div style="font-size: 9px; text-align: right; margin-top: 3px; opacity: 0.6;">
                        ${new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;

        if (badge) {
            if (unread > 0 && document.getElementById('lockChatWidgetBox').style.display !== 'flex') {
                badge.innerText = unread;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) { console.error(e); }
}

async function kirimPesanLockChat() {
    const input = document.getElementById('lockInputChat');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const staffKey = getSafeStaffKeyForLock();

    const newMsg = {
        sender: 'staff',
        text: `[LAYAR TERKUNCI] ${text}`,
        time: Date.now(),
        read: false
    };

    try {
        await fetch(`${FIREBASE_DB_URL}/gudang_nuhsantara/chats/${staffKey}/messages.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMsg)
        });
        input.value = "";
        muatPesanLockChat();
    } catch (e) { alert("Gagal mengirim pesan!"); }
}

// --- HTML KOMPONEN FLOATING CHAT UNTUK LAYAR TERKUNCI ---
function buatFloatingChatHTML() {
    return `
      <!-- FLOATING CHAT BUTTON DI LAYAR TERKUNCI -->
      <div id="lockFloatingChatBtn" style="position: fixed !important; bottom: 24px !important; right: 24px !important; width: 56px !important; height: 56px !important; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important; border: 1px solid #38bdf8 !important; border-radius: 50% !important; display: flex !important; justify-content: center !important; align-items: center !important; color: #fff !important; font-size: 24px !important; cursor: pointer !important; z-index: 2147483648 !important; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.5) !important;" onclick="toggleLockChatWidget()">
          <i class="fa-solid fa-headset"></i>
          <span id="lockChatBadge" style="position: absolute !important; top: -2px !important; right: -2px !important; background: #ef4444 !important; color: #fff !important; font-size: 10px !important; font-weight: bold !important; padding: 2px 6px !important; border-radius: 10px !important; display: none; font-family: monospace !important; border: 1px solid #0f172a !important;">0</span>
      </div>

      <!-- KOTAK WIDGET CHAT DI LAYAR TERKUNCI -->
      <div id="lockChatWidgetBox" style="position: fixed !important; bottom: 90px !important; right: 24px !important; width: 350px !important; max-width: calc(100vw - 48px) !important; height: 400px !important; background: #0f172a !important; border: 1px solid rgba(56, 189, 248, 0.4) !important; border-radius: 16px !important; box-shadow: 0 25px 50px rgba(0,0,0,0.9) !important; z-index: 2147483649 !important; display: none; flex-direction: column !important; overflow: hidden !important; font-family: monospace !important; box-sizing: border-box !important;">
          <div style="background: rgba(15, 23, 42, 0.95) !important; padding: 10px 14px !important; border-bottom: 1px solid rgba(56, 189, 248, 0.2) !important; display: flex !important; justify-content: space-between !important; align-items: center !important; box-sizing: border-box !important;">
              <div>
                  <b style="color: #fff; font-size: 12px;"><i class="fa-solid fa-robot" style="color: #38bdf8;"></i> CS Asisten Nuhsantara</b>
                  <div style="font-size: 9.5px; color: #94a3b8;">Mode Darurat (Layar Terkunci)</div>
              </div>
              <button onclick="toggleLockChatWidget()" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">&times;</button>
          </div>

          <div id="lockChatMessagesContainer" style="flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; font-size: 11.5px; background: #070b14; box-sizing: border-box !important;">
              <div style="color: #94a3b8; text-align: center; margin: auto;">Memuat pesan...</div>
          </div>

          <div style="display: flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; padding: 10px !important; background: rgba(15, 23, 42, 0.95) !important; border-top: 1px solid rgba(56, 189, 248, 0.2) !important; box-sizing: border-box !important; width: 100% !important;">
              <input type="text" id="lockInputChat" placeholder="Ketik kendala token..." style="flex: 1 !important; width: auto !important; padding: 9px 10px !important; background: #020617 !important; border: 1px solid #334155 !important; color: #fff !important; border-radius: 7px !important; font-size: 11.5px !important; outline: none !important; font-family: monospace !important; box-sizing: border-box !important;" onkeypress="if(event.key === 'Enter') kirimPesanLockChat()" />
              <button type="button" onclick="kirimPesanLockChat()" style="flex-shrink: 0 !important; width: auto !important; padding: 9px 14px !important; background: #0284c7 !important; border: 1px solid #38bdf8 !important; color: white !important; border-radius: 7px !important; cursor: pointer !important; font-family: monospace !important; font-weight: bold !important; font-size: 11.5px !important; box-sizing: border-box !important;">Kirim</button>
          </div>
      </div>
    `;
}
// --- TAMPILKAN LAYAR KUNCI PERMANEN (KILL SWITCH - TANPA FORM INPUT) ---
function tampilkanLayarKunciPermanen() {
  const existing = document.getElementById('nx-global-lock-screen');
  if (existing && existing.dataset.mode === 'permanent') return;
  if (existing) existing.remove();

  document.title = "403 Access Forbidden - Permanent Revocation";

  const nomorWA = "6287762756779"; 
  const pesanWA = encodeURIComponent("Halo Admin, akses aplikasi Gudang Nuhsantara terkunci permanen. Mohon bantuan pemulihan akses.");
  const linkWA = "https://wa.me/" + nomorWA + "?text=" + pesanWA;

  const lockScreen = document.createElement('div');
  lockScreen.id = 'nx-global-lock-screen';
  lockScreen.dataset.mode = 'permanent';
  lockScreen.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 5, 5, 0.98); backdrop-filter: blur(16px); z-index: 2147483647; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;";

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
    <a href="${linkWA}" target="_blank" style="text-decoration: none; display: block; margin-bottom: 8px;">
      <button type="button" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; border: 1px solid #22c55e; padding: 10px 16px; font-size: 11.5px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; font-family: monospace;">💬 HUBUNGI ADMINISTRATOR</button>
    </a>
    <div style="font-size: 9.5px; color: #64748b; margin-top: 10px;">Gudang Nuhsantara Cloud Core</div>
    ${buatFloatingChatHTML()}
  `;

  lockScreen.appendChild(box);
  if (document.body) {
    document.body.appendChild(lockScreen);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(lockScreen));
  }
}

// --- TAMPILKAN MODAL LAYAR KUNCI SEMENTARA (DENGAN FORM INPUT TOKEN) ---
function tampilkanLayarKunciMandiri() {
  const existing = document.getElementById('nx-global-lock-screen');
  if (existing && existing.dataset.mode === 'temporary') return;
  if (existing) existing.remove();

  document.title = "503 Service Unavailable - Gateway Timeout";

  const nomorWA = "6287762756779"; 
  const pesanWA = encodeURIComponent("Halo Admin, akses aplikasi Gudang Nuhsantara terkunci. Mohon bantuan token aktivasi baru.");
  const linkWA = "https://wa.me/" + nomorWA + "?text=" + pesanWA;

  const lockScreen = document.createElement('div');
  lockScreen.id = 'nx-global-lock-screen';
  lockScreen.dataset.mode = 'temporary';
  lockScreen.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(7, 11, 20, 0.98); backdrop-filter: blur(16px); z-index: 2147483647; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;";

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
    <a href="${linkWA}" target="_blank" style="text-decoration: none; display: block; margin-bottom: 8px;">
      <button type="button" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; border: 1px solid #22c55e; padding: 10px 16px; font-size: 11.5px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; font-family: monospace;">💬 HUBUNGI ADMINISTRATOR</button>
    </a>
    <div style="font-size: 9.5px; color: #64748b; margin-top: 10px;">Gudang Nuhsantara Cloud Core</div>
    ${buatFloatingChatHTML()}
  `;

  lockScreen.appendChild(box);
  if (document.body) {
    document.body.appendChild(lockScreen);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(lockScreen));
  }

  setTimeout(() => {
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
            tutupLockChatWidget();
            location.reload(true);
          } catch (e) {
            clearInterval(loadingInterval);
            alert("Gagal terhubung ke Cloud. Periksa koneksi internet.");
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
