# Stripe Agent Toolkit - Python

The Stripe Agent Toolkit library enables popular agent frameworks including OpenAI's Agent SDK, LangChain, and CrewAI to integrate with Stripe APIs through function calling. The
library is not exhaustive of the entire Stripe API. It is built directly on top
of the [Stripe Python SDK][python-sdk].

## Installation

You don't need this source code unless you want to modify the package. If you just
want to use the package, just run:

```sh
pip install stripe-agent-toolkit
```

### Requirements

-   Python 3.11+

## Usage

The library needs to be configured with your account's secret key which is
available in your [Stripe Dashboard][api-keys].

```python
from stripe_agent_toolkit.openai.toolkit import StripeAgentToolkit

stripe_agent_toolkit = StripeAgentToolkit(
    secret_key="sk_test_...",
    configuration={
        "actions": {
            "payment_links": {
                "create": True,
            },
        }
    },
)
```

The toolkit works with OpenAI's Agent SDK, LangChain, and CrewAI and can be passed as a list of tools. For example:

```python
from agents import Agent

stripe_agent = Agent(
    name="Stripe Agent",
    instructions="You are an expert at integrating with Stripe",
    tools=stripe_agent_toolkit.get_tools()
)
```

Examples for OpenAI's Agent SDK,LangChain, and CrewAI are included in [/examples](/examples).

[python-sdk]: https://github.com/stripe/stripe-python
[api-keys]: https://dashboard.stripe.com/account/apikeys

#### Context

In some cases you will want to provide values that serve as defaults when making requests. Currently, the `account` context value enables you to make API calls for your [connected accounts](https://docs.stripe.com/connect/authentication).

```python
stripe_agent_toolkit = StripeAgentToolkit(
    secret_key="sk_test_...",
    configuration={
        "context": {
            "account": "acct_123"
        }
    }
)
```

## Development

```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
