// =========================================================================
// 🌐 KONFIGURASI DINAMIS LINK GAS (GOOGLE APPS SCRIPT)
// =========================================================================
const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbzgfgJTg5maF0gLBcmFhLwqQS9dAzqXmFthEcp_GW3WtrOKuOfqP_INVLxlm0-68Yv8fA/exec";

function getGasUrl() {
  return localStorage.getItem('GUDANG_GAS_URL') || DEFAULT_GAS_URL;
}

Object.defineProperty(window, 'WEB_APP_URL', {
  get: function() { return getGasUrl(); },
  configurable: true
});

let currentDownloadUrl = "";
const SCRIPT_URL_REKAPAN = "https://script.google.com/macros/s/AKfycbzLud58sY-o4azbshEww7-JSXCLoZ2sbmALaS2z6aRhmT-Q_vvXCzlDn4NqzBCedZpS/exec";

// ==========================================
// 🎨 SCRIPT PENGATUR TOGGLE TEMA DARK / LIGHT
// ==========================================
function toggleDarkLightMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('gudang_theme', newTheme);
    updateThemeButtonUI(newTheme);
}

function updateThemeButtonUI(theme) {
    const thumbEl = document.getElementById('themeSwitchThumb');
    if (theme === 'light') {
        if (thumbEl) {
            thumbEl.style.transform = 'translateX(26px)';
            thumbEl.style.background = '#f59e0b';
            thumbEl.innerHTML = '<i class="fa-solid fa-sun" style="font-size: 11px; color: #070b14;"></i>';
        }
    } else {
        if (thumbEl) {
            thumbEl.style.transform = 'translateX(0px)';
            thumbEl.style.background = '#38bdf8';
            thumbEl.innerHTML = '<i class="fa-solid fa-moon" style="font-size: 11px; color: #070b14;"></i>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('gudang_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButtonUI(savedTheme);
});

// ==========================================
// 🛡️ DATABASE & VERIFIKASI OPERATOR SHIFT
// ==========================================
const operatorsProfile = {
  "IRGI": { id: "GDN-001", name: "IRGI", photo: "https://raw.githubusercontent.com/Nov-dev02/Gudang-Web-App/main/img/IRGI.jpg" },
  "DWI": { id: "GDN-003", name: "DWI", photo: "" },
  "ERIKA": { id: "GDN-004", name: "ERIKA", photo: "" }
};

function setOperatorProfile(namaOperator) {
    const elName = document.getElementById('operatorName');
    const elId = document.getElementById('operatorId');
    const elAvatarBox = document.getElementById('operatorAvatarBox');
    const settingBtn = document.getElementById('settingBtn');
    
    if (!namaOperator) {
        if (elName) elName.innerText = "---";
        if (elId) elId.innerText = "ID: ---";
        if (elAvatarBox) {
            elAvatarBox.innerHTML = '<i class="fa-solid fa-lock"></i>';
            elAvatarBox.style.background = 'rgba(239, 68, 68, 0.2)';
            elAvatarBox.style.color = '#ef4444';
        }
        if (settingBtn) {
            settingBtn.disabled = true;
            settingBtn.style.opacity = '0.5';
            settingBtn.style.cursor = 'not-allowed';
        }
        return;
    }

    if (settingBtn) {
        settingBtn.disabled = false;
        settingBtn.style.opacity = '1';
        settingBtn.style.cursor = 'pointer';
    }

    const cleanName = namaOperator.toUpperCase();
    const profile = operatorsProfile[cleanName] || { id: "GDN-999", name: namaOperator, photo: "" };
    
    if (elName) elName.innerText = profile.name;
    if (elId) elId.innerText = `ID: ${profile.id}`;
    
    if (elAvatarBox) {
        elAvatarBox.style.color = '';
        if (profile.photo && profile.photo.trim() !== "") {
            elAvatarBox.innerHTML = `<img src="${profile.photo}" alt="${profile.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 3px;">`;
            elAvatarBox.style.background = 'transparent';
        } else {
            elAvatarBox.innerHTML = profile.name.slice(0, 2).toUpperCase();
            elAvatarBox.style.background = 'rgba(56, 189, 248, 0.3)';
        }
    }
}

function verifyOperatorLogin() {
  const inputEl = document.getElementById('inputOperatorKey');
  if (!inputEl) return;  
  
  const inputVal = inputEl.value.trim().toUpperCase();
  const errorMsg = document.getElementById('loginErrorMsg');
  const alertBox = document.getElementById('loginAlertBox');
  const modal = document.getElementById('loginModal');

  const activeShiftOperator = typeof getActiveOperator === 'function' ? getActiveOperator() : "DWI";
  const activeProfile = operatorsProfile[activeShiftOperator];
  const isInputValid = (inputVal === activeShiftOperator) || (activeProfile && inputVal === activeProfile.id);

  if (isInputValid) {
    const sessionData = { name: activeShiftOperator, loginTime: new Date().getTime() };
    localStorage.setItem('gudang_active_operator', JSON.stringify(sessionData));
    
    if (errorMsg) errorMsg.style.display = 'none';
    if (alertBox) {
      alertBox.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span id="alertSuccessText">Verifikasi Berhasil! Selamat Bertugas, ${activeShiftOperator}!</span>`;
      alertBox.style.top = '0px';
    }
    setOperatorProfile(activeShiftOperator);
    
    setTimeout(() => {
      if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => { 
          modal.style.display = 'none'; 
          const welcomeAudio = new Audio(`https://raw.githubusercontent.com/Nov-dev02/Gudang-Web-App/main/audio/${activeShiftOperator}.mp3?v=99`);
          welcomeAudio.volume = 0.9;
          welcomeAudio.play().catch(err => console.log("Audio play blocked/error:", err));
        }, 300);
      }
    }, 1000);
  } else {
    if (errorMsg) {
      errorMsg.innerHTML = `<i class="fa-solid fa-circle-xmark" style="margin-right: 4px;"></i> Access Denied! Harap masukkan operator yang valid`;
      errorMsg.style.display = 'block';
    }
  }
}

function updateRowCounter() {
  const textarea = document.getElementById('shopeeData');
  const rowCounter = document.getElementById('rowCounter');
  if (!textarea || !rowCounter) return;

  let lines = textarea.value.split('\n').filter(line => line.trim() !== '');
  let totalLines = lines.length;

  if (totalLines === 0) {
    rowCounter.innerHTML = `<i class="fa-solid fa-chart-bar" style="margin-right: 5px; color: #38bdf8;"></i> 0 baris data`;
    return;
  }

  let shopeeCount = 0, tiktokCount = 0;
  lines.forEach(rawLine => {
    let line = rawLine.trim();
    let upperLine = line.toUpperCase();
    if (/^\d{6}[A-Z0-9]{8}$/i.test(line)) {
      shopeeCount++;
    } else if (upperLine.startsWith('JY') || upperLine.startsWith('TG') || upperLine.startsWith('GTL') || upperLine.includes('TIKTOK')) {
      tiktokCount++;
    }
  });

  if (shopeeCount > 0 || tiktokCount > 0) {
    rowCounter.innerHTML = `<i class="fa-solid fa-chart-bar" style="margin-right: 5px; color: #38bdf8;"></i> ${totalLines.toLocaleString()} baris <span style="font-size: 10px; opacity: 0.85; margin-left: 4px; font-weight: normal;">(Shopee: ${shopeeCount} | TikTok:${tiktokCount})</span>`;
  } else {
    rowCounter.innerHTML = `<i class="fa-solid fa-chart-bar" style="margin-right: 5px; color: #38bdf8;"></i> ${totalLines.toLocaleString()} baris data`;
  }
}

function initAppListeners() {
  const textarea = document.getElementById('shopeeData');
  if (textarea) {
    textarea.addEventListener('input', updateRowCounter);
    textarea.addEventListener('keyup', updateRowCounter);
    textarea.addEventListener('paste', () => setTimeout(updateRowCounter, 100));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppListeners);
} else {
  initAppListeners();
}

async function processData() {
  const textarea = document.getElementById('shopeeData');
  const rowCounter = document.getElementById('rowCounter');
  if (!textarea) return;
  const shopeeData = textarea.value.trim();
  
  const btn = document.getElementById('submitBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');
  const logDiv = document.getElementById('log');
  const logTextSpan = document.getElementById('logText');
  
  if (!shopeeData) {
    showNxCustomAlert("Silakan paste data Shopee & TikTok terlebih dahulu ya!", false);
    return;
  }

  if (btn) btn.disabled = true;
  if (btnSpinner) btnSpinner.style.setProperty('display', 'inline-block', 'important');
  if (btnText) btnText.style.setProperty('display', 'none', 'important');

  if (logDiv) logDiv.style.display = 'block';
  if (logTextSpan) logTextSpan.innerHTML = '[' + new Date().toLocaleTimeString() + '] <i class="fa-solid fa-network-wired" style="color: #22c55e; margin-right: 6px;"></i>Menghubungkan ke Cloud Database Google Drive...';
  
  await new Promise(resolve => setTimeout(resolve, 600));
  
  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ shopeeData: shopeeData })
    });
    
    if (!response.ok) throw new Error(`Server error HTTP: ${response.status}`);

    const result = await response.text();
    let res = JSON.parse(result);

    if (res.status === 'success') {
      textarea.value = '';
      if (rowCounter) rowCounter.innerHTML = `<i class="fa-solid fa-chart-bar" style="margin-right: 5px; color: #38bdf8;"></i> 0 baris data`;
      playSuccessSound();
      
      currentDownloadUrl = res.downloadUrl || res.fileUrl || res.spreadsheetUrl || "";
      window.globalServerResponse = res;
      
      setTimeout(() => {
        const modalKonfirmasi = document.getElementById('modalKonfirmasi');
        if (modalKonfirmasi) modalKonfirmasi.style.display = 'flex';
        else showCustomAlert(res.message || "Transaksi selesai.", currentDownloadUrl);
      }, 1200);
    } else {
      setTimeout(() => { showCustomAlert('Terjadi Kesalahan: ' + res.message, ''); }, 800);
    }
  } catch (error) {
    setTimeout(() => { showCustomAlert('Terjadi Kesalahan: ' + error.message, ''); }, 800);
  }
  
  if (btn) btn.disabled = false;
  if (btnSpinner) btnSpinner.style.setProperty('display', 'none', 'important');
  if (btnText) {
    btnText.style.setProperty('display', 'inline-flex', 'important');
    btnText.innerHTML = '<i class="fa-solid fa-bolt-lightning"></i> EXECUTE';
  }
}

function showCustomAlert(message, downloadUrl) {
  currentDownloadUrl = downloadUrl || "";
  const msgEl = document.getElementById('customAlertMessage');
  if (msgEl) msgEl.innerText = message;
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.style.display = (downloadUrl && downloadUrl.trim() !== "") ? 'flex' : 'none';
  }
  const modal = document.getElementById('customAlertModal');
  if (modal) modal.style.display = 'flex';
}

async function downloadExcelWithProgress() {
  const targetUrl = currentDownloadUrl || (window.globalServerResponse && window.globalServerResponse.downloadUrl) || "";
  if (!targetUrl) {
    showNxCustomAlert("URL download belum tersedia dari server.", false);
    closeCustomAlert();
    return;
  }
  try {
    const response = await fetch(targetUrl);
    const blobData = await response.blob();
    const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    const now = new Date();
    const dynamicFileName = "TRANSAKSI GUDANG " + ("0" + now.getDate()).slice(-2) + " " + months[now.getMonth()] + " " + now.getFullYear() + ".xlsx";

    const blobUrl = window.URL.createObjectURL(blobData);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = dynamicFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      closeCustomAlert();
    }, 600);
  } catch (err) {
    showNxCustomAlert("Terjadi kesalahan saat mengunduh file Excel.", false);
  }
}

function closeCustomAlert() {
  const modal = document.getElementById('customAlertModal');
  if (modal) modal.style.display = 'none';
}

const fadeTexts = [
  "📦 SISTEM MANAJEMEN GUDANG ONLINE",
  "📑 Scan Resi atau No Transaksi dengan Cepat & Akurat",
  "⚡ Fitur Auto-Expand Baris & Konversi TikTok Aktif",
  "⚡ Pemrosesan & Sinkronisasi Transaksi Super Cepat",
  "🔥 Operasional Gudang Siap Berjalan Maksimal!"
];

let fadeIndex = 0, rotatorInterval = null;
function initTextFadeRotator() {
  const textEl = document.getElementById('rotating-text');
  if (!textEl) return;
  if (rotatorInterval) clearInterval(rotatorInterval);
  textEl.innerText = fadeTexts[fadeIndex];
  rotatorInterval = setInterval(() => {
    textEl.style.opacity = 0;
    setTimeout(() => {
      fadeIndex = (fadeIndex + 1) % fadeTexts.length;
      textEl.innerText = fadeTexts[fadeIndex];
      textEl.style.opacity = 1;
    }, 800); 
  }, 5000); 
}

function updateLastSyncDisplay(timeString) {
  const lastSyncEl = document.getElementById('last-sync-text');
  if (lastSyncEl) {
    lastSyncEl.innerText = timeString || "Belum ada";
    lastSyncEl.style.color = timeString ? "#38bdf8" : "#e2e8f0";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedLastSync = localStorage.getItem('gudang_last_sync');
  if (savedLastSync) updateLastSyncDisplay(savedLastSync);
});

function openDeveloperModal() { const modal = document.getElementById('developerModal'); if (modal) modal.style.setProperty('display', 'flex', 'important'); }
function closeDeveloperModal() { const modal = document.getElementById('developerModal'); if (modal) modal.style.setProperty('display', 'none', 'important'); }

function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}

function pilihYaPending() {
  document.getElementById('modalKonfirmasi').style.display = 'none';
  document.getElementById('modalInputPending').style.display = 'flex';
  const inputEl = document.getElementById('inputNoTrx');
  if (inputEl) inputEl.focus();
}

function selesaiDanDownload() {
  document.getElementById('modalInputPending').style.display = 'none';
  showCustomAlert(window.globalServerResponse?.message || "Transaksi selesai dan laporan berhasil diproses!", currentDownloadUrl);
}

async function kirimAksiPendingCancel(actionType) {
  const inputEl = document.getElementById('inputNoTrx');
  const noTransaksi = inputEl ? inputEl.value.trim() : '';
  if (!noTransaksi) {
    showNxCustomAlert("Harap masukkan atau scan Nomor Transaksi terlebih dahulu!", false);
    return;
  }
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: actionType, noTransaksi: noTransaksi })
    });
    const res = await response.json();
    if (res.status === 'success') {
      window.globalServerResponse = res;
      currentDownloadUrl = res.downloadUrl || res.fileUrl || res.spreadsheetUrl || currentDownloadUrl;
      inputEl.value = '';
      inputEl.focus();
      showCustomAlert(res.message || `Transaksi berhasil diproses.`, currentDownloadUrl);
    } else {
      throw new Error(res.message || "Gagal memproses data.");
    }
  } catch (error) {
    showNxCustomAlert("Terjadi kesalahan: " + error.message, false);
  }
}

async function ambilDanPasteRekapan(btn) {
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Loading...'; }
  try {
    const response = await fetch(SCRIPT_URL_REKAPAN);
    const res = await response.json();
    if (res.error) { showNxCustomAlert("Error: " + res.error, false); return; }
    if (!res.transactions || res.transactions.length === 0) {
      showNxCustomAlert("Tidak ada No Transaksi ditemukan!", false);
      return;
    }
    const textarea = document.querySelector('textarea'); 
    if (textarea) {
      textarea.value = res.transactions.join('\n');
      textarea.dispatchEvent(new Event('input'));
    }
  } catch (err) {
    showNxCustomAlert("Gagal mengambil data rekapan: " + err, false);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Sync'; }
  }
}

function refreshAplikasi() { window.location.reload(); }
function bukaModalGas() {
  const modal = document.getElementById('modal-gas-config');
  const input = document.getElementById('input-gas-url');
  if (modal && input) { input.value = getGasUrl(); modal.style.display = 'flex'; }
}
function tutupModalGas() { document.getElementById('modal-gas-config').style.display = 'none'; }
function simpanGasUrl() {
  const input = document.getElementById('input-gas-url');
  if (input && input.value.trim() !== '') {
    localStorage.setItem('GUDANG_GAS_URL', input.value.trim());
    localStorage.setItem('GUDANG_REFRESH_BYPASS', 'true');
    tutupModalGas();
    setTimeout(() => window.location.reload(), 1000);
  }
}
function clearGasInput() { const input = document.getElementById('input-gas-url'); if (input) { input.value = ''; input.focus(); } }

// =========================================================================
// 🔒 CONTROL PANEL LISENSI NX & EGG TRIGGER (SUPER ADMIN)
// =========================================================================
const ADMIN_NX_PIN = "2026";
let secretClickCount = 0, secretClickTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img[src*="favicon"], header img, div img, h2').forEach(el => {
    if (el.closest('.container')) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        secretClickCount++;
        if (secretClickCount === 1) secretClickTimer = setTimeout(() => secretClickCount = 0, 2000);
        if (secretClickCount >= 5) { clearTimeout(secretClickTimer); secretClickCount = 0; bukaModalNxAdmin(); }
      });
    }
  });
});

function bukaModalNxAdmin() {
  const modal = document.getElementById('modal-nx-admin');
  document.getElementById('nx-pin-step').style.display = 'block';
  document.getElementById('nx-panel-step').style.display = 'none';
  document.getElementById('nxPinError').style.display = 'none';
  const inputPin = document.getElementById('inputNxPin');
  inputPin.value = '';
  modal.style.display = 'flex';
  setTimeout(() => inputPin.focus(), 100);
}

function tutupModalNxAdmin() { document.getElementById('modal-nx-admin').style.display = 'none'; }

function verifikasiNxPin() {
  const inputPin = document.getElementById('inputNxPin');
  if (inputPin && inputPin.value.trim() === ADMIN_NX_PIN) {
    document.getElementById('nx-pin-step').style.display = 'none';
    document.getElementById('nx-panel-step').style.display = 'block';
    muatDataPanelNx();
  } else {
    document.getElementById('nxPinError').style.display = 'block';
    inputPin.value = '';
    inputPin.focus();
  }
}

function muatDataPanelNx() {
  const savedExpiry = localStorage.getItem('gudang_token_expiry');
  const badge = document.getElementById('nxStatusBadge');
  const textExpiry = document.getElementById('nxExpiryText');
  const textCountdown = document.getElementById('nxCountdownText');

  if (!savedExpiry) {
    badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> TIDAK TERPASANG';
    badge.style.color = '#f59e0b';
    textExpiry.innerText = 'Bebas / Tanpa Batas';
    textCountdown.innerText = '-';
    return;
  }

  const expiryDate = new Date(savedExpiry);
  const now = new Date();
  if (now > expiryDate) {
    badge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> EXPIRED';
    badge.style.color = '#ef4444';
  } else {
    badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> AKTIF';
    badge.style.color = '#22c55e';
  }
  textExpiry.innerText = expiryDate.toLocaleString('id-ID') + ' WIB';
  const diffTime = expiryDate - now;
  if (diffTime > 0) {
    textCountdown.innerText = `${Math.floor(diffTime / (1000 * 60 * 60 * 24))} Hari Lagi`;
  } else {
    textCountdown.innerText = 'Kedaluwarsa!';
  }
}

function decodeTokenToDate(token) {
  try {
    if (!token || token.length < 15) return null;
    let cleanToken = token.trim();
    if (!cleanToken.includes('NX')) return null;
    let parts = cleanToken.split('NX');
    let hexPart = parts[1].match(/^[0-9a-fA-F]+/);
    if (!hexPart) return null;
    let timestamp = parseInt(hexPart[0], 16);
    return isNaN(timestamp) ? null : new Date(timestamp);
  } catch (e) {
    return null;
  }
}

function showNxCustomAlert(message, isSuccess = true) {
  let alertModal = document.getElementById('nxCustomAlertModal');
  if (!alertModal) {
    alertModal = document.createElement('div');
    alertModal.id = 'nxCustomAlertModal';
    alertModal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(7, 11, 20, 0.85); backdrop-filter: blur(6px); display: flex; justify-content: center; align-items: center; z-index: 2147483647; opacity: 0; transition: opacity 0.3s ease;`;
    alertModal.innerHTML = `<div style="background: rgba(15, 23, 42, 0.95); border: 1px solid #334155; padding: 24px; border-radius: 16px; width: 85%; max-width: 340px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); text-align: center; font-family: monospace;" id="nxAlertBoxContent"><div id="nxAlertIcon" style="font-size: 36px; margin-bottom: 12px;"></div><div id="nxAlertTitle" style="font-size: 15px; font-weight: bold; color: #f8fafc; margin-bottom: 8px;"></div><div id="nxAlertMessage" style="font-size: 12.5px; color: #94a3b8; margin-bottom: 20px; line-height: 1.4;"></div><button id="nxAlertCloseBtn" style="background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-family: monospace; cursor: pointer; width: 100%; font-size: 13px;">OK</button></div>`;
    document.body.appendChild(alertModal);
  }

  const iconEl = document.getElementById('nxAlertIcon');
  const titleEl = document.getElementById('nxAlertTitle');
  const msgEl = document.getElementById('nxAlertMessage');
  const closeBtn = document.getElementById('nxAlertCloseBtn');

  if (isSuccess) {
    iconEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #22c55e;"></i>';
    titleEl.innerText = "BERHASIL";
    closeBtn.style.background = '#22c55e';
  } else {
    iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>';
    titleEl.innerText = "PERHATIAN";
    closeBtn.style.background = '#ef4444';
  }

  msgEl.innerText = message;
  alertModal.style.display = 'flex';
  setTimeout(() => alertModal.style.opacity = '1', 10);

  closeBtn.onclick = () => {
    alertModal.style.opacity = '0';
    setTimeout(() => {
      alertModal.style.display = 'none';
      if (isSuccess && window.shouldReloadAfterAlert) {
        window.location.reload(true);
      }
    }, 300);
  };
}

// --- FUNGSI SIMPAN TOKEN DARI PANEL (MODAL CYBERPUNK) ---
function simpanTokenDariPanel() {
  const inputToken = document.getElementById('inputPanelNxToken');
  if (!inputToken || !inputToken.value.trim()) {
    window.shouldReloadAfterAlert = false;
    showNxCustomAlert("Harap masukkan token lisensi NX yang valid!", false);
    return;
  }

  const decodedDate = decodeTokenToDate(inputToken.value.trim());
  if (decodedDate && decodedDate > new Date()) {
    localStorage.setItem('gudang_token_expiry', decodedDate.toISOString());
    localStorage.removeItem('gudang_status_terkunci');
    window.shouldReloadAfterAlert = true;
    tutupModalNxAdmin();
    showNxCustomAlert("Token Lisensi NX Berhasil Diperbarui!", true);
  } else {
    window.shouldReloadAfterAlert = false;
    showNxCustomAlert("Token tidak valid atau sudah kedaluwarsa!", false);
  }
}

// --- FUNGSI SIMULASI KUNCI SISTEM (MODAL CYBERPUNK) ---
function simulasiKunciSistem() {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  
  localStorage.setItem('gudang_token_expiry', pastDate.toISOString());
  localStorage.setItem('gudang_status_terkunci', 'true');
  
  tutupModalNxAdmin();
  window.shouldReloadAfterAlert = true;
  showNxCustomAlert("Simulasi Kunci Sistem Berhasil Diterapkan! Halaman akan terkunci.", true);
}