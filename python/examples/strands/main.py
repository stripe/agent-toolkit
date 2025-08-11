import os
from dotenv import load_dotenv

from strands import Agent
from stripe_agent_toolkit.strands.toolkit import StripeAgentToolkit

load_dotenv()

# Initialize the Stripe Agent Toolkit
stripe_agent_toolkit = StripeAgentToolkit(
    secret_key=os.getenv("STRIPE_SECRET_KEY"),
    configuration={
        "actions": {
            "payment_links": {
                "create": True,
            },
            "products": {
                "create": True,
            },
            "prices": {
                "create": True,
            },
        }
    },
)

# Get the Stripe tools
tools = stripe_agent_toolkit.get_tools()

# Create agent with Stripe tools
agent = Agent(
    tools=tools
)

# Test the agent
response = agent("""
    Create a payment link for a new product called 'test' with a price
    of $100. Come up with a funny description about buy bots,
    maybe a haiku.
""")

print(response)
