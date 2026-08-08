// Image Processing Elements
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

processBtn.addEventListener('click', () => {
    if (!originalImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const newWidth = parseInt(widthInput.value) || originalImage.width;
    const newHeight = parseInt(heightInput.value) || originalImage.height;

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

    const quality = qualitySlider.value / 100;
    const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);

    const downloadLink = document.createElement('a');
    downloadLink.href = resizedDataUrl;
    downloadLink.download = `quickresizer_image.jpg`;
    downloadLink.click();
});

// Language Switcher Dictionary (English & Hindi)
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
        "btn-download": "Resize & Download Image",
        "how-title": "How to Resize an Image in 3 Easy Steps",
        "how-subtitle": "QuickResizer is designed to be simple, fast, and accessible for everyone.",
        "step1-title": "Upload Image",
        "step1-desc": "Drag and drop your photo into the box above or click 'Select Image' to choose a file.",
        "step2-title": "Adjust Settings",
        "step2-desc": "Set your required pixel width/height or choose crop, compression, and conversion quality.",
        "step3-title": "Download Instantly",
        "step3-desc": "Click 'Resize & Download' to save your newly optimized image directly to your device."
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
        "btn-download": "रिसाइज करके डाउनलोड करें",
        "how-title": "फोटो रिसाइज करने के 3 आसान स्टेप्स",
        "how-subtitle": "क्विक-रिसाइजर उपयोग करने में बहुत आसान और फास्ट है।",
        "step1-title": "फोटो अपलोड करें",
        "step1-desc": "ऊपर दिए गए बॉक्स में अपनी फोटो ड्रैग करें या 'फोटो चुनें' बटन दबाएं।",
        "step2-title": "सेटिंग्स चुनें",
        "step2-desc": "अपनी पसंद के पिक्सल (चौड़ाई/ऊंचाई) या कंप्रेशन क्वालिटी सेट करें।",
        "step3-title": "तुरंत डाउनलोड करें",
        "step3-desc": "'डाउनलोड' बटन दबाकर नई फोटो को तुरंत अपने मोबाइल या लैपटॉप में सेव करें।"
    }
};

// Language Dropdown Event Listener
document.getElementById('lang-select').addEventListener('change', (e) => {
    const lang = e.target.value;
    document.querySelectorAll('[data-lang]').forEach((element) => {
        const key = element.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            element.innerText = translations[lang][key];
        }
    });
});
