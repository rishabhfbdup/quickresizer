const imageInput = document.getElementById('imageInput');
const editorBox = document.getElementById('editorBox');
const previewImg = document.getElementById('previewImg');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const qualityInput = document.getElementById('qualityInput');
const formatSelect = document.getElementById('formatSelect');
const originalSizeText = document.getElementById('originalSize');
const newSizeText = document.getElementById('newSize');
const downloadBtn = document.getElementById('downloadBtn');

let loadedImage = new Image();

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    originalSizeText.textContent = `Original Size: ${(file.size / 1024).toFixed(2)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
        loadedImage.src = event.target.result;
        loadedImage.onload = () => {
            previewImg.src = loadedImage.src;
            widthInput.value = loadedImage.width;
            heightInput.value = loadedImage.height;
            editorBox.style.display = 'flex';
            renderResizedImage();
        };
    };
    reader.readAsDataURL(file);
});

function renderResizedImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const targetWidth = parseInt(widthInput.value) || loadedImage.width;
    const targetHeight = parseInt(heightInput.value) || loadedImage.height;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(loadedImage, 0, 0, targetWidth, targetHeight);

    const selectedFormat = formatSelect.value;
    const selectedQuality = parseFloat(qualityInput.value);

    canvas.toBlob((blob) => {
        if (!blob) return;

        newSizeText.textContent = `New Size: ${(blob.size / 1024).toFixed(2)} KB`;

        downloadBtn.onclick = () => {
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            const extension = selectedFormat.split('/')[1];
            downloadLink.download = `quickresizer-${targetWidth}x${targetHeight}.${extension}`;
            downloadLink.click();
        };
    }, selectedFormat, selectedQuality);
}

[widthInput, heightInput, qualityInput, formatSelect].forEach(inputElement => {
    inputElement.addEventListener('input', renderResizedImage);
});