import UserPolicy from '#policies/user_policy';
import UserService from '#services/user_service';
import { UserCreatedDto, UserCreateDto, UserData } from '#types/user';
import { createUserValidator, updateUserValidator } from '#validators/user';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import { DomainRuleException, ForbiddenException } from '#exceptions/domain_exception';

@inject()
export default class UsersController {
  constructor(private userService: UserService) {}

  async store({ request, response }: HttpContext) {
    const validatedUserData: UserCreateDto = await request.validateUsing(createUserValidator);
    const createdUser: UserCreatedDto = await this.userService.createUser(validatedUserData);
    return response.created(createdUser);
  }

  async index({ auth, bouncer, response }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    if (await bouncer.with(UserPolicy).denies('view')) {
      throw new ForbiddenException('You are not authorized to view this resource');
    }

    const userData: UserData = await this.userService.fetchUserData(auth.user!.uuid);

    return response.ok(userData);
  }

  async update({ auth, bouncer, request, response }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    if (await bouncer.with(UserPolicy).denies('edit')) {
      throw new ForbiddenException('You are not authorized to edit this resource');
    }

    const validatedUserData = await request.validateUsing(updateUserValidator);
    if (!validatedUserData.firstName && !validatedUserData.lastName) {
      throw new DomainRuleException('At least one of firstName or lastName must be provided');
    }
    const updatedUserData: Partial<UserData> = { userId: auth.user!.uuid, ...validatedUserData };
    await this.userService.updateUser(updatedUserData);
    return response.noContent();
  }
}
