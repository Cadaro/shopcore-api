import {
  OrderStatusValidatorService,
  OrderStatusValidationError,
} from '#services/order_status_validator_service';
import { OrderStatus } from '#types/enum/orderStatus';

/**
 * Example usage of the OrderStatusValidatorService
 * This demonstrates how to validate order status transitions according to business rules
 */

export class OrderStatusExample {
  /**
   * Example 1: Validate a single status transition
   */
  static validateSingleTransition() {
    console.log('=== Example 1: Single Transition Validation ===');

    try {
      // Valid transition
      OrderStatusValidatorService.validateTransition(OrderStatus.NEW, OrderStatus.PROCESSING);
      console.log('✅ Transition NEW -> PROCESSING is valid');

      // Invalid transition
      OrderStatusValidatorService.validateTransition(OrderStatus.NEW, OrderStatus.DELIVERED);
      console.log('❌ This should not be reached');
    } catch (error) {
      if (error instanceof OrderStatusValidationError) {
        console.log(`❌ Invalid transition: ${error.message}`);
        console.log(`   Current: ${error.currentStatus}, Target: ${error.targetStatus}`);
      }
    }
  }

  /**
   * Example 2: Validate a complete order lifecycle for HOME_DELIVERY
   */
  static validateHomeDeliveryLifecycle() {
    console.log('\n=== Example 2: Home Delivery Lifecycle ===');

    const homeDeliveryPath: OrderStatus[] = [
      OrderStatus.WAITING_FOR_PAYMENT,
      OrderStatus.NEW,
      OrderStatus.PROCESSING,
      OrderStatus.COMPLETED,
      OrderStatus.SENT,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED,
    ];

    try {
      OrderStatusValidatorService.validateStatusHistory(homeDeliveryPath, 'HOME_DELIVERY');
      console.log('✅ Complete home delivery path is valid');
      console.log(`   Path: ${homeDeliveryPath.join(' -> ')}`);
    } catch (error) {
      if (error instanceof OrderStatusValidationError) {
        console.log(`❌ Invalid path: ${error.message}`);
      }
    }
  }

  /**
   * Example 3: Validate pickup point delivery with failure
   */
  static validatePickupPointFailure() {
    console.log('\n=== Example 3: Pickup Point with Delivery Failure ===');

    const pickupPointFailurePath: OrderStatus[] = [
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

    try {
      OrderStatusValidatorService.validateStatusHistory(pickupPointFailurePath, 'PICKUP_POINT');
      console.log('✅ Pickup point failure path is valid');
      console.log(`   Path: ${pickupPointFailurePath.join(' -> ')}`);
    } catch (error) {
      if (error instanceof OrderStatusValidationError) {
        console.log(`❌ Invalid path: ${error.message}`);
      }
    }
  }

  /**
   * Example 4: Handle order with ON_HOLD status
   */
  static validateWithHoldStatus() {
    console.log('\n=== Example 4: Order with ON_HOLD Status ===');

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

    try {
      OrderStatusValidatorService.validateStatusHistory(pathWithHold, 'HOME_DELIVERY');
      console.log('✅ Path with ON_HOLD status is valid');
      console.log(`   Path: ${pathWithHold.join(' -> ')}`);
    } catch (error) {
      if (error instanceof OrderStatusValidationError) {
        console.log(`❌ Invalid path: ${error.message}`);
      }
    }
  }

  /**
   * Example 5: Check valid next statuses
   */
  static checkValidNextStatuses() {
    console.log('\n=== Example 5: Valid Next Statuses ===');

    const currentStatus: OrderStatus = OrderStatus.ON_THE_WAY;

    // Without delivery method
    const allValidNext = OrderStatusValidatorService.getValidNextStatuses(currentStatus);
    console.log(`From ${currentStatus}, valid transitions: ${allValidNext.join(', ')}`);

    // With HOME_DELIVERY
    const homeDeliveryNext = OrderStatusValidatorService.getValidNextStatuses(
      currentStatus,
      'HOME_DELIVERY'
    );
    console.log(`From ${currentStatus} (HOME_DELIVERY): ${homeDeliveryNext.join(', ')}`);

    // With PICKUP_POINT
    const pickupPointNext = OrderStatusValidatorService.getValidNextStatuses(
      currentStatus,
      'PICKUP_POINT'
    );
    console.log(`From ${currentStatus} (PICKUP_POINT): ${pickupPointNext.join(', ')}`);
  }

  /**
   * Example 6: Check if status is final
   */
  static checkFinalStatuses() {
    console.log('\n=== Example 6: Final Statuses ===');

    const statuses: OrderStatus[] = [
      OrderStatus.DELIVERED,
      OrderStatus.CANCELED,
      OrderStatus.RETURN_TO_SENDER,
      OrderStatus.PROCESSING,
      OrderStatus.ON_THE_WAY,
    ];

    for (const status of statuses) {
      const isFinal = OrderStatusValidatorService.isFinalStatus(status);
      console.log(`${status}: ${isFinal ? 'FINAL' : 'can transition further'}`);
    }
  }

  /**
   * Example 7: Validate payment cancellation
   */
  static validatePaymentCancellation() {
    console.log('\n=== Example 7: Payment Cancellation ===');

    try {
      // Valid cancellation from WAITING_FOR_PAYMENT
      OrderStatusValidatorService.validateTransition(
        OrderStatus.WAITING_FOR_PAYMENT,
        OrderStatus.CANCELED
      );
      console.log('✅ Cancellation from WAITING_FOR_PAYMENT is valid');

      // Invalid cancellation from other status
      OrderStatusValidatorService.validateTransition(OrderStatus.PROCESSING, OrderStatus.CANCELED);
      console.log('❌ This should not be reached');
    } catch (error) {
      if (error instanceof OrderStatusValidationError) {
        console.log(`❌ Invalid cancellation: ${error.message}`);
      }
    }
  }

  /**
   * Run all examples
   */
  static runAllExamples() {
    console.log('🚀 Order Status Validator Examples\n');

    this.validateSingleTransition();
    this.validateHomeDeliveryLifecycle();
    this.validatePickupPointFailure();
    this.validateWithHoldStatus();
    this.checkValidNextStatuses();
    this.checkFinalStatuses();
    this.validatePaymentCancellation();

    console.log('\n✨ All examples completed!');
  }
}

// Uncomment to run examples
// OrderStatusExample.runAllExamples();
