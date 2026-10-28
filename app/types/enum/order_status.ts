export enum OrderStatus {
  WAITING_FOR_PAYMENT = 'WAITING_FOR_PAYMENT', // order is created, waiting for payment
  NEW = 'NEW', // default status after order creation
  PROCESSING = 'PROCESSING', // order is being prepared
  COMPLETED = 'COMPLETED', // order is completed
  SENT = 'SENT', // order is sent to customer
  ON_THE_WAY = 'ON_THE_WAY', // order is being transported
  DELIVERED = 'DELIVERED', // order is delivered to customer
  DELIVERED_PICKUP_POINT = 'DELIVERED_PICKUP_POINT', // order is delivered to pickup point
  CANCELED = 'CANCELED', // order is canceled
  ON_HOLD = 'ON_HOLD', // order is on hold (for example: no product or address or delivery method issue)
  RETURNED = 'RETURNED', // order is returned by customer
  FAILED_DELIVERY = 'FAILED_DELIVERY', // order delivery failed
  RETURN_TO_SENDER = 'RETURN_TO_SENDER', // order is being returned to sender
}
