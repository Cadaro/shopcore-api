import { test } from '@japa/runner';
import { DomainRuleException } from '#exceptions/domain_exception';
import OrderService from '#services/order_service';
import StockService from '#services/stock_service';

test.group('Pagination service errors', () => {
  test('reports the sort parameter for invalid order sorting', async ({ assert }) => {
    const service = new OrderService();

    for (const sort of ['unknown:asc', 'status:up']) {
      await service.fetchUserOrderPage('user-id', { sort }).then(
        () => assert.fail(`Expected ${sort} to be rejected`),
        (error: unknown) => {
          if (!(error instanceof DomainRuleException)) {
            throw error;
          }
          assert.equal(error.status, 422);
          assert.equal(error.code, 'DOMAIN_RULE_VIOLATION');
          assert.deepEqual(error.details, [
            { field: 'sort', rule: 'enum', message: 'Invalid sort field or direction' },
          ]);
        }
      );
    }
  });

  test('reports the sort parameter for invalid stock sorting', async ({ assert }) => {
    const service = new StockService();

    for (const sort of ['unknown:asc', 'name:up']) {
      await service.fetchAvailableStock({ sort }).then(
        () => assert.fail(`Expected ${sort} to be rejected`),
        (error: unknown) => {
          if (!(error instanceof DomainRuleException)) {
            throw error;
          }
          assert.equal(error.status, 422);
          assert.equal(error.code, 'DOMAIN_RULE_VIOLATION');
          assert.deepEqual(error.details, [
            { field: 'sort', rule: 'enum', message: 'Invalid sort field or direction' },
          ]);
        }
      );
    }
  });
});
