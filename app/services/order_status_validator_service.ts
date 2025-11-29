import { OrderStatus } from '#types/enum/orderStatus';
import { DeliveryMethod } from '#types/enum/deliveryMethod';

export class OrderStatusValidationError extends Error {
  public currentStatus: OrderStatus;
  public targetStatus: OrderStatus;
  public deliveryMethod?: DeliveryMethod;

  constructor(
    message: string,
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    deliveryMethod?: DeliveryMethod
  ) {
    super(message);
    this.name = 'OrderStatusValidationError';
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
    this.deliveryMethod = deliveryMethod;

    // Restore prototype chain
    Object.setPrototypeOf(this, OrderStatusValidationError.prototype);
  }
}

export class OrderStatusValidatorService {
  /**
   * Valid status transitions map
   * Key: current status, Value: array of valid next statuses
   */
  private static readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.WAITING_FOR_PAYMENT]: [OrderStatus.NEW, OrderStatus.CANCELED],
    [OrderStatus.NEW]: [OrderStatus.PROCESSING],
    [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.ON_HOLD],
    [OrderStatus.ON_HOLD]: [OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED]: [OrderStatus.SENT],
    [OrderStatus.SENT]: [OrderStatus.ON_THE_WAY],
    [OrderStatus.ON_THE_WAY]: [
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERED_PICKUP_POINT,
      OrderStatus.FAILED_DELIVERY,
    ],
    [OrderStatus.DELIVERED_PICKUP_POINT]: [OrderStatus.DELIVERED, OrderStatus.FAILED_DELIVERY],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.FAILED_DELIVERY]: [OrderStatus.RETURN_TO_SENDER],
    [OrderStatus.RETURN_TO_SENDER]: [],
    [OrderStatus.CANCELED]: [],
    [OrderStatus.RETURNED]: [],
  };

  /**
   * Valid status paths for different delivery methods
   */
  private static readonly DELIVERY_METHOD_PATHS = {
    HOME_DELIVERY: {
      // Path 1: Standard home delivery
      standard: [
        OrderStatus.WAITING_FOR_PAYMENT,
        OrderStatus.NEW,
        OrderStatus.PROCESSING,
        OrderStatus.COMPLETED,
        OrderStatus.SENT,
        OrderStatus.ON_THE_WAY,
        OrderStatus.DELIVERED,
      ],
      // Path 3: Failed home delivery
      failed: [
        OrderStatus.WAITING_FOR_PAYMENT,
        OrderStatus.NEW,
        OrderStatus.PROCESSING,
        OrderStatus.COMPLETED,
        OrderStatus.SENT,
        OrderStatus.ON_THE_WAY,
        OrderStatus.FAILED_DELIVERY,
        OrderStatus.RETURN_TO_SENDER,
      ],
      // Path 5: With hold (can continue to standard or failed)
      withHold: [
        OrderStatus.WAITING_FOR_PAYMENT,
        OrderStatus.NEW,
        OrderStatus.PROCESSING,
        OrderStatus.ON_HOLD,
        OrderStatus.COMPLETED,
        OrderStatus.SENT,
        OrderStatus.ON_THE_WAY,
      ],
    },
    PICKUP_POINT: {
      // Path 2: Standard pickup point delivery
      standard: [
        OrderStatus.WAITING_FOR_PAYMENT,
        OrderStatus.NEW,
        OrderStatus.PROCESSING,
        OrderStatus.COMPLETED,
        OrderStatus.SENT,
        OrderStatus.ON_THE_WAY,
        OrderStatus.DELIVERED_PICKUP_POINT,
        OrderStatus.DELIVERED,
      ],
      // Path 4: Failed pickup point delivery
      failed: [
        OrderStatus.WAITING_FOR_PAYMENT,
        OrderStatus.NEW,
        OrderStatus.PROCESSING,
        OrderStatus.COMPLETED,
        OrderStatus.SENT,
        OrderStatus.ON_THE_WAY,
        OrderStatus.DELIVERED_PICKUP_POINT,
        OrderStatus.FAILED_DELIVERY,
        OrderStatus.RETURN_TO_SENDER,
      ],
      // Path 5: With hold (can continue to standard or failed)
      withHold: [
        OrderStatus.WAITING_FOR_PAYMENT,
        OrderStatus.NEW,
        OrderStatus.PROCESSING,
        OrderStatus.ON_HOLD,
        OrderStatus.COMPLETED,
        OrderStatus.SENT,
        OrderStatus.ON_THE_WAY,
      ],
    },
  };

  /**
   * Validates if a status transition is legal
   * @param currentStatus Current order status
   * @param targetStatus Target order status
   * @param deliveryMethod Delivery method (required for certain validations)
   * @throws OrderStatusValidationError if transition is invalid
   */
  public static validateTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    deliveryMethod?: DeliveryMethod
  ): void {
    // Check if the transition is allowed in general
    const validNextStatuses = this.VALID_TRANSITIONS[currentStatus];

    if (!validNextStatuses.includes(targetStatus)) {
      throw new OrderStatusValidationError(
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Valid transitions from '${currentStatus}' are: ${validNextStatuses.join(', ')}`,
        currentStatus,
        targetStatus,
        deliveryMethod
      );
    }

    // Additional validation for delivery method specific transitions
    if (deliveryMethod) {
      this.validateDeliveryMethodSpecificTransition(currentStatus, targetStatus, deliveryMethod);
    }
  }

  /**
   * Validates delivery method specific transitions
   */
  private static validateDeliveryMethodSpecificTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    deliveryMethod: DeliveryMethod
  ): void {
    // Special case: DELIVERED_PICKUP_POINT is only valid for PICKUP_POINT delivery
    if (targetStatus === OrderStatus.DELIVERED_PICKUP_POINT && deliveryMethod !== 'PICKUP_POINT') {
      throw new OrderStatusValidationError(
        `Status 'DELIVERED_PICKUP_POINT' is only valid for PICKUP_POINT delivery method, but delivery method is '${deliveryMethod}'`,
        currentStatus,
        targetStatus,
        deliveryMethod
      );
    }

    // Special case: For HOME_DELIVERY, transition from ON_THE_WAY should not go to DELIVERED_PICKUP_POINT
    if (
      currentStatus === OrderStatus.ON_THE_WAY &&
      targetStatus === OrderStatus.DELIVERED_PICKUP_POINT &&
      deliveryMethod === 'HOME_DELIVERY'
    ) {
      throw new OrderStatusValidationError(
        `Invalid transition from 'ON_THE_WAY' to 'DELIVERED_PICKUP_POINT' for HOME_DELIVERY method. Use 'DELIVERED' or 'FAILED_DELIVERY' instead`,
        currentStatus,
        targetStatus,
        deliveryMethod
      );
    }
  }

  /**
   * Checks if a status transition is valid without throwing an error
   * @param currentStatus Current order status
   * @param targetStatus Target order status
   * @param deliveryMethod Delivery method (optional)
   * @returns true if transition is valid, false otherwise
   */
  public static isValidTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    deliveryMethod?: DeliveryMethod
  ): boolean {
    try {
      this.validateTransition(currentStatus, targetStatus, deliveryMethod);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets all valid next statuses for a given current status
   * @param currentStatus Current order status
   * @param deliveryMethod Delivery method (optional, for filtering)
   * @returns Array of valid next statuses
   */
  public static getValidNextStatuses(
    currentStatus: OrderStatus,
    deliveryMethod?: DeliveryMethod
  ): OrderStatus[] {
    const validStatuses = this.VALID_TRANSITIONS[currentStatus] || [];

    if (!deliveryMethod) {
      return validStatuses;
    }

    // Filter based on delivery method
    return validStatuses.filter((status) => {
      try {
        this.validateDeliveryMethodSpecificTransition(currentStatus, status, deliveryMethod);
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * Validates an entire status history/path
   * @param statusHistory Array of statuses in chronological order
   * @param deliveryMethod Delivery method
   * @throws OrderStatusValidationError if any transition in the history is invalid
   */
  public static validateStatusHistory(
    statusHistory: OrderStatus[],
    deliveryMethod?: DeliveryMethod
  ): void {
    if (statusHistory.length < 2) {
      return; // Nothing to validate
    }

    for (let i = 1; i < statusHistory.length; i++) {
      this.validateTransition(statusHistory[i - 1], statusHistory[i], deliveryMethod);
    }
  }

  /**
   * Checks if an order has reached a final status (cannot transition further)
   * @param status Current order status
   * @returns true if status is final, false otherwise
   */
  public static isFinalStatus(status: OrderStatus): boolean {
    const validNextStatuses = this.VALID_TRANSITIONS[status];
    return validNextStatuses.length === 0;
  }

  /**
   * Gets all possible complete paths for a delivery method
   * @param deliveryMethod Delivery method
   * @returns Object containing all possible complete paths
   */
  public static getCompletePaths(deliveryMethod: DeliveryMethod) {
    return this.DELIVERY_METHOD_PATHS[deliveryMethod];
  }

  /**
   * Validates if a complete status path is valid for the given delivery method
   * @param statusPath Array of statuses representing a complete path
   * @param deliveryMethod Delivery method
   * @returns true if the path is valid, false otherwise
   */
  public static isValidCompletePath(
    statusPath: OrderStatus[],
    deliveryMethod: DeliveryMethod
  ): boolean {
    try {
      this.validateStatusHistory(statusPath, deliveryMethod);

      // Additional check: ensure the path matches one of the expected patterns
      const validPaths = this.DELIVERY_METHOD_PATHS[deliveryMethod];

      // Check if it matches any of the valid path patterns
      for (const pathType of Object.values(validPaths)) {
        // Check if the provided path is a subset/prefix of a valid path
        if (this.isPathSubsetOf(statusPath, pathType as OrderStatus[])) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Helper method to check if one path is a subset of another
   */
  private static isPathSubsetOf(subPath: OrderStatus[], fullPath: OrderStatus[]): boolean {
    if (subPath.length > fullPath.length) {
      return false;
    }

    for (let i = 0; i < subPath.length; i++) {
      if (subPath[i] !== fullPath[i]) {
        return false;
      }
    }

    return true;
  }
}
