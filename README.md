# EagleView

### "AI-Powered Visual Clarity and Security for Seniors and Caregivers."

---

## 👁️ Purpose
EagleView is a specialized visual assistance platform designed to bridge the gap between visual impairment and independence for the aging population. By leveraging the advanced multimodal capabilities of the Gemini AI, EagleView transforms a smartphone camera into a powerful diagnostic and security tool.

## 💡 Inspiration
The inspiration for EagleView came from witnessing the daily struggles of aging relatives—squinting at tiny font on prescription bottles, the anxiety of potentially mixing up daily medications, and the predatory nature of modern mail-based scams targeting the elderly. We wanted to build a "visual companion" that doesn't just see, but *understands* the context of a senior's life to provide safety and peace of mind for both them and their families.

## 🤖 What it does
EagleView provides three core "vision modes":
1.  **Pillbox Identification:** Analyzes a physical pillbox, identifies pill characteristics, and cross-references them with a saved schedule to catch dosing errors.
2.  **Fine Print Reader:** Converts tiny, complex legalese or medical instructions into simple, high-level summaries.
3.  **Document Security:** Scans mail for bills and government notices while performing a "Fraud Check" to highlight red flags like urgent threats or suspicious payment requests.
4.  **Caregiver Portal:** Allows family members to manage multiple seniors, configure their medication schedules remotely, and monitor their scan history.

## 🛠️ How we built it
- **Gemini 3 Flash:** We utilized the `gemini-3-flash-preview` model for its incredible speed and multimodal capabilities, allowing us to send high-resolution images and complex prompts simultaneously.
- **React & Tailwind CSS:** The frontend was built for maximum accessibility, using Tailwind to implement a robust "High Contrast" mode and dynamic font scaling.
- **Multimodal Prompt Engineering:** We crafted specialized system instructions that force the AI to return structured JSON, ensuring the UI remains consistent even with varied input data.
- **Web Speech API:** Integrated native text-to-speech to provide audio feedback for every scan, essential for users with significant vision loss.
- **Browser Media Streams:** Implemented a custom webcam interface for real-time capture directly within the web application.

## 🚧 Challenges we ran into
- **JSON Consistency:** Getting the AI to reliably return valid JSON across three different scan types required extensive prompt refinement and schema definition.
- **Lighting & Angles:** Seniors often have shaky hands or poor lighting. We had to tune the AI instructions to be "forgiving" and provide helpful feedback if an image was too blurry.
- **UI for Low Vision:** Balancing a modern aesthetic with the rigid requirements of high-contrast and large-font design required constant testing of color ratios and hit-target sizes.

## 🏆 Accomplishments that we're proud of
- **Context-Aware Safety:** Successfully matching a visual pillbox state against a text-based schedule is a complex logic task that the AI handles with surprising empathy and accuracy.
- **The "Scam Detector":** Building a system that actually identifies social engineering tactics in physical mail, potentially saving seniors from thousands of dollars in losses.
- **Monolithic Simplicity:** Achieving a multi-user, caregiver-to-senior workflow using local persistence for a zero-setup MVP experience.

## 📖 What we learned
- **Multimodal is the Future of Accessibility:** Traditional OCR is dead; context-aware vision is the new standard. Knowing a word is "Warning" is one thing; knowing that warning applies to *this specific user's medication* is life-changing.
- **Structure Matters:** Using `responseMimeType: "application/json"` in the Gemini API is a game-changer for building reliable frontend integrations.
- **Less is More:** For our target market, fewer buttons and clearer audio were always better than a "feature-rich" but cluttered screen.

## 🚀 What's next for EagleView
- **Real-Time Video Analysis:** Moving from static photos to live video streams where the AI can provide "live guidance" (e.g., "Move the camera slightly to the left").
- **Cloud Synchronization:** Moving beyond `localStorage` to a secure backend for real-time caregiver alerts.
- **Integration with Pharmacies:** Automatically pulling medication schedules from provider APIs to eliminate manual data entry.
- **Voice Commands:** Adding a "Hey EagleView" wake-word to allow for a completely hands-free experience.

## 👥 User Roles
- **Caregiver:** Manages onboarding, schedules, and remote monitoring.
- **Senior:** Uses visual tools for daily independence.

## 🛠️ Technologies Used
- **Frontend:** React (TSX), Tailwind CSS
- **AI Engine:** Google Gemini API (`gemini-3-flash-preview`)
- **Accessibility:** Web Speech API, ARIA patterns
- **Persistence:** LocalStorage for simulated multi-user context.
