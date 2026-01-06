// Ask Gemini - Content Script
(function () {
    // Prevent multiple initializations
    if (window.askGeminiInitialized) return;
    window.askGeminiInitialized = true;

    let floatingButton = null;
    let tooltipContainer = null;
    let currentSelection = "";
    let selectionRect = null;

    // Get extension URL for icons
    const tooltipIconUrl = chrome.runtime.getURL("icons/geminix32.png");
    const iconUrl = chrome.runtime.getURL("icons/geminix16.png");

    // Create floating Gemini button
    function createFloatingButton() {
        if (floatingButton && document.body.contains(floatingButton)) {
            return floatingButton;
        }

        floatingButton = document.createElement("div");
        floatingButton.id = "ask-gemini-btn";

        const img = document.createElement("img");
        img.src = tooltipIconUrl;
        img.alt = "Ask Gemini";
        img.style.width = "20px";
        img.style.height = "20px";
        img.style.pointerEvents = "none";

        floatingButton.appendChild(img);
        floatingButton.title = "Ask Gemini";
        document.body.appendChild(floatingButton);

        floatingButton.addEventListener("click", handleButtonClick);
        floatingButton.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        return floatingButton;
    }

    // Create tooltip container
    function createTooltipContainer() {
        if (tooltipContainer && document.body.contains(tooltipContainer)) {
            return tooltipContainer;
        }

        tooltipContainer = document.createElement("div");
        tooltipContainer.id = "ask-gemini-tooltip";
        tooltipContainer.innerHTML = `
            <div class="ask-gemini-header">
                <img src="${iconUrl}" alt="Gemini" style="width: 16px; height: 16px;">
                <span>Ask Gemini</span>
                <button class="ask-gemini-close" title="Close">×</button>
            </div>
            <div class="ask-gemini-content">
                <div class="ask-gemini-loading">
                    <div class="ask-gemini-ghost"></div>
                    <div class="ask-gemini-ghost"></div>
                    <div class="ask-gemini-ghost"></div>
                </div>
            </div>
        `;
        document.body.appendChild(tooltipContainer);

        // Close button handler
        const closeBtn = tooltipContainer.querySelector(".ask-gemini-close");
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            hideTooltip();
        });

        return tooltipContainer;
    }

    // Position element near selection
    function positionElement(element, rect, isButton = false) {
        if (!rect) return;

        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        let left, top;

        if (isButton) {
            // Position button to the right of selection
            left = rect.right + scrollX + 8;
            top = rect.top + scrollY + rect.height / 2 - 16;
        } else {
            // Position tooltip below selection
            left = rect.left + scrollX + rect.width / 2 - 160;
            top = rect.bottom + scrollY + 10;
        }

        // Ensure element stays within viewport
        const viewportWidth = window.innerWidth;

        // Keep within horizontal bounds
        if (left + 320 > viewportWidth + scrollX) {
            left = viewportWidth + scrollX - 330;
        }
        if (left < scrollX + 10) {
            left = scrollX + 10;
        }

        // For button, ensure it's visible
        if (isButton && left > viewportWidth + scrollX - 50) {
            left = rect.left + scrollX - 40;
        }

        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
    }

    // Handle text selection
    function handleSelection() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (
            selectedText &&
            selectedText.length > 0 &&
            selectedText.length < 500
        ) {
            currentSelection = selectedText;

            try {
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    selectionRect = range.getBoundingClientRect();

                    if (selectionRect.width > 0 && selectionRect.height > 0) {
                        const button = createFloatingButton();
                        positionElement(button, selectionRect, true);

                        // Force reflow and show
                        button.offsetHeight;
                        button.classList.add("visible");
                    }
                }
            } catch (e) {
                console.error("Ask Gemini: Error getting selection rect", e);
            }
        } else {
            hideFloatingButton();
            currentSelection = "";
        }
    }

    // Hide floating button
    function hideFloatingButton() {
        if (floatingButton) {
            floatingButton.classList.remove("visible");
        }
    }

    // Hide tooltip
    function hideTooltip() {
        if (tooltipContainer) {
            tooltipContainer.classList.remove("visible");
        }
    }

    // Handle button click
    function handleButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!currentSelection) return;

        const tooltip = createTooltipContainer();
        const contentEl = tooltip.querySelector(".ask-gemini-content");

        // Show loading state
        contentEl.innerHTML = `
            <div class="ask-gemini-loading">
                <div class="ask-gemini-ghost"></div>
                <div class="ask-gemini-ghost"></div>
                <div class="ask-gemini-ghost"></div>
            </div>
        `;

        // Position and show tooltip
        if (selectionRect) {
            positionElement(tooltip, selectionRect, false);
            tooltip.classList.add("visible");
        }

        // Hide the button
        hideFloatingButton();

        // Ask Gemini
        askGemini(currentSelection);
    }

    // Send request to Gemini API via background script
    async function askGemini(text) {
        const contentEl = tooltipContainer.querySelector(".ask-gemini-content");

        try {
            // Get settings from storage
            const settings = await new Promise((resolve) => {
                chrome.storage.sync.get(
                    ["geminiApiKey", "questionTemplate"],
                    resolve
                );
            });

            if (!settings.geminiApiKey) {
                contentEl.innerHTML = `
                    <div class="ask-gemini-error">
                        <p>Please set your Gemini API key in the extension settings.</p>
                        <p class="ask-gemini-hint">Click the extension icon in your toolbar to configure.</p>
                    </div>
                `;
                return;
            }

            const template =
                settings.questionTemplate || "What is {highlightedtext}?";
            const question = template.replace("{highlightedtext}", text);

            // Send message to background script
            const response = await chrome.runtime.sendMessage({
                action: "askGemini",
                apiKey: settings.geminiApiKey,
                question: question,
            });

            if (response && response.error) {
                contentEl.innerHTML = `
                    <div class="ask-gemini-error">
                        <p>${escapeHtml(response.error)}</p>
                    </div>
                `;
            } else if (response && response.answer) {
                contentEl.innerHTML = `
                    <div class="ask-gemini-answer">
                        ${escapeHtml(response.answer)}
                    </div>
                `;
            } else {
                contentEl.innerHTML = `
                    <div class="ask-gemini-error">
                        <p>No response received. Please try again.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Ask Gemini error:", error);
            contentEl.innerHTML = `
                <div class="ask-gemini-error">
                    <p>An error occurred. Please try again.</p>
                </div>
            `;
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Event listeners
    document.addEventListener("mouseup", (e) => {
        // Ignore clicks on our elements
        if (
            e.target.closest("#ask-gemini-btn") ||
            e.target.closest("#ask-gemini-tooltip")
        ) {
            return;
        }
        // Small delay to let selection complete
        setTimeout(handleSelection, 50);
    });

    document.addEventListener("mousedown", (e) => {
        // Hide elements when clicking elsewhere
        if (
            !e.target.closest("#ask-gemini-btn") &&
            !e.target.closest("#ask-gemini-tooltip")
        ) {
            hideFloatingButton();
            hideTooltip();
        }
    });

    // Hide on scroll (debounced)
    let scrollTimeout;
    document.addEventListener(
        "scroll",
        () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                hideFloatingButton();
                hideTooltip();
            }, 100);
        },
        true
    );

    // Handle keyboard selection (Shift+Arrow keys)
    document.addEventListener("keyup", (e) => {
        if (e.shiftKey || e.key === "Shift") {
            setTimeout(handleSelection, 50);
        }
    });

    // Handle Escape key to close tooltip
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            hideFloatingButton();
            hideTooltip();
        }
    });

    console.log("Ask Gemini: Content script initialized");
})();
