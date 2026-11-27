const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwMxaPzNaYATNn-zMyx36NvjYQ1iwjwKYbmpezRMxE_OYWUd-JveOUbFGVMApS1ZZDdvw/exec";
const FIREBASE_RTDB_URL = "https://gudang-nuhsantara-auth-default-rtdb.asia-southeast1.firebasedatabase.app";
const CURRENT_APP_VERSION = "v1.2.3";
const PO_THEME_STORAGE_KEY = "gudang_po_theme";

// ==========================================
// 🔐 FIREBASE AUTH CONFIG (REGISTER & LOGIN MANDIRI)
// Isi apiKey dari Firebase Console -> Project Settings -> General -> Your apps
// ==========================================
const FIREBASE_AUTH_CONFIG = {
    apiKey: "AIzaSyCOT-wtQZozXJXbwiwEVCAHAbsfAleuZzI",
    authDomain: "gudang-nuhsantara-auth.firebaseapp.com",
    databaseURL: FIREBASE_RTDB_URL
};

let masterBarang = [];
let html5QrCode = null;
let isScannerActive = false;
let stitchAudioCtx = null;
let currentEditRowIndex = null;
let currentAuthMode = "login";
let googleGsiInitialized = false;
let googleTokenClient = null;

// ==========================================
// 🐾 THEME SWITCHER & KARAKTER (DARK -> STITCH -> CAT)
// ==========================================
function getActivePoTheme() {
    const t = String(document.documentElement.getAttribute('data-theme') || 'dark').toLowerCase();
    if (t === 'cat' || t === 'kucing') return 'cat';
    if (t === 'stitch') return 'stitch';
    return 'dark';
}

function isStitchThemeActive() {
    return getActivePoTheme() === 'stitch';
}

function isCatThemeActive() {
    return getActivePoTheme() === 'cat';
}

function isLightMascotThemeActive() {
    const t = getActivePoTheme();
    return t === 'stitch' || t === 'cat';
}

window.playStitchSound = function(mode = "tap") {
    if (!isLightMascotThemeActive()) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!stitchAudioCtx) stitchAudioCtx = new AudioCtx();
        if (stitchAudioCtx.state === 'suspended') stitchAudioCtx.resume();

        const now = stitchAudioCtx.currentTime;
        const notes = mode === "success"
            ? [523.25, 659.25, 783.99, 1046.5]
            : mode === "warn"
                ? [440, 349.23]
                : [587.33, 880];

        notes.forEach((freq, idx) => {
            const osc = stitchAudioCtx.createOscillator();
            const gain = stitchAudioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.065);
            gain.gain.setValueAtTime(0.001, now + idx * 0.065);
            gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.065 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.14);
            osc.connect(gain);
            gain.connect(stitchAudioCtx.destination);
            osc.start(now + idx * 0.065);
            osc.stop(now + idx * 0.065 + 0.15);
        });
    } catch (e) {}
};

window.updateStitchSpeech = function(customText = null) {
    const bubble = document.getElementById('poStitchBubble');
    if (!bubble) return;

    if (customText) {
        bubble.textContent = customText;
        return;
    }

    const daftarPesan = isCatThemeActive()
        ? [
            "Meow! Mochi siap bantu input PO hari ini! 🐾✨",
            "Jangan lupa cek kode & jumlah barang biar presisi ya! 🐱",
            "Purr~ data PO aman terkendali bareng Mochi! 🧡",
            "Klik aku kalau butuh semangat tambahan bro! ✨"
        ]
        : [
            "Aloha! Ohana siap bantu input PO hari ini! 🌺",
            "Jangan lupa cek kode & jumlah barang biar presisi ya! 🐾",
            "Semangat kerja! Data PO aman terkendali bareng Stitch ✨",
            "Klik aku kalau butuh semangat tambahan bro! 💙"
        ];
    bubble.textContent = daftarPesan[Math.floor(Math.random() * daftarPesan.length)];
};

function normalizeThemeValue(themeName) {
    const val = String(themeName || 'dark').toLowerCase();
    if (val === 'cat' || val === 'kucing') return 'cat';
    if (val === 'stitch') return 'stitch';
    return 'dark';
}

function applyPoTheme(themeName, playSound = false) {
    const resolved = normalizeThemeValue(themeName);

    if (typeof window.terapkanTemaGlobalPo === 'function') {
        window.terapkanTemaGlobalPo(resolved);
    } else {
        const isStitch = resolved === 'stitch';
        const isCat = resolved === 'cat';

        document.documentElement.classList.remove('theme-stitch', 'theme-cat');
        if (isStitch || isCat) {
            document.documentElement.setAttribute('data-theme', resolved);
            document.documentElement.classList.add(isCat ? 'theme-cat' : 'theme-stitch');
        } else {
            document.documentElement.removeAttribute('data-theme');
            const roamBubble = document.getElementById('poStitchRoamBubble');
            if (roamBubble) roamBubble.classList.remove('show');
        }

        if (document.body) {
            document.body.classList.remove('theme-stitch', 'theme-cat');
            if (isStitch || isCat) {
                document.body.setAttribute('data-theme', resolved);
                document.body.classList.add(isCat ? 'theme-cat' : 'theme-stitch');
            } else {
                document.body.removeAttribute('data-theme');
            }
        }

        try {
            localStorage.setItem(PO_THEME_STORAGE_KEY, resolved);
        } catch (e) {}

        const switchBtn = document.getElementById('btnSwitchPoTheme');
        if (switchBtn) {
            if (resolved === 'stitch') {
                switchBtn.innerHTML = `🐱 Kucing`;
                switchBtn.setAttribute("aria-pressed", "true");
            } else if (resolved === 'cat') {
                switchBtn.innerHTML = `<i class="fa-solid fa-moon"></i> Gelap`;
                switchBtn.setAttribute("aria-pressed", "true");
            } else {
                switchBtn.innerHTML = `🐾 Stitch`;
                switchBtn.setAttribute("aria-pressed", "false");
            }
        }
    }

    const savedUser = localStorage.getItem('po_user');
    if (savedUser) setDynamicGreeting(savedUser);

    if (resolved !== 'dark') {
        window.updateStitchSpeech();
        if (playSound) window.playStitchSound("tap");
    }
}

window.toggleTemaStitchGlobal = function() {
    const saatIni = getActivePoTheme();
    let berikutnya = 'stitch';
    if (saatIni === 'dark') berikutnya = 'stitch';
    else if (saatIni === 'stitch') berikutnya = 'cat';
    else berikutnya = 'dark';

    applyPoTheme(berikutnya, true);
};

function initPoThemeSystem() {
    let savedTheme = 'dark';
    try {
        savedTheme = normalizeThemeValue(localStorage.getItem(PO_THEME_STORAGE_KEY) || 'dark');
    } catch (e) {}
    applyPoTheme(savedTheme, false);

    const stitchAvatar = document.getElementById('poStitchAvatar');
    if (stitchAvatar && !stitchAvatar.dataset.boundAvatar) {
        stitchAvatar.dataset.boundAvatar = "1";
        stitchAvatar.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!isLightMascotThemeActive()) return;
            window.playStitchSound("tap");
            window.updateStitchSpeech();
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initPoThemeSystem();
});

// ==========================================
// 🚀 AUTO-UPDATE & FORCE REFRESH SYSTEM
// ==========================================
async function cekPembaruanAplikasi() {
    try {
        const response = await fetch('./version.json?v=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        const versiTersimpan = localStorage.getItem('gudang_skip_version');

        if (data.version && data.version !== CURRENT_APP_VERSION && versiTersimpan !== data.version) {
            tampilkanModalPaksaUpdate(data.version);
        }
    } catch (err) {
        console.log("Auto-update check skipped:", err);
    }
}

function tampilkanModalPaksaUpdate(targetVersion) {
    let modal = document.getElementById('forceUpdateModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'forceUpdateModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.98); display: flex; justify-content: center;
            align-items: center; z-index: 9999999; padding: 20px; box-sizing: border-box;
            backdrop-filter: blur(8px);
        `;
        modal.innerHTML = `
            <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(56, 189, 248, 0.3); padding: 30px 25px; border-radius: 20px; max-width: 380px; width: 100%; text-align: center; color: #fff; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
                <div style="width: 60px; height: 60px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 26px; color: #38bdf8;">
                    <i class="fa-solid fa-arrows-rotate"></i>
                </div>
                <h3 style="margin-bottom: 12px; font-size: 20px; font-weight: 700; color: #f8fafc;">Pembaruan Sistem Tersedia</h3>
                <p style="font-size: 13px; color: #94a3b8; margin-bottom: 25px; line-height: 1.5;">
                    Versi baru Gudang Nuhsantara dengan fitur notifikasi rekap otomatis telah dirilis. Silakan perbarui sekarang untuk melanjutkan.
                </p>
                <button id="btnExecuteUpdate" style="
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: none; padding: 14px 20px;
                    border-radius: 12px; font-weight: 600; font-size: 15px; width: 100%; cursor: pointer;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                ">
                    Perbarui Sekarang
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }

    document.getElementById('btnExecuteUpdate').onclick = async () => {
        const btn = document.getElementById('btnExecuteUpdate');
        btn.innerText = "Memperbarui...";
        btn.disabled = true;

        try {
            localStorage.setItem('gudang_skip_version', targetVersion);
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (let reg of regs) await reg.unregister();
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                for (let key of keys) await caches.delete(key);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {}

        modal.style.display = 'none';
        window.location.reload(true);
    };
}

// ==========================================
// 🎨 CUSTOM MODERN MODAL HELPER
// ==========================================
function showCustomModal({ title = "Informasi", message = "", type = "info", showCancel = false, confirmText = "OK", cancelText = "Batal" }) {
    return new Promise((resolve) => {
        const modalBox = document.getElementById('customModalBox');
        const wrapper = document.getElementById('modalContentWrapper');
        const titleEl = document.getElementById('modalTitle');
        const msgEl = document.getElementById('modalMessage');
        const iconEl = document.getElementById('modalIcon');
        const iconContainer = document.getElementById('modalIconContainer');
        const btnConfirm = document.getElementById('modalBtnConfirm');
        const btnCancel = document.getElementById('modalBtnCancel');

        if (!modalBox || !wrapper) { resolve(true); return; }

        if (isCatThemeActive()) {
            wrapper.style.background = "linear-gradient(145deg, #fffdf9, #ffedd5)";
            wrapper.style.borderColor = "#fdba74";
            if (titleEl) titleEl.style.color = "#c2410c";
            if (msgEl) msgEl.style.color = "#431407";
        } else if (isStitchThemeActive()) {
            wrapper.style.background = "linear-gradient(145deg, #ffffff, #e0f2fe)";
            wrapper.style.borderColor = "#7dd3fc";
            if (titleEl) titleEl.style.color = "#0369a1";
            if (msgEl) msgEl.style.color = "#334155";
        } else {
            wrapper.style.background = "linear-gradient(145deg, #1e293b, #0f172a)";
            wrapper.style.borderColor = "rgba(56, 189, 248, 0.3)";
            if (titleEl) titleEl.style.color = "#f8fafc";
            if (msgEl) msgEl.style.color = "#94a3b8";
        }

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;
        if (btnConfirm) btnConfirm.textContent = confirmText;
        if (btnCancel) btnCancel.textContent = cancelText;

        if (iconEl && iconContainer && btnConfirm) {
            if (type === 'success') {
                iconEl.className = "fa-solid fa-check";
                iconContainer.style.background = "rgba(16, 185, 129, 0.15)";
                iconContainer.style.borderColor = "rgba(16, 185, 129, 0.4)";
                iconContainer.style.color = "#10b981";
                btnConfirm.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                btnConfirm.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
            } else if (type === 'error') {
                iconEl.className = "fa-solid fa-triangle-exclamation";
                iconContainer.style.background = "rgba(239, 68, 68, 0.15)";
                iconContainer.style.borderColor = "rgba(239, 68, 68, 0.4)";
                iconContainer.style.color = "#ef4444";
                btnConfirm.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
                btnConfirm.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
            } else if (type === 'warning') {
                iconEl.className = "fa-solid fa-circle-question";
                iconContainer.style.background = "rgba(245, 158, 11, 0.15)";
                iconContainer.style.borderColor = "rgba(245, 158, 11, 0.4)";
                iconContainer.style.color = "#f59e0b";
                btnConfirm.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
                btnConfirm.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.4)";
            } else {
                iconEl.className = "fa-solid fa-circle-info";
                iconContainer.style.background = "rgba(56, 189, 248, 0.15)";
                iconContainer.style.borderColor = "rgba(56, 189, 248, 0.4)";
                iconContainer.style.color = "#38bdf8";
                btnConfirm.style.background = "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
                btnConfirm.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
            }
        }

        if (btnCancel) btnCancel.style.display = showCancel ? "block" : "none";

        modalBox.style.display = "flex";
        setTimeout(() => {
            wrapper.style.transform = "scale(1)";
            wrapper.style.opacity = "1";
        }, 10);

        const cleanup = (result) => {
            wrapper.style.transform = "scale(0.9)";
            wrapper.style.opacity = "0";
            setTimeout(() => {
                modalBox.style.display = "none";
                if (btnConfirm) btnConfirm.onclick = null;
                if (btnCancel) btnCancel.onclick = null;
                resolve(result);
            }, 200);
        };

        if (btnConfirm) btnConfirm.onclick = () => cleanup(true);
        if (btnCancel) btnCancel.onclick = () => cleanup(false);
    });
}

function formatDateLocal(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLocalDateString() {
    return formatDateLocal(new Date());
}

function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeJsAttr(text) {
    return String(text ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;');
}

function injectModernStyles() {
    if (document.getElementById('modernCustomStyles')) return;
    const style = document.createElement('style');
    style.id = 'modernCustomStyles';
    style.innerHTML = `
        #btnLogin, #btnRegister, #btnSubmit {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
            color: #ffffff !important;
            border: none !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            letter-spacing: 0.5px !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
        }
        #btnLogin:hover:not(:disabled), #btnRegister:hover:not(:disabled), #btnSubmit:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
        }
        #btnLogin:active:not(:disabled), #btnRegister:active:not(:disabled), #btnSubmit:active:not(:disabled) {
            transform: translateY(0) !important;
        }
        .modern-spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: spinBtn 0.8s linear infinite;
            vertical-align: middle;
            margin-right: 8px;
        }
        @keyframes spinBtn {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

function updateRealTimeClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    document.querySelectorAll('.real-time-clock').forEach(el => { el.textContent = timeString; });
}
setInterval(updateRealTimeClock, 1000);

function setDynamicGreeting(username) {
    const greetingEl = document.getElementById('userGreeting');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let waktu = "Malam";
    let daftarMotivasi = [];

    if (hour >= 4 && hour < 11) {
        waktu = "Pagi";
        daftarMotivasi = [
            "Awali hari dengan semangat baru dan catat inventaris dengan teliti!",
            "Pagi yang cerah, semoga stok barang hari ini aman terkendali!",
            "Semangat pagi! Jangan lupa senyum dan pastikan data PO akurat."
        ];
    } else if (hour >= 11 && hour < 15) {
        waktu = "Siang";
        daftarMotivasi = [
            "Tetap fokus dan jaga produktivitas kerja di siang hari ini!",
            "Udah jam siang, tetap semangat selesaikan tugas gudangnya ya!",
            "Meskipun gerah di siang hari, pastikan input data tetap presisi!"
        ];
    } else if (hour >= 15 && hour < 18) {
        waktu = "Sore";
        daftarMotivasi = [
            "Sebentar lagi jam pulang, selesaikan rekap PO dengan cermat ya!",
            "Sore-sore gini tetap gaspol, rapikan sisa laporan gudang!",
            "Hampir jam pulang, cek sekali lagi data barang masuknya biar pas."
        ];
    } else {
        waktu = "Malam";
        daftarMotivasi = [
            "Kerja hebat! Pastikan semua data PO tercatat dengan akurat.",
            "Lembur malam tetap produktif, jaga kesehatan ya bro!",
            "Malam tenang, waktunya beresin tugas terakhir dengan teliti."
        ];
    }

    const motivasiAcak = daftarMotivasi[Math.floor(Math.random() * daftarMotivasi.length)];
    const aktifTema = getActivePoTheme();
    const subColor = aktifTema === 'stitch'
        ? '#0369a1'
        : aktifTema === 'cat'
            ? '#9a3412'
            : '#94a3b8';
    greetingEl.innerHTML = `Selamat ${waktu}, <b>${escapeHtml(username)}</b>! <br><span style="font-size: 11px; color: ${subColor};">${escapeHtml(motivasiAcak)}</span>`;
}

window.onload = function() {
    updateRealTimeClock();
    injectModernStyles();
    initPoThemeSystem();
    cekPembaruanAplikasi();
    switchAuthMode("login");
    initGoogleIdentityProvider();

    const today = getLocalDateString();
    const poTanggal = document.getElementById('poTanggal');
    if (poTanggal) poTanggal.value = today;

    const savedUser = localStorage.getItem('po_user');
    const loginDate = localStorage.getItem('po_login_date');

    setTimeout(() => {
        const splash = document.getElementById('appSplashScreen');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 400);
        }

        if (savedUser && loginDate === today) {
            tampilkanFormPO(savedUser);
        } else {
            localStorage.removeItem('po_user');
            localStorage.removeItem('po_login_date');
            tampilkanLogin();
        }
    }, 800);

    initRobotAnimation();
    initEventListeners();
    checkFormValidity();
};

function tampilkanLogin() {
    const loginSec = document.getElementById('loginSection');
    const poSec = document.getElementById('poSection');
    if (loginSec) loginSec.classList.remove('hidden');
    if (poSec) poSec.classList.add('hidden');
    switchAuthMode("login");
    initGoogleIdentityProvider();

    let savedTheme = 'dark';
    try {
        savedTheme = normalizeThemeValue(localStorage.getItem(PO_THEME_STORAGE_KEY) || 'dark');
    } catch (e) {}
    applyPoTheme(savedTheme, false);
}

function tampilkanFormPO(username) {
    const loginSec = document.getElementById('loginSection');
    const poSec = document.getElementById('poSection');
    if (loginSec) loginSec.classList.add('hidden');
    if (poSec) poSec.classList.remove('hidden');

    let savedTheme = 'dark';
    try {
        savedTheme = normalizeThemeValue(localStorage.getItem(PO_THEME_STORAGE_KEY) || 'dark');
    } catch (e) {}
    applyPoTheme(savedTheme, false);

    setDynamicGreeting(username);
    loadMasterBarang();
    cekRekapOtomatis();
    setTimeout(checkAndForceNotification, 1500);
}

// ==========================================
// 🔐 FIREBASE AUTH (REGISTER, LOGIN & GOOGLE)
// ==========================================
function switchAuthMode(mode) {
    currentAuthMode = mode === "register" ? "register" : "login";
    const isReg = currentAuthMode === "register";

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLogin = document.getElementById("tabBtnLogin");
    const tabRegister = document.getElementById("tabBtnRegister");
    const headingTitle = document.getElementById("authHeadingTitle");
    const subtitle = document.getElementById("authSubtitle");
    const loginErr = document.getElementById("loginError");
    const regErr = document.getElementById("registerError");

    if (loginForm) {
        loginForm.classList.toggle("hidden", isReg);
        loginForm.style.display = isReg ? "none" : "block";
    }
    if (registerForm) {
        registerForm.classList.toggle("hidden", !isReg);
        registerForm.style.display = isReg ? "block" : "none";
    }

    if (tabLogin) {
        tabLogin.style.background = !isReg ? "#3b82f6" : "transparent";
        tabLogin.style.color = !isReg ? "#ffffff" : "#94a3b8";
    }
    if (tabRegister) {
        tabRegister.style.background = isReg ? "#3b82f6" : "transparent";
        tabRegister.style.color = isReg ? "#ffffff" : "#94a3b8";
    }

    if (headingTitle) headingTitle.textContent = isReg ? "Daftar Akun Gudang" : "Login Gudang";
    if (subtitle) {
        subtitle.textContent = isReg
            ? "Buat akun baru dengan nama, username, email, dan password"
            : "Silakan masuk menggunakan username/email dan password";
    }
    if (loginErr) loginErr.textContent = "";
    if (regErr) regErr.textContent = "";
}

function normalizeUsernameKey(rawUser) {
    return String(rawUser || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function mapFirebaseAuthError(code) {
    switch (code) {
        case "EMAIL_EXISTS":
            return "Email ini sudah terdaftar. Silakan login atau pakai email lain.";
        case "INVALID_EMAIL":
            return "Format email tidak valid.";
        case "WEAK_PASSWORD : Password should be at least 6 characters":
        case "WEAK_PASSWORD":
            return "Password minimal 6 karakter.";
        case "EMAIL_NOT_FOUND":
        case "INVALID_LOGIN_CREDENTIALS":
            return "Username/email atau password salah!";
        case "USER_DISABLED":
            return "Akun ini telah dinonaktifkan.";
        case "TOO_MANY_ATTEMPTS_TRY_LATER":
            return "Terlalu banyak percobaan gagal. Coba lagi beberapa saat.";
        default:
            return "Terjadi kendala autentikasi. Periksa kembali data Anda.";
    }
}

async function signUpWithFirebaseEmailPassword(email, password) {
    if (!FIREBASE_AUTH_CONFIG.apiKey || FIREBASE_AUTH_CONFIG.apiKey.startsWith("ISI_")) {
        throw new Error("API Key Firebase Auth belum diisi di FIREBASE_AUTH_CONFIG.");
    }
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(FIREBASE_AUTH_CONFIG.apiKey)}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email,
            password: password,
            returnSecureToken: true
        })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
        const errCode = data?.error?.message || "AUTH_ERROR";
        throw new Error(mapFirebaseAuthError(errCode));
    }
    return data;
}

async function signInWithFirebaseEmailPassword(email, password) {
    if (!FIREBASE_AUTH_CONFIG.apiKey || FIREBASE_AUTH_CONFIG.apiKey.startsWith("ISI_")) {
        throw new Error("API Key Firebase Auth belum diisi di FIREBASE_AUTH_CONFIG.");
    }
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(FIREBASE_AUTH_CONFIG.apiKey)}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email,
            password: password,
            returnSecureToken: true
        })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
        const errCode = data?.error?.message || "INVALID_LOGIN_CREDENTIALS";
        throw new Error(mapFirebaseAuthError(errCode));
    }
    return data;
}

async function signInWithFirebaseGoogleCredential({ idToken = null, accessToken = null }) {
    if (!FIREBASE_AUTH_CONFIG.apiKey || FIREBASE_AUTH_CONFIG.apiKey.startsWith("ISI_")) {
        throw new Error("API Key Firebase Auth belum diisi di FIREBASE_AUTH_CONFIG.");
    }
    const postBody = `id_token=${encodeURIComponent(idToken || "")}&access_token=${encodeURIComponent(accessToken || "")}&providerId=google.com`;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${encodeURIComponent(FIREBASE_AUTH_CONFIG.apiKey)}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            postBody: postBody,
            requestUri: window.location.href,
            returnIdpCredential: true,
            returnSecureToken: true
        })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
        const rawErr = data?.error?.message || "GOOGLE_AUTH_FAILED";
        if (rawErr.includes("CONFIGURATION_NOT_FOUND") || rawErr.includes("OPERATION_NOT_ALLOWED")) {
            throw new Error("Provider Google belum diaktifkan di Firebase Console -> Authentication -> Sign-in method.");
        }
        throw new Error("Gagal menghubungkan akun Google ke Firebase Auth (" + rawErr + ").");
    }
    return data;
}

async function resolveIdentifierToEmail(identifier) {
    const trimmed = String(identifier || "").trim();
    if (trimmed.includes("@")) {
        return { email: trimmed.toLowerCase(), username: trimmed.split("@")[0] };
    }

    const unameKey = normalizeUsernameKey(trimmed);
    if (!unameKey) {
        throw new Error("Username atau email tidak valid.");
    }

    const res = await fetch(`${FIREBASE_RTDB_URL}/gudang_nuhsantara/usernames/${encodeURIComponent(unameKey)}.json`);
    const record = await res.json();
    if (!record || !record.email) {
        throw new Error("Username tidak ditemukan atau belum terdaftar.");
    }
    return {
        email: String(record.email).trim().toLowerCase(),
        username: record.username || trimmed
    };
}

async function handleRegister() {
    const namaInput = document.getElementById("regNama");
    const userInput = document.getElementById("regUsername");
    const emailInput = document.getElementById("regEmail");
    const passInput = document.getElementById("regPassword");
    const errDiv = document.getElementById("registerError");
    const btnReg = document.getElementById("btnRegister");

    const nama = namaInput ? namaInput.value.trim() : "";
    const usernameRaw = userInput ? userInput.value.trim() : "";
    const usernameKey = normalizeUsernameKey(usernameRaw);
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const pass = passInput ? passInput.value : "";

    if (!nama || !usernameRaw || !email || !pass) {
        if (errDiv) {
            errDiv.style.color = "#ef4444";
            errDiv.textContent = "Nama, username, email, dan password wajib diisi!";
        }
        return;
    }

    if (!usernameKey || usernameKey.length < 3) {
        if (errDiv) {
            errDiv.style.color = "#ef4444";
            errDiv.textContent = "Username minimal 3 karakter huruf/angka.";
        }
        return;
    }

    if (pass.length < 6) {
        if (errDiv) {
            errDiv.style.color = "#ef4444";
            errDiv.textContent = "Password minimal 6 karakter.";
        }
        return;
    }

    if (errDiv) errDiv.textContent = "";
    if (btnReg) {
        btnReg.disabled = true;
        btnReg.style.opacity = "0.7";
        btnReg.innerHTML = `<span class="modern-spinner"></span>Mendaftarkan...`;
    }

    try {
        if (errDiv) {
            errDiv.style.color = "#38bdf8";
            errDiv.textContent = "Memeriksa ketersediaan username...";
        }

        const checkRes = await fetch(`${FIREBASE_RTDB_URL}/gudang_nuhsantara/usernames/${encodeURIComponent(usernameKey)}.json`);
        const existingUser = await checkRes.json();
        if (existingUser && existingUser.email) {
            throw new Error("Username sudah digunakan. Silakan pilih username lain.");
        }

        if (errDiv) {
            errDiv.style.color = "#38bdf8";
            errDiv.textContent = "Membuat akun di Firebase Auth...";
        }

        const authData = await signUpWithFirebaseEmailPassword(email, pass);
        const uid = authData.localId;

        await Promise.all([
            fetch(`${FIREBASE_RTDB_URL}/gudang_nuhsantara/usernames/${encodeURIComponent(usernameKey)}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: uid,
                    email: email,
                    username: usernameRaw,
                    nama: nama,
                    createdAt: Date.now()
                })
            }),
            fetch(`${FIREBASE_RTDB_URL}/gudang_nuhsantara/users_auth/${encodeURIComponent(uid)}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: uid,
                    nama: nama,
                    username: usernameRaw,
                    email: email,
                    createdAt: Date.now()
                })
            })
        ]);

        if (errDiv) {
            errDiv.style.color = "#10b981";
            errDiv.textContent = "Pendaftaran berhasil! Silakan login dengan akun Anda.";
        }

        const loginUserField = document.getElementById("username");
        const loginPassField = document.getElementById("password");
        if (loginUserField) loginUserField.value = usernameRaw;
        if (loginPassField) loginPassField.value = "";

        if (document.getElementById("registerForm")) {
            document.getElementById("registerForm").reset();
        }

        setTimeout(() => {
            switchAuthMode("login");
            if (loginPassField) loginPassField.focus();
        }, 700);
    } catch (err) {
        if (errDiv) {
            errDiv.style.color = "#ef4444";
            errDiv.textContent = err.message || "Gagal mendaftarkan akun.";
        }
    } finally {
        if (btnReg) {
            btnReg.innerHTML = "Daftar Sekarang";
            btnReg.disabled = false;
            btnReg.style.opacity = "1";
        }
    }
}

async function handleLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errDiv = document.getElementById('loginError');
    const btnLogin = document.getElementById('btnLogin');

    const identifier = usernameInput ? usernameInput.value.trim() : '';
    const pass = passwordInput ? passwordInput.value : '';

    if (!identifier || !pass) {
        if (errDiv) {
            errDiv.style.color = "#ef4444";
            errDiv.innerText = "Username/email dan password wajib diisi!";
        }
        return;
    }

    if (errDiv) errDiv.innerText = "";
    if (btnLogin) {
        btnLogin.disabled = true;
        btnLogin.style.opacity = "0.7";
        btnLogin.innerHTML = `<span class="modern-spinner"></span>Memproses...`;
    }

    try {
        if (errDiv) {
            errDiv.style.color = "#38bdf8";
            errDiv.innerText = "Memverifikasi akun...";
        }

        const resolved = await resolveIdentifierToEmail(identifier);
        const authData = await signInWithFirebaseEmailPassword(resolved.email, pass);
        const uid = authData.localId;

        let displayName = resolved.username || identifier;
        try {
            const profRes = await fetch(`${FIREBASE_RTDB_URL}/gudang_nuhsantara/users_auth/${encodeURIComponent(uid)}.json`);
            const profData = await profRes.json();
            if (profData && (profData.nama || profData.username)) {
                displayName = profData.nama || profData.username;
            }
        } catch (e) {}

        if (errDiv) {
            errDiv.style.color = "#10b981";
            errDiv.innerText = "Akses diterima! Membuka sistem...";
        }
        await new Promise(resolveDelay => setTimeout(resolveDelay, 400));

        const today = getLocalDateString();
        localStorage.setItem('po_user', displayName);
        localStorage.setItem('po_email', resolved.email);
        localStorage.setItem('po_login_date', today);
        if (!localStorage.getItem('gudang_staff_name')) {
            localStorage.setItem('gudang_staff_name', displayName);
        }

        if (errDiv) errDiv.innerText = "";
        tampilkanFormPO(displayName);
    } catch (err) {
        if (errDiv) {
            errDiv.style.color = "#ef4444";
            errDiv.innerText = err.message || "Username/email atau password salah!";
        }
    } finally {
        if (btnLogin) {
            btnLogin.innerHTML = "Login";
            btnLogin.disabled = false;
            btnLogin.style.opacity = "1";
        }
    }
}

function getGoogleClientId() {
    const onloadEl = document.getElementById('g_id_onload');
    const attrClientId = onloadEl ? onloadEl.getAttribute('data-client_id') : '';
    return (attrClientId || "698331638433-4ed4d0okpc28i5na8tvrt18f0ftqs2d1.apps.googleusercontent.com").trim();
}

function initGoogleIdentityProvider() {
    if (typeof google === 'undefined' || !google.accounts) return;

    const clientId = getGoogleClientId();
    if (!clientId) return;

    if (!googleGsiInitialized && google.accounts.id) {
        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleLogin,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        googleGsiInitialized = true;
    }

    if (!googleTokenClient && google.accounts.oauth2 && google.accounts.oauth2.initTokenClient) {
        googleTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
                if (!tokenResponse || tokenResponse.error || !tokenResponse.access_token) {
                    setGoogleButtonLoading(false);
                    if (tokenResponse && tokenResponse.error && tokenResponse.error !== 'popup_closed_by_user') {
                        const errDiv = document.getElementById('loginError');
                        if (errDiv) {
                            errDiv.style.color = "#ef4444";
                            errDiv.innerText = "Login Google dibatalkan atau gagal: " + tokenResponse.error;
                        }
                    }
                    return;
                }

                try {
                    let googleProfile = { name: "Pengguna Google", email: "" };
                    try {
                        const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                        });
                        if (infoRes.ok) {
                            const infoJson = await infoRes.json();
                            googleProfile = {
                                name: infoJson.name || infoJson.email || "Pengguna Google",
                                email: infoJson.email || ""
                            };
                        }
                    } catch (e) {}

                    await completeGoogleFirebaseLogin({
                        accessToken: tokenResponse.access_token,
                        fallbackName: googleProfile.name,
                        fallbackEmail: googleProfile.email
                    });
                } catch (err) {
                    setGoogleButtonLoading(false);
                    const errDiv = document.getElementById('loginError');
                    if (errDiv) {
                        errDiv.style.color = "#ef4444";
                        errDiv.innerText = err.message || "Gagal login dengan Google.";
                    }
                }
            }
        });
    }
}

function setGoogleButtonLoading(loading) {
    const btnGoogle = document.getElementById('btnGoogleLogin');
    if (!btnGoogle) return;
    btnGoogle.disabled = !!loading;
    btnGoogle.style.opacity = loading ? "0.7" : "1";
    btnGoogle.innerHTML = loading
        ? `<span class="modern-spinner"></span><span>Menghubungkan Google...</span>`
        : `<i class="fab fa-google" style="font-size: 16px;"></i><span>Lanjutkan dengan Google</span>`;
}

async function completeGoogleFirebaseLogin({ idToken = null, accessToken = null, fallbackName = "", fallbackEmail = "" }) {
    const errDiv = document.getElementById('loginError');
    if (errDiv) {
        errDiv.style.color = "#38bdf8";
        errDiv.innerText = "Menyinkronkan akun Google dengan Firebase Auth...";
    }

    const firebaseAuthData = await signInWithFirebaseGoogleCredential({ idToken, accessToken });
    const uid = firebaseAuthData.localId;
    const operatorName = (firebaseAuthData.displayName || fallbackName || firebaseAuthData.email || "Staf Gudang").trim();
    const operatorEmail = (firebaseAuthData.email || fallbackEmail || "").trim().toLowerCase();

    try {
        await fetch(`${FIREBASE_RTDB_URL}/gudang_nuhsantara/users_auth/${encodeURIComponent(uid)}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uid: uid,
                nama: operatorName,
                email: operatorEmail,
                provider: "google.com",
                lastLoginAt: Date.now()
            })
        });
    } catch (e) {}

    if (errDiv) {
        errDiv.style.color = "#10b981";
        errDiv.innerText = `Selamat datang, ${operatorName}! Membuka sistem...`;
    }

    await new Promise(resolveDelay => setTimeout(resolveDelay, 500));

    const today = getLocalDateString();
    localStorage.setItem('po_user', operatorName);
    localStorage.setItem('po_email', operatorEmail);
    localStorage.setItem('po_login_date', today);
    if (!localStorage.getItem('gudang_staff_name')) {
        localStorage.setItem('gudang_staff_name', operatorName);
    }

    if (errDiv) errDiv.innerText = "";
    setGoogleButtonLoading(false);
    tampilkanFormPO(operatorName);
}

async function handleGoogleLogin(response) {
    setGoogleButtonLoading(true);
    try {
        const responsePayload = parseJwt(response.credential);
        const operatorName = responsePayload.name || responsePayload.email || "Staf Gudang";
        const operatorEmail = responsePayload.email || "";

        await completeGoogleFirebaseLogin({
            idToken: response.credential,
            fallbackName: operatorName,
            fallbackEmail: operatorEmail
        });
    } catch (err) {
        setGoogleButtonLoading(false);
        const errDiv = document.getElementById('loginError');
        if (errDiv) {
            errDiv.style.color = "#ef4444";
            errDiv.innerText = err.message || "Gagal login menggunakan akun Google.";
        }
    }
}

function triggerGoogleLogin() {
    initGoogleIdentityProvider();

    if (typeof google === 'undefined' || !google.accounts) {
        showCustomModal({
            title: "Google Login",
            message: "Layanan Google belum termuat. Pastikan koneksi internet aktif lalu coba lagi.",
            type: "warning"
        });
        return;
    }

    const errDiv = document.getElementById('loginError');
    if (errDiv) errDiv.innerText = "";

    if (googleTokenClient && typeof googleTokenClient.requestAccessToken === 'function') {
        setGoogleButtonLoading(true);
        googleTokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
    }

    if (google.accounts.id && typeof google.accounts.id.prompt === 'function') {
        google.accounts.id.prompt();
    } else {
        showCustomModal({
            title: "Google Login",
            message: "Layanan Google sedang diinisialisasi, silakan coba klik sekali lagi.",
            type: "info"
        });
    }
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

async function loadMasterBarang() {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getBarang' })
        });
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
            masterBarang = result.data;
        }
    } catch (error) {
        console.error("Gagal mengambil data dari Google Sheets:", error);
    }
}

function renderList(data) {
    const container = document.getElementById('itemListPopup');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
                Tidak ada barang ditemukan.<br>
                <button type="button" onclick="muatUlangMasterBarangManual()" style="margin-top: 10px; padding: 6px 14px; background: #3b82f6; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">Muat Ulang Data</button>
            </div>`;
        return;
    }

    container.innerHTML = data.map(item => {
        let kode = '-', nama = '-', pic = '-';
        if (Array.isArray(item)) {
            kode = item[0] || '-';
            nama = item[1] || '-';
            pic = item[2] || '-';
        } else if (typeof item === 'object' && item !== null) {
            kode = item.kode_barang || item.kode || item.code || '-';
            nama = item.nama_barang || item.nama || item.name || '-';
            pic = item.pic || item.penanggung_jawab || '-';
        }
        return `
            <div class="item-pilihan" onclick="pilihBarang('${escapeJsAttr(kode)}', '${escapeJsAttr(nama)}', '${escapeJsAttr(pic)}')">
                <span class="item-kode">${escapeHtml(kode)}</span>
                <span class="item-nama">${escapeHtml(nama)} (${escapeHtml(pic)})</span>
            </div>
        `;
    }).join('');
}

async function muatUlangMasterBarangManual() {
    const container = document.getElementById('itemListPopup');
    if (container) {
        container.innerHTML = `<div style="padding: 20px; text-align: center; color: #38bdf8; font-size: 13px;"><span class="modern-spinner"></span> Memuat data...</div>`;
    }
    await loadMasterBarang();
    renderList(masterBarang);
}

function pilihBarang(kode, nama, pic) {
    const elKode = document.getElementById('poKode');
    const elNama = document.getElementById('poNama');
    const elPic = document.getElementById('poPic');
    const elTrigger = document.getElementById('triggerModal');
    const elPopup = document.getElementById('popupSearch');

    if (elKode) elKode.value = kode;
    if (elNama) elNama.value = nama;
    if (elPic) elPic.value = pic;
    if (elTrigger) elTrigger.textContent = `${kode} - ${nama}`;
    if (elPopup) elPopup.style.display = 'none';

    stopCameraScanner();
    checkFormValidity();

    if (isLightMascotThemeActive()) {
        window.playStitchSound("tap");
        window.updateStitchSpeech(`Sip! Barang "${nama}" terpilih. Tinggal isi jumlahnya ya! 🐾`);
    }

    setTimeout(() => {
        const submitBtn = document.querySelector('#poSection button[type="submit"]');
        if (submitBtn) submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
}

function openRiwayatModal() {
    const modal = document.getElementById('riwayatModal');
    if (modal) modal.style.display = 'flex';
    if (isLightMascotThemeActive()) window.playStitchSound("tap");
    loadRiwayatPOData();
}

function closeRiwayatModal() {
    const modal = document.getElementById('riwayatModal');
    if (modal) modal.style.display = 'none';
}

async function loadRiwayatPOData() {
    const tbody = document.getElementById('modalRiwayatTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="padding: 25px; text-align: center; color: #38bdf8;"><span class="modern-spinner"></span> Memuat seluruh riwayat PO...</td></tr>`;

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getFormPoData' })
        });
        const result = await response.json();

        if (result.status === 'success' && Array.isArray(result.data)) {
            const rows = result.data;
            if (rows.length <= 1) {
                tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #888;">Belum ada data PO di spreadsheet.</td></tr>`;
                return;
            }

            let formattedRows = [];
            for (let i = 1; i < rows.length; i++) {
                formattedRows.push({
                    rowIndex: i + 1,
                    tanggal: rows[i][0] || '',
                    kode: rows[i][1] || '',
                    nama: rows[i][2] || '',
                    pic: rows[i][3] || '-',
                    jumlah: rows[i][4] || '0'
                });
            }

            formattedRows.reverse();

            const borderRow = isStitchThemeActive() ? '#e0f2fe' : isCatThemeActive() ? '#ffedd5' : '#1e293b';
            const hoverBg = isStitchThemeActive() ? '#f0f9ff' : isCatThemeActive() ? '#fff7ed' : 'rgba(255,255,255,0.03)';

            tbody.innerHTML = formattedRows.map(item => {
                let tanggalStr = item.tanggal;
                if (tanggalStr) {
                    try {
                        const d = new Date(tanggalStr);
                        if (!isNaN(d.getTime())) {
                            tanggalStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        }
                    } catch (e) {}
                }

                return `
                    <tr style="border-bottom: 1px solid ${borderRow}; transition: background 0.2s;" onmouseover="this.style.background='${hoverBg}'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 10px; white-space: nowrap; color: #94a3b8;">${escapeHtml(tanggalStr)}</td>
                        <td style="padding: 10px; color: #38bdf8; font-weight: 500;">${escapeHtml(item.kode)}</td>
                        <td style="padding: 10px; color: #f8fafc;">${escapeHtml(item.nama)}</td>
                        <td style="padding: 10px; color: #cbd5e1;">${escapeHtml(item.pic)}</td>
                        <td style="padding: 10px; text-align: right; font-weight: 600; color: #34d399;">${escapeHtml(item.jumlah)}</td>
                        <td class="riwayat-aksi-col">
                            <div class="riwayat-aksi-wrap">
                                <button type="button" class="btn-aksi-icon edit" title="Edit" aria-label="Edit" onclick="persiapkanEdit(${item.rowIndex}, '${escapeJsAttr(item.tanggal)}', '${escapeJsAttr(item.kode)}', '${escapeJsAttr(item.nama)}', '${escapeJsAttr(item.pic)}', '${escapeJsAttr(item.jumlah)}')"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button type="button" class="btn-aksi-icon hapus" title="Hapus" aria-label="Hapus" onclick="hapusDataPO(${item.rowIndex})"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #ef4444;">Gagal memuat data dari spreadsheet.</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #ef4444;">Terjadi kesalahan koneksi internet.</td></tr>`;
    }
}

function persiapkanEdit(rowIndex, tanggal, kode, nama, pic, jumlah) {
    currentEditRowIndex = rowIndex;

    const elTgl = document.getElementById('poTanggal');
    if (elTgl) {
        let parsed = false;
        if (tanggal) {
            const d = new Date(tanggal);
            if (!isNaN(d.getTime())) {
                elTgl.value = formatDateLocal(d);
                parsed = true;
            }
        }
        if (!parsed) elTgl.value = getLocalDateString();
    }

    document.getElementById('poKode').value = kode;
    document.getElementById('poNama').value = nama;
    document.getElementById('poPic').value = pic;
    document.getElementById('poJumlah').value = jumlah;
    document.getElementById('triggerModal').textContent = `${kode} - ${nama}`;

    const btnSubmit = document.getElementById('btnSubmit');
    if (btnSubmit) {
        btnSubmit.innerHTML = "💾 Update Data PO";
        btnSubmit.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    }

    if (isLightMascotThemeActive()) {
        window.playStitchSound("tap");
        window.updateStitchSpeech(`Mode edit aktif untuk "${nama}". Silakan ubah lalu simpan! ✏️`);
    }

    closeRiwayatModal();
    checkFormValidity();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function hapusDataPO(rowIndex) {
    const isConfirmed = await showCustomModal({
        title: "Konfirmasi Hapus",
        message: "Apakah kamu yakin ingin menghapus data PO ini dari Form PO & Database_PO secara permanen?",
        type: "warning",
        showCancel: true,
        confirmText: "Ya, Hapus",
        cancelText: "Batal"
    });

    if (!isConfirmed) return;

    const modalBox = document.getElementById('customModalBox');
    const wrapper = document.getElementById('modalContentWrapper');
    const titleEl = document.getElementById('modalTitle');
    const msgEl = document.getElementById('modalMessage');
    const iconContainer = document.getElementById('modalIconContainer');
    const btnConfirm = document.getElementById('modalBtnConfirm');
    const btnCancel = document.getElementById('modalBtnCancel');

    if (titleEl) titleEl.textContent = "Memproses...";
    if (msgEl) msgEl.textContent = "Sedang menghapus data dari server, mohon tunggu sebentar...";

    if (iconContainer) {
        iconContainer.innerHTML = `<i id="modalIcon" class="fa-solid fa-spinner fa-spin" style="color: #38bdf8;"></i>`;
        iconContainer.style.background = "rgba(56, 189, 248, 0.15)";
        iconContainer.style.borderColor = "rgba(56, 189, 248, 0.4)";
        iconContainer.style.color = "#38bdf8";
    }

    if (btnCancel) btnCancel.style.display = "none";
    if (btnConfirm) btnConfirm.style.display = "none";

    if (modalBox) modalBox.style.display = "flex";
    if (wrapper) {
        wrapper.style.transform = "scale(1)";
        wrapper.style.opacity = "1";
    }

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deletePO', rowIndex: rowIndex })
        });
        const result = await response.json();

        if (result.status === 'success') {
            if (isLightMascotThemeActive()) window.playStitchSound("success");
            if (titleEl) titleEl.textContent = "Berhasil";
            if (msgEl) msgEl.textContent = "Data PO berhasil dihapus!";
            if (iconContainer) {
                iconContainer.innerHTML = `<i id="modalIcon" class="fa-solid fa-check" style="color: #10b981;"></i>`;
                iconContainer.style.background = "rgba(16, 185, 129, 0.15)";
                iconContainer.style.borderColor = "rgba(16, 185, 129, 0.4)";
                iconContainer.style.color = "#10b981";
            }

            await new Promise(resolve => setTimeout(resolve, 1500));

            if (wrapper) {
                wrapper.style.transform = "scale(0.9)";
                wrapper.style.opacity = "0";
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            if (modalBox) modalBox.style.display = "none";

            loadRiwayatPOData();
        } else {
            if (wrapper) { wrapper.style.transform = "scale(0.9)"; wrapper.style.opacity = "0"; }
            await new Promise(resolve => setTimeout(resolve, 200));
            if (modalBox) modalBox.style.display = "none";

            showCustomModal({
                title: "Gagal",
                message: "Gagal menghapus data: " + result.message,
                type: "error",
                showCancel: false,
                confirmText: "Tutup"
            });
        }
    } catch (err) {
        if (wrapper) { wrapper.style.transform = "scale(0.9)"; wrapper.style.opacity = "0"; }
        await new Promise(resolve => setTimeout(resolve, 200));
        if (modalBox) modalBox.style.display = "none";

        showCustomModal({
            title: "Kesalahan",
            message: "Terjadi kesalahan koneksi saat menghapus data.",
            type: "error",
            showCancel: false,
            confirmText: "Tutup"
        });
    } finally {
        if (btnConfirm) btnConfirm.style.display = "block";
    }
}

function initEventListeners() {
    const triggerModal = document.getElementById('triggerModal');
    const popupSearch = document.getElementById('popupSearch');
    const searchInput = document.getElementById('searchInputPopup');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnToggleScanner = document.getElementById('btnToggleScanner');
    const poJumlahInput = document.getElementById('poJumlah');

    if (triggerModal) {
        triggerModal.addEventListener('click', async function() {
            if (popupSearch) popupSearch.style.display = 'flex';
            if (searchInput) searchInput.value = '';
            if (isLightMascotThemeActive()) window.playStitchSound("tap");

            if (!masterBarang || masterBarang.length === 0) {
                renderList([{ kode_barang: '', nama_barang: 'Memuat data dari server...', pic: '' }]);
                await loadMasterBarang();
            }
            renderList(masterBarang);
            if (searchInput) searchInput.focus();
        });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', function() {
            if (popupSearch) popupSearch.style.display = 'none';
            if (searchInput) searchInput.value = '';
            stopCameraScanner();
        });
    }

    if (popupSearch) {
        popupSearch.addEventListener('click', function(e) {
            if (e.target === popupSearch) {
                popupSearch.style.display = 'none';
                stopCameraScanner();
            }
        });
    }

    if (btnToggleScanner) {
        btnToggleScanner.addEventListener('click', function() {
            if (!isScannerActive) startCameraScanner();
            else stopCameraScanner();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const keyword = this.value.toLowerCase().trim();
            const filtered = masterBarang.filter(item => {
                let namaItem = '', kodeItem = '';
                if (Array.isArray(item)) {
                    kodeItem = (item[0] || '').toString();
                    namaItem = (item[1] || '').toString();
                } else if (typeof item === 'object' && item !== null) {
                    kodeItem = (item.kode_barang || item.kode || item.code || '').toString();
                    namaItem = (item.nama_barang || item.nama || item.name || '').toString();
                }
                return namaItem.toLowerCase().includes(keyword) || kodeItem.toLowerCase().includes(keyword);
            });
            renderList(filtered);
        });
    }

    if (poJumlahInput) {
        poJumlahInput.addEventListener('input', function() { checkFormValidity(); });
    }
}

function checkFormValidity() {
    const kode = document.getElementById('poKode') ? document.getElementById('poKode').value.trim() : '';
    const jumlah = document.getElementById('poJumlah') ? document.getElementById('poJumlah').value.trim() : '';
    const btnSubmit = document.getElementById('btnSubmit');

    if (!btnSubmit) return;

    if (kode && kode !== "" && jumlah !== "" && parseInt(jumlah, 10) > 0) {
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = "1";
        btnSubmit.style.cursor = "pointer";
    } else {
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = "0.4";
        btnSubmit.style.cursor = "not-allowed";
    }
}

async function startCameraScanner() {
    const readerDiv = document.getElementById('reader');
    const btnToggleScanner = document.getElementById('btnToggleScanner');
    const titleScanner = document.getElementById('scannerTextTitle');
    if (!readerDiv) return;

    readerDiv.style.display = 'block';
    if (titleScanner) titleScanner.textContent = "🔴 Tutup Scanner";
    if (btnToggleScanner) btnToggleScanner.style.borderColor = '#f59e0b';
    isScannerActive = true;

    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

    try {
        if (html5QrCode.isScanning) await html5QrCode.stop();
        await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            onScanFailure
        );
    } catch (err) {
        showCustomModal({
            title: "Akses Kamera",
            message: "Tidak dapat mengakses kamera: " + (err.message || err),
            type: "error"
        });
        readerDiv.style.display = 'none';
        if (titleScanner) titleScanner.textContent = "Scan QR";
        if (btnToggleScanner) btnToggleScanner.style.borderColor = '#10b981';
        isScannerActive = false;
    }
}

async function stopCameraScanner() {
    const readerDiv = document.getElementById('reader');
    const btnToggleScanner = document.getElementById('btnToggleScanner');
    const titleScanner = document.getElementById('scannerTextTitle');

    if (html5QrCode) {
        try { if (html5QrCode.isScanning) await html5QrCode.stop(); } catch (err) {}
    }

    if (readerDiv) readerDiv.style.display = 'none';
    if (titleScanner) titleScanner.textContent = "Scan QR";
    if (btnToggleScanner) btnToggleScanner.style.borderColor = '#10b981';
    isScannerActive = false;
}

async function onScanSuccess(decodedText) {
    const found = masterBarang.find(item => {
        let kode = '', nama = '';
        if (Array.isArray(item)) {
            kode = (item[0] || '').toString().trim().toLowerCase();
            nama = (item[1] || '').toString().trim().toLowerCase();
        } else if (typeof item === 'object' && item !== null) {
            kode = (item.kode_barang || item.kode || item.code || '').toString().trim().toLowerCase();
            nama = (item.nama_barang || item.nama || item.name || '').toString().trim().toLowerCase();
        }
        const scan = decodedText.trim().toLowerCase();
        return kode === scan || nama.includes(scan);
    });

    if (found) {
        const kode = Array.isArray(found) ? found[0] : (found.kode_barang || found.kode || found.code || '');
        const nama = Array.isArray(found) ? found[1] : (found.nama_barang || found.nama || found.name || '');
        const pic = Array.isArray(found) ? found[2] : (found.pic || found.penanggung_jawab || '');

        pilihBarang(kode, nama, pic);
        await showCustomModal({
            title: "Scan Berhasil",
            message: `Berhasil memilih barang: ${nama}`,
            type: "success"
        });
    } else {
        const elKode = document.getElementById('poKode');
        const elTrigger = document.getElementById('triggerModal');
        if (elKode) elKode.value = decodedText;
        if (elTrigger) elTrigger.textContent = decodedText;
        stopCameraScanner();
        checkFormValidity();
        if (isLightMascotThemeActive()) window.playStitchSound("tap");
        await showCustomModal({
            title: "Kode Ditemukan",
            message: `Kode terdeteksi: ${decodedText} (Dimasukkan manual)`,
            type: "info"
        });

        setTimeout(() => {
            const submitBtn = document.querySelector('#poSection button[type="submit"]');
            if (submitBtn) submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
    }
}

function onScanFailure(error) {}

async function submitPO(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const msg = document.getElementById('poMessage');

    const isEditMode = (currentEditRowIndex !== null);
    const actionType = isEditMode ? 'updatePO' : 'submitPO';

    if (btn) {
        btn.disabled = true;
        btn.style.opacity = "0.7";
        btn.innerHTML = `<span class="modern-spinner"></span>${isEditMode ? 'Memperbarui...' : 'Mengirim...'}`;
    }

    if (msg) {
        msg.style.color = isCatThemeActive() ? "#c2410c" : isStitchThemeActive() ? "#0284c7" : "#38bdf8";
        msg.innerText = isEditMode ? "Memperbarui data di kedua sheet..." : "Mengirim data PO ke Google Sheets...";
    }

    const dataPO = {
        action: actionType,
        rowIndex: currentEditRowIndex,
        tanggal: document.getElementById('poTanggal') ? document.getElementById('poTanggal').value : '',
        kodeBarang: document.getElementById('poKode') ? document.getElementById('poKode').value : '',
        namaBarang: document.getElementById('poNama') ? document.getElementById('poNama').value : '',
        pic: document.getElementById('poPic') ? document.getElementById('poPic').value : '',
        jumlah: document.getElementById('poJumlah') ? document.getElementById('poJumlah').value : ''
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(dataPO)
        });
        const result = await response.json();

        if (result.status === 'success') {
            if (!isEditMode) {
                const namaStafAktif = localStorage.getItem('po_user') || localStorage.getItem('gudang_staff_name') || dataPO.pic || 'Staf';
                fetch(`${FIREBASE_RTDB_URL}/gudang_nuhsantara/po_history.json`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pic: namaStafAktif,
                        kode: dataPO.kodeBarang,
                        barang: dataPO.namaBarang,
                        jumlah: dataPO.jumlah,
                        timestamp: Date.now()
                    })
                }).catch(err => {});
            }

            if (isLightMascotThemeActive()) {
                window.playStitchSound("success");
                if (isEditMode) {
                    window.updateStitchSpeech(
                        isCatThemeActive()
                            ? "Meow! Data PO berhasil diperbarui! 🎉"
                            : "Yeay! Data PO berhasil diperbarui! 🎉"
                    );
                } else {
                    window.updateStitchSpeech(
                        isCatThemeActive()
                            ? "Meow! PO baru Mochi simpan! 🚀"
                            : "Mantap Ohana! PO baru sudah tersimpan! 🚀"
                    );
                }
            }

            if (btn) {
                btn.innerHTML = `✨ Berhasil!`;
                btn.style.backgroundColor = "#10b981";
            }

            if (msg) {
                msg.style.color = "#10b981";
                msg.innerText = isEditMode ? "Data PO Berhasil Diperbarui di Kedua Sheet!" : "Data PO Berhasil Disimpan!";
            }

            await new Promise(resolve => setTimeout(resolve, 800));

            if (document.getElementById('poForm')) document.getElementById('poForm').reset();
            currentEditRowIndex = null;

            if (document.getElementById('poTanggal')) document.getElementById('poTanggal').value = getLocalDateString();
            if (document.getElementById('poKode')) document.getElementById('poKode').value = '';
            if (document.getElementById('poNama')) document.getElementById('poNama').value = '';
            if (document.getElementById('poPic')) document.getElementById('poPic').value = '';
            if (document.getElementById('triggerModal')) document.getElementById('triggerModal').textContent = "-- Pilih Barang dari Master --";

            if (btn) {
                btn.innerHTML = "Kirim";
                btn.style.background = "";
            }
        } else {
            if (isLightMascotThemeActive()) {
                window.playStitchSound("warn");
                window.updateStitchSpeech("Waduh gagal simpan, coba cek lagi datanya ya bro!");
            }
            await showCustomModal({
                title: "Gagal",
                message: "Gagal: " + result.message,
                type: "error"
            });
            if (btn) {
                btn.innerHTML = isEditMode ? "💾 Update Data PO" : "Kirim";
                btn.disabled = false;
                btn.style.opacity = "1";
            }
        }

        setTimeout(() => { if (msg) msg.innerText = ""; }, 3000);
    } catch (err) {
        if (isLightMascotThemeActive()) {
            window.playStitchSound("warn");
            window.updateStitchSpeech("Koneksi internet terputus sebentar, coba kirim ulang ya!");
        }
        if (msg) {
            msg.style.color = "#ef4444";
            msg.innerText = "Terjadi kendala koneksi internet!";
        }
        if (btn) {
            btn.innerHTML = isEditMode ? "💾 Update Data PO" : "Kirim";
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    } finally {
        checkFormValidity();
    }
}

function initRobotAnimation() {
    const usernameInput = document.getElementById('username');
    const regUsernameInput = document.getElementById('regUsername');
    const passwordInput = document.getElementById('password');
    const regPasswordInput = document.getElementById('regPassword');
    const robotContainer = document.getElementById('robotContainer');
    const robotBubble = document.getElementById('robotBubble');

    if (!robotContainer || !robotBubble) return;

    function updateRobotState() {
        setTimeout(() => {
            const activeEl = document.activeElement;
            if (activeEl === passwordInput || activeEl === regPasswordInput) {
                robotContainer.classList.add('password-active');
                robotBubble.textContent = "Waduh, password rahasia! Aku tutup mata ya 🙈";
            } else if (activeEl === usernameInput || activeEl === regUsernameInput) {
                robotContainer.classList.remove('password-active');
                robotBubble.textContent = "Halo! Masukkan username atau email kamu ya 👤";
            } else {
                robotContainer.classList.remove('password-active');
                robotBubble.textContent = isCatThemeActive()
                    ? "Meow! Ayo kerja input PO! 🐾✨"
                    : isStitchThemeActive()
                        ? "Aloha! Ohana siap bantu login! 🌺"
                        : "Masukkan akun internal gudang";
            }
        }, 50);
    }

    [usernameInput, regUsernameInput, passwordInput, regPasswordInput].forEach(el => {
        if (!el) return;
        el.addEventListener('focus', updateRobotState);
        el.addEventListener('blur', updateRobotState);
    });
}

function togglePasswordVisibility(inputId = 'password', iconId = 'eyeIconToggle') {
    const passwordInput = document.getElementById(inputId);
    const eyeIconToggle = document.getElementById(iconId);
    if (!passwordInput || !eyeIconToggle) return;

    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    eyeIconToggle.className = isPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
}

function handleLogout() {
    localStorage.removeItem('po_user');
    localStorage.removeItem('po_login_date');
    tampilkanLogin();
}

function tambahJumlah(angka) {
    const inputJumlah = document.getElementById('poJumlah');
    if (!inputJumlah) return;
    const nilaiSekarang = parseInt(inputJumlah.value, 10) || 0;
    inputJumlah.value = nilaiSekarang + Number(angka || 0);
    if (isLightMascotThemeActive()) window.playStitchSound("tap");
    checkFormValidity();
}

// =========================================================================
// 🔔 POP-UP BANNER REKAP HARIAN DI DALAM APLIKASI
// =========================================================================
async function cekRekapOtomatis() {
    const namaPicLogin = localStorage.getItem('po_user') || localStorage.getItem('gudang_staff_name') || "";
    if (!namaPicLogin) return;

    const kemarin = new Date();
    kemarin.setDate(kemarin.getDate() - 1);
    const tanggalKemarin = formatDateLocal(kemarin);
    const tanggalKemarinFormatted = kemarin.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const kunciKemarin = `banner_rekap_shown_${tanggalKemarin}_${namaPicLogin}`;
    if (localStorage.getItem(kunciKemarin)) return;

    try {
        let totalPO = 0;
        try {
            const response = await fetch(`${WEB_APP_URL}?action=getRekap&pic=${encodeURIComponent(namaPicLogin)}&tanggal=${tanggalKemarin}`);
            const hasil = await response.json();
            if (hasil.status === "success" && typeof hasil.totalPO === 'number') {
                totalPO = hasil.totalPO;
            }
        } catch (e) {
            console.log("Skip getRekap Apps Script:", e);
        }

        const startYesterday = new Date(kemarin.getFullYear(), kemarin.getMonth(), kemarin.getDate(), 0, 0, 0).getTime();
        const endYesterday = new Date(kemarin.getFullYear(), kemarin.getMonth(), kemarin.getDate(), 23, 59, 59, 999).getTime();

        const historyRes = await fetch(`${FIREBASE_RTDB_URL}/gudang_nuhsantara/login_history.json?t=${Date.now()}`);
        const historyData = await historyRes.json() || {};
        let loginList = [];

        Object.values(historyData).forEach(item => {
            if (!item || !item.timestamp) return;
            const ts = Number(item.timestamp);
            const itemName = (item.name || "").toLowerCase();
            const targetName = namaPicLogin.toLowerCase();

            if ((itemName.includes(targetName) || targetName.includes(itemName)) && ts >= startYesterday && ts <= endYesterday) {
                const d = new Date(ts);
                const jamStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                loginList.push({
                    ts,
                    jam: `${jamStr} WIB`,
                    modul: item.modul || 'Aplikasi'
                });
            }
        });

        loginList.sort((a, b) => a.ts - b.ts);

        tampilkanBannerRekapHarian({
            nama: namaPicLogin,
            tanggalLabel: tanggalKemarinFormatted,
            loginList: loginList,
            totalPO: totalPO,
            storageKey: kunciKemarin
        });
    } catch (err) {
        console.error("Gagal memuat rekap otomatis:", err);
    }
}

function tampilkanBannerRekapHarian({ nama, tanggalLabel, loginList, totalPO, storageKey }) {
    const existing = document.getElementById('bannerRekapHarianModal');
    if (existing) existing.remove();

    const isCat = isCatThemeActive();
    const isStitch = isStitchThemeActive();
    const isLight = isCat || isStitch;

    const cardBg = isCat
        ? 'linear-gradient(145deg, #fffdf9, #ffedd5)'
        : isStitch
            ? 'linear-gradient(145deg, #ffffff, #e0f2fe)'
            : 'linear-gradient(145deg, #0f172a, #1e293b)';
    const cardBorder = isCat ? '#fdba74' : isStitch ? '#7dd3fc' : 'rgba(56, 189, 248, 0.45)';
    const titleColor = isCat ? '#c2410c' : isStitch ? '#0369a1' : '#fff';
    const textColor = isCat ? '#431407' : isStitch ? '#334155' : '#cbd5e1';
    const accentColor = isCat ? '#ea580c' : isStitch ? '#0284c7' : '#38bdf8';
    const listBoxBg = isCat ? '#fff7ed' : isStitch ? '#f0f9ff' : 'rgba(2, 6, 23, 0.65)';
    const listBoxBorder = isCat ? '#fed7aa' : isStitch ? '#bae6fd' : '#334155';
    const fontStack = isLight
        ? "'Fredoka', 'Nunito', 'Comic Sans MS', cursive, sans-serif"
        : "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    let listHtml = "";
    if (loginList.length > 0) {
        listHtml = loginList.map(log => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-bottom: 1px solid ${isCat ? '#ffedd5' : isStitch ? '#e0f2fe' : 'rgba(255,255,255,0.06)'}; font-size: 11px;">
                <span style="color: ${textColor};">📅 ${escapeHtml(log.jam)}</span>
                <span style="color: ${accentColor}; font-weight: 600;">${escapeHtml(log.modul)}</span>
                <span style="color: #10b981; font-size: 10px;">🟢 Masuk</span>
            </div>
        `).join('');
    } else {
        listHtml = `<div style="padding: 10px; text-align: center; color: #64748b; font-size: 11px;">Tidak ada riwayat sesi login tercatat kemarin.</div>`;
    }

    const modal = document.createElement('div');
    modal.id = 'bannerRekapHarianModal';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(7, 11, 20, 0.85);
        backdrop-filter: blur(10px); display: flex; justify-content: center;
        align-items: center; z-index: 2147483647; padding: 18px; box-sizing: border-box;
        font-family: ${fontStack};
    `;

    modal.innerHTML = `
        <div style="background: ${cardBg}; border: 1.5px solid ${cardBorder}; border-radius: 20px; width: 100%; max-width: 420px; padding: 24px 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.45); color: ${titleColor};">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px; border-bottom: 1px solid ${listBoxBorder}; padding-bottom: 12px;">
                <div style="width: 42px; height: 42px; background: rgba(56, 189, 248, 0.15); border: 1px solid ${accentColor}; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: ${accentColor}; font-size: 18px; flex-shrink: 0;">
                    <i class="fa-solid fa-clipboard-check"></i>
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: ${titleColor};">REKAP AKTIVITAS KEMARIN</h3>
                    <div style="font-size: 11px; color: ${accentColor};">${escapeHtml(tanggalLabel)}</div>
                </div>
            </div>

            <p style="font-size: 12.5px; color: ${textColor}; margin: 0 0 14px 0; line-height: 1.5;">
                Halo <b style="color: ${accentColor};">${escapeHtml(nama)}</b>, berikut catatan kehadiran aplikasi dan produktivitas PO kamu kemarin:
            </p>

            <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 12px; color: ${textColor};">
                    <i class="fa-solid fa-file-invoice" style="color: #10b981; margin-right: 6px;"></i> Total Input PO Kemarin
                </div>
                <div style="font-size: 16px; font-weight: 800; color: #10b981; font-family: ${isLight ? fontStack : 'monospace'};">
                    ${totalPO} Kali
                </div>
            </div>

            <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                <i class="fa-solid fa-clock-rotate-left"></i> Riwayat Sesi Login (${loginList.length}x)
            </div>
            <div style="background: ${listBoxBg}; border: 1px solid ${listBoxBorder}; border-radius: 10px; max-height: 165px; overflow-y: auto; margin-bottom: 18px; font-family: ${isLight ? fontStack : 'monospace'};">
                ${listHtml}
            </div>

            <button type="button" id="btnConfirmRekapHarian" style="width: 100%; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border: 1px solid #38bdf8; color: #fff; padding: 12px; border-radius: 10px; font-weight: 700; font-size: 12.5px; cursor: pointer; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);">
                ✔ MENGERTI, MULAI KERJA HARI INI
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btnConfirmRekapHarian').addEventListener('click', () => {
        localStorage.setItem(storageKey, 'true');
        if (isLightMascotThemeActive()) window.playStitchSound("tap");
        modal.remove();
    });
}

// ==========================================
// 🔔 MODAL PAKSA IZIN NOTIFIKASI & REGISTRASI FCM TOKEN
// ==========================================
async function registerFCMTokenToServer(tokenValue) {
    const currentUser = localStorage.getItem('po_user');
    if (!tokenValue || !currentUser) return;

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveFCMToken', user: currentUser, token: tokenValue })
        });
    } catch (err) {}
}

function checkAndForceNotification() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted" || localStorage.getItem("gudang_notif_allowed") === "true") {
        let deviceToken = localStorage.getItem("gudang_device_token");
        if (!deviceToken) {
            deviceToken = "token_" + Math.random().toString(36).substring(2) + "_" + Date.now();
            localStorage.setItem("gudang_device_token", deviceToken);
        }
        registerFCMTokenToServer(deviceToken);
        return;
    }

    showForceNotificationModal();
}

function showForceNotificationModal() {
    let modal = document.getElementById('forceNotificationModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'forceNotificationModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.95); display: flex; justify-content: center;
            align-items: center; z-index: 999999; padding: 20px; box-sizing: border-box;
            backdrop-filter: blur(8px);
        `;
        modal.innerHTML = `
            <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(56, 189, 248, 0.3); padding: 30px 25px; border-radius: 20px; max-width: 380px; width: 100%; text-align: center; color: #fff; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
                <div style="width: 60px; height: 60px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 26px; color: #38bdf8;">
                    <i class="fa-solid fa-bell"></i>
                </div>
                <h3 style="margin-bottom: 12px; font-size: 20px; font-weight: 700; color: #f8fafc;">Aktifkan Notifikasi</h3>
                <p style="font-size: 13px; color: #94a3b8; margin-bottom: 25px; line-height: 1.5;">
                    Mohon aktifkan izin notifikasi agar kamu bisa menerima rekap harian PO dan informasi penting dari Gudang Nuhsantara secara tepat waktu.
                </p>
                <button id="btnAllowNotif" style="
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 14px 20px;
                    border-radius: 12px; font-weight: 600; font-size: 15px; width: 100%; cursor: pointer;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                ">
                    Izinkan Notifikasi Sekarang
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }

    document.getElementById('btnAllowNotif').onclick = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                localStorage.setItem("gudang_notif_allowed", "true");
                modal.style.display = 'none';

                let deviceToken = localStorage.getItem("gudang_device_token");
                if (!deviceToken) {
                    deviceToken = "token_" + Math.random().toString(36).substring(2) + "_" + Date.now();
                    localStorage.setItem("gudang_device_token", deviceToken);
                }
                registerFCMTokenToServer(deviceToken);
            } else {
                await showCustomModal({
                    title: "Izin Ditolak",
                    message: "Aplikasi memerlukan izin notifikasi agar dapat digunakan oleh tim gudang!",
                    type: "error"
                });
            }
        } catch (error) {}
    };
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./firebase-messaging-sw.js').catch(() => {});
    });
}
