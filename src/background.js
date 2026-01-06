// Ask Gemini - Background Service Worker
// Uses official Google Generative AI SDK

import { GoogleGenerativeAI } from "@google/generative-ai";

// Default model
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

// Curated list of major Gemini/Gemma models (static to avoid API rate limits)
const AVAILABLE_MODELS = [
    {
        id: "gemini-pro-latest",
        name: "Gemini Pro Latest",
        description: "Latest release of Gemini Pro",
    },
    {
        id: "gemini-flash-latest",
        name: "Gemini Flash Latest",
        description: "Latest release of Gemini Flash",
    },
    {
        id: "gemini-flash-lite-latest",
        name: "Gemini Flash Lite Latest",
        description: "Latest release of Gemini Flash-Lite",
    },
    {
        id: "gemini-3-pro-preview",
        name: "Gemini 3 Pro",
        description: "Most intelligent model",
    },
    {
        id: "gemini-3-flash-preview",
        name: "Gemini 3 Flash",
        description: "Most balanced model, designed to scale",
    },
    {
        id: "gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash Lite",
        description: "Fastest and most efficient (default)",
    },
    {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Fast and capable",
    },
    {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Most capable Gemini model",
    },
    {
        id: "gemini-2.0-flash-lite",
        name: "Gemini 2.0 Flash Lite",
        description: "Fast and efficient",
    },
    {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        description: "Balanced performance",
    },
    {
        id: "gemma-3-27b-it",
        name: "Gemma 3 27B",
        description: "Most capable open model",
    },
    {
        id: "gemma-3-12b-it",
        name: "Gemma 3 12B",
        description: "Balanced open model",
    },
    {
        id: "gemma-3-4b-it",
        name: "Gemma 3 4B",
        description: "Fast open model",
    },
    {
        id: "gemma-3-1b-it",
        name: "Gemma 3 1B",
        description: "Ultra-light open model",
    },
];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "askGemini") {
        handleGeminiRequest(request.apiKey, request.question, request.model)
            .then(sendResponse)
            .catch((error) => sendResponse({ error: error.message }));
        return true;
    }

    if (request.action === "getApiKey") {
        getApiKey()
            .then((apiKey) => sendResponse({ apiKey }))
            .catch((error) => sendResponse({ error: error.message }));
        return true;
    }

    if (request.action === "getModels") {
        // Check cache first, then fall back to static list
        getModels()
            .then((models) => sendResponse({ models }))
            .catch(() => sendResponse({ models: AVAILABLE_MODELS }));
        return true;
    }

    if (request.action === "refreshModels") {
        // Fetch fresh models from API and cache them
        fetchAndCacheModels(request.apiKey)
            .then((models) => sendResponse({ models, fromApi: true }))
            .catch((error) =>
                sendResponse({ models: AVAILABLE_MODELS, error: error.message })
            );
        return true;
    }

    if (request.action === "getSelectedModel") {
        chrome.storage.sync.get(["selectedModel"], (result) => {
            sendResponse({ model: result.selectedModel || DEFAULT_MODEL });
        });
        return true;
    }
});

// Get API key based on storage mode
async function getApiKey() {
    const syncData = await chrome.storage.sync.get([
        "geminiApiKey",
        "storageMode",
        "encryptedApiKey",
    ]);
    const mode = syncData.storageMode || "sync";

    if (mode === "sync") {
        return syncData.geminiApiKey;
    } else if (mode === "encrypted") {
        // Get decrypted key from session storage
        const sessionData = await chrome.storage.session.get(["sessionApiKey"]);
        return sessionData.sessionApiKey;
    }

    return null;
}

// Get models from cache or return static list
async function getModels() {
    try {
        const data = await chrome.storage.local.get(["cachedModels"]);
        if (data.cachedModels && data.cachedModels.length > 0) {
            return data.cachedModels;
        }
    } catch (error) {
        console.error("Error reading cached models:", error);
    }
    return AVAILABLE_MODELS;
}

// Fetch models from API and cache them
async function fetchAndCacheModels(apiKey) {
    if (!apiKey) {
        throw new Error("API key required to fetch models");
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch models");
    }

    const data = await response.json();

    // Filter for major generative models
    const models = data.models
        .filter((model) => {
            const name = model.name.toLowerCase();
            const id = model.name.replace("models/", "");
            // Only include major gemini/gemma models that support generateContent
            return (
                ((name.includes("gemini") || name.includes("gemma")) &&
                    model.supportedGenerationMethods?.includes(
                        "generateContent"
                    ) &&
                    !name.includes("vision") &&
                    !name.includes("embedding") &&
                    !name.includes("aqa") &&
                    !name.includes("thinking") &&
                    !id.includes("-")) ||
                /^gemini-[0-9]/.test(id) || // Major versioned models like gemini-2.0-flash
                /^gemma-[0-9]/.test(id) // Gemma models like gemma-3-27b-it
            );
        })
        .map((model) => {
            const id = model.name.replace("models/", "");
            return {
                id: id,
                name: formatModelName(id),
                description: model.description || "",
            };
        })
        .filter(
            (model, index, self) =>
                // Remove duplicates by id
                index === self.findIndex((m) => m.id === model.id)
        )
        .sort((a, b) => {
            // Sort by version (newer first)
            const aVersion = extractVersion(a.id);
            const bVersion = extractVersion(b.id);
            if (bVersion !== aVersion) return bVersion - aVersion;
            // Then by type: lite < flash < pro
            if (a.id.includes("lite") && !b.id.includes("lite")) return -1;
            if (!a.id.includes("lite") && b.id.includes("lite")) return 1;
            if (a.id.includes("flash") && b.id.includes("pro")) return -1;
            if (a.id.includes("pro") && b.id.includes("flash")) return 1;
            return 0;
        });

    // Cache the models in local storage
    if (models.length > 0) {
        await chrome.storage.local.set({ cachedModels: models });
        return models;
    }

    return AVAILABLE_MODELS;
}

// Format model name for display
function formatModelName(modelId) {
    return modelId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

// Extract version number from model ID
function extractVersion(modelId) {
    const match = modelId.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
}

async function handleGeminiRequest(apiKey, question, modelId) {
    try {
        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(apiKey);

        // Get the selected model or use default
        const selectedModel = modelId || DEFAULT_MODEL;

        // Get the model
        const model = genAI.getGenerativeModel({
            model: selectedModel,
            systemInstruction: `You are a concise answer assistant. Follow these rules strictly:
1. Answer only the question asked
2. No embellishments or extra commentary
3. No follow-up questions
4. No extra formatting like bullet points or headers
5. Keep answer under 100 words
6. Just provide the direct answer, nothing else`,
        });

        // Configure generation parameters
        const generationConfig = {
            temperature: 0.3,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 200,
        };

        // Generate content
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: question }] }],
            generationConfig,
        });

        const response = result.response;
        const text = response.text();

        if (text) {
            return { answer: text.trim() };
        } else {
            throw new Error("No response generated. Please try again.");
        }
    } catch (error) {
        console.error("Gemini API Error:", error);

        // Handle specific error types
        if (
            error.message?.includes("API_KEY_INVALID") ||
            error.message?.includes("API key")
        ) {
            throw new Error("Invalid API key. Please check your settings.");
        } else if (error.message?.includes("PERMISSION_DENIED")) {
            throw new Error(
                "API key does not have permission. Please check your API key."
            );
        } else if (
            error.message?.includes("RESOURCE_EXHAUSTED") ||
            error.message?.includes("429")
        ) {
            throw new Error(
                "Rate limit exceeded. Try a different model in settings or wait a moment."
            );
        } else if (error.message?.includes("SAFETY")) {
            throw new Error("Content was blocked by safety filters.");
        } else if (
            error.message?.includes("fetch") ||
            error.message?.includes("network")
        ) {
            throw new Error("Network error. Please check your connection.");
        }

        throw new Error(
            error.message || "An error occurred. Please try again."
        );
    }
}
