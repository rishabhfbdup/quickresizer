// Global Variables & Elements
const dropZone = document.getElementById('drop-zone');
const imageInput = document.getElementById('image-input');
const controlsSection = document.getElementById('controls-section');
const imagePreview = document.getElementById('image-preview');
const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');
const qualitySlider = document.getElementById('quality-slider');
const qualityVal = document.getElementById('quality-val');
const processBtn = document.getElementById('process-btn');

let originalImage = null;
let currentMode = 'resize'; // Default mode: resize, crop, compress, convert

// Tab Selection (Resize, Crop, Compress, Convert)
const actionTabs = document.querySelectorAll('.action-tab');
const toolLinks = document.querySelectorAll('.tool-link');

function setActiveMode(mode) {
    currentMode = mode;

    // Update Tab Styles
    actionTabs.forEach(tab => tab.classList.remove('active'));
    toolLinks.forEach(link => link.classList.remove('active'));

    // Highlight Selected Tab
    actionTabs.forEach(tab => {
        if (tab.innerText.toLowerCase().includes(mode)) tab.classList.add('active');
    });

    // Adjust UI Labels based on Mode
    if (processBtn) {
        if (mode === 'resize') processBtn.innerHTML = `<i class="fa-solid fa-download"></i> Resize & Download`;
        else if (mode === 'crop') processBtn.innerHTML = `<i class="fa-solid fa-crop-simple"></i> Crop & Download`;
        else if (mode === 'compress') processBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Compress KB & Download`;
        else if (mode === 'convert') processBtn.innerHTML = `<i class="fa-solid fa-arrow-rotate-right"></i> Convert & Download`;
    }
}

// Click Listeners for Action Tabs
actionTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        const modes = ['resize', 'crop', 'compress', 'convert'];
        setActiveMode(modes[index]);
    });
});

toolLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const modes = ['resize', 'crop', 'compress', 'convert'];
        setActiveMode(modes[index]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// Drag and Drop Logic
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#0284c7';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#38bdf8';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImage(file);
});

function handleImage(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        originalImage = new Image();
        originalImage.onload = () => {
            widthInput.value = originalImage.width;
            heightInput.value = originalImage.height;
            imagePreview.src = event.target.result;
            controlsSection.classList.remove('hidden');
            controlsSection.scrollIntoView({ behavior: 'smooth' });
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

qualitySlider.addEventListener('input', () => {
    qualityVal.innerText = `${qualitySlider.value}%`;
});

// Image Processing Action
processBtn.addEventListener('click', () => {
    if (!originalImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let newWidth = parseInt(widthInput.value) || originalImage.width;
    let newHeight = parseInt(heightInput.value) || originalImage.height;

    // Mode-based Logic
    if (currentMode === 'compress') {
        // Compress Mode: Keep original resolution, only adjust quality
        newWidth = originalImage.width;
        newHeight = originalImage.height;
    } else if (currentMode === 'crop') {
        // Crop Mode: Center Crop Strategy
        newWidth = Math.min(newWidth, originalImage.width);
        newHeight = Math.min(newHeight, originalImage.height);
    }

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

    const quality = qualitySlider.value / 100;
    const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);

    const downloadLink = document.createElement('a');
    downloadLink.href = resizedDataUrl;
    downloadLink.download = `quickresizer_${currentMode}_image.jpg`;
    downloadLink.click();
});

// Language Switcher Dictionary
const translations = {
    en: {
        "menu-resize": "Resize",
        "menu-crop": "Crop",
        "menu-compress": "Compress",
        "menu-convert": "Convert",
        "btn-login": "Login",
        "btn-signup": "Sign Up",
        "tab-resize": "Resize Image",
        "tab-crop": "Crop Image",
        "tab-compress": "Compress KB",
        "tab-convert": "Convert Format",
        "hero-title": "Resize & Compress Images Online",
        "hero-subtitle": "Easily resize, crop, compress, and convert JPG, PNG, WEBP images in seconds for free!",
        "drop-text": "Drop your images here or",
        "browse-text": "browse files",
        "limits-text": "Supports JPG, PNG, WEBP, GIF | Unlimited File Size",
        "btn-select": "Select Image",
        "badge-private": "100% Private (No Server Uploads)",
        "badge-fast": "Ultra Fast Processing",
        "badge-free": "Completely Free Forever",
        "lbl-width": "Width (Pixels):",
        "lbl-height": "Height (Pixels):",
        "lbl-quality": "Compression Quality:",
        "btn-download": "Resize & Download Image"
    },
    hi: {
        "menu-resize": "रिसाइज",
        "menu-crop": "क्रॉप",
        "menu-compress": "कंप्रेस",
        "menu-convert": "कन्वर्ट",
        "btn-login": "लॉगिन",
        "btn-signup": "साइन अप",
        "tab-resize": "इमेज रिसाइज करें",
        "tab-crop": "इमेज क्रॉप करें",
        "tab-compress": "KB कम करें",
        "tab-convert": "फॉर्मेट बदलें",
        "hero-title": "ऑनलाइन फोटो रिसाइज और कंप्रेस करें",
        "hero-subtitle": "JPG, PNG, WEBP फोटो को कुछ ही सेकंड में आसानी से रिसाइज, क्रॉप और कंप्रेस करें!",
        "drop-text": "अपनी फोटो यहाँ ड्रॉप करें या",
        "browse-text": "फाइल चुनें",
        "limits-text": "JPG, PNG, WEBP, GIF सपोर्ट | कोई फाइल साइज लिमिट नहीं",
        "btn-select": "फोटो चुनें",
        "badge-private": "100% सुरक्षित (सर्वर पर अपलोड नहीं)",
        "badge-fast": "सुपर फास्ट प्रोसेसिंग",
        "badge-free": "हमेशा के लिए 100% फ्री",
        "lbl-width": "चौड़ाई (Pixels):",
        "lbl-height": "ऊंचाई (Pixels):",
        "lbl-quality": "इमेज क्वालिटी:",
        "btn-download": "डाउनलोड करें"
    }
};

document.getElementById('lang-select').addEventListener('change', (e) => {
    const lang = e.target.value;
    document.querySelectorAll('[data-lang]').forEach((element) => {
        const key = element.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            element.innerText = translations[lang][key];
        }
    });
});
