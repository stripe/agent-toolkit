import asyncio
import os

from dotenv import load_dotenv
load_dotenv()

from agents import Agent, Runner, WebSearchTool
from stripe_agent_toolkit.openai.toolkit import StripeAgentToolkit

stripe_agent_toolkit = StripeAgentToolkit(
    secret_key=os.getenv("STRIPE_SECRET_KEY"),
    configuration={},
)

research_agent = Agent(
    name="Research Agent",
    instructions="You are an expert at research.",
    tools=[WebSearchTool()],
    hooks=stripe_agent_toolkit.billing_hook(
        type="outcome",
        customer=os.getenv("STRIPE_CUSTOMER_ID"),
        meter=os.getenv("STRIPE_METER"),
    ),
)

async def main():
    result = await Runner.run(
        research_agent,
        "search the web for 'global gdp' and give me the latest data.",
    )
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
