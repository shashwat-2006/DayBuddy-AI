
import express from "express";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import * as z from "zod";

const app = express();
app.use(express.json());

const PORT = 3001;

// MCP tools ko har request ke liye register karo.
function createDayBuddyMCP() {
  const server = new McpServer({
    name: "daybuddy-ai",
    version: "1.0.0",
  });

  // Tool 1: Tasks ko priority ke hisaab se rank karo.
  server.registerTool(
    "prioritize_tasks",
    {
      description:
        "Rank a user's tasks by priority, then by duration.",
      inputSchema: z.object({
        tasks: z.array(
          z.object({
            title: z.string(),
            priority: z.enum(["High", "Medium", "Low"]),
            duration: z.number().positive(),
          })
        ),
      }),
    },
    async ({ tasks }) => {
      const rank = { High: 3, Medium: 2, Low: 1 };

      const sorted = [...tasks].sort(
        (a, b) =>
          rank[b.priority] - rank[a.priority] ||
          a.duration - b.duration
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(sorted, null, 2),
          },
        ],
      };
    }
  );

  // Tool 2: Tasks ka simple time-based schedule banao.
  server.registerTool(
    "create_daily_plan",
    {
      description:
        "Create a sequential daily schedule from supplied tasks and working hours.",
      inputSchema: z.object({
        tasks: z.array(
          z.object({
            title: z.string(),
            priority: z.enum(["High", "Medium", "Low"]),
            duration: z.number().positive(),
          })
        ),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    },
    async ({ tasks, startTime, endTime }) => {
      const toMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const start = toMinutes(startTime);
      const end = toMinutes(endTime);

      if (
        start >= end ||
        end > 24 * 60 ||
        start >= 24 * 60
      ) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Please provide a valid same-day time range.",
            },
          ],
        };
      }

      const rank = { High: 3, Medium: 2, Low: 1 };
      const sorted = [...tasks].sort(
        (a, b) =>
          rank[b.priority] - rank[a.priority] ||
          a.duration - b.duration
      );

      let cursor = start;
      const schedule = [];
      const unfittedTasks = [];

      for (const task of sorted) {
        const duration = Math.ceil(task.duration);

        if (cursor + duration > end) {
          unfittedTasks.push(task.title);
          continue;
        }

        const formatTime = (minutes) =>
          `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
            minutes % 60
          ).padStart(2, "0")}`;

        schedule.push({
          start: formatTime(cursor),
          end: formatTime(cursor + duration),
          title: task.title,
          priority: task.priority,
          type: "task",
        });

        cursor += duration;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { schedule, unfittedTasks },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  return server;
}

// MCP Streamable HTTP endpoint.
app.post("/mcp", async (req, res) => {
  const server = createDayBuddyMCP();
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed:", error);

    if (!res.headersSent) {
      res.status(500).json({ error: "MCP request failed" });
    }
  }
});

app.get("/", (_req, res) => {
  res.send("DayBuddy AI MCP server is running.");
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`DayBuddy MCP server: http://localhost:${PORT}/mcp`);
});
