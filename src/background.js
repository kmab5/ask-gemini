// Ask Gemini - Background Service Worker
// Uses official Google Generative AI SDK

import { GoogleGenerativeAI } from "@google/generative-ai";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "askGemini") {
        handleGeminiRequest(request.apiKey, request.question)
            .then(sendResponse)
            .catch((error) => sendResponse({ error: error.message }));
        return true; // Keep message channel open for async response
    }

    if (request.action === "getApiKey") {
        getApiKey()
            .then((apiKey) => sendResponse({ apiKey }))
            .catch((error) => sendResponse({ error: error.message }));
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

async function handleGeminiRequest(apiKey, question) {
    try {
        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(apiKey);

        // Get the model - using gemini-2.5-flash-lite for speed and efficiency
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
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
                "Rate limit exceeded. Please try again in a moment."
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
