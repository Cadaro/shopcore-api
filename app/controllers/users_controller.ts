import ResponseErrorHandler from '#exceptions/response';
import UserPolicy from '#policies/user_policy';
import UserService from '#services/user_service';
import { StatusCodeEnum } from '#types/response';
import { UserCreatedDto, UserCreateDto, UserData } from '#types/user';
import { createUserValidator, updateUserValidator } from '#validators/user';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class UsersController {
  constructor(private userService: UserService) {}
  //TODO: Add tests for UsersController to achieve 100% coverage and check edge cases. Needs to be cheked if email uniqueness is handled properly. Also verify that error handling works as expected (error responses should use class ResponseErrorHandler).
  async store({ request, response }: HttpContext) {
    const validatedUserData: UserCreateDto = await request.validateUsing(createUserValidator);
    try {
      const createdUser: UserCreatedDto = await this.userService.createUser(validatedUserData);
      return response.created(createdUser);
    } catch (e) {
      return new ResponseErrorHandler().handleError(response, StatusCodeEnum.BadRequest, e);
    }
  }

  async index({ auth, bouncer, response }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    if (await bouncer.with(UserPolicy).denies('view')) {
      return new ResponseErrorHandler().handleError(response, StatusCodeEnum.Forbidden, {
        message: 'You are not authorized to view this resource',
      });
    }

    const userData: UserData = await this.userService.fetchUserData(auth.user!.uuid);

    return response.ok(userData);
  }

  async update({ auth, bouncer, request, response }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    if (await bouncer.with(UserPolicy).denies('edit')) {
      return new ResponseErrorHandler().handleError(response, StatusCodeEnum.Forbidden, {
        message: 'You are not authorized to edit this resource',
      });
    }

    try {
      const validatedUserData = await request.validateUsing(updateUserValidator);
      if (!validatedUserData.firstName && !validatedUserData.lastName) {
        return new ResponseErrorHandler().handleError(response, StatusCodeEnum.BadRequest, {
          message: 'At least one of firstName or lastName must be provided',
        });
      }
      const updatedUserData: Partial<UserData> = { userId: auth.user!.uuid, ...validatedUserData };
      await this.userService.updateUser(updatedUserData);
      return response.noContent();
    } catch (e) {
      return new ResponseErrorHandler().handleError(response, StatusCodeEnum.BadRequest, e);
    }
  }
}
