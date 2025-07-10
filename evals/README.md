## Evals

Set up `.env` file with the following (see `.env.example` for an example):

```
BRAINTRUST_API_KEY=...
STRIPE_SECRET_KEY=sk_test_....
OPENAI_BASE_URL=http://0.0.0.0:8000/v1
OPENAI_API_KEY=EMPTY
```

To run:

```
tsx eval.ts
```

We are using [Braintrust](https://www.braintrust.dev/) to run the evals.

## Framework

There is a very lightweight built-in testing framework that wraps Braintrust to make adding new test cases easy.

Add a new test case to `cases.ts`:

```javascript
test({
  prompt:
    "Create a product called 'Test Product' with a description 'A test product for evaluation'",
  fn: ({ toolCalls, messages }) => [
    expectToolCall(toolCalls, ["create_product"]),
    llmCriteriaMet(
      messages,
      "The message should include a successful production creation response"
    ),
  ],
});
```

The Typescript type defintions has documentation to help you. The `fn` function
will be called with the resulting output of your prompt. This should return an array of "assertions." These are like `expect` in Jest.

This can be as simple as noting a tool was called or as complex as asking an LLM to do semantic similarities. See `scorer.ts` for a list of assertions.

Override the toolkit config by passing a `toolkitConfig` object.

If your test case needs some set up, for example, if it needs to set up some state in the Stripe account or load data, you can pass an async function.

```javascript
test(async () => {
  const customers = await stripe.customers.list();

  return {
    prompt: "What are my payments",
    toolkitConfig: {
      context: {
        customer: customers.data[0].id,
      },
    },
    fn: ({ toolCalls, messages }) => [],
  };
});
```
