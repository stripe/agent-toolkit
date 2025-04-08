const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValueOnce(mockResponse),
} as unknown as Response);

const result = await searchDocumentation(stripe, {}, requestBody);

expect(fetchMock).toHaveBeenCalledWith("https://ai.stripe.com/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "fetch",
    "User-Agent": "stripe-agent-toolkit-typescript",
  },
  body: JSON.stringify(requestBody),
});

const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
  ok: false,
  status: 400,
  json: jest.fn().mockResolvedValueOnce(mockError),
} as unknown as Response);

const result = await searchDocumentation(stripe, {}, requestBody);

expect(fetchMock).toHaveBeenCalledWith("https://ai.stripe.com/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "fetch",
    "User-Agent": "stripe-agent-toolkit-typescript",
  },
  body: JSON.stringify(requestBody),
});
