// =========================================================================
// 🛡️ GUDANG NUHSANTARA - 100% PURE CLOUD FIREBASE GUARD (v4.1 FINAL)
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
    
    // Jika data di cloud belum ada, lewati
    if (!data) return;

    const now = new Date();
    const expiryDate = data.expiry ? new Date(data.expiry) : null;
    const isExpired = expiryDate ? (now > expiryDate) : false;

    // KUNCI UTAMA: Jika Cloud bilang locked == true ATAU tanggal expired sudah lewat
    if (data.locked === true || isExpired) {
      tampilkanLayarKunciMandiri();
    } else {
      // Jika Cloud bilang unlocked (locked == false) dan token valid, tutup layar kunci & reload
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

// --- TAMPILKAN MODAL LAYAR KUNCI MERAH (DOM CLEAN VERSION) ---
function tampilkanLayarKunciMandiri() {
  // Jika modal sudah ada di layar, jangan di-render ulang (biar tombol tidak glitch/bisa diklik)
  if (document.getElementById('nx-global-lock-screen')) return;

  document.title = "503 Service Unavailable - Gateway Timeout";

  const nomorWA = "6287762756779"; 
  const pesanWA = encodeURIComponent("Halo Admin, akses aplikasi Gudang Nuhsantara terkunci. Mohon bantuan token aktivasi baru.");
  const linkWA = "https://wa.me/" + nomorWA + "?text=" + pesanWA;

  // 1. Buat Container Utama
  const lockScreen = document.createElement('div');
  lockScreen.id = 'nx-global-lock-screen';
  lockScreen.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(7, 11, 20, 0.98); backdrop-filter: blur(16px); z-index: 2147483647; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;";

  // 2. Buat Kotak Dialog Box
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

  // 3. Pasang Event Listener ke tombol redeem token -> Kirim status locked: false ke Cloud Firebase
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
            // Update status cloud menjadi tidak terkunci (unlocked) dengan tanggal expiry baru
            await fetch(CLOUD_LICENSE_ENDPOINT, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                locked: false,
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

// --- CUSTOM TOAST CYBERPUNK ---
function showNxToastMessage(message, isSuccess = true) {
  let existingToast = document.getElementById('nx-cyber-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'nx-cyber-toast';
  
  const borderColor = isSuccess ? '#22c55e' : '#ef4444';
  const iconSymbol = isSuccess ? '✅' : '⚠️';

  toast.style.cssText = `
    position: fixed; top: 30px; left: 50%; transform: translateX(-50%) translateY(-20px);
    background: rgba(15, 23, 42, 0.98); border: 1.5px solid ${borderColor};
    color: #f8fafc; padding: 14px 24px; border-radius: 14px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 25px ${isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};
    font-family: monospace; font-size: 13px; z-index: 2147483647;
    display: flex; align-items: center; gap: 12px; backdrop-filter: blur(12px);
    opacity: 0; transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  toast.innerHTML = `<span style="font-size: 18px;">${iconSymbol}</span> <span style="font-weight: bold; letter-spacing: 0.5px;">${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 20);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// --- INISIALISASI EASTER EGG OPERATOR & PANEL LISENSI ---
document.addEventListener("DOMContentLoaded", function() {
  const logoElements = document.querySelectorAll('img[src*="favicon"], header img, div img');
  const titleElements = document.querySelectorAll('h2');
  const clickTargets = [...logoElements, ...titleElements];

  clickTargets.forEach(el => {
    if (el.closest('.container') && el.closest('.container') === document.querySelector('.container')) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', handleSecretTriggerClick);
    }
  });

  const inputPin = document.getElementById('inputNxPin');
  if (inputPin) {
    inputPin.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') verifikasiNxPin();
    });
  }
});

function handleSecretTriggerClick(e) {
  e.stopPropagation();
  secretClickCount++;
  
  if (secretClickCount === 1) {
    secretClickTimer = setTimeout(() => {
      secretClickCount = 0;
    }, 2000);
  }

  if (secretClickCount >= 5) {
    clearTimeout(secretClickTimer);
    secretClickCount = 0;
    bukaModalNxAdmin();
  }
}

function bukaModalNxAdmin() {
  const modal = document.getElementById('modal-nx-admin');
  const pinStep = document.getElementById('nx-pin-step');
  const panelStep = document.getElementById('nx-panel-step');
  const inputPin = document.getElementById('inputNxPin');
  const errPin = document.getElementById('nxPinError');

  if (modal && pinStep && panelStep) {
    pinStep.style.display = 'block';
    panelStep.style.display = 'none';
    if (errPin) errPin.style.display = 'none';
    if (inputPin) {
      inputPin.value = '';
      setTimeout(() => inputPin.focus(), 100);
    }
    modal.style.display = 'flex';
  }
}

function tutupModalNxAdmin() {
  const modal = document.getElementById('modal-nx-admin');
  if (modal) modal.style.display = 'none';
}

function verifikasiNxPin() {
  const inputPin = document.getElementById('inputNxPin');
  const errPin = document.getElementById('nxPinError');
  const pinStep = document.getElementById('nx-pin-step');
  const panelStep = document.getElementById('nx-panel-step');

  if (inputPin && inputPin.value.trim() === ADMIN_NX_PIN) {
    if (errPin) errPin.style.display = 'none';
    pinStep.style.display = 'none';
    panelStep.style.display = 'block';
    muatDataPanelNx();
  } else {
    if (errPin) errPin.style.display = 'block';
    if (inputPin) {
      inputPin.style.border = '1px solid #ef4444';
      inputPin.value = '';
      inputPin.focus();
    }
  }
}

// Fungsi panel tetap aman tanpa error
function muatDataPanelNx() {}
function simpanTokenDariPanel() {}
function simulasiKunciSistem() {}
