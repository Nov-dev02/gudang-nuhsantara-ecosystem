// =========================================================================
// 🛡️ GUDANG NUHSANTARA - 100% PURE CLOUD FIREBASE GUARD (v4.2 FINAL WITH PERMANENT LOCK)
// =========================================================================

// 🌐 URL FIREBASE REALTIME DATABASE MILIKMU
const FIREBASE_DB_URL = "https://gudang-nuhsantara-auth-default-rtdb.asia-southeast1.firebasedatabase.app";
const CLOUD_LICENSE_ENDPOINT = `${FIREBASE_DB_URL}/gudang_nuhsantara/license.json`;

const ADMIN_NX_PIN = "2026";
let secretClickCount = 0;
let secretClickTimer = null;

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
        location.reload();
      }
    }
  } catch (err) {
    console.log("Menunggu koneksi cloud...");
  }
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
