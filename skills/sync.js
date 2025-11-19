const fs = require("fs").promises;
const path = require("path");

const STRIPE_API_KEY = process.env.MCP_STRIPE_API_KEY;

if (!STRIPE_API_KEY) {
  throw new Error("MCP_STRIPE_API_KEY environment variable is required");
}

const getMCPPrompt = async (promptName) => {
  const response = await fetch("https://mcp.stripe.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STRIPE_API_KEY}`,
      "User-Agent": "github.com/stripe/ai/skills",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "prompts/get",
      params: {
        name: "stripe-best-practices",
        arguments: {},
      },
      id: 1,
    }),
  });
  const data = await response.json();
  return data.result.messages[0].content.text;
};

const listMCPPrompts = async () => {
  const response = await fetch("https://mcp.stripe.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STRIPE_API_KEY}`,
      "User-Agent": "github.com/stripe/ai/skills",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "prompts/list",
      params: {},
      id: 1,
    }),
  });
  const data = await response.json();
  return data.result.prompts;
};

const run = async () => {
  const prompts = await listMCPPrompts();
  console.log(`Found ${prompts.length} prompts`);
  for (const prompt of prompts) {
    const content = await getMCPPrompt(prompt.name);
    const outputPath = path.join(__dirname, `${prompt.name}.md`);

    const skillFileContent = `---
description: ${prompt.description}
alwaysApply: false
---

${content}
`;

    await fs.writeFile(outputPath, skillFileContent, "utf8");
    console.log(`Content written to ${outputPath}`);
  }
};

run();
