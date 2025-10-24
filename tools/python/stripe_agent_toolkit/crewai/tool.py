"""
This tool allows agents to interact with the Stripe API.
"""

from __future__ import annotations

from typing import Any, Optional, Type
from pydantic import BaseModel

from crewai_tools import BaseTool

from ..api import StripeAPI


class StripeTool(BaseTool):
    """Tool for interacting with the Stripe API."""

    stripe_api: StripeAPI
    method: str
    name: str = ""
    description: str = ""
    args_schema: Optional[Type[BaseModel]] = None

    def _run(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> str:
        """Use the Stripe API to run an operation."""
        return self.stripe_api.run(self.method, *args, **kwargs)
