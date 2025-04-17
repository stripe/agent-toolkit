import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import {createCustomerParameters, listCustomersParameters} from './parameters';

export const createCustomer = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof createCustomerParameters>>
) => {
  try {
    const customer = await stripe.customers.create(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return {id: customer.id};
  } catch (error) {
    return 'Failed to create customer';
  }
};

export const listCustomers = async (
  stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof listCustomersParameters>>
) => {
  try {
    const customers = await stripe.customers.list(
      params,
      context.account ? {stripeAccount: context.account} : undefined
    );

    return customers.data;
  } catch (error) {
    return 'Failed to list customers';
  }
};
