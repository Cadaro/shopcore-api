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
import { Permission } from '#types/enum/permission';

router
  .group(() => {
    router.group(() => {
      router
        .resource('stocks', StocksController)
        .params({ stocks: 'itemId' })
        .apiOnly()
        .only(['index', 'show', 'store', 'update'])
        .use(
          ['store', 'update'],
          middleware.permission({ permission: Permission.PRODUCTS_MANAGE })
        );
      router
        .resource('orders', OrdersController)
        .params({ orders: 'orderId' })
        .apiOnly()
        .only(['index', 'store', 'show'])
        .use('index', middleware.permission({ permission: Permission.ORDERS_VIEW }))
        .use('store', middleware.permission({ permission: Permission.ORDERS_CREATE }))
        .use('show', middleware.permission({ permission: Permission.ORDERS_VIEW }));
      router
        .get('orders/:orderId/status-history', [OrderStatusController, 'history'])
        .use(middleware.permission({ permission: Permission.ORDERS_VIEW }));
      router
        .resource('customers/invoice-data', InvoiceCustomersController)
        .apiOnly()
        .only(['index', 'store'])
        .use(
          ['index', 'store'],
          middleware.permission({ permission: Permission.INVOICE_DATA_MANAGE })
        );
      router
        .put('customers/invoice-data', [InvoiceCustomersController, 'update'])
        .use(middleware.permission({ permission: Permission.INVOICE_DATA_MANAGE }));
    });
    router
      .group(() => {
        router
          .resource('users', UsersController)
          .only(['index'])
          .apiOnly()
          .use('index', middleware.permission({ permission: Permission.USERS_VIEW }));
        router
          .patch('users', [UsersController, 'update'])
          .use(middleware.permission({ permission: Permission.USERS_UPDATE }));
        router
          .patch('users/:userId/role', [UsersController, 'updateRole'])
          .use(middleware.permission({ permission: Permission.ROLES_ASSIGN }));
        router.resource('users', UsersController).apiOnly().only(['store']);
        router.resource('token', TokenController).apiOnly().only(['store']);
      })
      .prefix('auth');
  })
  .prefix('api');
