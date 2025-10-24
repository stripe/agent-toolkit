import {updateDispute} from '@/shared/disputes/updateDispute';
import {listDisputes} from '@/shared/disputes/listDisputes';

const Stripe = jest.fn().mockImplementation(() => ({
  disputes: {
    update: jest.fn(),
    list: jest.fn(),
  },
}));

let stripe: ReturnType<typeof Stripe>;

beforeEach(() => {
  stripe = new Stripe('fake-api-key');
});

describe('updateDispute', () => {
  it('should update a dispute and return the id', async () => {
    const params = {
      dispute: 'dp_123456',
      evidence: {
        uncategorized_text: 'Test product',
      },
      submit: true,
    };

    const context = {};

    const mockDispute = {id: 'dp_123456'};
    stripe.disputes.update.mockResolvedValue(mockDispute);

    const result = await updateDispute(stripe, context, params);

    expect(stripe.disputes.update).toHaveBeenCalledWith(
      params.dispute,
      {
        evidence: params.evidence,
        submit: params.submit,
      },
      undefined
    );
    expect(result).toEqual({id: mockDispute.id});
  });

  it('should specify the connected account if included in context', async () => {
    const params = {
      dispute: 'dp_123456',
      evidence: {
        uncategorized_text: 'Test product',
      },
      submit: true,
    };

    const context = {
      account: 'acct_123456',
    };

    const mockDispute = {id: 'dp_123456'};
    stripe.disputes.update.mockResolvedValue(mockDispute);

    const result = await updateDispute(stripe, context, params);

    expect(stripe.disputes.update).toHaveBeenCalledWith(
      params.dispute,
      {
        evidence: params.evidence,
        submit: params.submit,
      },
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual({id: mockDispute.id});
  });
});

describe('listDisputes', () => {
  it('should list disputes and return their ids', async () => {
    const mockDisputes = [{id: 'dp_123456'}, {id: 'dp_789012'}];

    const context = {};

    stripe.disputes.list.mockResolvedValue({data: mockDisputes});
    const result = await listDisputes(stripe, context, {});

    expect(stripe.disputes.list).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual(mockDisputes.map(({id}) => ({id})));
  });

  it('should specify the connected account if included in context', async () => {
    const mockDisputes = [{id: 'dp_123456'}, {id: 'dp_789012'}];

    const context = {
      account: 'acct_123456',
    };

    stripe.disputes.list.mockResolvedValue({data: mockDisputes});
    const result = await listDisputes(stripe, context, {});

    expect(stripe.disputes.list).toHaveBeenCalledWith(
      {},
      {
        stripeAccount: context.account,
      }
    );
    expect(result).toEqual(mockDisputes.map(({id}) => ({id})));
  });

  it('should pass through list parameters', async () => {
    const params = {
      charge: 'ch_123456',
      payment_intent: 'pi_123456',
      limit: 5,
    };

    const mockDisputes = [{id: 'dp_123456'}, {id: 'dp_789012'}];

    const context = {};

    stripe.disputes.list.mockResolvedValue({data: mockDisputes});
    const result = await listDisputes(stripe, context, params);

    expect(stripe.disputes.list).toHaveBeenCalledWith(params, undefined);
    expect(result).toEqual(mockDisputes.map(({id}) => ({id})));
  });
});
