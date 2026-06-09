import { callSixStageScrumMcpTool, sixStageScrumMcpTools } from "@/server/mcp/six-stage-tools";

export const runtime = "nodejs";

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
};

function result(id: JsonRpcId, payload: Record<string, unknown>) {
  return Response.json({
    jsonrpc: "2.0",
    id,
    result: payload,
  });
}

function error(id: JsonRpcId, code: number, message: string, status = 400, data?: unknown) {
  return Response.json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        data,
      },
    },
    { status },
  );
}

export function GET() {
  return Response.json({
    ok: true,
    app: "ai-product-manager",
    protocol: "mcp-json-rpc",
    endpoint: "/api/mcp",
    tools: sixStageScrumMcpTools,
  });
}

export async function POST(request: Request) {
  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return error(null, -32700, "Parse error");
  }

  const id = body.id ?? null;
  if (body.jsonrpc !== "2.0") {
    return error(id, -32600, "Invalid Request: jsonrpc must be 2.0");
  }

  switch (body.method) {
    case "initialize":
      return result(id, {
        protocolVersion: "2025-06-18",
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: "ai-product-manager-scrum-mcp",
          version: "0.1.0",
        },
      });

    case "tools/list":
      return result(id, {
        tools: sixStageScrumMcpTools,
      });

    case "tools/call": {
      const params = body.params ?? {};
      const toolName = typeof params.name === "string" ? params.name : "";
      if (!toolName) {
        return error(id, -32602, "Invalid params: tools/call requires params.name");
      }

      const toolResult = await callSixStageScrumMcpTool(toolName, params.arguments ?? {});
      return result(id, toolResult);
    }

    default:
      return error(id, -32601, `Method not found: ${body.method ?? "undefined"}`, 404);
  }
}
