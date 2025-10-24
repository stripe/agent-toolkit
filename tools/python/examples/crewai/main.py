import os
from dotenv import load_dotenv

from crewai import Agent, Task, Crew
from stripe_agent_toolkit.crewai.toolkit import StripeAgentToolkit

load_dotenv()

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

stripe_agent = Agent(
    role="Stripe Agent",
    goal="Integrate with Stripe effectively to support our business.",
    backstory="You have been using stripe forever.",
    tools=[*stripe_agent_toolkit.get_tools()],
    allow_delegation=False,
    verbose=True,
)

haiku_writer = Agent(
    role="Haiku writer",
    goal="Write a haiku",
    backstory="You are really good at writing haikus.",
    allow_delegation=False,
    verbose=True,
)

create_payment_link = Task(
    description="Create a payment link for a new product called 'test' "
    "with a price of $100. The description should be a haiku",
    expected_output="url",
    agent=stripe_agent,
)

write_haiku = Task(
    description="Write a haiku about buy bots.",
    expected_output="haiku",
    agent=haiku_writer,
)

crew = Crew(
    agents=[stripe_agent, haiku_writer],
    tasks=[create_payment_link, write_haiku],
    verbose=True,
    planning=True,
)

crew.kickoff()
