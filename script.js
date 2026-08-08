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

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#0369a1';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#0284c7';
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
    downloadLink.download = `resized_quickresizer.jpg`;
    downloadLink.click();
});
