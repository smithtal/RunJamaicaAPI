import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AccessTokenDto } from './dto/access-token.dto';
import { RefreshCredentialsDto } from './dto/refesh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { UserTokensDto } from './dto/user-tokens.dto';
import { JwtPayload } from './types/jwt-payload.interface';
import { TokenType } from './types/token-type.enum';
import { UserRepository } from './user.repository';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger('AuthService');
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserRepository) private userRepository: UserRepository,
  ) {}
  async signup(signupDto: SignupDto): Promise<UserTokensDto> {
    const user = await this.userRepository.signup(signupDto);

    const accessTokenPayload: JwtPayload = {
      emailAddress: user.emailAddress,
      name: user.name,
      type: TokenType.ACCESS,
    };

    const refreshTokenPayload: JwtPayload = {
      ...accessTokenPayload,
      type: TokenType.REFRESH,
    };

    const accessToken = await this.jwtService.sign(accessTokenPayload);
    const refreshToken = await this.jwtService.sign(refreshTokenPayload, {
      expiresIn: '365d',
    });
    return { accessToken, refreshToken };
  }

  async refreshCredentials(
    refreshCredentialsDto: RefreshCredentialsDto,
  ): Promise<AccessTokenDto> {
    const { refreshToken } = refreshCredentialsDto;

    const invalidRefreshTokenErrorMessage = 'Invalid refresh token provided.';

    let decodedJwt: JwtPayload;

    try {
      decodedJwt = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
    } catch (error) {
      this.logger.log(
        `Attempt to use invalid JWT for refresh - ${error.message}`,
      );
      throw new UnauthorizedException(invalidRefreshTokenErrorMessage);
    }

    if (decodedJwt.type == TokenType.REFRESH) {
      const accessTokenPayload: JwtPayload = {
        emailAddress: decodedJwt.emailAddress,
        name: decodedJwt.name,
        type: TokenType.ACCESS,
      };
      const accessToken = await this.jwtService.signAsync(accessTokenPayload);
      return { accessToken };
    } else {
      this.logger.log('Attempt to use access token as refresh token.');
      throw new UnauthorizedException(invalidRefreshTokenErrorMessage);
    }
  }
}
