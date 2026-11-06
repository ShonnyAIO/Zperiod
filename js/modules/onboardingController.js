
import { t } from "./langController.js";

/**
 * Enhanced Onboarding Flow for Zperiod 2.0
 */
export function initOnboardingFlow() {
  const overlay = document.createElement("div");
  overlay.id = "zperiod-onboarding-overlay";
  overlay.innerHTML = `
    <style>
      #zperiod-onboarding-overlay {
        position: fixed;
        inset: 0;
        background: #ffffff;
        z-index: 1000000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-family: 'Inter', -apple-system, sans-serif;
      }

      .logo-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 120px;
      }

      .logo-z {
        width: 100px;
        height: 100px;
        z-index: 2;
        transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        background: transparent;
      }

      .logo-text {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-size: 64px;
        font-weight: 800;
        color: #1e293b;
        letter-spacing: -2px;
        opacity: 0;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1;
        transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
      }

      .logo-container.expanded .logo-z {
        transform: translateX(-95px);
      }

      .logo-container.expanded .logo-text {
        opacity: 1;
        transform: translateX(-15px);
      }

      .danmaku-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        opacity: 0;
        transition: opacity 1.5s ease;
      }

      .danmaku-container.visible {
        opacity: 0.25;
      }

      .danmaku-item {
        position: absolute;
        white-space: nowrap;
        font-weight: 700;
        color: #475569;
        opacity: 0.6;
        filter: blur(0.5px);
        animation: danmaku-move linear forwards;
      }

      @keyframes danmaku-move {
        from { transform: translateX(-100%); left: 0; }
        to { transform: translateX(100vw); left: 0; }
      }

      .start-btn-container {
        margin-top: 24px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.6s ease;
        z-index: 10;
      }

      .start-btn-container.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .onboarding-btn {
        padding: 14px 40px;
        background: #1e293b;
        color: white;
        border: none;
        border-radius: 14px;
        font-size: 1.05rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .onboarding-btn:hover {
        transform: translateY(-2px);
        background: #000;
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      }

    </style>
    <div class="danmaku-container" id="danmaku-field"></div>
    
    <div id="animation-stage" style="display:flex; flex-direction:column; align-items:center;">
        <div class="logo-container" id="onboarding-logo">
          <img src="logo.svg" class="logo-z" alt="Z">
          <span class="logo-text">Periódica UCV</span>
        </div>
        
        <div class="start-btn-container" id="start-btn-box">
          <button class="onboarding-btn" id="onboarding-start-btn">${t("onboarding.start")}</button>
        </div>
    </div>

  `;
  document.body.appendChild(overlay);

  const logoContainer = document.getElementById("onboarding-logo");
  const danmakuField = document.getElementById("danmaku-field");
  const startBtnBox = document.getElementById("start-btn-box");
  const startBtn = document.getElementById("onboarding-start-btn");
  const stage = document.getElementById("animation-stage");

  // Step 1: Initial Delay then Expand Logo
  setTimeout(() => {
    logoContainer.classList.add("expanded");
  }, 800);

  // Step 2: Show Danmaku and Start Button after Logo animation
  setTimeout(() => {
    danmakuField.classList.add("visible");
    startBtnBox.classList.add("visible");
    startDanmaku();
  }, 1600);

  function startDanmaku() {
    const phrases = t("onboarding.phrases", []);
    const allPhrases = Array.isArray(phrases) ? [...phrases] : [];

    if (allPhrases.length === 0) {
        allPhrases.push("Periódica UCV", "Chemistry", "Atom", "Molecule");
    }

    const createItem = () => {
      if (!overlay.parentElement) return;
      const item = document.createElement("div");
      item.className = "danmaku-item";
      item.textContent = allPhrases[Math.floor(Math.random() * allPhrases.length)];
      
      const top = Math.random() * 85 + 5; 
      const size = Math.random() * 0.8 + 0.9; 
      const duration = Math.random() * 12 + 10; 
      
      item.style.top = `${top}%`;
      item.style.fontSize = `${size}rem`;
      item.style.animationDuration = `${duration}s`;
      
      danmakuField.appendChild(item);
      item.addEventListener("animationend", () => item.remove());
      
      setTimeout(createItem, 1500 + Math.random() * 1000);
    };

    for(let i=0; i<4; i++) setTimeout(createItem, i * 1000);
  }

  startBtn.addEventListener("click", () => {
    // Background danmaku fades out
    danmakuField.style.opacity = "0";
    stage.style.transition = "all 0.5s ease";
    stage.style.opacity = "0";
    stage.style.transform = "translateY(-20px)";
    
    setTimeout(() => {
        stage.style.display = "none";
    }, 500);

    localStorage.setItem("zperiod_welcomed_v2", "true");
    
    // Smooth seamless transition: Create a temporary white overlay to hide the reload flash
    const transitionOverlay = document.createElement("div");
    Object.assign(transitionOverlay.style, {
      position: "fixed",
      inset: "0",
      background: "white",
      zIndex: "2000000",
      opacity: "0",
      transition: "opacity(0.4s ease)"
    });
    document.body.appendChild(transitionOverlay);

    requestAnimationFrame(() => {
      transitionOverlay.style.opacity = "1";
      setTimeout(() => {
        window.location.reload();
      }, 450);
    });
  });
}
