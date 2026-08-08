let currentMode = 'resize';
let originalImage = null;

// Switch Tool Mode Function
function switchMode(mode) {
    currentMode = mode;

    // Update Header Links and Action Tabs UI
    document.querySelectorAll('.tool-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.action-tab').forEach(tab => tab.classList.remove('active'));
    
    const activeTab = document.getElementById(`tab-${mode}`);
    if(activeTab) activeTab.classList.add('active');

    // Update Title & Description
    const titles = {
        resize: "Resize Image Online",
        crop: "Crop Image Online",
        compress: "Compress Image KB Size",
        convert: "Convert Image Format"
    };
    const descs = {
        resize: "Change image width and height in pixels easily for free!",
        crop: "Crop photos to square, 16:9 landscape, or custom ratios.",
        compress: "Reduce photo file size in KB/MB with quality controls.",
        convert: "Convert images from JPG, PNG, WEBP to desired formats instantly."
    };

    document.getElementById('mode-title').innerText = titles[mode];
    document.getElementById('mode-desc').innerText = descs[mode];

    // Hide All Panels and Show Selected Panel
    document.querySelectorAll('.mode-panel').forEach(panel => panel.classList.add('hidden'));
    const selectedPanel = document.getElementById(`panel-${mode}`);
    if (selectedPanel) selectedPanel.classList.remove('hidden');

    // Update Download Button Text
    const btn = document.getElementById('process-btn');
    if (mode === 'resize') btn.innerHTML = `<i class="fa-solid fa-download"></i> Resize & Download`;
    else if (mode === 'crop') btn.innerHTML = `<i class="fa-solid fa-crop"></i> Crop & Download`;
    else if (mode === 'compress') btn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Compress & Download`;
    else if (mode === 'convert') btn.innerHTML = `<i class="fa-solid fa-arrows-repeat"></i> Convert & Download`;
}

// Drag & Drop
const dropZone = document.getElementById('drop-zone');
const imageInput = document.getElementById('image-input');
const controlsSection = document.getElementById('controls-section');
const imagePreview = document.getElementById('image-preview');

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#0284c7'; });
dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = '#38bdf8'; });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]);
});
imageInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleImage(e.target.files[0]);
});

function handleImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage = new Image();
        originalImage.onload = () => {
            document.getElementById('width-input').value = originalImage.width;
            document.getElementById('height-input').value = originalImage.height;
            imagePreview.src = e.target.result;
            controlsSection.classList.remove('hidden');
            controlsSection.scrollIntoView({ behavior: 'smooth' });
        };
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Slider update
document.getElementById('quality-slider').addEventListener('input', (e) => {
    document.getElementById('quality-val').innerText = `${e.target.value}%`;
});

// Process Image Action
document.getElementById('process-btn').addEventListener('click', () => {
    if (!originalImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let w = originalImage.width;
    let h = originalImage.height;
    let mimeType = 'image/jpeg';
    let quality = 0.8;

    if (currentMode === 'resize') {
        w = parseInt(document.getElementById('width-input').value) || w;
        h = parseInt(document.getElementById('height-input').value) || h;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(originalImage, 0, 0, w, h);
    } 
    else if (currentMode === 'crop') {
        const ratio = document.getElementById('crop-ratio').value;
        let cropWidth = w;
        let cropHeight = h;

        if (ratio === 'square') {
            cropWidth = cropHeight = Math.min(w, h);
        } else if (ratio === '16:9') {
            cropHeight = Math.floor(w * (9 / 16));
        }

        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const startX = (w - cropWidth) / 2;
        const startY = (h - cropHeight) / 2;
        ctx.drawImage(originalImage, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    } 
    else if (currentMode === 'compress') {
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(originalImage, 0, 0, w, h);
        quality = parseInt(document.getElementById('quality-slider').value) / 100;
    } 
    else if (currentMode === 'convert') {
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(originalImage, 0, 0, w, h);
        mimeType = document.getElementById('convert-to').value;
    }

    const resultUrl = canvas.toDataURL(mimeType, quality);
    const downloadLink = document.createElement('a');
    downloadLink.href = resultUrl;
    
    let ext = 'jpg';
    if(mimeType === 'image/png') ext = 'png';
    else if(mimeType === 'image/webp') ext = 'webp';

    downloadLink.download = `quickresizer_${currentMode}.${ext}`;
    downloadLink.click();
});
