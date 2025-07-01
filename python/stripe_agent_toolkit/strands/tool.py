from strands.tools.tools import PythonAgentTool as StrandTool
import json

def StripeTool(api, tool) -> StrandTool:
    parameters = tool["args_schema"].model_json_schema()
    parameters["additionalProperties"] = False
    parameters["type"] = "object"
    return StrandTool(
        tool_name=tool["method"],
        tool_spec={
            "name": tool["method"],
            "description": tool["description"],
            "inputSchema": {
                "json": parameters
            }
        },
        callback=lambda x: api.run(tool["method"], **json.loads(x))
    )
