# BrowserBurner ♨️

[![Visit Site](https://img.shields.io/badge/Visit%20Site-browserburner.com-brightgreen)](https://browserburner.com)

A simple, web-based CPU & GPU stress-testing tool. Its primary purpose is to push your hardware to its limits, generating load... and a surprising amount of heat.



## ⚠️ WARNING: USE AT YOUR OWN RISK

> This is a hardware stress-testing tool. Running it will push your computer's **CPU and GPU to 100% load**.
>
> This can cause your system to **freeze, crash, or become unresponsive**. In rare cases, running this for extended periods on hardware with poor cooling could **cause permanent damage**.
>
> **Save all your work** before starting this test. The creators of this tool are not responsible for any data loss or hardware damage.

---

## 🤔 Why?

The original idea was simple: my office was cold. This project started as a Python script to spin up CPU cores and act as a small "desk heater." It evolved into a full-fledged, client-side web application to control both CPU and GPU load, complete with a UI and safety warnings.

## ✨ Features

* **CPU Stress Test:** Uses **Web Workers** to max out a user-defined number of CPU cores with a continuous calculation.
* **GPU Stress Test:** Uses **WebGL** to run a highly complex fragment shader on a hidden canvas, pushing the GPU to 100% load.
* **Fine-Grained Control:** Sliders allow you to select the *exact* number of CPU cores to use and the "intensity" (canvas size) of the GPU load.
* **Settings Remembered:** Your last-used settings (CPU cores, GPU size, etc.) are saved in a cookie for your next visit.
* **Safety First:** An interstitial warning modal forces users to acknowledge the risks before the tool will even load.
* **Lightweight & Fast:** Built as a 100% static site. Styled with [Pico.css](https://picocss.com/) for a clean, lightweight, and responsive UI.

---

## 🛠️ How It Works

This project is built entirely with client-side HTML, CSS, and JavaScript. There is no server-side component.

1.  **CPU Load (`worker.js`):**
    * When you start the test, the main script (`main.js`) launches one **Web Worker** for each CPU core you selected.
    * Each worker runs a simple, infinite loop (`while (true) { Math.sqrt(123456789.0); }`), which is computationally expensive enough to load a single CPU core to 100%.
    * Running this in workers prevents the main browser tab from freezing.

2.  **GPU Load (`main.js`):**
    * When "Include GPU" is checked, the script creates a hidden `<canvas>` element and gets a WebGL context.
    * It compiles a **fragment shader** designed to be as computationally difficult as possible (a `for` loop with 50,000+ iterations of `sin()`, `cos()`, and `tan()`).
    * It then uses `requestAnimationFrame` to run this shader on every pixel of the canvas, every single frame, forcing the GPU into a 100% load state.
    * The "GPU Intensity" slider directly controls the size of this canvas (e.g., 300x300 = 90,000 pixels being shaded every frame).

---

## 🚀 How to Run Locally

This is a fully static website. However, you cannot simply open the `index.html` file from your file system due to browser security policies around Web Workers (`file://` paths).

To run it locally, you must serve the files from a simple local server.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/browserburner.git](https://github.com/your-username/browserburner.git)
    cd browserburner
    ```

2.  **Start a local server:**
    The easiest way is to use Python's built-in module.

    *If you have Python 3:*
    ```bash
    python3 -m http.server 8000
    ```
    *If you have Python 2:*
    ```bash
    python -m SimpleHTTPServer 8000
    ```

3.  **Open in your browser:**
    Navigate to `http://localhost:8000`

---

## 📜 Disclaimer

This tool is provided as-is for educational and entertainment purposes. The creator is not responsible for any data loss, hardware damage, or increased electricity bills that may result from its use. **Use this tool responsibly.**

## License

[MIT License](LICENSE.md)

Copyright (c) 2025 [Bjorkor]
