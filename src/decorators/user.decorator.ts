import { IUsers } from "@/interfaces/user.interface";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const User = createParamDecorator<any, any, IUsers>((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const { user } = request;

  return user as IUsers;
});