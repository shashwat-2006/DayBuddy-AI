
require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the DayBuddy AI frontend
app.use(express.static(__dirname));

// Test whether the backend is running
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "DayBuddy AI backend is running!"
  });
});


app.post("/api/plan", async (req, res) => {
  try {
    const {
  tasks,
  startTime = "09:00",
  endTime = "18:00"
} = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        error: "Please provide at least one task."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "API key missing. Check your .env file."
      });
    }

   
const prompt = `
You are DayBuddy AI, a practical daily planning assistant.

Available time: ${startTime} to ${endTime}
Tasks:
${JSON.stringify(tasks)}

Create a realistic schedule. Prioritize high-priority tasks,
respect task durations, add short breaks, and flag tasks that
cannot fit in the available time.

Return ONLY valid JSON. Do not use markdown fences or extra text.
Use exactly this structure:

{
  "greeting": "A short friendly introduction",
  "summary": "A short summary of the plan",
  "schedule": [
    {
      "start": "09:00",
      "end": "10:00",
      "title": "Complete hackathon project",
      "description": "Work on the most important task",
      "type": "task",
      "priority": "High"
    },
    {
      "start": "10:00",
      "end": "10:15",
      "title": "Short break",
      "description": "Stretch and rest your eyes",
      "type": "break",
      "priority": "Low"
    }
  ],
  "unfittedTasks": []
}

Rules:
- Each schedule item must have start, end, title, description, type, priority.
- type must be "task", "break", or "flexible".
- Include every pending task exactly once, unless it cannot fit.
- Use 24-hour HH:MM time.
- Do not schedule outside the available time.
- Do not invent tasks from the user's task list.
`;


    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "AI request failed."
      });
    }

    
const rawPlan = data.candidates?.[0]?.content?.parts
  ?.map(part => part.text || "")
  .join("\n")
  ?.trim();

if (!rawPlan) {
  return res.status(502).json({
    error: "AI returned an empty plan. Please try again."
  });
}

let plan;

try {
  const cleanPlan = rawPlan
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  plan = JSON.parse(cleanPlan);
} catch (error) {
  console.error("Invalid AI JSON response:", rawPlan);

  return res.status(502).json({
    error: "AI returned an invalid schedule format. Please try again."
  });
}

if (!plan || !Array.isArray(plan.schedule)) {
  return res.status(502).json({
    error: "AI schedule format was incomplete. Please try again."
  });
}

res.json({ plan });

    res.json({ plan: plan || "No plan was returned." });
  } catch (error) {
    console.error("Plan error:", error.message);
    res.status(500).json({
      error: "Could not generate a plan. Please try again."
    });
  }
});


app.listen(PORT, () => {
  console.log(`DayBuddy AI running at http://localhost:${PORT}`);
});
