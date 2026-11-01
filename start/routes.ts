/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from './kernel.js';
import router from '@adonisjs/core/services/router';
import OrdersController from '#controllers/orders_controller';
import OrderStatusController from '#controllers/order_status_controller';
import TokenController from '#controllers/token_controller';
import UsersController from '#controllers/users_controller';
import StocksController from '#controllers/stocks_controller';
import InvoiceCustomersController from '#controllers/invoice_customers_controller';

router
  .group(() => {
    router.group(() => {
      router
        .resource('stocks', StocksController)
        .params({ stocks: 'itemId' })
        .apiOnly()
        .only(['index', 'show', 'store'])
        .use(['store'], middleware.admin());
      router
        .resource('orders', OrdersController)
        .params({ orders: 'orderId' })
        .apiOnly()
        .only(['index', 'store', 'show'])
        .use(['index', 'store', 'show'], middleware.user());
      router
        .get('orders/:orderId/status-history', [OrderStatusController, 'history'])
        .use(middleware.user());
      router
        .resource('customers/invoice-data', InvoiceCustomersController)
        .apiOnly()
        .only(['index', 'store'])
        .use(['index', 'store'], middleware.user());
      router
        .put('customers/invoice-data', [InvoiceCustomersController, 'update'])
        .use(middleware.user());
    });
    router
      .group(() => {
        router
          .resource('users', UsersController)
          .only(['index'])
          .apiOnly()
          .use('index', middleware.user());
        router.patch('users', [UsersController, 'update']).use(middleware.user());
        router.resource('users', UsersController).apiOnly().only(['store']);
        router.resource('token', TokenController).apiOnly().only(['store']);
      })
      .prefix('auth');
  })
  .prefix('api');
