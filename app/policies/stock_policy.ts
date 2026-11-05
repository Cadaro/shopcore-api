import User from '#models/user';
import { BasePolicy } from '@adonisjs/bouncer';
import { AuthorizerResponse } from '@adonisjs/bouncer/types';
import { can } from '#abilities/main';
import { Permission } from '#types/enum/permission';

export default class StockPolicy extends BasePolicy {
  create(user: User): AuthorizerResponse {
    return can.original(user, Permission.PRODUCTS_MANAGE);
  }
}
