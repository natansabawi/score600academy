/**
 * Score600Academy - Telegram Mini App & Secure Study Companion
 * Core Controller: Google Drive Preview Ingestion, Iframe DRM, Telegram SDK & PDF Canvas Fallback
 */

(function () {
  "use strict";

  // =========================================================================
  // 1. STATE & TELEGRAM INITIALIZATION
  // =========================================================================
  const tg = window.Telegram?.WebApp;

  const state = {
    selectedGrade: "9", // 'all' | '9' | '10' | '11' | '12'
    selectedCategory: "all",
    searchQuery: "",
    bookmarks: JSON.parse(localStorage.getItem("score600_bookmarks") || "[]"),
    activeDoc: null,
    viewerMode: "drive", // 'drive' (iframe preview) | 'canvas' (PDF.js canvas)
    readingMode: "normal", // 'normal' | 'comfort' | 'dark'
    
    // Canvas PDF.js State (Fallback Engine)
    pdfDoc: null,
    currentPage: 1,
    totalPages: 1,
    currentScale: 1.0,
    isRendering: false,
    pagePendingRender: null,

    // Dynamic Telegram Profile
    telegramUser: {
      id: "TG-600982",
      first_name: "Student",
      username: "score600_scholar"
    }
  };

  // Configure PDF.js Worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  // DOM Elements Cache
  const DOM = {
    userAvatar: document.getElementById("user-avatar"),
    userName: document.getElementById("user-name"),
    userStatus: document.getElementById("user-status"),
    searchInput: document.getElementById("search-input"),
    clearSearchBtn: document.getElementById("clear-search-btn"),
    gradePills: document.querySelectorAll(".grade-pill"),
    catPills: document.querySelectorAll(".cat-pill"),
    materialsGrid: document.getElementById("materials-grid"),
    emptyState: document.getElementById("empty-state"),
    resetFilterBtn: document.getElementById("reset-filter-btn"),
    catalogueHeading: document.getElementById("catalogue-heading"),
    materialsCountBadge: document.getElementById("materials-count-badge"),
    bookmarkCount: document.getElementById("bookmark-count"),
    heroBannerTitle: document.getElementById("hero-banner-title"),

    // Ingest Custom Drive Link Modal
    openIngestBtn: document.getElementById("open-ingest-btn"),
    ingestModal: document.getElementById("ingest-modal"),
    closeIngestModalBtn: document.getElementById("close-ingest-modal-btn"),
    cancelIngestBtn: document.getElementById("cancel-ingest-btn"),
    submitIngestBtn: document.getElementById("submit-ingest-btn"),
    driveInputUrl: document.getElementById("drive-input-url"),
    driveInputTitle: document.getElementById("drive-input-title"),

    // Secure Reader Modal
    readerModal: document.getElementById("secure-reader-modal"),
    readerCloseBtn: document.getElementById("reader-close-btn"),
    readerDocTitle: document.getElementById("reader-doc-title"),
    readerGradeBadge: document.getElementById("reader-grade-badge"),
    readerThemeToggle: document.getElementById("reader-theme-toggle"),
    themeModeIcon: document.getElementById("theme-mode-icon"),
    readerViewModeToggle: document.getElementById("reader-view-mode-toggle"),
    readerModeLabel: document.getElementById("reader-mode-label"),
    readerBookmarkBtn: document.getElementById("reader-bookmark-btn"),
    readerStage: document.getElementById("reader-stage"),
    readerLoader: document.getElementById("reader-loader"),
    readerLoaderText: document.getElementById("reader-loader-text"),

    // Google Drive Iframe Viewer
    driveViewerContainer: document.getElementById("drive-viewer-container"),
    drivePreviewIframe: document.getElementById("drive-preview-iframe"),
    driveWatermarkOverlay: document.getElementById("drive-watermark-overlay"),

    // High-Fidelity Canvas Fallback
    canvasWrapper: document.getElementById("canvas-wrapper"),
    pdfCanvas: document.getElementById("pdf-render-canvas"),
    canvasWatermark: document.getElementById("canvas-watermark"),
    canvasShield: document.getElementById("canvas-shield"),
    readerBottomBar: document.getElementById("reader-bottom-bar"),
    prevPageBtn: document.getElementById("prev-page-btn"),
    nextPageBtn: document.getElementById("next-page-btn"),
    currentPageInput: document.getElementById("current-page-input"),
    totalPagesSpan: document.getElementById("total-pages-span"),

    // Protections
    securityToast: document.getElementById("security-toast"),
    securityBlurShield: document.getElementById("security-blur-shield")
  };

  /**
   * Initialize Telegram Mini App
   */
  function initTelegramWebApp() {
    if (tg) {
      tg.ready();
      tg.expand();
      if (typeof tg.enableClosingConfirmation === "function") {
        tg.enableClosingConfirmation();
      }

      const user = tg.initDataUnsafe?.user;
      if (user) {
        state.telegramUser = {
          id: user.id || state.telegramUser.id,
          first_name: user.first_name || "Student",
          username: user.username || ""
        };
      }

      // Native BackButton handler
      if (tg.BackButton) {
        tg.BackButton.onClick(() => {
          if (!DOM.readerModal.classList.contains("hidden")) {
            closeReader();
          } else if (!DOM.ingestModal.classList.contains("hidden")) {
            closeIngestModal();
          }
        });
      }

      applyTelegramTheme();
      tg.onEvent("themeChanged", applyTelegramTheme);
    }

    updateUserProfileDisplay();
  }

  function applyTelegramTheme() {
    if (!tg || !tg.themeParams) return;
    const p = tg.themeParams;
    const root = document.documentElement;
    if (p.bg_color) root.style.setProperty("--bg-primary", p.bg_color);
    if (p.secondary_bg_color) root.style.setProperty("--bg-secondary", p.secondary_bg_color);
    if (p.text_color) root.style.setProperty("--text-main", p.text_color);
    if (p.hint_color) root.style.setProperty("--text-secondary", p.hint_color);
    if (p.button_color) root.style.setProperty("--accent-primary", p.button_color);
  }

  function updateUserProfileDisplay() {
    const user = state.telegramUser;
    DOM.userName.textContent = user.first_name;
    const initial = (user.first_name || "S").charAt(0).toUpperCase();
    DOM.userAvatar.textContent = initial;
    DOM.userStatus.textContent = "Verified Scholar";
  }

  function triggerHaptic(type = "light") {
    if (tg?.HapticFeedback) {
      if (type === "light" || type === "medium" || type === "heavy") {
        tg.HapticFeedback.impactOccurred(type);
      } else if (type === "warning" || type === "error" || type === "success") {
        tg.HapticFeedback.notificationOccurred(type);
      } else if (type === "selection") {
        tg.HapticFeedback.selectionChanged();
      }
    }
  }

  // =========================================================================
  // 2. SECURITY & DRM PROTECTION LAYER
  // =========================================================================
  let toastTimeout = null;

  function showSecurityToast(message = "Direct downloads, saving, and copying are disabled.") {
    triggerHaptic("warning");
    const toastDesc = DOM.securityToast.querySelector(".toast-desc");
    if (toastDesc) toastDesc.textContent = message;

    DOM.securityToast.classList.remove("hidden");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      DOM.securityToast.classList.add("hidden");
    }, 2800);
  }

  function setupDRMProtections() {
    // 1. Block Context Menu (Right Click / Long Press)
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showSecurityToast("Right-click & saving are restricted on study materials.");
      return false;
    });

    // 2. Block Clipboard Copy / Cut / Selection
    document.addEventListener("copy", (e) => {
      e.preventDefault();
      showSecurityToast("Content copying is disabled to protect material integrity.");
      return false;
    });

    document.addEventListener("cut", (e) => {
      e.preventDefault();
      return false;
    });

    // 3. Block Dangerous Keyboard Shortcuts (Ctrl+S, Ctrl+P, Ctrl+C, Ctrl+U, F12)
    document.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Print (Ctrl/Cmd + P)
      if (modKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        showSecurityToast("Printing is restricted for Score600 study materials.");
        return false;
      }

      // Save (Ctrl/Cmd + S)
      if (modKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        showSecurityToast("Direct file downloading is restricted.");
        return false;
      }

      // Copy (Ctrl/Cmd + C) while inside Reader
      if (modKey && (e.key === "c" || e.key === "C") && !DOM.readerModal.classList.contains("hidden")) {
        e.preventDefault();
        showSecurityToast("Copying text is restricted in secure study mode.");
        return false;
      }

      // View Source (Ctrl/Cmd + U)
      if (modKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return false;
      }

      // DevTools
      if (e.key === "F12" || (modKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))) {
        e.preventDefault();
        return false;
      }

      // PrintScreen Key
      if (e.key === "PrintScreen") {
        obfuscateContentTemporarily();
        showSecurityToast("Screen capture attempt flagged.");
      }
    });

    // 4. Temporary Obfuscation when Window loses Focus
    window.addEventListener("blur", () => {
      if (!DOM.readerModal.classList.contains("hidden")) {
        DOM.securityBlurShield.classList.remove("hidden");
      }
    });

    window.addEventListener("focus", () => {
      DOM.securityBlurShield.classList.add("hidden");
    });
  }

  function obfuscateContentTemporarily() {
    DOM.securityBlurShield.classList.remove("hidden");
    setTimeout(() => {
      DOM.securityBlurShield.classList.add("hidden");
    }, 1500);
  }

  /**
   * Generates dynamic tiled watermarks identifying the specific Telegram User & Session
   */
  function generateDynamicWatermarks() {
    const user = state.telegramUser;
    const now = new Date();
    const timeString = now.toISOString().slice(0, 16).replace("T", " ");
    const text = `UID: ${user.id} | @${user.username || user.first_name} | Score600 DRM | ${timeString} UTC`;

    // Over Iframe
    DOM.driveWatermarkOverlay.innerHTML = "";
    for (let i = 0; i < 16; i++) {
      const item = document.createElement("div");
      item.className = "watermark-item";
      item.textContent = text;
      DOM.driveWatermarkOverlay.appendChild(item);
    }

    // Over Canvas
    DOM.canvasWatermark.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      const item = document.createElement("div");
      item.className = "watermark-item";
      item.textContent = text;
      DOM.canvasWatermark.appendChild(item);
    }
  }

  // =========================================================================
  // 3. CATALOGUE RENDERING & GRADE/SUBJECT FILTERING
  // =========================================================================
  function renderCatalogue() {
    const list = window.SCORE600_MATERIALS || [];
    const query = state.searchQuery.toLowerCase().trim();

    const filtered = list.filter((item) => {
      // Grade Filter
      if (state.selectedGrade !== "all" && String(item.grade) !== String(state.selectedGrade)) {
        return false;
      }

      // Category / Subject Filter
      if (state.selectedCategory === "bookmarked") {
        if (!state.bookmarks.includes(item.id)) return false;
      } else if (state.selectedCategory !== "all" && item.category !== state.selectedCategory) {
        return false;
      }

      // Search Query Filter
      if (query) {
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchSubject = item.subject.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchDriveId = (item.driveFileId || "").toLowerCase().includes(query);
        return matchTitle || matchSubject || matchDesc || matchDriveId;
      }

      return true;
    });

    // Update Headings & Count Badges
    const gradeTitleMap = {
      all: "All Grades (9 to 12) Study Materials",
      "9": "Grade 9 Study Materials & Exam Prep",
      "10": "Grade 10 Board Prep & STEM Materials",
      "11": "Grade 11 Advanced Revision & Notes",
      "12": "Grade 12 National Board & Score600 Prep"
    };

    DOM.catalogueHeading.textContent = gradeTitleMap[state.selectedGrade] || "Study Materials";
    DOM.materialsCountBadge.textContent = `${filtered.length} Material${filtered.length === 1 ? "" : "s"} Available`;
    DOM.bookmarkCount.textContent = state.bookmarks.length;

    // Handle Empty State
    if (filtered.length === 0) {
      DOM.materialsGrid.innerHTML = "";
      DOM.emptyState.classList.remove("hidden");
      return;
    }

    DOM.emptyState.classList.add("hidden");

    // Render Study Cards with "Read Securely" buttons
    DOM.materialsGrid.innerHTML = filtered
      .map((item) => {
        const isBookmarked = state.bookmarks.includes(item.id);
        const previewUrl = window.buildGoogleDrivePreviewUrl(item.driveFileId);

        return `
        <article class="study-card" data-id="${item.id}">
          <div>
            <div class="card-top">
              <div class="badges-group">
                <span class="grade-badge-card">Grade ${item.grade}</span>
                <span class="subject-badge">${escapeHTML(item.subject)}</span>
              </div>
              <div class="card-actions">
                <button class="bookmark-toggle-btn ${isBookmarked ? "bookmarked" : ""}" data-id="${item.id}" title="Save Document">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="${isBookmarked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <h3 class="study-card-title">${escapeHTML(item.title)}</h3>
            <p class="study-card-desc">${escapeHTML(item.description)}</p>
          </div>

          <div>
            <div class="card-meta">
              <div class="meta-item">
                <span>📄</span>
                <span>${item.pagesCount} Pages</span>
              </div>
              <div class="meta-item">
                <span>⏱️</span>
                <span>${item.estimatedTime}</span>
              </div>
              <div class="meta-item">
                <span>⭐</span>
                <span>${item.rating}</span>
              </div>
            </div>

            <div class="card-footer-action">
              <div class="drive-sync-tag" title="Google Drive File ID: ${escapeHTML(item.driveFileId)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                </svg>
                <span>Drive Synced</span>
              </div>

              <button class="read-securely-btn open-reader-btn" data-id="${item.id}" data-url="${previewUrl}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Read Securely</span>
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join("");
  }

  function toggleBookmark(docId) {
    triggerHaptic("selection");
    const index = state.bookmarks.indexOf(docId);
    if (index > -1) {
      state.bookmarks.splice(index, 1);
    } else {
      state.bookmarks.push(docId);
    }
    localStorage.setItem("score600_bookmarks", JSON.stringify(state.bookmarks));
    renderCatalogue();
    updateReaderBookmarkBtn();
  }

  function updateReaderBookmarkBtn() {
    if (!state.activeDoc) return;
    const isBookmarked = state.bookmarks.includes(state.activeDoc.id);
    const icon = DOM.readerBookmarkBtn.querySelector(".bookmark-icon");
    if (isBookmarked) {
      DOM.readerBookmarkBtn.style.color = "#fbbf24";
      icon.setAttribute("fill", "currentColor");
    } else {
      DOM.readerBookmarkBtn.style.color = "var(--text-main)";
      icon.setAttribute("fill", "none");
    }
  }

  // =========================================================================
  // 4. SECURE IN-APP READER (GOOGLE DRIVE IFRAME & CANVAS FALLBACK)
  // =========================================================================
  function openReader(docId, customUrl = null, customTitle = null) {
    triggerHaptic("medium");

    let doc = (window.SCORE600_MATERIALS || []).find((m) => m.id === docId);
    if (!doc && customUrl) {
      doc = {
        id: "custom-drive-" + Date.now(),
        title: customTitle || "Google Drive Shared Study Material",
        grade: state.selectedGrade === "all" ? "12" : state.selectedGrade,
        subject: "Study Notes",
        driveFileId: window.extractGoogleDriveId(customUrl),
        pages: []
      };
    }
    if (!doc) return;

    state.activeDoc = doc;
    state.viewerMode = "drive"; // Default to Google Drive secure iframe

    DOM.readerDocTitle.textContent = doc.title;
    DOM.readerGradeBadge.textContent = `Grade ${doc.grade}`;
    DOM.readerModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Show Native Telegram BackButton
    if (tg?.BackButton) {
      tg.BackButton.show();
    }

    updateReaderBookmarkBtn();
    generateDynamicWatermarks();
    renderActiveViewerMode();
  }

  function renderActiveViewerMode() {
    if (state.viewerMode === "drive") {
      // Switch to Google Drive Iframe
      DOM.canvasWrapper.classList.add("hidden");
      DOM.readerBottomBar.classList.add("hidden");
      DOM.driveViewerContainer.classList.remove("hidden");
      DOM.readerModeLabel.textContent = "🖼️ Canvas View";

      DOM.readerLoader.classList.remove("hidden");
      DOM.readerLoaderText.textContent = "Securing Google Drive Stream...";

      const previewUrl = window.buildGoogleDrivePreviewUrl(state.activeDoc.driveFileId);
      DOM.drivePreviewIframe.src = previewUrl;

      DOM.drivePreviewIframe.onload = () => {
        DOM.readerLoader.classList.add("hidden");
      };

      // Fallback timeout in case iframe onload doesn't fire due to sandbox
      setTimeout(() => {
        DOM.readerLoader.classList.add("hidden");
      }, 1400);

    } else {
      // Switch to High-Fidelity Canvas View
      DOM.driveViewerContainer.classList.add("hidden");
      DOM.canvasWrapper.classList.remove("hidden");
      DOM.readerBottomBar.classList.remove("hidden");
      DOM.readerModeLabel.textContent = "☁️ Drive Iframe";

      loadCanvasPdfDocument();
    }
  }

  function toggleViewerMode() {
    triggerHaptic("selection");
    state.viewerMode = state.viewerMode === "drive" ? "canvas" : "drive";
    renderActiveViewerMode();
  }

  async function loadCanvasPdfDocument() {
    DOM.readerLoader.classList.remove("hidden");
    DOM.readerLoaderText.textContent = "Rendering Canvas DRM...";

    try {
      const doc = state.activeDoc;
      const pdfString = window.createPdfDocument(
        doc.title,
        doc.subject,
        doc.pages && doc.pages.length ? doc.pages : [
          {
            sections: [
              {
                heading: "Score600Academy Secure Viewer",
                lines: [
                  "This document is mirrored from Google Drive file: " + doc.driveFileId,
                  "Anti-download and screen protections are active.",
                  "All access is watermarked to your Telegram student identity."
                ]
              }
            ]
          }
        ]
      );

      const pdfData = new Uint8Array(pdfString.length);
      for (let i = 0; i < pdfString.length; i++) {
        pdfData[i] = pdfString.charCodeAt(i) & 0xff;
      }

      const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });
      state.pdfDoc = await loadingTask.promise;
      state.totalPages = state.pdfDoc.numPages;
      state.currentPage = 1;
      state.currentScale = calculateFitScale();

      DOM.totalPagesSpan.textContent = state.totalPages;
      DOM.currentPageInput.max = state.totalPages;
      DOM.currentPageInput.value = state.currentPage;

      renderCurrentPdfPage();
    } catch (err) {
      console.error("Canvas render error:", err);
      DOM.readerLoader.classList.add("hidden");
    }
  }

  function calculateFitScale() {
    const stageWidth = DOM.readerStage.clientWidth || window.innerWidth;
    const availableWidth = Math.max(stageWidth - 32, 280);
    return Math.min(Math.max(availableWidth / 612, 0.75), 1.6);
  }

  async function renderCurrentPdfPage() {
    if (!state.pdfDoc) return;
    if (state.isRendering) {
      state.pagePendingRender = state.currentPage;
      return;
    }

    state.isRendering = true;
    DOM.readerLoader.classList.remove("hidden");

    try {
      const page = await state.pdfDoc.getPage(state.currentPage);
      const viewport = page.getViewport({ scale: state.currentScale });
      const outputScale = window.devicePixelRatio || 1;
      const canvas = DOM.pdfCanvas;
      const context = canvas.getContext("2d");

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = Math.floor(viewport.width) + "px";
      canvas.style.height = Math.floor(viewport.height) + "px";

      DOM.canvasWrapper.style.width = Math.floor(viewport.width) + "px";
      DOM.canvasWrapper.style.height = Math.floor(viewport.height) + "px";

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      await page.render({
        canvasContext: context,
        transform: transform,
        viewport: viewport
      }).promise;

      state.isRendering = false;
      DOM.readerLoader.classList.add("hidden");

      DOM.currentPageInput.value = state.currentPage;
      DOM.prevPageBtn.disabled = state.currentPage <= 1;
      DOM.nextPageBtn.disabled = state.currentPage >= state.totalPages;

      if (state.pagePendingRender !== null) {
        state.currentPage = state.pagePendingRender;
        state.pagePendingRender = null;
        renderCurrentPdfPage();
      }
    } catch (err) {
      console.error("Page render error:", err);
      state.isRendering = false;
      DOM.readerLoader.classList.add("hidden");
    }
  }

  function closeReader() {
    triggerHaptic("light");
    DOM.readerModal.classList.add("hidden");
    document.body.style.overflow = "";

    // Reset iframe to stop streaming/memory
    DOM.drivePreviewIframe.src = "";

    state.activeDoc = null;
    state.pdfDoc = null;

    if (tg?.BackButton) {
      tg.BackButton.hide();
    }
  }

  function changePage(delta) {
    triggerHaptic("selection");
    const target = state.currentPage + delta;
    if (target >= 1 && target <= state.totalPages) {
      state.currentPage = target;
      renderCurrentPdfPage();
    }
  }

  function toggleReadingMode() {
    triggerHaptic("selection");
    if (state.readingMode === "normal") {
      state.readingMode = "comfort";
      DOM.readerStage.classList.remove("mode-dark");
      DOM.readerStage.classList.add("mode-comfort");
      DOM.themeModeIcon.textContent = "☀️";
    } else if (state.readingMode === "comfort") {
      state.readingMode = "dark";
      DOM.readerStage.classList.remove("mode-comfort");
      DOM.readerStage.classList.add("mode-dark");
      DOM.themeModeIcon.textContent = "📖";
    } else {
      state.readingMode = "normal";
      DOM.readerStage.classList.remove("mode-comfort", "mode-dark");
      DOM.themeModeIcon.textContent = "🌙";
    }
  }

  // =========================================================================
  // 5. INGEST CUSTOM GOOGLE DRIVE MODAL HANDLERS
  // =========================================================================
  function openIngestModal() {
    triggerHaptic("light");
    DOM.ingestModal.classList.remove("hidden");
    DOM.driveInputUrl.value = "";
    DOM.driveInputTitle.value = "";
    DOM.driveInputUrl.focus();

    if (tg?.BackButton) {
      tg.BackButton.show();
    }
  }

  function closeIngestModal() {
    triggerHaptic("light");
    DOM.ingestModal.classList.add("hidden");

    if (tg?.BackButton && DOM.readerModal.classList.contains("hidden")) {
      tg.BackButton.hide();
    }
  }

  function submitIngest() {
    const rawInput = DOM.driveInputUrl.value.trim();
    if (!rawInput) {
      showSecurityToast("Please paste a valid Google Drive file link or ID.");
      return;
    }

    const fileId = window.extractGoogleDriveId(rawInput);
    if (!fileId) {
      showSecurityToast("Could not recognize Google Drive file ID.");
      return;
    }

    const title = DOM.driveInputTitle.value.trim() || `Google Drive Doc (${fileId.slice(0, 8)}...)`;
    const previewUrl = window.buildGoogleDrivePreviewUrl(fileId);

    // Add to materials list dynamically
    const newDoc = {
      id: "ingested-" + Date.now(),
      grade: state.selectedGrade === "all" ? 12 : parseInt(state.selectedGrade, 10),
      title: title,
      subject: "Custom Drive",
      category: "exams",
      badge: "User Ingested",
      driveFileId: fileId,
      pagesCount: 1,
      estimatedTime: "10 min read",
      rating: "5.0",
      readCount: "Just added",
      description: `Imported Google Drive document (ID: ${fileId}). Protected with Score600 DRM.`,
      pages: []
    };

    window.SCORE600_MATERIALS.unshift(newDoc);
    renderCatalogue();
    closeIngestModal();

    // Immediately open in secure viewer
    openReader(newDoc.id, previewUrl, title);
  }

  // =========================================================================
  // 6. EVENT LISTENERS SETUP
  // =========================================================================
  function setupEventListeners() {
    // Grade Selection Pills
    DOM.gradePills.forEach((pill) => {
      pill.addEventListener("click", () => {
        triggerHaptic("selection");
        DOM.gradePills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        state.selectedGrade = pill.dataset.grade;
        renderCatalogue();
      });
    });

    // Subject Category Pills
    DOM.catPills.forEach((pill) => {
      pill.addEventListener("click", () => {
        triggerHaptic("selection");
        DOM.catPills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        state.selectedCategory = pill.dataset.category;
        renderCatalogue();
      });
    });

    // Search Input
    DOM.searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      DOM.clearSearchBtn.classList.toggle("hidden", !state.searchQuery);
      renderCatalogue();
    });

    DOM.clearSearchBtn.addEventListener("click", () => {
      DOM.searchInput.value = "";
      state.searchQuery = "";
      DOM.clearSearchBtn.classList.add("hidden");
      renderCatalogue();
    });

    // Reset Filters Button
    DOM.resetFilterBtn.addEventListener("click", () => {
      DOM.searchInput.value = "";
      state.searchQuery = "";
      DOM.clearSearchBtn.classList.add("hidden");
      const allGradePill = document.querySelector(".grade-pill[data-grade='all']");
      const allCatPill = document.querySelector(".cat-pill[data-category='all']");
      if (allGradePill) allGradePill.click();
      if (allCatPill) allCatPill.click();
    });

    // Cards Click Delegation ("Read Securely" & Bookmark)
    DOM.materialsGrid.addEventListener("click", (e) => {
      const readBtn = e.target.closest(".read-securely-btn");
      if (readBtn) {
        const id = readBtn.dataset.id;
        openReader(id);
        return;
      }

      const bookmarkBtn = e.target.closest(".bookmark-toggle-btn");
      if (bookmarkBtn) {
        const id = bookmarkBtn.dataset.id;
        toggleBookmark(id);
        return;
      }
    });

    // Reader UI buttons
    DOM.readerCloseBtn.addEventListener("click", closeReader);
    DOM.readerThemeToggle.addEventListener("click", toggleReadingMode);
    DOM.readerViewModeToggle.addEventListener("click", toggleViewerMode);
    DOM.readerBookmarkBtn.addEventListener("click", () => {
      if (state.activeDoc) toggleBookmark(state.activeDoc.id);
    });

    // Canvas Pagination
    DOM.prevPageBtn.addEventListener("click", () => changePage(-1));
    DOM.nextPageBtn.addEventListener("click", () => changePage(1));
    DOM.currentPageInput.addEventListener("change", (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > state.totalPages) val = state.totalPages;
      state.currentPage = val;
      renderCurrentPdfPage();
    });

    // Ingest Modal buttons
    DOM.openIngestBtn.addEventListener("click", openIngestModal);
    DOM.closeIngestModalBtn.addEventListener("click", closeIngestModal);
    DOM.cancelIngestBtn.addEventListener("click", closeIngestModal);
    DOM.submitIngestBtn.addEventListener("click", submitIngest);

    // Responsive Canvas Resize
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.pdfDoc && state.viewerMode === "canvas" && !DOM.readerModal.classList.contains("hidden")) {
          state.currentScale = calculateFitScale();
          renderCurrentPdfPage();
        }
      }, 250);
    });
  }

  function escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // =========================================================================
  // 7. BOOTSTRAP
  // =========================================================================
  function init() {
    initTelegramWebApp();
    setupDRMProtections();
    setupEventListeners();
    renderCatalogue();
    console.log("Score600Academy initialized with Google Drive Secure DRM Ingestion.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
