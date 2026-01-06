# Ask Gemini - Chrome Extension

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/kmab5/ask-gemini)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Author](https://img.shields.io/badge/author-kmab5-orange.svg)](https://github.com/kmab5)
[![Website](https://img.shields.io/badge/website-ask--gemini-4285f4.svg)](https://kmab5.github.io/ask-gemini/)

A Chrome extension that lets you quickly find out what highlighted text means by asking Google's Gemini AI.

🌐 **Website:** [kmab5.github.io/ask-gemini](https://kmab5.github.io/ask-gemini/)

![Ask Gemini](icons/logox128.png)

## Features

- **Quick Access**: Highlight any text on a webpage to see a floating Gemini button
- **Instant Answers**: Click the button to get AI-powered explanations
- **Model Selection**: Choose from Gemini and Gemma models (Flash, Pro, and open-source variants)
- **Customizable Questions**: Set your own question template (e.g., "What is {highlightedtext}?" or "Translate {highlightedtext} to Spanish")
- **Secure Storage**: Optional password-protected encryption (AES-256-GCM) for your API key
- **Clean UI**: Modern, dark-themed tooltip with smooth animations
- **Ghost Loading**: Beautiful shimmer animation while waiting for responses
- **Concise Responses**: Gemini is configured to give direct answers under 100 words with no embellishments

## Installation

### From Source (Developer Mode)

1. **Clone** this repository:

   ```bash
   git clone https://github.com/kmab5/ask-gemini.git
   cd ask-gemini
   ```

2. **Install dependencies and build**:

   ```bash
   npm install
   npm run build
   ```

3. **Open Chrome** and navigate to `chrome://extensions/`

4. **Enable Developer Mode** by toggling the switch in the top-right corner

5. **Click "Load unpacked"** and select the `ask-gemini` folder

6. The extension should now appear in your extensions list and toolbar

### Getting Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Setup

1. Click the **Ask Gemini** extension icon in your Chrome toolbar
2. Paste your **Gemini API key** in the settings popup
3. (Optional) Customize the **question template**
4. Click **Save Settings**

## Usage

1. **Highlight** any text on a webpage
2. A **floating Gemini button** will appear near your selection
3. **Click the button** to ask Gemini about the highlighted text
4. Wait for the **ghost loading animation** to complete
5. Read Gemini's **concise answer** in the tooltip
6. Click the **×** button or click elsewhere to close the tooltip

## Configuration Options

### API Key

Your personal Gemini API key from Google AI Studio. Required for the extension to work.

### Question Template

Customize how you want to ask Gemini about highlighted text. Use `{highlightedtext}` as a placeholder for the selected text.

**Default:** `What is {highlightedtext}?`

**Examples:**

- `Define {highlightedtext}`
- `Explain {highlightedtext} in simple terms`
- `Translate {highlightedtext} to French`
- `What does {highlightedtext} mean in programming?`
- `Summarize {highlightedtext}`

## Technical Details

### Permissions

- `storage`: Save your API key and settings
- `activeTab`: Access the current tab to detect text selection

### API Configuration

The extension uses Gemini 2.5 Flash Lite with the following settings:

- **Temperature**: 0.3 (for consistent, focused answers)
- **Max Output Tokens**: 200
- **System Instruction**: Configured for concise, direct answers only

### Files Structure

```bash
ask-gemini/
├── manifest.json          # Extension configuration
├── popup.html             # Settings popup UI
├── popup.js               # Settings popup logic
├── content.js             # Content script (selection handling)
├── background.js          # Bundled service worker (API calls)
├── styles.css             # Tooltip and button styles
├── README.md              # Documentation
├── package.json           # NPM dependencies and build scripts
├── src/
│   └── background.js      # Source file for background worker
└── icons/
    ├── logox[16,32,48,128].png    # Extension toolbar icons
    └── geminix[16,32,48,128].png  # Floating tooltip icons
```

## Troubleshooting

### "Please set your Gemini API key"

Make sure you've entered your API key in the extension settings and clicked "Save Settings".

### "Invalid API key or request"

Double-check that your API key is correct and hasn't expired. Try generating a new key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### "Rate limit exceeded"

You've made too many requests. Wait a few moments and try again, or check your API quota in Google AI Studio.

### "Content was blocked by safety filters"

The selected text triggered Gemini's safety filters. Try selecting different text.

### Button doesn't appear

- Make sure you've selected some text (not just clicked)
- The selection must be between 1-500 characters
- Some websites may block content scripts

## Privacy

- Your API key is stored locally in Chrome's sync storage (or encrypted with AES-256-GCM if password protection is enabled)
- Selected text is sent directly to Google's Gemini API
- No data is collected or stored by this extension beyond your settings
- See our [Privacy Policy](https://kmab5.github.io/ask-gemini/#privacy) for more details

## License

MIT License - Feel free to modify and distribute.

## Author

**kmab5** - [GitHub](https://github.com/kmab5)

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

Issues and PRs can be submitted at [github.com/kmab5/ask-gemini](https://github.com/kmab5/ask-gemini)

## Changelog

### v1.2.0

- **Model Selection**: Choose from multiple Gemini and Gemma models
- **Model Refresh**: Fetch latest available models from Google's API
- **Getting Started Guide**: New section on landing page for new users
- **Rate Limit Guidance**: Helpful error messages when rate limited
- **Gemma Support**: Added Gemma 3 models (27B, 12B, 4B, 1B)
- **Website Launch**: Official landing page at [kmab5.github.io/ask-gemini](https://kmab5.github.io/ask-gemini/)
- Model list cached in local storage for persistence
- Shows selected model name in tooltip header after response
- Chrome Web Store listing description added

### v1.1.1

- Code cleanup and optimizations
- Removed unused session-only storage mode
- Updated model comments for accuracy
- Minor bug fixes

### v1.1.0

- Added password-protected API key storage (AES-256-GCM encryption)
- New unlock/clear UI for encrypted storage mode
- Overhauled landing page with modern design
- Custom scrollbar styling in popup
- Improved error messages for encrypted mode
- Fixed session storage access in content scripts

### v1.0.1

- Migrated to official Google Generative AI SDK
- Updated to Gemini 2.5 Flash Lite model
- Added esbuild bundler for npm package support
- Improved error handling and API responses
- Fixed icon display issues (now using PNG format)
- Code cleanup and optimizations

### v1.0.0

- Initial release
- Text selection detection
- Floating Gemini button
- Tooltip with loading animation
- Customizable question templates
- Settings popup for API key configuration
