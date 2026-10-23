# DayBuddy AI 🤖

**An AI-powered daily planner that helps you plan your day, prioritize tasks, and stay focused.**

## 🚀 About

DayBuddy AI is a productivity web application that combines AI-powered scheduling with task management and focus tools. It helps users organize pending tasks into a practical daily plan based on task priorities, estimated durations, and available time.

## ✨ Features

- **AI Daily Planner:** Generate a personalized daily schedule using Google Gemini.
- **Visual Daily Timeline:** View scheduled activities, time slots, breaks, and priority labels.
- **Task Management:** Add, complete, delete, and clear completed tasks.
- **Search & Filters:** Search tasks and filter by completion status or priority.
- **Productivity Dashboard:** Track total, completed, and remaining tasks.
- **Focus Mode:** Use a countdown timer to focus on one task at a time.
- **Custom Schedule:** Set the start and end times for your day.
- **Local Task Storage:** Preserve tasks between browser refreshes.

## 🛠️ Tech Stack

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- Google Gemini API

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- A Google Gemini API key

### Installation

1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

5. Start the application:

   ```bash
   npm start
   ```

6. Open `http://localhost:3000` in your browser.

**Security:** Never commit your `.env` file or expose your API key in frontend JavaScript or screenshots.

## 🧠 How It Works

1. The user creates tasks and assigns priorities and estimated durations.
2. The user selects their available daily schedule.
3. The frontend sends pending tasks and schedule settings to the Express backend.
4. The backend requests a plan from the Gemini API.
5. The application displays the generated schedule as a visual timeline.
6. The user manages tasks and uses Focus Mode to support productive work.

## 🔮 Future Improvements

- Persistent focus-session history
- More robust schedule and duration validation
- Optional database-backed task synchronization
- User accounts and cross-device support
- Calendar integrations and reminders

## 🔐 Privacy & Security

The Gemini API key is stored in a server-side environment variable. Tasks are currently stored in browser local storage, so they are not automatically synchronized across devices.

## 📌 Project Status

Hackathon MVP in development. Features and reliability should be verified before public deployment.
