"""
This tool allows agents to interact with the Stripe API.
"""

from __future__ import annotations

from typing import Any, Optional, Type
from pydantic import BaseModel

from ..api import StripeAPI


class StripeTool:
    """Tool for interacting with the Stripe API."""

    def __init__(
        self,
        name: str,
        description: str,
        method: str,
        stripe_api: StripeAPI,
        args_schema: Optional[Type[BaseModel]] = None,
    ):
        super().__init__()
        self.name = name
        self.description = description
        self.method = method
        self.stripe_api = stripe_api
        self.args_schema = args_schema
        self.__name__ = method

    def __call__(
        self,
        **kwargs: Any,
    ) -> str:
        """Use the Stripe API to run an operation."""
        if self.args_schema:
            # Validate and transform arguments using the schema
            validated_args = self.args_schema(**kwargs)
            return self.stripe_api.run(self.method, **validated_args.dict())
        return self.stripe_api.run(self.method, **kwargs)

    def _run(
        self,
        **kwargs: Any,
    ) -> str:
        """Use the Stripe API to run an operation."""
        return self.__call__(**kwargs)
