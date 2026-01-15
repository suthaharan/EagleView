# EagleView - Senior Visual Support Assistant

EagleView is an AI-powered  web application designed to assist seniors and their caregivers. By leveraging advanced computer vision via the Google Gemini API, EagleView helps users identify medications, read fine print, and detect potential fraud in documents.

## 🌟 Key Features

### 🔍 AI-Powered Visual Analysis
*   **Pillbox Identification**: Scans pill organizers to list compartments, describe pills (color/shape), and verify if doses match the assigned medication schedule.
*   **Fine Print Reader**: Specifically tuned to extract dosages, warnings, and expiration dates from medicine labels or legal contracts.
*   **Document & Fraud Detection**: Analyzes mail, bills, and notices to classify document types and assess fraud risk levels (Low, Medium, High) based on red flags.

### 👥 User Roles & Management
*   **Caregiver Role**: 
    *   Manage multiple senior citizens from a single account.
    *   Add new seniors and switch between their profiles seamlessly.
    *   Set personalized care plans, including medication schedules and daily notifications.
*   **Senior Role**: 
    *   Direct access to a simplified, high-accessibility dashboard.
    *   View daily messages left by their caregiver.

### 📸 Dual Capture Modes
*   **Live Camera Capture**: Integrated webcam/mobile camera support for real-time scanning.
*   **File Upload**: Ability to upload existing images from the device gallery for analysis.

### ♿ Accessibility First
*   **Text-to-Speech (TTS)**: Automatic narration of analysis results using the Web Speech API to assist those with visual impairments.
*   **High Contrast Mode**: A dedicated UI toggle for maximum visibility.
*   **Extra Large Text**: Font scaling options to ensure all text is easily readable for senior users.

### 📚 Scan History
*   **Isolated Data**: History is strictly separated by senior citizen to maintain privacy and organization.
*   **Categorized View**: Scans are grouped by date and analysis type (Pillbox, Fine Print, Document) for quick referencing.

## 🛠️ Tech Stack
*   **Frontend**: React (v19), Tailwind CSS
*   **AI Engine**: Google Gemini API (`gemini-3-flash-preview`)
*   **Communication**: Web Speech API (Speech Synthesis)
*   **Deployment**: Optimized for mobile and desktop web browsers.

## 🚀 Getting Started
1.  **Sign In**: Choose either the 'Senior' or 'Caregiver' role.
2.  **Select Client (Caregivers only)**: Choose a senior from your list or add a new one.
3.  **Scan**: Use the "Scan" button to choose an analysis type and capture an image.
4.  **Listen & Act**: Review the AI's findings, listen to the audio summary, and check history if needed.
