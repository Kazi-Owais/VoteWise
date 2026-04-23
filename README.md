# 🗳️ VotePath AI

**VotePath AI** is a premium, lightweight, and responsive web application designed to guide citizens through the complexities of the voting process. Built with a focus on privacy, simplicity, and accessibility, it provides a tailored experience for every user without the need for complex backend AI or data storage.

---

## 🚀 Key Features

### 🤖 No-AI Smart Assistant (Rule-Based Intelligence)
Our "AI" assistant uses a sophisticated **keyword-detection engine** to provide instant, context-aware answers. 
- **Privacy-First**: No data is sent to external servers. All matching happens locally in your browser.
- **Dynamic Context**: Responses adapt based on your selected **Persona** and **Explanation Style**.
- **Interactive**: Includes typing simulations and quick-suggestion actions for a "live" chat feel.

### 🎭 Persona-Based System
Choose your journey! On entry, VotePath AI asks you to select a persona:
- **First-time Voter**: Simplified basics and encouraging language.
- **Student**: Focused on campus residency, student IDs, and class schedule alignment.
- **Working Professional**: Emphasizes efficiency, mail-in ballots, and employer labor rights.

### 🗺️ Polling Booth Finder & Map Integration
- **Live Geolocation**: Uses the browser's Geolocation API to find your current coordinates.
- **Embedded Maps**: Integrates a dynamic Google Maps view to help you visualize your assigned booth.
- **Mock Locations**: Provides realistic data on nearby stations, including distances and hours.

### 🌓 Multi-Mode Explanations
Toggle between **Simple Mode** and **Detailed Mode**:
- **Simple**: High-level summaries and 3-step guides.
- **Detailed**: Comprehensive legal insights, registration nuances, and deeper chatbot explanations.

### ♿ Accessibility & Modern UX
- **High Contrast**: Designed for readability with accessible color palettes (Indigo/Slate).
- **Responsive Design**: Flawess experience across mobile, tablet, and desktop.
- **Interactive UI**: Powered by **Lucide Icons** and 60fps CSS animations for a premium "app" feel.

---

## 🛠️ Technical Logic

### 1. The Logic Engine (`script.js`)
The application is purely client-side. The `sections` object acts as a localized database, mapping content to both `userPersona` and `explanationMode`.

### 2. Validation & Security
- **Strict RegEx**: Age inputs are validated using `^\d+$` to ensure only whole numbers are processed.
- **HTML Sanitization**: All user inputs in the chat are passed through a custom `sanitize()` function to prevent XSS (Cross-Site Scripting) attacks.
- **State Management**: Uses lightweight global variables (`userPersona`, `explanationMode`) to persist choices during the session.

---

## 📁 File Structure
- `index.html`: The semantic UI and application shell.
- `style.css`: Modern design system using CSS Variables and Flex/Grid.
- `script.js`: Core logic, interaction handling, and content mapping.

---

## 🛡️ Privacy Note
VotePath AI is a strictly local application. **No personal data is stored, tracked, or transmitted.** Your age, location, and persona choice never leave your device.

---
*Created with ❤️ by Antigravity*