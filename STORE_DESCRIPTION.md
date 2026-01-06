# Chrome Web Store Listing

## Extension Name

Ask Gemini

## Short Description (132 characters max)

Highlight any text on the web and get instant AI-powered explanations from Google's Gemini. Fast, private, and customizable.

## Detailed Description

### 🚀 Understand Anything, Instantly

Ask Gemini lets you highlight any text on any webpage and get instant, AI-powered explanations from Google's Gemini. No copy-pasting, no tab switching — just answers.

### ✨ Key Features

**⚡ Lightning Fast**
Get AI explanations in under 2 seconds. Powered by Google's latest Gemini models.

**🎯 Zero Friction**  
Highlight text → Click the floating button → Get your answer. It's that simple.

**🤖 Choose Your Model**
Select from available Gemini and Gemma models including Flash Lite, Flash, Pro, and open-source Gemma variants. Refresh models anytime to get the latest options.

**⚙️ Fully Customizable**
Set your own question templates:
• "What is {highlightedtext}?"
• "Translate {highlightedtext} to Spanish"
• "Explain {highlightedtext} in simple terms"
• "What does {highlightedtext} mean in programming?"

**🔐 Security Options**
• Standard Chrome sync storage
• Password-protected encryption (AES-256-GCM)
• Your API key never leaves your device

**📝 Concise Answers**
Responses are capped at 100 words. No fluff, no embellishments — just the information you need.

**🪶 Lightweight**
Under 50KB total. Only activates when you select text.

### 🔒 Privacy First

• Your API key is stored locally on your device
• Optional password encryption with AES-256-GCM
• Selected text is sent directly to Google's Gemini API
• No data collection, no analytics, no tracking
• 100% open source — audit the code yourself

### 📋 How to Get Started

1. Install the extension
2. Get a free API key from Google AI Studio (link in settings)
3. Paste your API key in the extension popup
4. Start highlighting text on any webpage!

### 🛠️ Requirements

• A Google Gemini API key (free tier available)
• Chrome browser

### 💡 Perfect For

• Students researching unfamiliar terms
• Professionals reading technical documents
• Language learners looking up translations
• Anyone who wants quick answers while browsing

### 🔗 Links

- Website: <https://kmab5.github.io/ask-gemini/>
- Privacy Policy: <https://kmab5.github.io/ask-gemini/#privacy>
- Getting Started: <https://kmab5.github.io/ask-gemini/#getting-started>
- Source Code: <https://github.com/kmab5/ask-gemini>
- Report Issues: <https://github.com/kmab5/ask-gemini/issues>

---

**Note:** Ask Gemini is an independent open-source project and is not affiliated with, endorsed by, or sponsored by Google LLC. Gemini and Gemma are trademarks of Google LLC.

## Category

Productivity

## Language

English

## Screenshots Suggestions

1. Highlighting text with the floating Gemini button visible
2. Tooltip showing an AI explanation
3. Settings popup with API key and model selection
4. Password protection option in settings

---

## Chrome Web Store Submission Details

### Single Purpose

This extension has a single, narrow purpose: **to provide instant AI-powered explanations for highlighted text on any webpage**.

Users highlight text → click the floating button → receive an AI explanation from Google's Gemini API. That's it. No additional features, no bloat, no scope creep.

### Permission Justification

#### `storage`

**Why needed:** To save user preferences and settings locally, including:

- API key (stored in chrome.storage.sync or encrypted in chrome.storage.session)
- Custom question template
- Selected Gemini model
- Encryption password hash (when password protection is enabled)
- Model cache (chrome.storage.local)

**Data stored:** User preferences only. No browsing data, history, or personal information is collected.

#### `activeTab`

**Why needed:** To inject the content script that:

- Detects when the user highlights text on the current page
- Displays the floating "Ask Gemini" button near the selection
- Shows the tooltip with the AI response

**Scope:** Only activates on the tab where the user is actively using the extension. Does not access other tabs or run in the background.

#### Host Permission (`<all_urls>`)

**Why needed:** To allow the extension to work on any webpage where the user wants to highlight text and get explanations.

**Justification:** The core functionality requires detecting text selection and displaying UI elements (button, tooltip) on any page. Without this permission, users would be limited to specific websites, defeating the purpose of a universal text explanation tool.

**What it does NOT do:**

- Does not read or collect page content
- Does not modify page content (except adding the floating button/tooltip UI)
- Does not track browsing history
- Does not run unless the user actively selects text

### Remote Code

**Does this extension use remote code?** No.

All JavaScript code is bundled locally within the extension package. The extension makes API calls to Google's Gemini API (`https://generativelanguage.googleapis.com`) to fetch AI responses, but no remote JavaScript is loaded or executed.

### Data Usage

**What data is collected?** None.

**What data is transmitted?**

- Selected/highlighted text is sent to Google's Gemini API for processing
- The user's API key is sent to Google's API for authentication

**What data is stored locally?**

- User's API key (in Chrome sync storage or encrypted session storage)
- User preferences (question template, selected model)
- Model cache (for offline model list)

**What data is shared with third parties?**

- Only the highlighted text and API key are sent to Google's Gemini API
- No data is sent to any other third party
- No analytics, tracking, or telemetry

### Privacy Policy

<https://kmab5.github.io/ask-gemini/#privacy>

The privacy policy covers:

- What data is collected (none)
- What data is transmitted (highlighted text to Gemini API)
- How API keys are stored (locally, with optional encryption)
- Third-party services used (Google Gemini API only)
- User rights and data deletion
