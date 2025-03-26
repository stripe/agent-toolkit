import {z} from 'zod';
import type {Context} from './configuration';

export const createCustomerParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    name: z.string().describe('The name of the customer'),
    email: z.string().email().optional().describe('The email of the customer'),
  });

export const listCustomersParameters = (_context: Context = {}) =>
  z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100.'
      ),
    email: z
      .string()
      .optional()
      .describe(
        "A case-sensitive filter on the list based on the customer's email field. The value must be a string."
      ),
  });

export const createProductParameters = (_context: Context = {}) =>
  z.object({
    name: z.string().describe('The name of the product.'),
    description: z
      .string()
      .optional()
      .describe('The description of the product.'),
  });

export const listProductsParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });

export const createPriceParameters = (_context: Context = {}) =>
  z.object({
    product: z
      .string()
      .describe('The ID of the product to create the price for.'),
    unit_amount: z
      .number()
      .int()
      .describe('The unit amount of the price in cents.'),
    currency: z.string().describe('The currency of the price.'),
  });

export const listPricesParameters = (_context: Context = {}): z.AnyZodObject =>
  z.object({
    product: z
      .string()
      .optional()
      .describe('The ID of the product to list prices for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });

export const createPaymentLinkParameters = (_context: Context = {}) =>
  z.object({
    price: z
      .string()
      .describe('The ID of the price to create the payment link for.'),
    quantity: z
      .number()
      .int()
      .describe('The quantity of the product to include.'),
  });

export const createInvoiceParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .describe('The ID of the customer to create the invoice for.'),
    days_until_due: z
      .number()
      .int()
      .optional()
      .describe('The number of days until the invoice is due.'),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};

export const listInvoicesParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .optional()
      .describe('The ID of the customer to list invoices for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.'
      ),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};
export const createInvoiceItemParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .describe('The ID of the customer to create the invoice item for.'),
    price: z.string().describe('The ID of the price for the item.'),
    invoice: z
      .string()
      .describe('The ID of the invoice to create the item for.'),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};

export const finalizeInvoiceParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    invoice: z.string().describe('The ID of the invoice to finalize.'),
  });

export const retrieveBalanceParameters = (
  _context: Context = {}
): z.AnyZodObject => z.object({});

export const createRefundParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    payment_intent: z
      .string()
      .describe('The ID of the PaymentIntent to refund.'),
    amount: z
      .number()
      .int()
      .optional()
      .describe('The amount to refund in cents.'),
  });

export const listPaymentIntentsParameters = (
  context: Context = {}
): z.AnyZodObject => {
  const schema = z.object({
    customer: z
      .string()
      .optional()
      .describe('The ID of the customer to list payment intents for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe(
        'A limit on the number of objects to be returned. Limit can range between 1 and 100.'
      ),
  });

  if (context.customer) {
    return schema.omit({customer: true});
  } else {
    return schema;
  }
};

export const searchStripeResourcesParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    resource: z
      .enum([
        'charges',
        'customers',
        'invoices',
        'payment_intents',
        'prices',
        'products',
        'subscriptions',
      ])
      .describe(
        'This is the Stripe resource to search for. Each Stripe resource object has different metadata that can be queried.'
      ),
    query: z.string()
      .describe(`This is a custom query syntax to search Stripe resources

      Query structure and terminology:
      A query clause consists of a field followed by an operator followed by a value:
      clause: email:"amy@rocketrides.io"
      field: email
      operator: :
      value: amy@rocketrides.io

      You can combine up to 10 query clauses in a search by either separating them with a space, or using the AND or OR keywords (case insensitive). You can’t combine AND and OR in the same query. Furthermore, there’s no option to use parentheses to give priority to certain logic operators. By default, the API combines clauses with AND logic.
      The example query email:"amy@rocketrides.io" metadata["key"]:"value" matches records where both the email address is amy@rocketrides.io, and the metadata in the record includes key with a value of value.

      Every search field supports exact matching with a :. Certain fields such as email and name support substring matching. Certain other fields such as amount support numeric comparators like > and <.
      You must use quotation marks around string values. Quotation marks are optional for numeric values.
      You can escape quotes inside of quotes with a backslash (\\).


      ## Query fields for Charges
      * amount                                        
      * billing_details.address.postal_code           
      * created                                       
      * currency                                      
      * customer                                      
      * disputed                                      
      * metadata                                      
      * payment_method_details.{{SOURCE}}.last4       
      * payment_method_details.{{SOURCE}}.exp_month   
      * payment_method_details.{{SOURCE}}.exp_year    
      * payment_method_details.{{SOURCE}}.brand       
      * payment_method_details.{{SOURCE}}.fingerprint 
      * refunded                                      
      * status                                        

      ## Query fields for Customers
      * created  
      * email    
      * metadata 
      * name     
      * phone    

      ### Query fields for Invoices
      * created                     
      * currency                    
      * customer                    
      * last_finalization_error_code 
      * last_finalization_error_type 
      * metadata                    
      * number                      
      * receipt_number              
      * status                      
      * subscription                
      * total                       
      
      ## Query fields for PaymentIntents
      * amount  
      * created 
      * currency 
      * customer 
      * metadata 
      * status  

      ### Query fields for Prices
      * active    
      * currency  
      * lookup_key 
      * metadata  
      * product   
      * type      

      ### Query fields for Products
      * active     
      * description 
      * metadata   
      * name       
      * shippable  
      * url        

      ### Query fields for Subscriptions
      * created    
      * metadata   
      * status     
      * canceled_at 


      Examples:

      Input: Look up charges matching a custom metadata value.
      Output: metadata['order_id']:'1234567890'

      Input: Look up charges matching the last 4 digits of the card used for the payment.
      Output: payment_method_details.card.last4:4242

      Input: Look up customers matching an email.
      Output: email:'sally@rocketrides.io'

      Input: Look up PaymentIntents not in the USD currency.
      Output: -currency:'usd'

      Input: Filter invoice objects with a total greater than 1000.
      Output: total>1000

      Input: Filter payments with a amount over $100.
      Reasoning: Stripe "amount" field is in cents, so we use 1000 instead of 100
      Output: amount>1000

      Input: Look up charges matching a combination of metadata and currency.
      Output: metadata['key']:'value' AND currency:'usd'
      `),
  });

export const searchDocumentationParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    question: z
      .string()
      .describe(
        'The user question about integrating with Stripe will be used to search the documentation.'
      ),
    language: z
      .enum(['dotnet', 'go', 'java', 'node', 'php', 'ruby', 'python', 'curl'])
      .optional()
      .describe(
        'The programming language to search for in the the documentation.'
      ),
  });
