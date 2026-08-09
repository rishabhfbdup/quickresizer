// Global App States & Local Storage DB
let currentMode = 'resize';
let uploadedFiles = [];
let cropperInstance = null;
let registeredUsers = JSON.parse(localStorage.getItem('quickresizer_registered_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('quickresizer_user')) || null;
let pendingSubscriptionAfterAuth = false;

// ==========================================
// 1. TOOL MODE SWITCHER LOGIC
// ==========================================
function switchMode(mode) {
    currentMode = mode;

    // Update Action Tabs UI
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
        crop: "Drag and adjust box to visual crop your image precisely.",
        compress: "Set exact target KB (e.g. 20KB, 50KB) or adjust compression slider.",
        convert: "Convert images from JPG, PNG, WEBP to desired formats instantly."
    };

    if (document.getElementById('mode-title')) document.getElementById('mode-title').innerText = titles[mode];
    if (document.getElementById('mode-desc')) document.getElementById('mode-desc').innerText = descs[mode];

    // Hide All Panels and Show Selected Panel
    document.querySelectorAll('.mode-panel').forEach(panel => panel.classList.add('hidden'));
    const selectedPanel = document.getElementById(`panel-${mode}`);
    if (selectedPanel) selectedPanel.classList.remove('hidden');

    // Handle Cropper Initialization on Crop Mode
    if (currentMode === 'crop' && document.getElementById('image-preview').src) {
        initCropper();
    } else {
        destroyCropper();
    }

    // Update Download Button Text
    const btn = document.getElementById('process-btn');
    if (btn) {
        const countText = uploadedFiles.length > 1 ? ` (${uploadedFiles.length} Files)` : '';
        if (mode === 'resize') btn.innerHTML = `<i class="fa-solid fa-download"></i> Resize & Download${countText}`;
        else if (mode === 'crop') btn.innerHTML = `<i class="fa-solid fa-crop"></i> Crop & Download`;
        else if (mode === 'compress') btn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Compress KB & Download${countText}`;
        else if (mode === 'convert') btn.innerHTML = `<i class="fa-solid fa-arrows-repeat"></i> Convert & Download${countText}`;
    }
}

// ==========================================
// 2. FILE UPLOAD & DRAG-DROP LOGIC
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

function handleFiles(files) {
    uploadedFiles = Array.from(files);
    const firstFile = uploadedFiles[0];

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

    switchMode(currentMode);
}

// ==========================================
// 3. CROPPER.JS VISUAL CROPPER
// ==========================================
function initCropper() {
    destroyCropper();
    if (typeof Cropper !== 'undefined' && imagePreview && imagePreview.src) {
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

// ==========================================
// 4. IMAGE PROCESSING & BINARY SEARCH COMPRESSOR
// ==========================================
document.getElementById('process-btn')?.addEventListener('click', async () => {
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
});

function processSingleFile(file, index) {
    return new Promise((resolve) => {
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
                ctx.drawImage(img, 0, 0, w, h);

                const targetKB = parseFloat(document.getElementById('target-kb-input')?.value);
                let resultDataUrl;

                if (currentMode === 'compress' && targetKB && targetKB > 0) {
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
// 5. USER AUTHENTICATION & RAZORPAY PAYMENT
// ==========================================
function updateAuthUI() {
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');

    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) {
            signupBtn.innerText = `Hi, ${currentUser.name.split(' ')[0]}`;
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

        // Validation for Duplicate Email
        const existingUser = registeredUsers.find(u => u.email === email);
        if (existingUser) {
            alert('❌ This Email ID is already registered! Please Login instead.');
            switchAuthTab('login');
            return;
        }

        const newUser = { name, mobile, email, password };
        registeredUsers.push(newUser);
        localStorage.setItem('quickresizer_registered_users', JSON.stringify(registeredUsers));

        currentUser = { name, email, mobile };
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

        currentUser = { name: user.name, email: user.email, mobile: user.mobile };
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
        initiateRazorpayPayment();
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

function buyProSubscription() {
    if (!currentUser) {
        alert('Please signup or login to your account before purchasing the Pro Plan.');
        openAuthModal('signup', true);
    } else {
        initiateRazorpayPayment();
    }
}

function initiateRazorpayPayment() {
    const razorpayKey = "rzp_test_YOUR_KEY_HERE"; // Replace with your live Razorpay key ID

    const options = {
        "key": razorpayKey, 
        "amount": 29900, // ₹299
        "currency": "INR",
        "name": "QuickResizer Pro Plan",
        "description": "Unlimited Bulk Resizing & High Speed Access",
        "image": "https://quickresizer.in/favicon.ico",
        "handler": function (response) {
            alert(`Payment Successful!\nPayment ID: ${response.razorpay_payment_id}\nYour Pro Plan is now ACTIVE!`);
        },
        "prefill": {
            "name": currentUser ? currentUser.name : "",
            "email": currentUser ? currentUser.email : "",
            "contact": currentUser ? currentUser.mobile : ""
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
