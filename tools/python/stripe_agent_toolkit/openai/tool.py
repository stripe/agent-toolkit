"""
This tool allows agents to interact with the Stripe API.
"""

from __future__ import annotations

from collections.abc import Awaitable
from typing import Any
import json

from agents import FunctionTool
from agents.run_context import RunContextWrapper

def StripeTool(api, tool) -> FunctionTool:
    async def on_invoke_tool(ctx: RunContextWrapper[Any], input_str: str) -> str:
        return api.run(tool["method"], **json.loads(input_str))

    parameters = tool["args_schema"].model_json_schema()
    parameters["additionalProperties"] = False
    parameters["type"] = "object"

    # Remove the description field from parameters as it's not needed in the OpenAI function schema
    if "description" in parameters:
        del parameters["description"]

    if "title" in parameters:
        del parameters["title"]

    # Remove title and default fields from properties
    if "properties" in parameters:
        for prop in parameters["properties"].values():
            if "title" in prop:
                del prop["title"]
            if "default" in prop:
                del prop["default"]

    return FunctionTool(
        name=tool["method"],
        description=tool["description"],
        params_json_schema=parameters,
        on_invoke_tool=on_invoke_tool,
        strict_json_schema=False
    )
