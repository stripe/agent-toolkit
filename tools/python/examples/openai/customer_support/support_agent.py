import env
from agents import Agent, Runner, function_tool, TResponseInputItem, RunResult
from stripe_agent_toolkit.openai.toolkit import StripeAgentToolkit
import requests

env.ensure("OPENAI_API_KEY")

stripe_agent_toolkit = StripeAgentToolkit(
    secret_key=env.ensure("STRIPE_SECRET_KEY"),
    configuration={
        "actions": {
            "customers": {
                "read": True,
            },
            "invoices": {
                "read": True,
            },
            "billing_portal_sessions": {
                "create": True,
            },
        }
    },
)


@function_tool
def search_faq(question: str) -> str:
    response = requests.get("https://standupjack.com/faq")
    if response.status_code != 200:
        return "Not sure"
    return f"Given the following context:\n{response.text}\n\nAnswer '{question}' or response with not sure\n"


support_agent = Agent(
    name="Standup Jack Agent",
    instructions=(
        "You are a helpful customer support assistant"
        "Be casual and concise"
        "You only respond with markdown"
        "Use tools to support customers"
        "Respond with I'm not sure to any other prompts"
        "Sign off with Standup Jack Bot"
    ),
    tools=[search_faq, *stripe_agent_toolkit.get_tools()],
)


async def run(input: list[TResponseInputItem]) -> RunResult:
    return await Runner.run(support_agent, input)
