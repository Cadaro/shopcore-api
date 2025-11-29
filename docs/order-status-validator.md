# Order Status Validator Service

This service validates order status transitions according to business rules for the ShopCore API.

## Overview

The `OrderStatusValidatorService` ensures that order status changes follow the defined legal transition paths based on the delivery method and business logic.

## Legal Status Transition Paths

All transitions start with `WAITING_FOR_PAYMENT` status:

### 1. Standard Home Delivery

```
WAITING_FOR_PAYMENT → NEW → PROCESSING → COMPLETED → SENT → ON_THE_WAY → DELIVERED
```

### 2. Standard Pickup Point Delivery

```
WAITING_FOR_PAYMENT → NEW → PROCESSING → COMPLETED → SENT → ON_THE_WAY → DELIVERED_PICKUP_POINT → DELIVERED
```

### 3. Failed Home Delivery

```
WAITING_FOR_PAYMENT → NEW → PROCESSING → COMPLETED → SENT → ON_THE_WAY → FAILED_DELIVERY → RETURN_TO_SENDER
```

### 4. Failed Pickup Point Delivery

```
WAITING_FOR_PAYMENT → NEW → PROCESSING → COMPLETED → SENT → ON_THE_WAY → DELIVERED_PICKUP_POINT → FAILED_DELIVERY → RETURN_TO_SENDER
```

### 5. Orders with Hold Status

Any of the above paths can include an `ON_HOLD` status between `PROCESSING` and `COMPLETED`:

```
... → PROCESSING → ON_HOLD → COMPLETED → ...
```

### 6. Payment Cancellation

```
WAITING_FOR_PAYMENT → CANCELED
```

## Usage

### Basic Transition Validation

```typescript
import {
  OrderStatusValidatorService,
  OrderStatusValidationError,
} from '#services/order_status_validator_service';

try {
  // Validate a single status transition
  OrderStatusValidatorService.validateTransition('NEW', 'PROCESSING');
  console.log('✅ Transition is valid');
} catch (error) {
  if (error instanceof OrderStatusValidationError) {
    console.log(`❌ Invalid transition: ${error.message}`);
    console.log(`Current: ${error.currentStatus}, Target: ${error.targetStatus}`);
  }
}
```

### Delivery Method Specific Validation

```typescript
try {
  // This will fail because DELIVERED_PICKUP_POINT is only for PICKUP_POINT delivery
  OrderStatusValidatorService.validateTransition(
    'ON_THE_WAY',
    'DELIVERED_PICKUP_POINT',
    'HOME_DELIVERY'
  );
} catch (error) {
  console.log('Expected error for invalid delivery method combination');
}

// This will succeed
OrderStatusValidatorService.validateTransition(
  'ON_THE_WAY',
  'DELIVERED_PICKUP_POINT',
  'PICKUP_POINT'
);
```

### Validate Complete Order History

```typescript
const orderHistory = [
  'WAITING_FOR_PAYMENT',
  'NEW',
  'PROCESSING',
  'COMPLETED',
  'SENT',
  'ON_THE_WAY',
  'DELIVERED',
];

try {
  OrderStatusValidatorService.validateStatusHistory(orderHistory, 'HOME_DELIVERY');
  console.log('✅ Order history is valid');
} catch (error) {
  console.log(`❌ Invalid history: ${error.message}`);
}
```

### Check Without Throwing Errors

```typescript
// Check if transition is valid without throwing
const isValid = OrderStatusValidatorService.isValidTransition('NEW', 'PROCESSING');
console.log(`Transition is ${isValid ? 'valid' : 'invalid'}`);
```

### Get Valid Next Statuses

```typescript
// Get all valid next statuses
const nextStatuses = OrderStatusValidatorService.getValidNextStatuses('ON_THE_WAY');
console.log(`From ON_THE_WAY, can transition to: ${nextStatuses.join(', ')}`);

// Get valid statuses for specific delivery method
const homeDeliveryNext = OrderStatusValidatorService.getValidNextStatuses(
  'ON_THE_WAY',
  'HOME_DELIVERY'
);
console.log(`For home delivery: ${homeDeliveryNext.join(', ')}`);
```

### Check Final Statuses

```typescript
const isFinal = OrderStatusValidatorService.isFinalStatus('DELIVERED');
console.log(`DELIVERED is ${isFinal ? 'a final' : 'not a final'} status`);
```

## Error Handling

The service throws `OrderStatusValidationError` with detailed information:

```typescript
class OrderStatusValidationError extends Error {
  currentStatus: OrderStatus;
  targetStatus: OrderStatus;
  deliveryMethod?: DeliveryMethod;
}
```

## Business Rules

1. **Only from WAITING_FOR_PAYMENT**: Orders can only be canceled from `WAITING_FOR_PAYMENT` status
2. **Delivery Method Restrictions**: `DELIVERED_PICKUP_POINT` is only valid for `PICKUP_POINT` delivery method
3. **Sequential Flow**: Most status changes must follow the sequential order (no skipping steps)
4. **Hold State**: `ON_HOLD` can only be reached from `PROCESSING` and can only transition to `COMPLETED`
5. **Final States**: `DELIVERED`, `CANCELED`, `RETURN_TO_SENDER`, `RETURNED` are final states

## Integration Examples

### In a Controller

```typescript
export default class OrdersController {
  async updateStatus({ params, request, response }: HttpContext) {
    const { orderId } = params;
    const { newStatus, deliveryMethod } = request.only(['newStatus', 'deliveryMethod']);

    const order = await Order.findOrFail(orderId);

    try {
      // Validate the transition
      OrderStatusValidatorService.validateTransition(order.status, newStatus, deliveryMethod);

      // Update the order
      order.status = newStatus;
      await order.save();

      return response.ok({ message: 'Status updated successfully', order });
    } catch (error) {
      if (error instanceof OrderStatusValidationError) {
        return response.badRequest({
          error: 'Invalid status transition',
          details: error.message,
        });
      }
      throw error;
    }
  }
}
```

### In a Service

```typescript
export default class OrderService {
  async processOrder(orderId: string) {
    const order = await Order.findOrFail(orderId);

    // Get valid next statuses
    const validNextStatuses = OrderStatusValidatorService.getValidNextStatuses(
      order.status,
      order.deliveryMethod
    );

    if (validNextStatuses.includes('PROCESSING')) {
      await this.transitionToProcessing(order);
    }
  }

  private async transitionToProcessing(order: Order) {
    // Validate before transition
    OrderStatusValidatorService.validateTransition(
      order.status,
      'PROCESSING',
      order.deliveryMethod
    );

    order.status = 'PROCESSING';
    await order.save();
  }
}
```

## Testing

Comprehensive tests are available in `tests/functional/order_status_validator.spec.ts` covering all transition scenarios and edge cases.

To run the tests:

```bash
npm test functional
```
