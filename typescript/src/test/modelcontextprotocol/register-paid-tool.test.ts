import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {registerPaidTool} from '../../modelcontextprotocol/register-paid-tool';
import Stripe from 'stripe';
import type {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import type {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js';

// Mock Stripe
jest.mock('stripe');
const mockSecretKey = 'sk_test_123';

describe('registerPaidTool', () => {
  let mockMcpServer: jest.Mocked<McpServer>;
  let mockStripe: jest.Mocked<any>;
  let mockExtra: RequestHandlerExtra<ServerRequest, ServerNotification>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock McpServer
    mockMcpServer = {
      tool: jest.fn(),
    } as any;

    // Mock Stripe instance and methods
    mockStripe = {
      customers: {
        list: jest.fn(),
        create: jest.fn(),
      },
      checkout: {
        sessions: {
          create: jest.fn(),
          retrieve: jest.fn(),
          list: jest.fn(),
        },
      },
      subscriptions: {
        list: jest.fn(),
      },
      billing: {
        meterEvents: {
          create: jest.fn(),
        },
      },
    };

    (Stripe as unknown as jest.Mock).mockImplementation(() => mockStripe);

    // Mock request handler extra
    mockExtra = {
      signal: new AbortController().signal,
      sendNotification: jest.fn(),
      sendRequest: jest.fn(),
    };
  });

  it('should register a tool with the McpServer', async () => {
    const toolName = 'testTool';
    const toolDescription = 'Test tool description';
    const paramsSchema = {
      testParam: z.string(),
    };
    const callback = jest.fn();

    // @ts-ignore
    await registerPaidTool(
      mockMcpServer,
      toolName,
      toolDescription,
      paramsSchema,
      callback,
      {
        priceId: 'price_123',
        paymentReason: 'Test payment',
        successUrl: 'https://example.com/success',
        stripeSecretKey: mockSecretKey,
        userEmail: 'test@example.com',
      }
    );

    expect(mockMcpServer.tool).toHaveBeenCalledWith(
      toolName,
      toolDescription,
      paramsSchema,
      expect.any(Function)
    );
  });

  it('should create a new customer if one does not exist', async () => {
    mockStripe.customers.list.mockResolvedValue({data: []});
    mockStripe.customers.create.mockResolvedValue({id: 'cus_123'});
    mockStripe.subscriptions.list.mockResolvedValue({
      data: [
        {
          items: {
            data: [
              {
                price: {
                  id: 'price_123',
                },
              },
            ],
          },
        },
      ],
    });
    mockStripe.checkout.sessions.list.mockResolvedValue({data: []});
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.com/123',
    });

    const toolName = 'testTool';
    const callback = jest.fn();

    await registerPaidTool(
      mockMcpServer,
      toolName,
      'Test description',
      {testParam: z.string()},
      callback,
      {
        priceId: 'price_123',
        paymentReason: 'Test payment',
        successUrl: 'https://example.com/success',
        stripeSecretKey: mockSecretKey,
        userEmail: 'test@example.com',
      }
    );

    const registeredCallback = mockMcpServer.tool.mock.calls[0]?.[3];
    await registeredCallback({testParam: 'test'}, mockExtra);

    expect(mockStripe.customers.list).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });

  it('should create a checkout session for unpaid tools', async () => {
    mockStripe.customers.list.mockResolvedValue({
      data: [{id: 'cus_123', email: 'test@example.com'}],
    });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.com/123',
    });
    mockStripe.subscriptions.list.mockResolvedValue({data: []});

    const toolName = 'testTool';
    const callback = jest.fn();

    await registerPaidTool(
      mockMcpServer,
      toolName,
      'Test description',
      {testParam: z.string()},
      callback,
      {
        priceId: 'price_123',
        paymentReason: 'Test payment',
        successUrl: 'https://example.com/success',
        stripeSecretKey: mockSecretKey,
        userEmail: 'test@example.com',
      }
    );

    const registeredCallback = mockMcpServer.tool.mock.calls[0]?.[3];
    const result = await registeredCallback({testParam: 'test'}, mockExtra);

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
      success_url: 'https://example.com/success',
      line_items: [{price: 'price_123', quantity: 1}],
      mode: 'subscription',
      customer: 'cus_123',
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Payment required!'),
        },
      ],
    });
  });

  it('should handle usage-based billing when meterEvent is provided', async () => {
    mockStripe.customers.list.mockResolvedValue({
      data: [{id: 'cus_123', email: 'test@example.com'}],
    });
    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
    });

    const toolName = 'testTool';
    const callback = jest.fn().mockResolvedValue({
      content: [{type: 'text', text: 'Success'}],
    });

    await registerPaidTool(
      mockMcpServer,
      toolName,
      'Test description',
      {testParam: z.string()},
      callback,
      {
        priceId: 'price_123',
        paymentReason: 'Test payment',
        successUrl: 'https://example.com/success',
        meterEvent: 'test.event',
        stripeSecretKey: mockSecretKey,
        userEmail: 'test@example.com',
      }
    );

    const registeredCallback = mockMcpServer.tool.mock.calls[0]?.[3];
    await registeredCallback({testParam: 'test'}, mockExtra);

    expect(mockStripe.billing.meterEvents.create).toHaveBeenCalledWith({
      event_name: 'test.event',
      payload: {
        stripe_customer_id: 'cus_123',
        value: '1',
      },
    });
  });
});
