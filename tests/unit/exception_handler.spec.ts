import { test } from '@japa/runner';
import { HttpContextFactory } from '@adonisjs/core/factories/http';
import HttpExceptionHandler from '#exceptions/handler';
import { DomainRuleException, InternalServerException } from '#exceptions/domain_exception';

test.group('HTTP exception handler', () => {
  test('returns a generic 500 without the internal message or details', async ({ assert }) => {
    const ctx = new HttpContextFactory().create();
    const error = new InternalServerException('Sensitive internal message', [
      { field: 'email', message: 'Sensitive detail' },
    ]);

    await new HttpExceptionHandler().handle(error, ctx);

    assert.equal(ctx.response.getStatus(), 500);
    assert.deepEqual(ctx.response.getBody(), {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  });

  test('preserves the message and details of a domain rule error', async ({ assert }) => {
    const ctx = new HttpContextFactory().create();
    const details = [{ field: 'sort', message: 'Invalid sort', rule: 'enum' }];

    await new HttpExceptionHandler().handle(new DomainRuleException('Invalid sort', details), ctx);

    assert.equal(ctx.response.getStatus(), 422);
    assert.deepEqual(ctx.response.getBody(), {
      code: 'DOMAIN_RULE_VIOLATION',
      message: 'Invalid sort',
      details,
    });
  });
});
