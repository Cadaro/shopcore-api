import { test } from '@japa/runner';
import { DeliveryMethod } from '#types/enum/delivery_method';
import { OrderStatus } from '#types/enum/order_status';
import {
  OrderStatusValidationError,
  OrderStatusValidatorService,
} from '#services/order_status_validator_service';

test.group('Order status validator service', () => {
  test('accepts valid transitions and reports invalid transition details', ({ assert }) => {
    assert.doesNotThrow(() =>
      OrderStatusValidatorService.validateTransition(OrderStatus.NEW, OrderStatus.PROCESSING)
    );
    assert.isTrue(
      OrderStatusValidatorService.isValidTransition(OrderStatus.ON_HOLD, OrderStatus.COMPLETED)
    );
    assert.isFalse(
      OrderStatusValidatorService.isValidTransition(OrderStatus.DELIVERED, OrderStatus.NEW)
    );

    try {
      OrderStatusValidatorService.validateTransition(OrderStatus.DELIVERED, OrderStatus.NEW);
      assert.fail('Expected a final status transition to fail');
    } catch (error) {
      assert.instanceOf(error, OrderStatusValidationError);
      if (!(error instanceof OrderStatusValidationError)) {
        throw error;
      }
      assert.equal(error.currentStatus, OrderStatus.DELIVERED);
      assert.equal(error.targetStatus, OrderStatus.NEW);
      assert.isUndefined(error.details);
    }
  });

  test('filters transitions by delivery method', ({ assert }) => {
    assert.deepEqual(
      OrderStatusValidatorService.getValidNextStatuses(
        OrderStatus.ON_THE_WAY,
        DeliveryMethod.HOME_DELIVERY
      ),
      [OrderStatus.DELIVERED, OrderStatus.FAILED_DELIVERY]
    );
    assert.deepEqual(
      OrderStatusValidatorService.getValidNextStatuses(
        OrderStatus.ON_THE_WAY,
        DeliveryMethod.PICKUP_POINT
      ),
      [OrderStatus.DELIVERED, OrderStatus.DELIVERED_PICKUP_POINT, OrderStatus.FAILED_DELIVERY]
    );
  });

  test('validates status history and complete delivery paths', ({ assert }) => {
    assert.doesNotThrow(() =>
      OrderStatusValidatorService.validateStatusHistory([], DeliveryMethod.HOME_DELIVERY)
    );
    assert.doesNotThrow(() =>
      OrderStatusValidatorService.validateStatusHistory(
        [OrderStatus.WAITING_FOR_PAYMENT, OrderStatus.NEW, OrderStatus.PROCESSING],
        DeliveryMethod.HOME_DELIVERY
      )
    );
    let invalidHistoryError: unknown;
    try {
      OrderStatusValidatorService.validateStatusHistory(
        [OrderStatus.NEW, OrderStatus.DELIVERED],
        DeliveryMethod.HOME_DELIVERY
      );
    } catch (error) {
      invalidHistoryError = error;
    }
    assert.instanceOf(invalidHistoryError, OrderStatusValidationError);

    assert.isTrue(
      OrderStatusValidatorService.isValidCompletePath(
        [OrderStatus.WAITING_FOR_PAYMENT, OrderStatus.NEW, OrderStatus.PROCESSING],
        DeliveryMethod.HOME_DELIVERY
      )
    );
    assert.isFalse(
      OrderStatusValidatorService.isValidCompletePath(
        [
          OrderStatus.WAITING_FOR_PAYMENT,
          OrderStatus.NEW,
          OrderStatus.PROCESSING,
          OrderStatus.COMPLETED,
          OrderStatus.SENT,
          OrderStatus.ON_THE_WAY,
          OrderStatus.DELIVERED,
        ],
        DeliveryMethod.PICKUP_POINT
      )
    );
    assert.isTrue(OrderStatusValidatorService.isFinalStatus(OrderStatus.RETURNED));
    assert.isFalse(OrderStatusValidatorService.isFinalStatus(OrderStatus.PROCESSING));
    assert.equal(
      OrderStatusValidatorService.getCompletePaths(DeliveryMethod.HOME_DELIVERY).standard.at(-1),
      OrderStatus.DELIVERED
    );
  });
});
