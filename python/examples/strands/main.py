from strands import Agent
from strands_tools import calculator, file_read, shell

# Add tools to our agent
agent = Agent(
    tools=[calculator, file_read, shell]
)

# Agent will automatically determine when to use the calculator tool
agent("What is 42 ^ 9")

print("\n\n")  # Print new lines

# Agent will use the shell and file reader tool when appropriate
agent("Show me the contents of a single file in this directory")