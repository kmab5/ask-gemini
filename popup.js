document.addEventListener("DOMContentLoaded", () => {
    const apiKeyInput = document.getElementById("apiKey");
    const questionTemplateInput = document.getElementById("questionTemplate");
    const saveBtn = document.getElementById("saveBtn");
    const statusEl = document.getElementById("status");

    // Load saved settings
    chrome.storage.sync.get(["geminiApiKey", "questionTemplate"], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
        }
        if (result.questionTemplate) {
            questionTemplateInput.value = result.questionTemplate;
        } else {
            questionTemplateInput.value = "What is {highlightedtext}?";
        }
    });

    // Save settings
    saveBtn.addEventListener("click", () => {
        const apiKey = apiKeyInput.value.trim();
        const questionTemplate =
            questionTemplateInput.value.trim() || "What is {highlightedtext}?";

        if (!apiKey) {
            showStatus("Please enter your API key", "error");
            return;
        }

        if (!questionTemplate.includes("{highlightedtext}")) {
            showStatus("Template must include {highlightedtext}", "error");
            return;
        }

        chrome.storage.sync.set(
            {
                geminiApiKey: apiKey,
                questionTemplate: questionTemplate,
            },
            () => {
                showStatus("Settings saved successfully!", "success");
            }
        );
    });

    function showStatus(message, type) {
        statusEl.textContent = message;
        statusEl.className = "status " + type;
        setTimeout(() => {
            statusEl.className = "status";
        }, 3000);
    }
});
