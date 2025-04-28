import {retrieveBalanceParameters} from '@/shared/balance/retrieveBalance';

describe('retrieveBalanceParameters', () => {
  it('should return the correct parameters if no context', () => {
    const parameters = retrieveBalanceParameters({});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual([]);
    expect(fields.length).toBe(0);
  });

  it('should return the correct parameters if customer is specified', () => {
    const parameters = retrieveBalanceParameters({customer: 'cus_123'});

    const fields = Object.keys(parameters.shape);
    expect(fields).toEqual([]);
    expect(fields.length).toBe(0);
  });
});
