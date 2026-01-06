document.addEventListener("DOMContentLoaded", () => {
    const apiKeyInput = document.getElementById("apiKey");
    const questionTemplateInput = document.getElementById("questionTemplate");
    const saveBtn = document.getElementById("saveBtn");
    const statusEl = document.getElementById("status");
    const passwordField = document.getElementById("passwordField");
    const encryptionPasswordInput =
        document.getElementById("encryptionPassword");
    const storageOptions = document.querySelectorAll(
        'input[name="storageMode"]'
    );
    const optionLabels = document.querySelectorAll(".storage-option");

    // Elements for unlock UI
    const apiKeySection = document.getElementById("apiKeySection");
    const unlockSection = document.getElementById("unlockSection");
    const unlockPasswordInput = document.getElementById("unlockPassword");
    const unlockBtn = document.getElementById("unlockBtn");
    const clearStorageBtn = document.getElementById("clearStorageBtn");
    const unlockStatus = document.getElementById("unlockStatus");

    // Track current state
    let hasEncryptedKey = false;
    let isUnlocked = false;

    // Update UI when storage option changes
    storageOptions.forEach((option) => {
        option.addEventListener("change", (e) => {
            // Update selected styling
            optionLabels.forEach((label) => label.classList.remove("selected"));
            e.target.closest(".storage-option").classList.add("selected");

            const mode = e.target.value;
            updateUIForMode(mode);
        });
    });

    // Update UI based on mode and state
    function updateUIForMode(mode) {
        if (mode === "encrypted") {
            passwordField.classList.add("visible");

            if (hasEncryptedKey && !isUnlocked) {
                // Show unlock UI, hide API key input
                apiKeySection.style.display = "none";
                unlockSection.style.display = "block";
            } else {
                // Show API key input for new setup or after unlock
                apiKeySection.style.display = "block";
                unlockSection.style.display = "none";
            }
        } else {
            passwordField.classList.remove("visible");
            apiKeySection.style.display = "block";
            unlockSection.style.display = "none";
        }
    }

    // Load saved settings
    async function loadSettings() {
        const syncData = await new Promise((resolve) => {
            chrome.storage.sync.get(
                [
                    "geminiApiKey",
                    "questionTemplate",
                    "storageMode",
                    "encryptedApiKey",
                ],
                resolve
            );
        });

        const sessionData = await new Promise((resolve) => {
            chrome.storage.session.get(["sessionApiKey"], resolve);
        });

        const mode = syncData.storageMode || "sync";
        hasEncryptedKey = !!syncData.encryptedApiKey;
        isUnlocked = !!sessionData.sessionApiKey;

        // Set the storage mode radio button
        const modeRadio = document.getElementById(
            mode === "encrypted" ? "storage-encrypted" : "storage-sync"
        );
        if (modeRadio) {
            modeRadio.checked = true;
            modeRadio.closest(".storage-option").classList.add("selected");
        }

        // Update UI based on mode
        updateUIForMode(mode);

        // Load API key based on mode
        if (mode === "sync" && syncData.geminiApiKey) {
            apiKeyInput.value = syncData.geminiApiKey;
        } else if (mode === "encrypted") {
            if (isUnlocked) {
                // Already unlocked this session
                apiKeyInput.value = sessionData.sessionApiKey;
                apiKeyInput.placeholder = "API key (unlocked for this session)";
            } else if (hasEncryptedKey) {
                // Has encrypted key, needs unlock
                apiKeyInput.value = "";
                apiKeyInput.placeholder = "Unlock to view/edit API key";
            }
        }

        // Load question template
        if (syncData.questionTemplate) {
            questionTemplateInput.value = syncData.questionTemplate;
        } else {
            questionTemplateInput.value = "What is {highlightedtext}?";
        }
    }

    loadSettings();

    // Handle unlock button
    unlockBtn.addEventListener("click", async () => {
        const password = unlockPasswordInput.value;

        if (!password) {
            showUnlockStatus("Please enter your password", "error");
            return;
        }

        try {
            const syncData = await new Promise((resolve) => {
                chrome.storage.sync.get(["encryptedApiKey"], resolve);
            });

            if (!syncData.encryptedApiKey) {
                showUnlockStatus("No encrypted key found", "error");
                return;
            }

            const decryptedKey = await decryptApiKey(
                syncData.encryptedApiKey,
                password
            );

            // Store in session storage
            await chrome.storage.session.set({ sessionApiKey: decryptedKey });

            isUnlocked = true;
            apiKeyInput.value = decryptedKey;

            // Switch to API key view
            apiKeySection.style.display = "block";
            unlockSection.style.display = "none";

            showStatus("Unlocked! API key ready for this session.", "success");
            unlockPasswordInput.value = "";
        } catch (error) {
            console.error("Decryption error:", error);
            showUnlockStatus("Incorrect password", "error");
        }
    });

    // Handle clear storage button
    clearStorageBtn.addEventListener("click", async () => {
        if (
            confirm(
                "This will remove your encrypted API key. You'll need to set up a new one. Continue?"
            )
        ) {
            await chrome.storage.sync.set({
                encryptedApiKey: null,
                storageMode: "sync",
            });
            await chrome.storage.session.set({ sessionApiKey: null });

            hasEncryptedKey = false;
            isUnlocked = false;
            apiKeyInput.value = "";
            unlockPasswordInput.value = "";

            // Switch back to sync mode
            const syncRadio = document.getElementById("storage-sync");
            syncRadio.checked = true;
            optionLabels.forEach((label) => label.classList.remove("selected"));
            syncRadio.closest(".storage-option").classList.add("selected");

            updateUIForMode("sync");
            showStatus("Storage cleared. Choose a storage method.", "success");
        }
    });

    // Save settings
    saveBtn.addEventListener("click", async () => {
        const apiKey = apiKeyInput.value.trim();
        const questionTemplate =
            questionTemplateInput.value.trim() || "What is {highlightedtext}?";
        const selectedMode = document.querySelector(
            'input[name="storageMode"]:checked'
        ).value;
        const encryptionPassword = encryptionPasswordInput.value;

        if (!apiKey) {
            showStatus("Please enter your API key", "error");
            return;
        }

        if (!questionTemplate.includes("{highlightedtext}")) {
            showStatus("Template must include {highlightedtext}", "error");
            return;
        }

        if (
            selectedMode === "encrypted" &&
            !encryptionPassword &&
            !isUnlocked
        ) {
            showStatus("Please enter an encryption password", "error");
            return;
        }

        try {
            if (selectedMode === "sync") {
                // Option A: Simple sync storage
                await chrome.storage.sync.set({
                    geminiApiKey: apiKey,
                    questionTemplate: questionTemplate,
                    storageMode: "sync",
                    encryptedApiKey: null,
                });
                await chrome.storage.session.set({ sessionApiKey: null });
                showStatus("Settings saved!", "success");
            } else if (selectedMode === "encrypted") {
                if (isUnlocked && !encryptionPassword) {
                    // Just updating the question template, keep existing encrypted key
                    // But also update session storage with the (possibly edited) API key
                    await chrome.storage.session.set({ sessionApiKey: apiKey });
                    await chrome.storage.sync.set({
                        questionTemplate: questionTemplate,
                    });
                    showStatus("Settings updated!", "success");
                } else {
                    // New encryption or re-encryption
                    const encryptedKey = await encryptApiKey(
                        apiKey,
                        encryptionPassword
                    );
                    await chrome.storage.sync.set({
                        geminiApiKey: null,
                        encryptedApiKey: encryptedKey,
                        questionTemplate: questionTemplate,
                        storageMode: "encrypted",
                    });
                    // Store decrypted key in session for immediate use
                    await chrome.storage.session.set({ sessionApiKey: apiKey });

                    hasEncryptedKey = true;
                    isUnlocked = true;
                    encryptionPasswordInput.value = "";

                    showStatus("Settings saved & encrypted!", "success");
                }
            }
        } catch (error) {
            showStatus("Error saving: " + error.message, "error");
        }
    });

    function showStatus(message, type) {
        statusEl.textContent = message;
        statusEl.className = "status " + type;
        setTimeout(() => {
            statusEl.className = "status";
        }, 3000);
    }

    function showUnlockStatus(message, type) {
        unlockStatus.textContent = message;
        unlockStatus.className = "unlock-status " + type;
        setTimeout(() => {
            unlockStatus.className = "unlock-status";
        }, 3000);
    }

    // Encryption using Web Crypto API (AES-GCM with PBKDF2)
    async function encryptApiKey(apiKey, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);

        // Derive key from password
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveBits", "deriveKey"]
        );

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt"]
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );

        // Combine salt + iv + encrypted data and encode as base64
        const combined = new Uint8Array(
            salt.length + iv.length + encrypted.byteLength
        );
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        return btoa(String.fromCharCode(...combined));
    }

    // Decryption using Web Crypto API
    async function decryptApiKey(encryptedData, password) {
        const encoder = new TextEncoder();

        // Decode base64
        const combined = new Uint8Array(
            atob(encryptedData)
                .split("")
                .map((c) => c.charCodeAt(0))
        );

        // Extract salt, iv, and encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encrypted = combined.slice(28);

        // Derive key from password
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveBits", "deriveKey"]
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
    }
});
