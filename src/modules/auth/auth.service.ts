import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload } from '@/interfaces/auth.types';
import { ErrorHelper } from '@/utils/error.util';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { instanceToPlain } from 'class-transformer';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) { }


  /**
  * Registers a new user if the email or phone number does not already exist.
  *
  * @param {RegisterDto} registerDto - User registration data
  * @returns {Promise<AuthPayload>} Auth token and user info
  * @throws {ConflictException} If email or phone already exists
  */
  async register(registerDto: RegisterDto): Promise<AuthPayload> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { phoneNumber: registerDto.phoneNumber }],
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        ErrorHelper.ConflictException('Email is already in use');
      }

      if (existingUser.phoneNumber === registerDto.phoneNumber) {
        ErrorHelper.ConflictException('Phone number is already in use');
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      phoneNumber: registerDto.phoneNumber,
      password: hashedPassword,
      role: registerDto.role,
    });

    await this.userRepository.save(user);

    const payload = {
      ...user
    }
    const token = await this.signToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role
      },
      token,
    };
  }

  /**
   * Logs in a user with valid credentials.
   *
   * @param {LoginDto} dto - Login credentials
   * @returns {Promise<AuthPayload>} Auth token and user info
   * @throws {UnauthorizedException} If credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<AuthPayload> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      ErrorHelper.UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordMatch) {
      ErrorHelper.UnauthorizedException('Invalid credentials');
    }

    const userInfo = instanceToPlain(user)

    const payload = {
      ...userInfo
    }
    const token = await this.signToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
      },
      token,
    };
  }

  /**
   * Generates a JWT access token.
   *
   * @private
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @returns {Promise<string>} JWT token
   */
  private async signToken(user: any): Promise < string > {
  return this.jwtService.signAsync(user);
}
}
