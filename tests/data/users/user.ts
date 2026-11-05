import User from '#models/user';
import { UserCreateDb } from '#types/user';
import { Role } from '#types/enum/role';

export class CreateUser {
  private email: string;
  private password: string;
  private role: Role;
  private uuid: string;

  constructor(newUser: UserCreateDb) {
    this.email = newUser.email;
    this.password = newUser.password;
    this.role = newUser.role;
    this.uuid = newUser.uuid;
  }
  public async create(): Promise<User> {
    return User.create({
      email: this.email,
      password: this.password,
      role: this.role,
      uuid: this.uuid,
    });
  }
}
