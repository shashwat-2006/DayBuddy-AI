
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const client = new Client({
  name: "daybuddy-test-client",
  version: "1.0.0",
});

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3001/mcp")
);

try {
  await client.connect(transport);
  console.log("Connected to DayBuddy MCP server!");

  const tools = await client.listTools();
  console.log("\nAvailable MCP tools:");
  console.log(tools.tools.map((tool) => tool.name));

  const result = await client.callTool({
    name: "prioritize_tasks",
    arguments: {
      tasks: [
        { title: "Finish project", priority: "High", duration: 60 },
        { title: "Reply to emails", priority: "Low", duration: 15 },
        { title: "Study", priority: "Medium", duration: 30 },
      ],
    },
  });

  console.log("\nTool test result:");
  console.log(result.content);
  
  const planResult = await client.callTool({
    name: "create_daily_plan",
    arguments: {
      tasks: [
        { title: "Build DayBuddy demo", priority: "High", duration: 60 },
        { title: "Record demo video", priority: "Medium", duration: 30 },
        { title: "Check README", priority: "Low", duration: 15 },
      ],
      startTime: "09:00",
      endTime: "11:00",
    },
  });

  console.log("\nDaily plan test:");
  console.log(planResult.content);

} catch (error) {
  console.error("MCP test failed:", error);
  process.exitCode = 1;
} finally {
  await client.close().catch(() => {});
}
