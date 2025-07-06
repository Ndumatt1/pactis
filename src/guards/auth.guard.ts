import { ErrorHelper } from '@/utils/error.util';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) { }

  async canActivate(context: ExecutionContext): Promise<any> {
    const req = context.switchToHttp().getRequest();

    const authorization = req.headers['authorization'];

    if (!authorization) {
      ErrorHelper.UnauthorizedException('Authorization header is missing');
    }

    const user = await this.verifyAccessToken(authorization);

    req.user = user;

    return true;
  }

  async verifyAccessToken(authorization: string) {
    const [bearer, accessToken] = authorization.split(' ');

    if (bearer !== 'Bearer') {
      ErrorHelper.UnauthorizedException('Authorization should be Bearer');
    }

    if (!accessToken) {
      ErrorHelper.UnauthorizedException('Access token is missing');
    }

    try {
      const payload = this.jwtService.verify(accessToken);

      const user = payload;

      if (!user) {
        ErrorHelper.UnauthorizedException('Unauthorized Exception');
      }

      return user;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        ErrorHelper.UnauthorizedException('Token expired. Login required!');
      }

      ErrorHelper.UnauthorizedException(error.message);
    }
  }
}
