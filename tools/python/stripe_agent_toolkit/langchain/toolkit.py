"""Stripe Agent Toolkit."""

from typing import List, Optional
from pydantic import PrivateAttr

from ..api import StripeAPI
from ..tools import tools
from ..configuration import Configuration, Context, is_tool_allowed
from .tool import StripeTool


class StripeAgentToolkit:
    _tools: List = PrivateAttr(default=[])

    def __init__(
        self, secret_key: str, configuration: Optional[Configuration] = None
    ):
        super().__init__()

        context = configuration.get("context") if configuration else None

        stripe_api = StripeAPI(secret_key=secret_key, context=context)

        filtered_tools = [
            tool for tool in tools if is_tool_allowed(tool, configuration)
        ]

        self._tools = [
            StripeTool(
                name=tool["method"],
                description=tool["description"],
                method=tool["method"],
                stripe_api=stripe_api,
                args_schema=tool.get("args_schema", None),
            )
            for tool in filtered_tools
        ]

    def get_tools(self) -> List:
        """Get the tools in the toolkit."""
        return self._tools
