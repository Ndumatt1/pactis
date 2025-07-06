import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthPayload } from '@/interfaces/auth.types';
import { RegisterDto } from './dto/register.dto';
import { HttpResponse } from '@/utils/http-response.utils';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<HttpResponse> {
    const data = await this.authService.register(dto);

    return HttpResponse.success({
      data,
      message: 'Registration Successful'
    })
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<HttpResponse> {
    const data = await this.authService.login(dto);

    return HttpResponse.success({
      data,
      message: 'Registration Successful'
    })
  }
}
