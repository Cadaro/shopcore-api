/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| You may export multiple abilities from this file and pre-register them
| when creating the Bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

import User from '#models/user';
import { Permission } from '#types/enum/permission';
import { Role } from '#types/enum/role';
import { Bouncer } from '@adonisjs/bouncer';

const customerPermissions = [
  Permission.PRODUCTS_VIEW,
  Permission.ORDERS_CREATE,
  Permission.ORDERS_VIEW,
  Permission.INVOICE_DATA_MANAGE,
  Permission.USERS_VIEW,
  Permission.USERS_UPDATE,
  Permission.RETURNS_CREATE,
  Permission.RETURNS_CANCEL,
] as const;

const staffPermissions = [
  ...customerPermissions,
  Permission.PRODUCTS_MANAGE,
  Permission.ORDERS_MANAGE,
  Permission.CUSTOMERS_MANAGE,
  Permission.RETURNS_MANAGE,
] as const;

const permissionsByRole: Record<Role, readonly Permission[]> = {
  [Role.CUSTOMER]: customerPermissions,
  [Role.STAFF]: staffPermissions,
  [Role.ADMIN]: Object.values(Permission),
};

export const can = Bouncer.ability(
  (user: User, permission: Permission): boolean =>
    permissionsByRole[user.role]?.includes(permission) ?? false
);
