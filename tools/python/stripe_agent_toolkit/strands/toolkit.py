"""Stripe Agent Toolkit."""

from typing import List, Optional, Dict
from strands.tools.tools import PythonAgentTool as StrandTool

from ..api import StripeAPI
from ..tools import tools
from ..configuration import Configuration, is_tool_allowed
from .tool import StripeTool
from .hooks import BillingHooks


class StripeAgentToolkit:
    def __init__(
        self, secret_key: str, configuration: Optional[Configuration] = None
    ):
        context = configuration.get("context") if configuration else None

        self._stripe_api = StripeAPI(secret_key=secret_key, context=context)

        filtered_tools = [
            tool for tool in tools if is_tool_allowed(tool, configuration)
        ]

        self._tools = [
            StripeTool(self._stripe_api, tool)
            for tool in filtered_tools
        ]

    def get_tools(self) -> List[StrandTool]:
        """Get the tools in the toolkit."""
        return self._tools

    def billing_hook(
        self,
        type: Optional[str] = None,
        customer: Optional[str] = None,
        meter: Optional[str] = None,
        meters: Optional[Dict[str, str]] = None
    ) -> BillingHooks:
        return BillingHooks(self._stripe_api, type, customer, meter, meters)
