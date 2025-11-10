/**
 * main.js
 * * Manages warning modal, settings, and stress test controls.
 */

// --- DOM Elements ---
const statusElement = document.getElementById('status');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

const coreSlider = document.getElementById('coreSlider');
const sliderValue = document.getElementById('sliderValue');
const gpuCheckbox = document.getElementById('gpuCheckbox');
const gpuSlider = document.getElementById('gpuSlider');
const gpuSliderValue = document.getElementById('gpuSliderValue');

// --- NEW: Warning Modal Elements ---
const warningModal = document.getElementById('warning-modal');
const mainControls = document.getElementById('main-controls');
const confirmCheck = document.getElementById('confirm-check');
const agreeButton = document.getElementById('agree-button');
const warningKey = "heaterWarningAcknowledged";

// --- Global State ---
let workers = [];
let gl; 
let gpuProgram; 
let gpuLoopId = 0; 
let gpuCanvas; 
const settingsCookieName = "heaterSettings";

// --- Initialization ---
const totalCores = navigator.hardwareConcurrency || 4; 
const defaultCores = totalCores > 1 ? totalCores - 1 : 1;
coreSlider.max = totalCores;

// --- Event Listeners ---
coreSlider.addEventListener('input', () => {
    sliderValue.textContent = coreSlider.value;
});

gpuSlider.addEventListener('input', () => {
    gpuSliderValue.textContent = `${gpuSlider.value}x${gpuSlider.value}`;
});

startButton.addEventListener('click', startStress);
stopButton.addEventListener('click', stopStress);

// --- NEW: Modal Management ---

function showMainControls() {
    mainControls.style.visibility = 'visible';
    mainControls.style.opacity = 1;
}

function initWarningModal() {
    if (localStorage.getItem(warningKey)) {
        // User has already agreed
        warningModal.close(); // Hide modal
        showMainControls();
        loadSettings(); // Load settings now
    } else {
        // User needs to agree
        // Modal is open by default
        
        confirmCheck.addEventListener('change', () => {
            // Enable button only if checkbox is ticked
            agreeButton.disabled = !confirmCheck.checked;
        });

        agreeButton.addEventListener('click', () => {
            // User agrees. Save to localStorage.
            localStorage.setItem(warningKey, 'true');
            warningModal.close();
            showMainControls();
            loadSettings(); // Load settings now
        });
    }
}

// --- Main Functions ---

function startStress() {
    if (workers.length > 0 || gpuLoopId !== 0) {
        console.log("Stress test is already running.");
        return;
    }
    saveSettings(); // Save settings

    // (Rest of the function is the same...)
    const coresToUse = parseInt(coreSlider.value, 10);
    console.log(`Starting stress test on ${coresToUse} CPU cores...`);
    
    for (let i = 0; i < coresToUse; i++) {
        try {
            const worker = new Worker('worker.js');
            workers.push(worker);
            console.log(`Started CPU worker ${i + 1}`);
        } catch (e) {
            console.error("Failed to create worker:", e);
        }
    }

    let gpuStatus = "";
    if (gpuCheckbox.checked) {
        const gpuSize = parseInt(gpuSlider.value, 10); 
        console.log(`Starting GPU stress test at ${gpuSize}x${gpuSize}...`);
        
        if (startGpuStress(gpuSize)) { 
            gpuStatus = " and 1 GPU";
        } else {
            gpuStatus = " (GPU failed to start)";
        }
    }
    
    statusElement.textContent = `Status: Running on ${coresToUse} CPU cores${gpuStatus}...`;
    
    coreSlider.disabled = true;
    gpuCheckbox.disabled = true;
    gpuSlider.disabled = true; 
    startButton.disabled = true;
}

function stopStress() {
    if (workers.length === 0 && gpuLoopId === 0) {
        console.log("No test running.");
        return;
    }

    console.log("\nStopping CPU stress test...");
    for (const worker of workers) {
        worker.terminate();
    }
    workers = []; 
    console.log("All CPU workers stopped.");

    if (gpuLoopId !== 0) {
        console.log("Stopping GPU stress test...");
        stopGpuStress();
        console.log("GPU stress test stopped.");
    }
    
    statusElement.textContent = "Status: Idle";
    
    coreSlider.disabled = false;
    gpuCheckbox.disabled = false;
    gpuSlider.disabled = false; 
    startButton.disabled = false;
}


// --- GPU HELPER FUNCTIONS (Unchanged) ---
// (All the GPU functions remain here, unchanged)

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initGpuStress(size) { 
    try {
        if (gpuCanvas) {
            gpuCanvas.remove();
        }
        gpuCanvas = document.createElement('canvas');
        gpuCanvas.width = size; 
        gpuCanvas.height = size; 
        gl = gpuCanvas.getContext('webgl');
        if (!gl) {
            console.error("WebGL not supported!");
            return false;
        }
        const vsSource = `attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;
        const fsSource = `precision highp float; void main() { float result = 0.0; for (float i = 0.0; i < 50000.0; i++) { result += sin(i * 0.01) * cos(i * 0.02) * tan(i * 0.03); } gl_FragColor = vec4(fract(result), 0.0, 0.0, 1.0); }`;
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        gpuProgram = gl.createProgram();
        gl.attachShader(gpuProgram, vertexShader);
        gl.attachShader(gpuProgram, fragmentShader);
        gl.linkProgram(gpuProgram);
        if (!gl.getProgramParameter(gpuProgram, gl.LINK_STATUS)) {
            console.error('Error linking shader program:', gl.getProgramInfoLog(gpuProgram));
            return false;
        }
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [-1.0, -1.0, 1.0, -1.0, -1.0,  1.0, -1.0,  1.0, 1.0, -1.0, 1.0,  1.0,];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        const positionAttributeLocation = gl.getAttribLocation(gpuProgram, "a_position");
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0); 
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.useProgram(gpuProgram);
        return true;
    } catch (e) {
        console.error("Error initializing GPU stress test:", e);
        return false;
    }
}

function renderGpuFrame() {
    gl.drawArrays(gl.TRIANGLES, 0, 6); 
    gpuLoopId = requestAnimationFrame(renderGpuFrame);
}

function startGpuStress(size) { 
    if (!initGpuStress(size)) { return false; }
    gpuLoopId = requestAnimationFrame(renderGpuFrame);
    return true;
}

function stopGpuStress() {
    if (gpuLoopId !== 0) {
        cancelAnimationFrame(gpuLoopId);
        gpuLoopId = 0;
    }
    gl = null;
    if (gpuCanvas) {
        gpuCanvas.remove();
        gpuCanvas = null;
    }
}

// --- COOKIE FUNCTIONS (Unchanged) ---
// (All cookie functions remain here, unchanged)

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (JSON.stringify(value) || "")  + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            return JSON.parse(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

function saveSettings() {
    const settings = {
        cpuCores: coreSlider.value,
        gpuSize: gpuSlider.value,
        useGpu: gpuCheckbox.checked
    };
    setCookie(settingsCookieName, settings, 365);
    console.log("Settings saved:", settings);
}

function loadSettings() {
    const settings = getCookie(settingsCookieName);
    console.log("Loading settings:", settings);

    if (settings) {
        coreSlider.value = settings.cpuCores;
        gpuSlider.value = settings.gpuSize;
        gpuCheckbox.checked = settings.useGpu;
    } else {
        coreSlider.value = defaultCores;
        gpuSlider.value = 100;
        gpuCheckbox.checked = false;
    }

    sliderValue.textContent = coreSlider.value;
    gpuSliderValue.textContent = `${gpuSlider.value}x${gpuSlider.value}`;
}

// --- Run on page load ---
// We now run the modal init first, which will THEN run loadSettings()
// loadSettings(); // <-- Don't run this here anymore
initWarningModal(); // <-- This is the new entry point
