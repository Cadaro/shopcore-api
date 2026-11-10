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
import GuestsController from '#controllers/guests_controller';
import { Permission } from '#types/enum/permission';
import { guestSessionCreationThrottle, loginThrottle, registrationThrottle } from '#start/limiter';

router
  .group(() => {
    router.post('v1/guests', [GuestsController, 'store']).use(guestSessionCreationThrottle);
    router.group(() => {
      router
        .resource('stocks', StocksController)
        .params({ stocks: 'itemId' })
        .apiOnly()
        .only(['index', 'show', 'store', 'update'])
        .use(['store', 'update'], middleware.permission({ permission: Permission.PRODUCTS_MANAGE }))
        .use('index', middleware.businessRateLimit({ group: 'read', allowGuests: true }))
        .use('show', middleware.businessRateLimit({ group: 'read', allowGuests: true }));
      router
        .resource('orders', OrdersController)
        .params({ orders: 'orderId' })
        .apiOnly()
        .only(['index', 'store', 'show'])
        .use('index', middleware.permission({ permission: Permission.ORDERS_VIEW }))
        .use('store', middleware.permission({ permission: Permission.ORDERS_CREATE }))
        .use('show', middleware.permission({ permission: Permission.ORDERS_VIEW }))
        .use('index', middleware.businessRateLimit({ group: 'read' }))
        .use('store', middleware.businessRateLimit({ group: 'write' }))
        .use('show', middleware.businessRateLimit({ group: 'read' }));
      router
        .get('orders/:orderId/status-history', [OrderStatusController, 'history'])
        .use(middleware.permission({ permission: Permission.ORDERS_VIEW }))
        .use(middleware.businessRateLimit({ group: 'read' }));
      router
        .resource('customers/invoice-data', InvoiceCustomersController)
        .apiOnly()
        .only(['index', 'store'])
        .use(
          ['index', 'store'],
          middleware.permission({ permission: Permission.INVOICE_DATA_MANAGE })
        )
        .use('index', middleware.businessRateLimit({ group: 'read' }))
        .use('store', middleware.businessRateLimit({ group: 'write' }));
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
        router
          .resource('users', UsersController)
          .apiOnly()
          .only(['store'])
          .use('store', registrationThrottle);
        router.post('token', [TokenController, 'store']).use(loginThrottle);
        router.delete('token', [TokenController, 'destroy']).use(middleware.user());
      })
      .prefix('auth');
  })
  .prefix('api');
