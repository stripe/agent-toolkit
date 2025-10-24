from typing import Any
from agents import AgentHooks, RunContextWrapper, Agent, Tool
from ..api import StripeAPI

class BillingHooks(AgentHooks):
    def __init__(self, stripe: StripeAPI, type: str, customer: str, meter: str = None, meters: dict[str, str] = None):
        self.type = type
        self.stripe = stripe
        self.customer = customer
        self.meter = meter
        self.meters = meters

    async def on_end(self, context: RunContextWrapper, agent: Agent, output: Any) -> None:
        if self.type == "outcome":
            self.stripe.create_meter_event(self.meter, self.customer)

        if self.type == "token":
            if self.meters["input"]:
                self.stripe.create_meter_event(self.meters["input"], self.customer, context.usage.input_tokens)
            if self.meters["output"]:
                self.stripe.create_meter_event(self.meters["output"], self.customer, context.usage.output_tokens)
