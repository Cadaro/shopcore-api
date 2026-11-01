import { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/core';
import OrderStatusService from '#services/order_status_service';

@inject()
export default class OrderStatusController {
  constructor(private orderStatusService: OrderStatusService) {}

  async history({ auth, params, response }: HttpContext) {
    const history = await this.orderStatusService.fetchUserOrderStatusHistory(
      params.orderId,
      auth.user!.uuid
    );
    return response.ok(history);
  }
}
