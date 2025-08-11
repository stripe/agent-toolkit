from strands.tools.tools import PythonAgentTool as StrandTool
import json

def StripeTool(api, tool) -> StrandTool:
    parameters = tool["args_schema"].model_json_schema()
    parameters["additionalProperties"] = False
    parameters["type"] = "object"

    def callback_wrapper(tool_input, **kwargs):
        """Wrapper to handle additional parameters from strands framework."""

        # Extract toolUseId for the response
        tool_use_id = None
        if isinstance(tool_input, dict) and 'toolUseId' in tool_input:
            tool_use_id = tool_input['toolUseId']
            # Extract the actual parameters from the nested input structure
            actual_params = tool_input.get('input', {})
        elif isinstance(tool_input, str):
            # Parse JSON string input
            try:
                parsed = json.loads(tool_input)
                tool_use_id = parsed.get('toolUseId')
                actual_params = parsed.get('input', parsed)
            except json.JSONDecodeError:
                actual_params = {}
        elif isinstance(tool_input, dict):
            actual_params = tool_input.copy()
        else:
            actual_params = {}

        try:
            # Call the Stripe API
            result = api.run(tool["method"], **actual_params)
            
            # Return in the format expected by strands (ToolResult format)
            response = {
                "content": [{"text": result}],
                "status": "success",  # Required field for ToolResult
                "toolUseId": tool_use_id or "unknown"  # Always required
            }
            
        except Exception as e:
            # Handle errors with proper ToolResult format
            response = {
                "content": [{"text": f"Error: {str(e)}"}],
                "status": "error",  # Required field for ToolResult
                "toolUseId": tool_use_id or "unknown"  # Always required
            }

        return response

    return StrandTool(
        tool_name=tool["method"],
        tool_spec={
            "name": tool["method"],
            "description": tool["description"],
            "inputSchema": {
                "json": parameters
            }
        },
        tool_func=callback_wrapper
    )
