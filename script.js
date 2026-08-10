// Global App States & Local Storage DB
let currentMode = 'resize';
let uploadedFiles = [];
let cropperInstance = null;
let registeredUsers = JSON.parse(localStorage.getItem('quickresizer_registered_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('quickresizer_user')) || null;
let pendingSubscriptionAfterAuth = false;
let billingDetails = {};

// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

// Default Plan State (Yearly Plan default)
let selectedPlan = { name: 'Yearly', inrPrice: 2199, usdDisplay: '$25.99' };

// ==========================================
// 1. TOOL MODE SWITCHER LOGIC
// ==========================================
function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.action-tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${mode}`);
    if(activeTab) activeTab.classList.add('active');

    const titles = {
        resize: "Resize Image Online",
        crop: "Crop Image Online",
        compress: "Compress Image KB Size",
        convert: "Convert Image Format",
        namedate: "Add Name & Date to Photo",
        signature: "Signature Cleaner & Enhancer",
        bgcolor: "Change Photo Background Color",
        imgtopdf: "Convert Images to PDF Document",
        pdftoimg: "Convert PDF Pages to Images (JPG/PNG)",
        mergepdf: "Merge Multiple PDF Files Online",
        splitpdf: "Split & Extract PDF Pages",
        compresspdf: "Compress PDF File Size",
        resume: "1-Click Clean PDF Resume Builder",
        wordcounter: "Word & Character Counter",
        'wa-chat': "WhatsApp Direct Chat Link Generator",
        svgtopng: "Convert SVG to High-Res PNG",
        jsonformat: "JSON Formatter & Validator"
    };
    const descs = {
        resize: "Change image width and height in pixels easily for free!",
        crop: "Drag and adjust box to visual crop your image precisely.",
        compress: "Set exact target KB (PRO Feature) or adjust compression slider.",
        convert: "Convert images from JPG, PNG, WEBP to desired formats instantly.",
        namedate: "Add candidate name and photo date/DOB at the bottom for official forms.",
        signature: "Clean background shadows from photo signatures and make ink pitch black.",
        bgcolor: "Fill or replace photo background with official white, passport blue, or custom colors.",
        imgtopdf: "Combine single or multiple images into a clean PDF document instantly.",
        pdftoimg: "Extract crisp JPG/PNG image files from every page of your PDF file.",
        mergepdf: "Select 2 or more PDF files to combine them into 1 single document.",
        splitpdf: "Extract specific page ranges into a separate new PDF document.",
        compresspdf: "Reduce large PDF document size directly in your browser.",
        resume: "Fill your details below to generate an ATS-friendly professional PDF Resume.",
        wordcounter: "Count words, characters, and estimated reading time live.",
        'wa-chat': "Generate instant WhatsApp direct chat link without saving contact.",
        svgtopng: "Convert scalable vector SVG graphics into crisp PNG images.",
        jsonformat: "Beautify, format, and validate raw JSON code strings instantly."
    };

    if (document.getElementById('mode-title')) document.getElementById('mode-title').innerText = titles[mode] || titles.resize;
    if (document.getElementById('mode-desc')) document.getElementById('mode-desc').innerText = descs[mode] || descs.resize;

    document.querySelectorAll('.mode-panel').forEach(panel => panel.classList.add('hidden'));
    const selectedPanel = document.getElementById(`panel-${mode}`);
    if (selectedPanel) selectedPanel.classList.remove('hidden');

    const microTools = ['wordcounter', 'wa-chat', 'jsonformat', 'resume'];
    if (microTools.includes(mode)) {
        document.getElementById('controls-section')?.classList.remove('hidden');
        document.querySelector('.preview-box')?.classList.add('hidden');
    } else {
        document.querySelector('.preview-box')?.classList.remove('hidden');
    }

    if (currentMode === 'crop' && document.getElementById('image-preview').src) {
        initCropper();
    } else {
        destroyCropper();
    }

    const btn = document.getElementById('process-btn');
    if (btn) {
        const countText = uploadedFiles.length > 1 ? ` (${uploadedFiles.length} Files)` : '';
        if (mode === 'resize') btn.innerHTML = `<i class="fa-solid fa-download"></i> Resize & Download${countText}`;
        else if (mode === 'crop') btn.innerHTML = `<i class="fa-solid fa-crop"></i> Crop & Download`;
        else if (mode === 'compress') btn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Compress KB & Download${countText}`;
        else if (mode === 'convert') btn.innerHTML = `<i class="fa-solid fa-arrows-repeat"></i> Convert & Download${countText}`;
        else if (mode === 'namedate') btn.innerHTML = `<i class="fa-solid fa-id-card"></i> Add Name/Date & Download${countText}`;
        else if (mode === 'signature') btn.innerHTML = `<i class="fa-solid fa-signature"></i> Clean Signature & Download${countText}`;
        else if (mode === 'bgcolor') btn.innerHTML = `<i class="fa-solid fa-palette"></i> Apply BG Color & Download${countText}`;
        else if (mode === 'imgtopdf') btn.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Generate PDF & Download`;
        else if (mode === 'pdftoimg') btn.innerHTML = `<i class="fa-solid fa-file-image"></i> Extract Images & Download`;
        else if (mode === 'mergepdf') btn.innerHTML = `<i class="fa-solid fa-object-group"></i> Merge PDFs & Download`;
        else if (mode === 'splitpdf') btn.innerHTML = `<i class="fa-solid fa-scissors"></i> Split & Download PDF`;
        else if (mode === 'compresspdf') btn.innerHTML = `<i class="fa-solid fa-file-contract"></i> Compress PDF & Download`;
        else if (mode === 'resume') btn.innerHTML = `<i class="fa-solid fa-file-user"></i> Generate Resume PDF`;
        else if (mode === 'wordcounter') btn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy Text`;
        else if (mode === 'wa-chat') btn.innerHTML = `<i class="fa-brands fa-whatsapp"></i> Open Direct Chat`;
        else if (mode === 'svgtopng') btn.innerHTML = `<i class="fa-solid fa-download"></i> Convert & Download PNG`;
        else if (mode === 'jsonformat') btn.innerHTML = `<i class="fa-solid fa-code"></i> Format & Validate JSON`;
    }
}

// ==========================================
// 2. PLAN RULES & MB SIZE LIMIT CHECKING
// ==========================================
const dropZone = document.getElementById('drop-zone');
const imageInput = document.getElementById('image-input');
const controlsSection = document.getElementById('controls-section');
const imagePreview = document.getElementById('image-preview');

if (dropZone) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#0284c7'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = '#38bdf8'; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });
}

if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFiles(e.target.files);
    });
}

function getMaxMbLimit() {
    if (!currentUser || !currentUser.isPro) return 5;
    const plan = currentUser.plan || '';
    if (plan === 'Subscription') return 10;
    if (plan === 'Simple') return 15;
    if (plan === 'Smart') return 20;
    if (plan === 'Professional') return 30;
    if (plan === 'Yearly') return Infinity;
    return 5;
}

function handleFiles(files) {
    const filesArray = Array.from(files);
    const isPremiumUser = currentUser && currentUser.isPro;
    const userPlan = currentUser ? currentUser.plan : '';
    const maxMbLimit = getMaxMbLimit();

    for (let i = 0; i < filesArray.length; i++) {
        const fileSizeMb = filesArray[i].size / (1024 * 1024);
        if (fileSizeMb > maxMbLimit) {
            const limitText = maxMbLimit === Infinity ? 'Unlimited' : `${maxMbLimit}MB`;
            alert(`⚠️ File size exceeds your plan limit!\n\nYour current plan allows files up to ${limitText}. The uploaded file "${filesArray[i].name}" is ${fileSizeMb.toFixed(1)}MB.\n\nPlease upgrade your plan to upload larger files!`);
            const pricingSection = document.getElementById('pricing');
            if (pricingSection) pricingSection.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    }

    if (!isPremiumUser) {
        if (filesArray.length > 1 && currentMode !== 'mergepdf') {
            alert('⭐ Bulk Upload is a PRO Feature!\n\nFree users can process only 1 file at a time (Max 5MB). Please upgrade to Pro for bulk processing!');
            const pricingSection = document.getElementById('pricing');
            if (pricingSection) pricingSection.scrollIntoView({ behavior: 'smooth' });
            uploadedFiles = [filesArray[0]];
        } else {
            uploadedFiles = filesArray;
        }
    } else if (userPlan === 'Subscription' && filesArray.length > 10) {
        alert('⚠️ Your Subscription Plan allows up to 10 files at once.\n\nProcessing the first 10 files. Upgrade to Simple, Smart, Professional, or Yearly for Unlimited Bulk Uploads!');
        uploadedFiles = filesArray.slice(0, 10);
    } else {
        uploadedFiles = filesArray;
    }

    const firstFile = uploadedFiles[0];

    if (firstFile.type === 'application/pdf' || firstFile.name.endsWith('.pdf')) {
        imagePreview.src = 'https://cdn-icons-png.flaticon.com/512/337/337946.png';
        if (controlsSection) controlsSection.classList.remove('hidden');
        if (controlsSection) controlsSection.scrollIntoView({ behavior: 'smooth' });
    } else if (firstFile.name.endsWith('.svg')) {
        imagePreview.src = 'https://cdn-icons-png.flaticon.com/512/5968/5968364.png';
        if (controlsSection) controlsSection.classList.remove('hidden');
        if (controlsSection) controlsSection.scrollIntoView({ behavior: 'smooth' });
        if (currentMode !== 'svgtopng') switchMode('svgtopng');
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            
            const img = new Image();
            img.onload = () => {
                if (document.getElementById('width-input')) document.getElementById('width-input').value = img.width;
                if (document.getElementById('height-input')) document.getElementById('height-input').value = img.height;
                if (controlsSection) controlsSection.classList.remove('hidden');
                if (controlsSection) controlsSection.scrollIntoView({ behavior: 'smooth' });

                if (currentMode === 'crop') {
                    initCropper();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(firstFile);
    }

    switchMode(currentMode);
}

// ==========================================
// 3. CROPPER.JS VISUAL CROPPER
// ==========================================
function initCropper() {
    destroyCropper();
    if (typeof Cropper !== 'undefined' && imagePreview && imagePreview.src && !imagePreview.src.includes('337946.png')) {
        cropperInstance = new Cropper(imagePreview, {
            aspectRatio: NaN,
            viewMode: 1,
            background: false,
            autoCropArea: 0.8
        });
    }
}

function destroyCropper() {
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
}

document.getElementById('crop-ratio')?.addEventListener('change', (e) => {
    if (!cropperInstance) return;
    const val = e.target.value;
    if (val === 'square') cropperInstance.setAspectRatio(1);
    else if (val === '16:9') cropperInstance.setAspectRatio(16 / 9);
    else if (val === '4:3') cropperInstance.setAspectRatio(4 / 3);
    else cropperInstance.setAspectRatio(NaN);
});

document.getElementById('quality-slider')?.addEventListener('input', (e) => {
    if (document.getElementById('quality-val')) {
        document.getElementById('quality-val').innerText = `${e.target.value}%`;
    }
});

document.getElementById('target-kb-input')?.addEventListener('focus', (e) => {
    const isPremiumUser = currentUser && currentUser.isPro;
    if (!isPremiumUser) {
        e.target.blur();
        alert('⭐ Exact Target KB Compression (e.g. 20KB for SSC/UPSC forms) is a PRO Feature!\n\nUpgrade to Pro to set exact file size limits.');
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
});

document.getElementById('word-input-text')?.addEventListener('input', (e) => {
    const text = e.target.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const readingTimeSec = Math.ceil(words / 3.3);

    if (document.getElementById('cnt-words')) document.getElementById('cnt-words').innerText = words;
    if (document.getElementById('cnt-chars')) document.getElementById('cnt-chars').innerText = chars;
    if (document.getElementById('cnt-reading')) document.getElementById('cnt-reading').innerText = `${readingTimeSec}s`;
});

// ==========================================
// 4. MAIN PROCESSOR WITH SPEED DELAY & PAGE LIMITS
// ==========================================
function getProcessingDelay() {
    if (!currentUser || !currentUser.isPro) return 3500;
    const plan = currentUser.plan || '';
    if (plan === 'Subscription' || plan === 'Simple') return 1500;
    if (plan === 'Smart') return 800;
    if (plan === 'Professional' || plan === 'Yearly') return 0;
    return 3500;
}

document.getElementById('process-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('process-btn');
    const originalText = btn ? btn.innerHTML : '';
    const isPremiumUser = currentUser && currentUser.isPro;

    if (!isPremiumUser && (currentMode === 'imgtopdf' || currentMode === 'splitpdf')) {
        if (currentMode === 'imgtopdf' && uploadedFiles.length > 3) {
            alert('⭐ Free Plan allows converting up to 3 image pages to PDF!\n\nUpgrade to Pro for Unlimited PDF pages!');
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        if (currentMode === 'splitpdf') {
            const start = parseInt(document.getElementById('split-start')?.value || 1);
            const end = parseInt(document.getElementById('split-end')?.value || 1);
            if ((end - start + 1) > 3) {
                alert('⭐ Free Plan allows splitting up to 3 pages at once!\n\nUpgrade to Pro for Unlimited PDF Page Splitting!');
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }
    }

    const delay = getProcessingDelay();
    
    if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing File... Please Wait`;
        btn.disabled = true;
    }

    if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
        if (currentMode === 'imgtopdf') {
            await convertImagesToPdf();
        } else if (currentMode === 'pdftoimg') {
            await convertPdfToImages();
        } else if (currentMode === 'mergepdf') {
            await mergePdfFiles();
        } else if (currentMode === 'splitpdf') {
            await splitPdfFile();
        } else if (currentMode === 'compresspdf') {
            await compressPdfFile();
        } else if (currentMode === 'resume') {
            generateResumePdf();
        } else if (currentMode === 'wordcounter') {
            const text = document.getElementById('word-input-text')?.value;
            navigator.clipboard.writeText(text);
            alert('✅ Text copied to clipboard!');
        } else if (currentMode === 'wa-chat') {
            let phone = document.getElementById('wa-phone')?.value.replace(/[^0-9]/g, '');
            const msg = encodeURIComponent(document.getElementById('wa-msg')?.value || '');
            if (!phone) {
                alert('Please enter a valid mobile number with country code!');
                return;
            }
            window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
        } else if (currentMode === 'svgtopng') {
            await convertSvgToPng();
        } else if (currentMode === 'jsonformat') {
            formatJsonText();
        } else {
            if (!uploadedFiles.length) return;
            for (let i = 0; i < uploadedFiles.length; i++) {
                const file = uploadedFiles[i];
                if (currentMode === 'crop' && cropperInstance) {
                    const croppedCanvas = cropperInstance.getCroppedCanvas();
                    const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9);
                    downloadDataUrl(dataUrl, `quickresizer_cropped_${i + 1}.jpg`);
                } else {
                    await processSingleFile(file, i);
                }
            }
        }
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
});

async function splitPdfFile() {
    const pdfFile = uploadedFiles.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdfFile) {
        alert('Please upload a PDF file to split!');
        return;
    }
    if (typeof PDFLib === 'undefined') {
        alert('PDF library is loading. Please try again in 3 seconds.');
        return;
    }

    const fileBuffer = await pdfFile.arrayBuffer();
    const srcPdf = await PDFLib.PDFDocument.load(fileBuffer);
    const totalPages = srcPdf.getPageCount();

    let start = parseInt(document.getElementById('split-start')?.value || 1);
    let end = parseInt(document.getElementById('split-end')?.value || totalPages);

    if (start < 1) start = 1;
    if (end > totalPages) end = totalPages;
    if (start > end) {
        alert('Start page cannot be greater than End page!');
        return;
    }

    const newPdf = await PDFLib.PDFDocument.create();
    const pageIndices = [];
    for (let i = start - 1; i < end; i++) {
        pageIndices.push(i);
    }

    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach(p => newPdf.addPage(p));

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quickresizer_split_p${start}-to-p${end}.pdf`;
    link.click();
}

function generateResumePdf() {
    if (typeof window.jspdf === 'undefined') {
        alert('PDF generator engine is loading. Please try again in 3 seconds.');
        return;
    }

    const name = document.getElementById('res-name')?.value.trim() || 'Rishabh Rajput';
    const title = document.getElementById('res-title')?.value.trim() || 'Software Developer';
    const email = document.getElementById('res-email')?.value.trim() || 'contact@example.com';
    const phone = document.getElementById('res-phone')?.value.trim() || '+91 9876543210';
    const edu = document.getElementById('res-edu')?.value.trim() || 'B.Tech in Computer Science & Engineering';
    const skills = document.getElementById('res-skills')?.value.trim() || 'JavaScript, Python, Problem Solving, Web Development';
    const exp = document.getElementById('res-exp')?.value.trim() || 'Developed web tools and optimized digital solutions.';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait', 'mm', 'a4');

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Poppins', 'bold');
    doc.setFontSize(22);
    doc.text(name.toUpperCase(), 15, 18);

    doc.setFontSize(12);
    doc.setFont('Poppins', 'normal');
    doc.text(title, 15, 27);

    doc.setFontSize(9);
    doc.text(`Email: ${email} | Phone: ${phone}`, 15, 34);

    doc.setTextColor(15, 23, 42);
    let y = 55;

    function addSectionHeader(heading) {
        doc.setFillColor(56, 189, 248);
        doc.rect(15, y, 180, 0.8, 'F');
        doc.setFont('Poppins', 'bold');
        doc.setFontSize(13);
        doc.text(heading, 15, y - 2);
        y += 8;
    }

    addSectionHeader('EDUCATION');
    doc.setFont('Poppins', 'normal');
    doc.setFontSize(10);
    const splitEdu = doc.splitTextToSize(edu, 175);
    doc.text(splitEdu, 15, y);
    y += (splitEdu.length * 6) + 10;

    addSectionHeader('KEY SKILLS');
    doc.setFont('Poppins', 'normal');
    doc.setFontSize(10);
    const splitSkills = doc.splitTextToSize(skills, 175);
    doc.text(splitSkills, 15, y);
    y += (splitSkills.length * 6) + 10;

    addSectionHeader('EXPERIENCE & PROJECTS');
    doc.setFont('Poppins', 'normal');
    doc.setFontSize(10);
    const splitExp = doc.splitTextToSize(exp, 175);
    doc.text(splitExp, 15, y);

    doc.save(`Resume_${name.replace(/\s+/g, '_')}.pdf`);
}

async function convertSvgToPng() {
    const svgFile = uploadedFiles.find(f => f.name.endsWith('.svg'));
    if (!svgFile) {
        alert('Please select an SVG file first!');
        return;
    }

    const scale = parseFloat(document.getElementById('svg-scale')?.value || 4.0);
    const svgText = await svgFile.text();

    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = (img.width || 800) * scale;
        canvas.height = (img.height || 600) * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        downloadDataUrl(pngUrl, `quickresizer_${svgFile.name.replace('.svg', '')}.png`);
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

function formatJsonText() {
    const textarea = document.getElementById('json-input');
    const val = textarea?.value.trim();
    if (!val) {
        alert('Please paste JSON text first!');
        return;
    }
    try {
        const parsed = JSON.parse(val);
        textarea.value = JSON.stringify(parsed, null, 4);
        alert('✅ Valid JSON! Formatted successfully.');
    } catch (err) {
        alert('❌ Invalid JSON Code: ' + err.message);
    }
}

async function convertImagesToPdf() {
    if (typeof window.jspdf === 'undefined') {
        alert('PDF generator library is loading. Please try again in 3 seconds.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const orientation = document.getElementById('pdf-orientation')?.value || 'portrait';
    const margin = parseInt(document.getElementById('pdf-margin')?.value || 0);

    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        if (file.type === 'application/pdf') continue;

        const dataUrl = await readFileAsDataUrl(file);
        const img = await loadImage(dataUrl);

        if (i > 0) pdf.addPage();

        let renderWidth = pdfWidth - (margin * 2);
        let renderHeight = (img.height * renderWidth) / img.width;

        if (renderHeight > (pdfHeight - (margin * 2))) {
            renderHeight = pdfHeight - (margin * 2);
            renderWidth = (img.width * renderHeight) / img.height;
        }

        const xPos = (pdfWidth - renderWidth) / 2;
        const yPos = (pdfHeight - renderHeight) / 2;

        pdf.addImage(dataUrl, 'JPEG', xPos, yPos, renderWidth, renderHeight);
    }

    pdf.save(`quickresizer_document_${Date.now()}.pdf`);
}

async function convertPdfToImages() {
    const pdfFile = uploadedFiles.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdfFile) {
        alert('Please select a valid PDF file to convert to images!');
        return;
    }
    if (typeof pdfjsLib === 'undefined') {
        alert('PDF reader library is loading. Please try again in 3 seconds.');
        return;
    }

    const fileArrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
    
    const mimeType = document.getElementById('pdf-to-img-format')?.value || 'image/jpeg';
    const scale = parseFloat(document.getElementById('pdf-to-img-dpi')?.value || 2.0);
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        const imgDataUrl = canvas.toDataURL(mimeType, 0.92);
        downloadDataUrl(imgDataUrl, `quickresizer_pdf_page_${pageNum}.${ext}`);
    }
}

async function mergePdfFiles() {
    const pdfFiles = uploadedFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfFiles.length < 2) {
        alert('Please select at least 2 PDF files to merge!');
        return;
    }
    if (typeof PDFLib === 'undefined') {
        alert('PDF Merger library is loading. Please try again in 3 seconds.');
        return;
    }

    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const file of pdfFiles) {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quickresizer_merged_${Date.now()}.pdf`;
    link.click();
}

async function compressPdfFile() {
    const pdfFile = uploadedFiles.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (!pdfFile) {
        alert('Please select a valid PDF file to compress!');
        return;
    }
    if (typeof pdfjsLib === 'undefined' || typeof window.jspdf === 'undefined') {
        alert('PDF compression engines are loading. Please try again in 3 seconds.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const fileArrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
    
    const scaleLevel = parseFloat(document.getElementById('pdf-compress-level')?.value || 1.0);
    let newPdf = null;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: scaleLevel });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        const imgDataUrl = canvas.toDataURL('image/jpeg', 0.65);
        const orientation = viewport.width > viewport.height ? 'landscape' : 'portrait';

        if (pageNum === 1) {
            newPdf = new jsPDF({
                orientation: orientation,
                unit: 'px',
                format: [viewport.width, viewport.height]
            });
        } else {
            newPdf.addPage([viewport.width, viewport.height], orientation);
        }

        newPdf.addImage(imgDataUrl, 'JPEG', 0, 0, viewport.width, viewport.height);
    }

    if (newPdf) {
        newPdf.save(`quickresizer_compressed_${Date.now()}.pdf`);
    }
}

function readFileAsDataUrl(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}

function drawNameAndDate(ctx, canvasWidth, canvasHeight, nameText, dateText) {
    if (!nameText && !dateText) return;

    const bannerHeight = Math.round(canvasHeight * 0.18);
    const bannerY = canvasHeight - bannerHeight;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, bannerY, canvasWidth, bannerHeight);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.max(2, Math.round(canvasHeight * 0.005));
    ctx.strokeRect(0, bannerY, canvasWidth, bannerHeight);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const fontSize = Math.round(bannerHeight * 0.35);
    ctx.font = `bold ${fontSize}px 'Poppins', Arial, sans-serif`;

    if (nameText && dateText) {
        ctx.fillText(nameText.toUpperCase(), canvasWidth / 2, bannerY + (bannerHeight * 0.35));
        ctx.font = `${Math.round(fontSize * 0.85)}px 'Poppins', Arial, sans-serif`;
        ctx.fillText(`DOP: ${dateText}`, canvasWidth / 2, bannerY + (bannerHeight * 0.75));
    } else if (nameText) {
        ctx.fillText(nameText.toUpperCase(), canvasWidth / 2, bannerY + (bannerHeight / 2));
    } else if (dateText) {
        ctx.fillText(`DOP: ${dateText}`, canvasWidth / 2, bannerY + (bannerHeight / 2));
    }
}

function cleanSignatureBackground(ctx, width, height) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    const contrastVal = parseInt(document.getElementById('sig-contrast')?.value || 200) / 100;
    const thresholdVal = parseInt(document.getElementById('sig-threshold')?.value || 180);

    for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        avg = ((avg - 128) * contrastVal) + 128;

        if (avg > thresholdVal) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
        } else {
            data[i] = Math.max(0, avg - 40);
            data[i + 1] = Math.max(0, avg - 40);
            data[i + 2] = Math.max(0, avg - 40);
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function applyBackgroundColor(ctx, img, width, height) {
    const colorHex = document.getElementById('bg-custom-color')?.value || '#FFFFFF';
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
}

function processSingleFile(file, index) {
    return new Promise((resolve) => {
        if (file.type === 'application/pdf') {
            resolve();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let w = img.width;
                let h = img.height;
                let mimeType = 'image/jpeg';
                let quality = 0.8;

                if (currentMode === 'resize') {
                    w = parseInt(document.getElementById('width-input').value) || w;
                    h = parseInt(document.getElementById('height-input').value) || h;
                } else if (currentMode === 'convert') {
                    mimeType = document.getElementById('convert-to').value;
                }

                canvas.width = w;
                canvas.height = h;

                if (currentMode === 'bgcolor') {
                    applyBackgroundColor(ctx, img, w, h);
                } else {
                    ctx.drawImage(img, 0, 0, w, h);
                }

                if (currentMode === 'namedate') {
                    const candidateName = document.getElementById('candidate-name')?.value.trim();
                    const photoDate = document.getElementById('photo-date')?.value;
                    drawNameAndDate(ctx, w, h, candidateName, photoDate);
                } else if (currentMode === 'signature') {
                    cleanSignatureBackground(ctx, w, h);
                }

                const targetKB = parseFloat(document.getElementById('target-kb-input')?.value);
                const isPremiumUser = currentUser && currentUser.isPro;
                let resultDataUrl;

                if (currentMode === 'compress' && targetKB && targetKB > 0 && isPremiumUser) {
                    resultDataUrl = compressToTargetKB(canvas, mimeType, targetKB);
                } else {
                    quality = parseInt(document.getElementById('quality-slider')?.value || 70) / 100;
                    resultDataUrl = canvas.toDataURL(mimeType, quality);
                }

                let ext = 'jpg';
                if (mimeType === 'image/png') ext = 'png';
                else if (mimeType === 'image/webp') ext = 'webp';

                downloadDataUrl(resultDataUrl, `quickresizer_${currentMode}_${index + 1}.${ext}`);
                resolve();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function compressToTargetKB(canvas, mimeType, targetKB) {
    let minQuality = 0.01;
    let maxQuality = 0.98;
    let bestDataUrl = canvas.toDataURL(mimeType, maxQuality);

    for (let i = 0; i < 8; i++) {
        let midQuality = (minQuality + maxQuality) / 2;
        let testDataUrl = canvas.toDataURL(mimeType, midQuality);
        
        let head = `data:${mimeType};base64,`;
        let sizeInBytes = Math.round((testDataUrl.length - head.length) * 3 / 4);
        let sizeInKB = sizeInBytes / 1024;

        if (sizeInKB <= targetKB) {
            bestDataUrl = testDataUrl;
            minQuality = midQuality;
        } else {
            maxQuality = midQuality;
        }
    }
    return bestDataUrl;
}

function downloadDataUrl(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
}

// ==========================================
// 5. USER AUTHENTICATION & BILLING LOGIC
// ==========================================
function updateAuthUI() {
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');

    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) {
            const badge = currentUser.isPro ? ' ⭐PRO' : '';
            signupBtn.innerText = `Hi, ${currentUser.name.split(' ')[0]}${badge}`;
            signupBtn.onclick = logoutUser;
            signupBtn.title = 'Click to Logout';
        }
    } else {
        if (loginBtn) {
            loginBtn.style.display = 'inline-block';
            loginBtn.onclick = () => openAuthModal('login');
        }
        if (signupBtn) {
            signupBtn.innerText = 'Sign Up';
            signupBtn.onclick = () => openAuthModal('signup');
        }
    }
}

function openAuthModal(tab = 'login', triggerSubscription = false) {
    pendingSubscriptionAfterAuth = triggerSubscription;
    switchAuthTab(tab);
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
    pendingSubscriptionAfterAuth = false;
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('tab-login-btn');
    const signupTab = document.getElementById('tab-signup-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-form');
    const modalHeader = document.getElementById('modal-tabs-header');

    if (loginForm) loginForm.classList.add('hidden');
    if (signupForm) signupForm.classList.add('hidden');
    if (forgotForm) forgotForm.classList.add('hidden');

    if (tab === 'login') {
        if (modalHeader) modalHeader.style.display = 'flex';
        if (loginTab) loginTab.classList.add('active');
        if (signupTab) signupTab.classList.remove('active');
        if (loginForm) loginForm.classList.remove('hidden');
    } else if (tab === 'signup') {
        if (modalHeader) modalHeader.style.display = 'flex';
        if (signupTab) signupTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (signupForm) signupForm.classList.remove('hidden');
    } else if (tab === 'forgot') {
        if (modalHeader) modalHeader.style.display = 'none';
        if (forgotForm) forgotForm.classList.remove('hidden');
    }
}

function handleAuthSubmit(event, type) {
    event.preventDefault();
    
    if (type === 'signup') {
        const name = document.getElementById('signup-name').value;
        const mobile = document.getElementById('signup-mobile').value;
        const email = document.getElementById('signup-email').value.toLowerCase().trim();
        const password = document.getElementById('signup-password').value;

        const existingUser = registeredUsers.find(u => u.email === email);
        if (existingUser) {
            alert('❌ This Email ID is already registered! Please Login instead.');
            switchAuthTab('login');
            return;
        }

        const newUser = { name, mobile, email, password, isPro: false, plan: '' };
        registeredUsers.push(newUser);
        localStorage.setItem('quickresizer_registered_users', JSON.stringify(registeredUsers));

        currentUser = { name, email, mobile, isPro: false, plan: '' };
        localStorage.setItem('quickresizer_user', JSON.stringify(currentUser));
        
        alert(`✅ Account created successfully! Welcome, ${name}.`);

    } else if (type === 'login') {
        const email = document.getElementById('login-email').value.toLowerCase().trim();
        const password = document.getElementById('login-password').value;

        const user = registeredUsers.find(u => u.email === email && u.password === password);

        if (!user) {
            alert('❌ Incorrect Email or Password! Please check your credentials.');
            return;
        }

        currentUser = { name: user.name, email: user.email, mobile: user.mobile, isPro: user.isPro || false, plan: user.plan || '' };
        localStorage.setItem('quickresizer_user', JSON.stringify(currentUser));
        
        alert(`✅ Welcome back, ${currentUser.name}!`);

    } else if (type === 'forgot') {
        const email = document.getElementById('forgot-email').value.toLowerCase().trim();
        const newPassword = document.getElementById('forgot-new-password').value;

        const userIndex = registeredUsers.findIndex(u => u.email === email);

        if (userIndex === -1) {
            alert('❌ Email ID not found! Please register a new account.');
            switchAuthTab('signup');
            return;
        }

        registeredUsers[userIndex].password = newPassword;
        localStorage.setItem('quickresizer_registered_users', JSON.stringify(registeredUsers));

        alert('✅ Password updated successfully! Please Login with your new password.');
        switchAuthTab('login');
        return;
    }

    updateAuthUI();
    closeAuthModal();

    if (pendingSubscriptionAfterAuth) {
        openBillingModal();
    }
}

function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('quickresizer_user');
        currentUser = null;
        updateAuthUI();
        alert('You have logged out.');
    }
}

function buyPlan(planName, inrAmount, usdText) {
    selectedPlan = { name: planName, inrPrice: inrAmount, usdDisplay: usdText };
    
    if (!currentUser) {
        alert(`Please signup or login to your account before purchasing the ${planName} plan.`);
        openAuthModal('signup', true);
    } else {
        openBillingModal();
    }
}

// 🌐 Dynamic Billing Modal Updates (Fees & Taxes for Global Countries)
function updateBillingPrices() {
    const country = document.getElementById('billing-country')?.value || 'IN';
    const baseUsd = parseFloat(selectedPlan.usdDisplay.replace('$', '')) || 9.99;
    
    let transferFee = 0;
    let tax = 0;
    let total = 0;

    if (country === 'IN') {
        // India (IN): Display in INR Summary & standard 18% GST calculation
        document.getElementById('intl-fee-row').style.display = 'none';
        document.getElementById('summary-base').innerText = `₹${selectedPlan.inrPrice}`;
        
        tax = selectedPlan.inrPrice * 0.18;
        total = selectedPlan.inrPrice + tax;
        
        document.getElementById('summary-tax').innerText = `₹${Math.round(tax)}`;
        document.getElementById('summary-total').innerText = `₹${Math.round(total)}`;
        
        const payBtn = document.querySelector('#billing-form button[type="submit"]');
        if (payBtn) payBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Proceed to Pay ₹${Math.round(total)}`;
    } else {
        // International Countries: Display USD with 3.5% Gateway Transfer Fee + 18% Local Taxes/VAT
        document.getElementById('intl-fee-row').style.display = 'flex';
        document.getElementById('summary-base').innerText = `$${baseUsd.toFixed(2)}`;
        
        transferFee = (baseUsd * 0.035) + 0.30; // 3.5% + $0.30 base gateway processing charge
        tax = (baseUsd + transferFee) * 0.18;
        total = baseUsd + transferFee + tax;
        
        document.getElementById('summary-fee').innerText = `$${transferFee.toFixed(2)}`;
        document.getElementById('summary-tax').innerText = `$${tax.toFixed(2)}`;
        document.getElementById('summary-total').innerText = `$${total.toFixed(2)}`;
        
        const payBtn = document.querySelector('#billing-form button[type="submit"]');
        if (payBtn) payBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Proceed to Pay $${total.toFixed(2)}`;
    }
}

function openBillingModal() {
    const modal = document.getElementById('billing-modal');
    if (modal) {
        if (currentUser) {
            if (document.getElementById('billing-name')) document.getElementById('billing-name').value = currentUser.name || '';
            if (document.getElementById('billing-mobile')) document.getElementById('billing-mobile').value = currentUser.mobile || '';
        }
        
        modal.classList.remove('hidden');
        
        // Listen to Country Dropdown changes to update global transaction taxes/fees dynamically
        const countrySelect = document.getElementById('billing-country');
        if (countrySelect) {
            countrySelect.removeEventListener('change', updateBillingPrices);
            countrySelect.addEventListener('change', updateBillingPrices);
        }
        updateBillingPrices();
    }
}

function closeBillingModal() {
    const modal = document.getElementById('billing-modal');
    if (modal) modal.classList.add('hidden');
}

function handleBillingSubmit(event) {
    event.preventDefault();

    billingDetails = {
        name: document.getElementById('billing-name').value,
        country: document.getElementById('billing-country').value,
        mobile: document.getElementById('billing-mobile').value,
        city: document.getElementById('billing-city').value,
        state: document.getElementById('billing-state').value,
        pincode: document.getElementById('billing-pincode').value,
        email: currentUser ? currentUser.email : ''
    };

    closeBillingModal();
    initiateRazorpayPayment();
}

function initiateRazorpayPayment() {
    const razorpayKey = "rzp_live_TNXhcB0cg4sMeQ"; 

    // Handle price structure dynamically based on user country during gateway launch
    let finalAmountPayable = selectedPlan.inrPrice * 100; // Razorpay takes paise
    let currencySelected = "INR";

    if (billingDetails.country !== "IN") {
        const baseUsd = parseFloat(selectedPlan.usdDisplay.replace('$', '')) || 9.99;
        const transferFee = (baseUsd * 0.035) + 0.30;
        const tax = (baseUsd + transferFee) * 0.18;
        const totalUsd = baseUsd + transferFee + tax;
        
        // Convert dynamic global checkout values into dynamic gateway values
        finalAmountPayable = Math.round(totalUsd * 84 * 100); // 1 USD = ~84 INR conversion for Razorpay architecture mapping
    } else {
        const taxInr = selectedPlan.inrPrice * 0.18;
        finalAmountPayable = Math.round((selectedPlan.inrPrice + taxInr) * 100);
    }

    const options = {
        "key": razorpayKey, 
        "amount": finalAmountPayable,
        "currency": currencySelected,
        "name": "QuickResizer",
        "description": `${selectedPlan.name} Plan - Global Secure Checkout`,
        "image": "https://quickresizer.in/favicon.ico",
        "handler": function (response) {
            if (currentUser) {
                currentUser.isPro = true;
                currentUser.plan = selectedPlan.name;
                localStorage.setItem('quickresizer_user', JSON.stringify(currentUser));
                
                const userIndex = registeredUsers.findIndex(u => u.email === currentUser.email);
                if (userIndex !== -1) {
                    registeredUsers[userIndex].isPro = true;
                    registeredUsers[userIndex].plan = selectedPlan.name;
                    localStorage.setItem('quickresizer_registered_users', JSON.stringify(registeredUsers));
                }
                
                updateAuthUI();
            }

            let supportMsg = "24×7 Email Support";
            if (selectedPlan.name === 'Professional' || selectedPlan.name === 'Yearly') {
                supportMsg = "24×7 Direct Customer Care Call & VIP Support";
            }

            alert(`🎉 Congratulations!\nPayment Successful! Payment ID: ${response.razorpay_payment_id}\n\nYour ${selectedPlan.name} PRO Account is now ACTIVE!\nIncluded Support: ${supportMsg}`);
        },
        "prefill": {
            "name": billingDetails.name || (currentUser ? currentUser.name : ""),
            "email": billingDetails.email || (currentUser ? currentUser.email : ""),
            "contact": billingDetails.mobile || (currentUser ? currentUser.mobile : "")
        },
        "notes": {
            "plan_name": selectedPlan.name,
            "usd_price": selectedPlan.usdDisplay,
            "billing_country": billingDetails.country || "IN",
            "city": billingDetails.city || "",
            "state": billingDetails.state || "",
            "pincode": billingDetails.pincode || ""
        },
        "theme": {
            "color": "#0284c7"
        }
    };

    if (typeof Razorpay !== 'undefined') {
        const rzp1 = new Razorpay(options);
        rzp1.open();
    } else {
        alert('Razorpay Gateway is loading. Please try again in 5 seconds.');
    }
}

// Initialize Auth state on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});
