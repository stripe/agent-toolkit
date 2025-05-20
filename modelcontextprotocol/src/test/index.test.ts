import {main} from '../index';
import {parseArgs} from '../index';
import {StripeAgentToolkit} from '@stripe/agent-toolkit/modelcontextprotocol';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
describe('parseArgs function', () => {
  describe('success cases', () => {
    it('should parse api-key, tools and stripe-header arguments correctly', () => {
      const args = [
        '--api-key=sk_test_123',
        '--tools=all',
        '--stripe-account=acct_123',
      ];
      const options = parseArgs(args);
      expect(options.apiKey).toBe('sk_test_123');
      expect(options.tools).toEqual(['all']);
      expect(options.stripeAccount).toBe('acct_123');
    });

    it('should parse api-key and tools arguments correctly', () => {
      const args = ['--api-key=sk_test_123', '--tools=all'];
      const options = parseArgs(args);
      expect(options.apiKey).toBe('sk_test_123');
      expect(options.tools).toEqual(['all']);
    });

    it('should parse restricted api key correctly', () => {
      const args = ['--api-key=rk_test_123', '--tools=all'];
      const options = parseArgs(args);
      expect(options.apiKey).toBe('rk_test_123');
      expect(options.tools).toEqual(['all']);
    });

    it('if api key set in env variable, should parse tools argument correctly', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      const args = ['--tools=all'];
      const options = parseArgs(args);
      expect(options.apiKey).toBe('sk_test_123');
      expect(options.tools).toEqual(['all']);
    });

    it('if api key set in env variable but also passed into args, should prefer args key', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      const args = ['--api-key=sk_test_456', '--tools=all'];
      const options = parseArgs(args);
      expect(options.apiKey).toBe('sk_test_456');
      expect(options.tools).toEqual(['all']);
      delete process.env.STRIPE_SECRET_KEY;
    });

    it('should parse tools argument correctly if a list of tools is provided', () => {
      const args = [
        '--api-key=sk_test_123',
        '--tools=customers.create,products.read,documentation.read',
      ];
      const options = parseArgs(args);
      expect(options.tools).toEqual([
        'customers.create',
        'products.read',
        'documentation.read',
      ]);
      expect(options.apiKey).toBe('sk_test_123');
    });

    it('ignore all arguments not prefixed with --', () => {
      const args = [
        '--api-key=sk_test_123',
        '--tools=all',
        'stripe-account=acct_123',
      ];
      const options = parseArgs(args);
      expect(options.apiKey).toBe('sk_test_123');
      expect(options.tools).toEqual(['all']);
      expect(options.stripeAccount).toBeUndefined();
    });
  });

  describe('error cases', () => {
    it("should throw an error if api-key does not start with 'sk_' or 'rk_'", () => {
      const args = ['--api-key=test_123', '--tools=all'];
      expect(() => parseArgs(args)).toThrow(
        'API key must start with "sk_" or "rk_".'
      );
    });

    it('should throw an error if api-key is not provided', () => {
      const args = ['--tools=all'];
      expect(() => parseArgs(args)).toThrow(
        'Stripe API key not provided. Please either pass it as an argument --api-key=$KEY or set the STRIPE_SECRET_KEY environment variable.'
      );
    });

    it("should throw an error if stripe-account does not start with 'acct_'", () => {
      const args = [
        '--api-key=sk_test_123',
        '--tools=all',
        '--stripe-account=test_123',
      ];
      expect(() => parseArgs(args)).toThrow(
        'Stripe account must start with "acct_".'
      );
    });

    it('should throw an error if tools argument is not provided', () => {
      const args = ['--api-key=sk_test_123'];
      expect(() => parseArgs(args)).toThrow(
        'The --tools arguments must be provided.'
      );
    });

    it('should throw an error if an invalid argument is provided', () => {
      const args = [
        '--invalid-arg=value',
        '--api-key=sk_test_123',
        '--tools=all',
      ];
      expect(() => parseArgs(args)).toThrow(
        'Invalid argument: invalid-arg. Accepted arguments are: api-key, tools, stripe-account'
      );
    });

    it('should throw an error if tools is not in accepted tool list', () => {
      const args = [
        '--api-key=sk_test_123',
        '--tools=customers.create,products.read,fake.tool',
      ];
      expect(() => parseArgs(args)).toThrow(
        /Invalid tool: fake\.tool\. Accepted tools are: .*$/
      );
    });
  });
});

jest.mock('@stripe/agent-toolkit/modelcontextprotocol');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

describe('main function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize the server with tools=all correctly', async () => {
    process.argv = ['node', 'index.js', '--api-key=sk_test_123', '--tools=all'];

    await main();

    expect(StripeAgentToolkit).toHaveBeenCalledWith({
      secretKey: 'sk_test_123',
      configuration: {
        actions: ALL_ACTIONS,
        context: {mode: 'modelcontextprotocol'},
      },
    });

    expect(StdioServerTransport).toHaveBeenCalled();
  });

  it('should initialize the server with specific list of tools correctly', async () => {
    process.argv = [
      'node',
      'index.js',
      '--api-key=sk_test_123',
      '--tools=customers.create,products.read,documentation.read',
    ];

    await main();

    expect(StripeAgentToolkit).toHaveBeenCalledWith({
      secretKey: 'sk_test_123',
      configuration: {
        actions: {
          customers: {
            create: true,
          },
          products: {
            read: true,
          },
          documentation: {
            read: true,
          },
        },
        context: {
          mode: 'modelcontextprotocol',
        },
      },
    });

    expect(StdioServerTransport).toHaveBeenCalled();
  });

  it('should initialize the server with stripe header', async () => {
    process.argv = [
      'node',
      'index.js',
      '--api-key=sk_test_123',
      '--tools=all',
      '--stripe-account=acct_123',
    ];

    await main();

    expect(StripeAgentToolkit).toHaveBeenCalledWith({
      secretKey: 'sk_test_123',
      configuration: {
        actions: ALL_ACTIONS,
        context: {account: 'acct_123', mode: 'modelcontextprotocol'},
      },
    });

    expect(StdioServerTransport).toHaveBeenCalled();
  });
});

const ALL_ACTIONS = {
  customers: {
    create: true,
    read: true,
  },
  coupons: {
    create: true,
    read: true,
  },
  invoices: {
    create: true,
    update: true,
  },
  invoiceItems: {
    create: true,
  },
  paymentLinks: {
    create: true,
  },
  products: {
    create: true,
    read: true,
  },
  prices: {
    create: true,
    read: true,
  },
  balance: {
    read: true,
  },
  refunds: {
    create: true,
  },
  subscriptions: {
    read: true,
    update: true,
  },
  paymentIntents: {
    read: true,
  },
  paymentMethodConfigurations: {
    read: true,
    update: true,
  },
  disputes: {
    read: true,
    update: true,
  },
  documentation: {
    read: true,
  },
};
