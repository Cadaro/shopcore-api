import { test } from '@japa/runner';
import {
  OrderStatusValidatorService,
  OrderStatusValidationError,
} from '#services/order_status_validator_service';
import { OrderStatus } from '#types/enum/orderStatus';
import { DeliveryMethod } from '#types/enum/deliveryMethod';

test.group('OrderStatusValidatorService', () => {
  test('should allow valid basic transitions', ({ assert }) => {
    // Test basic valid transitions
    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateTransition(
        OrderStatus.WAITING_FOR_PAYMENT,
        OrderStatus.NEW
      );
    });

    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateTransition(OrderStatus.NEW, OrderStatus.PROCESSING);
    });

    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateTransition(OrderStatus.PROCESSING, OrderStatus.COMPLETED);
    });

    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateTransition(OrderStatus.COMPLETED, OrderStatus.SENT);
    });
  });

  test('should throw error for invalid basic transitions', ({ assert }) => {
    // Test invalid transitions
    try {
      OrderStatusValidatorService.validateTransition(OrderStatus.NEW, OrderStatus.COMPLETED);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.instanceOf(error, OrderStatusValidationError);
      assert.include(error.message, "Invalid status transition from 'NEW' to 'COMPLETED'");
    }

    try {
      OrderStatusValidatorService.validateTransition(OrderStatus.DELIVERED, OrderStatus.PROCESSING);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.instanceOf(error, OrderStatusValidationError);
      assert.include(error.message, "Invalid status transition from 'DELIVERED' to 'PROCESSING'");
    }
  });

  test('should validate WAITING_FOR_PAYMENT -> CANCELED transition', ({ assert }) => {
    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateTransition(
        OrderStatus.WAITING_FOR_PAYMENT,
        OrderStatus.CANCELED
      );
    });

    // Cannot cancel from other statuses directly
    try {
      OrderStatusValidatorService.validateTransition(OrderStatus.NEW, OrderStatus.CANCELED);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.instanceOf(error, OrderStatusValidationError);
    }
  });

  test('should validate ON_HOLD transitions', ({ assert }) => {
    // Can go to ON_HOLD from PROCESSING
    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateTransition(OrderStatus.PROCESSING, OrderStatus.ON_HOLD);
    });

    // Can continue from ON_HOLD to COMPLETED
    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateTransition(OrderStatus.ON_HOLD, OrderStatus.COMPLETED);
    });
  });

  test('should validate HOME_DELIVERY specific transitions', ({ assert }) => {
    // Path 1: Standard home delivery
    const homeDeliveryPath1: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.COMPLETED,
      OrderStatus.SENT,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED,
    ];

    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateStatusHistory(
        homeDeliveryPath1,
        DeliveryMethod.HOME_DELIVERY
      );
    });

    // Path 3: Failed home delivery
    const homeDeliveryPath3: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.COMPLETED,
      OrderStatus.SENT,
      OrderStatus.ON_THE_WAY,
      OrderStatus.FAILED_DELIVERY,
      OrderStatus.RETURN_TO_SENDER,
    ];

    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateStatusHistory(
        homeDeliveryPath3,
        DeliveryMethod.HOME_DELIVERY
      );
    });

    // Should not allow DELIVERED_PICKUP_POINT for HOME_DELIVERY
    try {
      OrderStatusValidatorService.validateTransition(
        OrderStatus.ON_THE_WAY,
        OrderStatus.DELIVERED_PICKUP_POINT,
        DeliveryMethod.HOME_DELIVERY
      );
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.instanceOf(error, OrderStatusValidationError);
      assert.include(
        error.message,
        "Status 'DELIVERED_PICKUP_POINT' is only valid for PICKUP_POINT delivery method"
      );
      assert.include(error.message, 'HOME_DELIVERY');
    }
  });

  test('should validate PICKUP_POINT specific transitions', ({ assert }) => {
    // Path 2: Standard pickup point delivery
    const pickupPointPath2: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.COMPLETED,
      OrderStatus.SENT,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED_PICKUP_POINT,
      OrderStatus.DELIVERED,
    ];

    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateStatusHistory(
        pickupPointPath2,
        DeliveryMethod.PICKUP_POINT
      );
    });

    // Path 4: Failed pickup point delivery
    const pickupPointPath4: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.COMPLETED,
      OrderStatus.SENT,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED_PICKUP_POINT,
      OrderStatus.FAILED_DELIVERY,
      OrderStatus.RETURN_TO_SENDER,
    ];

    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateStatusHistory(
        pickupPointPath4,
        DeliveryMethod.PICKUP_POINT
      );
    });

    // Should allow DELIVERED_PICKUP_POINT for PICKUP_POINT delivery
    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateTransition(
        OrderStatus.ON_THE_WAY,
        OrderStatus.DELIVERED_PICKUP_POINT,
        DeliveryMethod.PICKUP_POINT
      );
    });

    // Should not allow DELIVERED_PICKUP_POINT for non-PICKUP_POINT delivery
    try {
      OrderStatusValidatorService.validateTransition(
        OrderStatus.ON_THE_WAY,
        OrderStatus.DELIVERED_PICKUP_POINT,
        DeliveryMethod.HOME_DELIVERY
      );
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.instanceOf(error, OrderStatusValidationError);
      assert.include(
        error.message,
        "Status 'DELIVERED_PICKUP_POINT' is only valid for PICKUP_POINT delivery method"
      );
      assert.include(error.message, 'HOME_DELIVERY');
    }
  });

  test('should validate paths with ON_HOLD (Path 5)', ({ assert }) => {
    // Path 5 for HOME_DELIVERY with hold, then continuing to standard completion
    const pathWithHold: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.ON_HOLD,
      OrderStatus.COMPLETED,
      OrderStatus.SENT,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED,
    ];

    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateStatusHistory(pathWithHold, DeliveryMethod.HOME_DELIVERY);
    });

    // Path 5 for PICKUP_POINT with hold, then continuing to failed delivery
    const pathWithHoldFailed: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.ON_HOLD,
      OrderStatus.COMPLETED,
      OrderStatus.SENT,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED_PICKUP_POINT,
      OrderStatus.FAILED_DELIVERY,
      OrderStatus.RETURN_TO_SENDER,
    ];

    assert.doesNotThrow(() => {
      OrderStatusValidatorService.validateStatusHistory(
        pathWithHoldFailed,
        DeliveryMethod.PICKUP_POINT
      );
    });
  });

  test('should check if transition is valid without throwing', ({ assert }) => {
    assert.isTrue(
      OrderStatusValidatorService.isValidTransition(OrderStatus.NEW, OrderStatus.PROCESSING)
    );
    assert.isFalse(
      OrderStatusValidatorService.isValidTransition(OrderStatus.NEW, OrderStatus.COMPLETED)
    );
    assert.isTrue(
      OrderStatusValidatorService.isValidTransition(
        OrderStatus.ON_THE_WAY,
        OrderStatus.DELIVERED_PICKUP_POINT,
        DeliveryMethod.PICKUP_POINT
      )
    );
    assert.isFalse(
      OrderStatusValidatorService.isValidTransition(
        OrderStatus.ON_THE_WAY,
        OrderStatus.DELIVERED_PICKUP_POINT,
        DeliveryMethod.HOME_DELIVERY
      )
    );
  });

  test('should get valid next statuses', ({ assert }) => {
    const nextStatuses = OrderStatusValidatorService.getValidNextStatuses(OrderStatus.NEW);
    assert.deepEqual(nextStatuses, [OrderStatus.PROCESSING]);

    const waitingStatuses = OrderStatusValidatorService.getValidNextStatuses(
      OrderStatus.WAITING_FOR_PAYMENT
    );
    assert.deepEqual(waitingStatuses, [OrderStatus.NEW, OrderStatus.CANCELED]);

    const onTheWayStatuses = OrderStatusValidatorService.getValidNextStatuses(
      OrderStatus.ON_THE_WAY
    );
    assert.deepEqual(onTheWayStatuses, [
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERED_PICKUP_POINT,
      OrderStatus.FAILED_DELIVERY,
    ]);

    // Test with delivery method filtering
    const onTheWayHomeDelivery = OrderStatusValidatorService.getValidNextStatuses(
      OrderStatus.ON_THE_WAY,
      DeliveryMethod.HOME_DELIVERY
    );
    assert.deepEqual(onTheWayHomeDelivery, [OrderStatus.DELIVERED, OrderStatus.FAILED_DELIVERY]);

    const onTheWayPickupPoint = OrderStatusValidatorService.getValidNextStatuses(
      OrderStatus.ON_THE_WAY,
      DeliveryMethod.PICKUP_POINT
    );
    assert.deepEqual(onTheWayPickupPoint, [
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERED_PICKUP_POINT,
      OrderStatus.FAILED_DELIVERY,
    ]);
  });

  test('should identify final statuses', ({ assert }) => {
    assert.isTrue(OrderStatusValidatorService.isFinalStatus(OrderStatus.DELIVERED));
    assert.isTrue(OrderStatusValidatorService.isFinalStatus(OrderStatus.CANCELED));
    assert.isTrue(OrderStatusValidatorService.isFinalStatus(OrderStatus.RETURN_TO_SENDER));
    assert.isTrue(OrderStatusValidatorService.isFinalStatus(OrderStatus.RETURNED));

    assert.isFalse(OrderStatusValidatorService.isFinalStatus(OrderStatus.NEW));
    assert.isFalse(OrderStatusValidatorService.isFinalStatus(OrderStatus.PROCESSING));
    assert.isFalse(OrderStatusValidatorService.isFinalStatus(OrderStatus.ON_THE_WAY));
  });

  test('should validate complete paths', ({ assert }) => {
    const validHomeDeliveryPath: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.COMPLETED,
      OrderStatus.SENT,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED,
    ];
    assert.isTrue(
      OrderStatusValidatorService.isValidCompletePath(
        validHomeDeliveryPath,
        DeliveryMethod.HOME_DELIVERY
      )
    );

    const validPickupPointPath: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.COMPLETED,
      OrderStatus.SENT,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED_PICKUP_POINT,
      OrderStatus.DELIVERED,
    ];
    assert.isTrue(
      OrderStatusValidatorService.isValidCompletePath(
        validPickupPointPath,
        DeliveryMethod.PICKUP_POINT
      )
    );

    // Invalid path - skipping statuses
    const invalidPath: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.COMPLETED,
      OrderStatus.DELIVERED,
    ];
    assert.isFalse(
      OrderStatusValidatorService.isValidCompletePath(invalidPath, DeliveryMethod.HOME_DELIVERY)
    );
  });

  test('should handle partial paths correctly', ({ assert }) => {
    // Partial valid path should be allowed
    const partialPath: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
    ];
    assert.isTrue(
      OrderStatusValidatorService.isValidCompletePath(partialPath, DeliveryMethod.HOME_DELIVERY)
    );

    // Another partial path
    const anotherPartialPath: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.ON_HOLD,
      OrderStatus.COMPLETED,
    ];
    assert.isTrue(
      OrderStatusValidatorService.isValidCompletePath(
        anotherPartialPath,
        DeliveryMethod.PICKUP_POINT
      )
    );
  });

  test('should provide detailed error information', ({ assert }) => {
    try {
      OrderStatusValidatorService.validateTransition(
        OrderStatus.NEW,
        OrderStatus.DELIVERED,
        DeliveryMethod.HOME_DELIVERY
      );
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.instanceOf(error, OrderStatusValidationError);
      assert.equal(error.currentStatus, OrderStatus.NEW);
      assert.equal(error.targetStatus, OrderStatus.DELIVERED);
      assert.equal(error.deliveryMethod, 'HOME_DELIVERY');
      assert.equal(error.name, 'OrderStatusValidationError');
    }
  });

  test('should get complete paths for delivery methods', ({ assert }) => {
    const homeDeliveryPaths = OrderStatusValidatorService.getCompletePaths(
      DeliveryMethod.HOME_DELIVERY
    );
    assert.property(homeDeliveryPaths, 'standard');
    assert.property(homeDeliveryPaths, 'failed');
    assert.property(homeDeliveryPaths, 'withHold');

    const pickupPointPaths = OrderStatusValidatorService.getCompletePaths(
      DeliveryMethod.PICKUP_POINT
    );
    assert.property(pickupPointPaths, 'standard');
    assert.property(pickupPointPaths, 'failed');
    assert.property(pickupPointPaths, 'withHold');
  });
});
