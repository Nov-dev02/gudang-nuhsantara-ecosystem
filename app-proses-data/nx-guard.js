// =========================================================================
// 🛡️ GUDANG NUHSANTARA - SECURITY CORE & LICENSING GUARD (NX-GUARD v2.1)
// =========================================================================

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

// --- PENGECEKAN STATUS EXPIRATION ---
function cekStatusLisensi() {
  const savedTokenExpiry = localStorage.getItem('gudang_token_expiry');
  if (!savedTokenExpiry) return false;

  const expiryDate = new Date(savedTokenExpiry);
  const today = new Date();

  return today > expiryDate;
}

// --- CUSTOM TOAST CYBERPUNK (ANTI ALERT BAWAAN BROWSER) ---
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

// --- INISIALISASI KEAMANAN & EASTER EGG OPERATOR ---
document.addEventListener("DOMContentLoaded", function() {
  const SAKLAR_DARURAT_AKTIF = cekStatusLisensi();

  if (SAKLAR_DARURAT_AKTIF) {
    document.title = "503 Service Unavailable - Gateway Timeout";
    localStorage.setItem('gudang_status_terkunci', 'true');

    const nomorWA = "6287762756779"; 
    const pesanWA = encodeURIComponent("Halo Admin, token akses Gudang Nuhsantara saya telah kedaluwarsa (ERR_EXPIRED_TOKEN). Mohon bantuannya untuk perpanjangan token baru.");
    const linkWA = "https://wa.me/" + nomorWA + "?text=" + pesanWA;

    const styleAnimation = document.createElement('style');
    styleAnimation.innerHTML = "@keyframes titikKedip { 0% { opacity: 0.2; } 50% { opacity: 1; } 100% { opacity: 0.2; } } .status-live-dot { animation: titikKedip 1.5s ease-in-out infinite; }";
    document.head.appendChild(styleAnimation);

    const lockScreen = document.createElement('div');
    lockScreen.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(7, 11, 20, 0.96); backdrop-filter: blur(16px); z-index: 2147483647; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;";

    lockScreen.innerHTML = '<div style="position: relative; background: #0f172a; border: 1px solid rgba(239, 68, 68, 0.4); padding: 32px 24px; border-radius: 20px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(239, 68, 68, 0.15); font-family: monospace;">' +
      '<div style="position: absolute; top: 16px; left: 18px; display: flex; align-items: center; gap: 6px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 8px; border-radius: 20px;">' +
        '<span class="status-live-dot" style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%; display: inline-block;"></span>' +
        '<span style="font-size: 9.5px; color: #ef4444; font-weight: bold; letter-spacing: 0.5px;">SYSTEM_DOWN</span>' +
      '</div>' +
      '<div style="width: 50px; height: 50px; background: rgba(239, 68, 68, 0.12); border: 1.5px solid rgba(239, 68, 68, 0.4); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 12px auto; box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' +
      '</div>' +
      '<h3 style="color: #ef4444; margin: 0 0 6px 0; font-size: 15px; font-weight: 700; letter-spacing: 1px;">GATEWAY TOKEN EXPIRED</h3>' +
      '<div style="font-size: 10.5px; color: #94a3b8; margin-bottom: 12px; background: rgba(239, 68, 68, 0.08); padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.2);">ERR_CLOUD_AUTH_TIMEOUT [ID: 503-GW]</div>' +
      '<p style="color: #cbd5e1; font-size: 12px; margin-bottom: 16px; line-height: 1.4; text-align: left;">Sesi token otorisasi cloud telah berakhir. Masukkan token lisensi baru dari administrator atau hubungi via WhatsApp.</p>' +
      '<div style="margin-bottom: 12px;">' +
        '<input type="text" id="inputTokenLisensi" placeholder="Masukkan token lisensi..." style="width: 100%; padding: 10px 12px; background: #020617; border: 1px solid #334155; color: #38bdf8; font-size: 11.5px; border-radius: 8px; outline: none; font-family: monospace; text-align: center; box-sizing: border-box;" />' +
        '<div id="tokenErrorMsg" style="color: #ef4444; font-size: 10px; margin-top: 4px; display: none;">Token tidak valid atau format salah!</div>' +
      '</div>' +
      '<button id="btnRedeemToken" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; border: 1px solid #38bdf8; padding: 10px 16px; font-size: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.3); font-family: monospace; letter-spacing: 0.5px; margin-bottom: 8px;">AKTIFKAN TOKEN</button>' +
      '<a href="' + linkWA + '" target="_blank" style="text-decoration: none; display: block; margin-bottom: 8px;">' +
        '<button style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; border: 1px solid #22c55e; padding: 10px 16px; font-size: 11.5px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 100%; font-family: monospace;">💬 HUBUNGI ADMINISTRATOR</button>' +
      '</a>' +
      '<div style="font-size: 9.5px; color: #64748b; margin-top: 10px;">Gudang Nuhsantara Cloud Core v2.0</div>' +
    '</div>';

    document.body.appendChild(lockScreen);

    document.getElementById('btnRedeemToken').addEventListener('click', function() {
      const btn = this;
      const valToken = document.getElementById('inputTokenLisensi').value;
      const decodedDate = decodeTokenToDate(valToken);
      const errorMsg = document.getElementById('tokenErrorMsg');

      if (decodedDate && decodedDate > new Date()) {
        btn.style.opacity = "0.8";
        btn.style.pointerEvents = "none";
        
        let dotCount = 0;
        let loadingInterval = setInterval(function() {
          dotCount = (dotCount + 1) % 4;
          let dots = ".".repeat(dotCount);
          btn.innerText = "MEMVALIDASI TOKEN" + dots;
        }, 300);

        setTimeout(function() {
          clearInterval(loadingInterval);
          localStorage.setItem('gudang_token_expiry', decodedDate.toISOString());
          localStorage.setItem('gudang_status_terkunci', 'true');
          location.reload(true);
        }, 1200);

      } else {
        errorMsg.style.display = 'block';
        document.getElementById('inputTokenLisensi').style.border = "1px solid #ef4444";
        
        btn.style.transform = "translateX(5px)";
        setTimeout(function() { btn.style.transform = "translateX(-5px)"; }, 100);
        setTimeout(function() { btn.style.transform = "translateX(0)"; }, 200);
      }
    });

  } else {
    if (localStorage.getItem('gudang_status_terkunci') === 'true') {
      const successModal = document.createElement('div');
      successModal.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(7, 11, 20, 0.85); backdrop-filter: blur(10px); z-index: 2147483647; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;";
      
      successModal.innerHTML = '<div style="background: #0f172a; border: 1px solid rgba(16, 185, 129, 0.4); padding: 32px 24px; border-radius: 20px; width: 100%; max-width: 380px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.8); font-family: monospace;">' +
        '<div style="width: 60px; height: 60px; background: rgba(16, 185, 129, 0.12); border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 16px auto; box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);">' +
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
        '</div>' +
        '<h3 style="color: #10b981; margin: 0 0 8px 0; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">TOKEN BERHASIL DIPERBARUI</h3>' +
        '<div style="font-size: 11px; color: #94a3b8; margin-bottom: 16px; background: rgba(16, 185, 129, 0.08); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.2);">STATUS_AUTH_OK [ID: 200-GW]</div>' +
        '<p style="color: #cbd5e1; font-size: 12px; margin-bottom: 0; line-height: 1.5;">Otorisasi cloud pusat telah diperbarui. Sistem Gudang Nuhsantara siap digunakan kembali secara normal.</p>' +
      '</div>';

      document.body.appendChild(successModal);
      localStorage.removeItem('gudang_status_terkunci');
      localStorage.setItem('gudang_warning_sudah_dibaca', 'true');

      setTimeout(function() {
        successModal.style.transition = "opacity 0.5s ease";
        successModal.style.opacity = "0";
        setTimeout(function() { successModal.remove(); }, 500);
      }, 3500);
    }
  }

  // --- TRIGGER RAHASIA KLIK 5x (PANEL CONTROL LISENSI) ---
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

function muatDataPanelNx() {
  const savedExpiry = localStorage.getItem('gudang_token_expiry');
  const badge = document.getElementById('nxStatusBadge');
  const textExpiry = document.getElementById('nxExpiryText');
  const textCountdown = document.getElementById('nxCountdownText');

  if (!savedExpiry) {
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> TIDAK TERPASANG';
      badge.style.color = '#f59e0b';
      badge.style.background = 'rgba(245, 158, 11, 0.15)';
    }
    if (textExpiry) textExpiry.innerText = 'Token Bawaan / Bebas';
    if (textCountdown) textCountdown.innerText = 'Tanpa Batasan';
    return;
  }

  const expiryDate = new Date(savedExpiry);
  const now = new Date();

  if (now > expiryDate) {
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> EXPIRED';
      badge.style.color = '#ef4444';
      badge.style.background = 'rgba(239, 68, 68, 0.15)';
    }
  } else {
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> AKTIF';
      badge.style.color = '#22c55e';
      badge.style.background = 'rgba(34, 197, 94, 0.15)';
    }
  }

  if (textExpiry) {
    textExpiry.innerText = expiryDate.toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
  }

  const diffTime = expiryDate - now;
  if (diffTime > 0) {
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (textCountdown) textCountdown.innerText = `${diffDays} Hari ${diffHours} Jam Lagi`;
  } else {
    if (textCountdown) textCountdown.innerText = 'Sudah Kedaluwarsa!';
  }
}

function simpanTokenDariPanel() {
  const inputToken = document.getElementById('inputPanelNxToken');
  if (!inputToken || !inputToken.value.trim()) {
    showNxToastMessage("Harap masukkan token lisensi NX yang valid!", false);
    return;
  }

  const valToken = inputToken.value.trim();
  const decodedDate = decodeTokenToDate(valToken);

  if (decodedDate && decodedDate > new Date()) {
    localStorage.setItem('gudang_token_expiry', decodedDate.toISOString());
    localStorage.removeItem('gudang_status_terkunci');
    tutupModalNxAdmin();
    showNxToastMessage("Token Lisensi NX Berhasil Diperbarui!", true);
    setTimeout(() => { location.reload(true); }, 1500);
  } else {
    showNxToastMessage("Token tidak valid atau sudah kedaluwarsa!", false);
  }
}

function simulasiKunciSistem() {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  
  localStorage.setItem('gudang_token_expiry', pastDate.toISOString());
  localStorage.setItem('gudang_status_terkunci', 'true');
  
  tutupModalNxAdmin();
  showNxToastMessage("Simulasi Kunci Sistem Berhasil Diterapkan!", true);
  
  setTimeout(() => {
    location.reload(true);
  }, 1500);
}
