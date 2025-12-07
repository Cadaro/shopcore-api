import User from '#models/user';
import Order from '#models/order';
import { BasePolicy } from '@adonisjs/bouncer';
import { AuthorizerResponse } from '@adonisjs/bouncer/types';

export default class OrderPolicy extends BasePolicy {
  view(user: User, order: Order): AuthorizerResponse {
    // User middleware ensures authentication and abilities
    // Only check ownership
    return user.uuid === order.userId;
  }

  viewList(user: User, orderList: Order[]): AuthorizerResponse {
    // User middleware ensures authentication and abilities
    // Only check that all orders belong to the user
    return orderList.every((order) => order.userId === user.uuid);
  }

  create(_user: User): AuthorizerResponse {
    // User middleware ensures authentication and abilities
    // Any authenticated user can create orders
    return true;
  }
}
