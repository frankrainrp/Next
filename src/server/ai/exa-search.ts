import { tool } from "@langchain/core/tools";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Web search for the six-stage agent, powered by Exa.
 *
 * Primary path: Exa's hosted MCP server through @langchain/mcp-adapters,
 * so the agent consumes search as real MCP tools.
 * Fallback path: Exa REST API wrapped as a plain LangChain tool, used when
 * the MCP connection cannot be established.
 *
 * Both paths need EXA_API_KEY. Without it, no search tools are exposed and
 * the agent simply works from user-provided information.
 */

const EXA_MCP_URL = process.env.EXA_MCP_URL ?? "https://mcp.exa.ai/mcp";

let cachedTools: StructuredToolInterface[] | null = null;

function exaRestFallbackTool(apiKey: string) {
  return tool(
    async ({ query, numResults }: { query: string; numResults?: number }) => {
      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          numResults: Math.min(numResults ?? 5, 10),
          contents: { text: { maxCharacters: 1500 } },
        }),
      });
      if (!response.ok) {
        return `Search failed with status ${response.status}. Continue without web evidence and tell the user the search was unavailable.`;
      }
      const body = (await response.json()) as {
        results?: Array<{ title?: string; url?: string; publishedDate?: string; text?: string }>;
      };
      const results = body.results ?? [];
      if (results.length === 0) return "No results found.";
      return results
        .map(
          (item, index) =>
            `[${index + 1}] ${item.title ?? "Untitled"}\nURL: ${item.url ?? "unknown"}\nPublished: ${item.publishedDate ?? "unknown"}\n${item.text ?? ""}`,
        )
        .join("\n\n---\n\n");
    },
    {
      name: "web_search",
      description:
        "Search the live web (Exa) for facts you cannot know reliably: competition rules, judging criteria, past winners, comparable products, technology feasibility. Always cite the source URL in your answer.",
      schema: z.object({
        query: z.string().describe("The search query, in natural language."),
        numResults: z.number().int().min(1).max(10).optional().describe("How many results to return (default 5)."),
      }),
    },
  );
}

export async function loadSearchTools(): Promise<StructuredToolInterface[]> {
  if (cachedTools) return cachedTools;

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    cachedTools = [];
    return cachedTools;
  }

  try {
    const { MultiServerMCPClient } = await import("@langchain/mcp-adapters");
    // Per docs.exa.ai/reference/exa-mcp: tools= selects which tools the server exposes.
    // exaApiKey= authenticates headless clients (OAuth is for interactive clients).
    const toolsParam = "web_search_exa,web_fetch_exa";
    const client = new MultiServerMCPClient({
      mcpServers: {
        exa: {
          url: `${EXA_MCP_URL}?tools=${toolsParam}&exaApiKey=${encodeURIComponent(apiKey)}`,
          transport: "http",
        },
      },
    });
    const tools = await client.getTools();
    if (tools.length > 0) {
      cachedTools = tools;
      return cachedTools;
    }
  } catch (error) {
    console.warn(
      "[exa-search] MCP connection failed, falling back to Exa REST tool:",
      error instanceof Error ? error.message : error,
    );
  }

  cachedTools = [exaRestFallbackTool(apiKey)];
  return cachedTools;
}
