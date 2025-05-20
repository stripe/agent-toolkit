import type {Tool} from './tools';

// Actions restrict the subset of API calls that can be made. They should
// be used in conjunction with Restricted API Keys. Setting a permission to false
// prevents the related "tool" from being considered.
export type Object =
  | 'customers'
  | 'disputes'
  | 'invoices'
  | 'invoiceItems'
  | 'paymentLinks'
  | 'products'
  | 'prices'
  | 'balance'
  | 'refunds'
  | 'paymentIntents'
  | 'subscriptions'
  | 'paymentMethodConfigurations'
  | 'documentation'
  | 'coupons';

export type Permission = 'create' | 'update' | 'read';

export type Actions = {
  [K in Object]?: {
    [K in Permission]?: boolean;
  };
} & {
  balance?: {
    read?: boolean;
  };
};

// Context are settings that are applied to all requests made by the integration.
export type Context = {
  // Account is a Stripe Connected Account ID. If set, the integration will
  // make requests for this Account.
  account?: string;

  // Customer is a Stripe Customer ID. If set, the integration will
  // make requests for this Customer.
  customer?: string;

  // If set to 'modelcontextprotocol', the Stripe API calls will use a special
  // header
  mode?: 'modelcontextprotocol' | 'toolkit';
};

// Configuration provides various settings and options for the integration
// to tune and manage how it behaves.
export type Configuration = {
  actions?: Actions;
  context?: Context;
};

export const isToolAllowed = (
  tool: Tool,
  configuration: Configuration
): boolean => {
  return Object.keys(tool.actions).every((resource) => {
    // For each resource.permission pair, check the configuration.
    // @ts-ignore
    const permissions = tool.actions[resource];

    return Object.keys(permissions).every((permission) => {
      // @ts-ignore
      return configuration.actions[resource]?.[permission] === true;
    });
  });
};
