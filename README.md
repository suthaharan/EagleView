# EagleView - Senior Visual Support Assistant

EagleView is an AI-powered visual support application designed to empower seniors and provide peace of mind to caregivers.

## 🌟 Key Features

### 🔍 AI-Powered Visual Analysis
*   **Pillbox Identification**: Scans organizers, verifies dosages against schedules, and identifies medications.
*   **Fine Print Reader**: Extracts critical information from medicine labels, warnings, and contracts.
*   **Document Fraud Detection**: Analyzes mail for classification and security risk assessment.
*   **Clarifying Chat**: After a scan, users can ask the AI follow-up questions (e.g., "Is this safe to take with milk?") for contextual help.

### 👥 User Management
*   **Caregiver & Senior Roles**: Role-based access with multi-senior management for caregivers.
*   **Daily Messages**: Caregivers can leave "sticky notes" on the senior's dashboard.
*   **Personalized Care Plans**: Persistent medication schedules and notification settings per senior.

### 📸 Seamless Interaction
*   **Live Camera**: Real-time capture optimized for mobile and web.
*   **History**: Individual scan history categorized by date and type.

### ♿ Accessibility First
*   **TTS Support**: Automatic and on-demand reading of analysis results and AI chat responses.
*   **High Contrast & Font Scaling**: Optimized UI for users with visual impairments.

## 🛠️ Tech Stack
*   **Frontend**: React 19, Tailwind CSS
*   **AI Engine**: Google Gemini API (`gemini-3-flash-preview`)
*   **Storage**: Firebase (Persistent history, preferences, and data synchronization)
*   **Communication**: Web Speech API for Text-to-Speech

## 🛤️ Future Roadmap
*   **Next Stage: Real-time Live Video**: Transitioning the "Camera" mode to the Gemini Live API for real-time voice-interactive assistance.
*   **Medication Reminders**: Push notifications for scheduled doses based on the Care Plan.
*   **Fraud Database**: Integration with global fraud databases for real-time verification of "urgent" mail senders.
*   **Family Sync**: Multi-caregiver support for a single senior client.
