import { Injectable } from '@nestjs/common';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
import dotenv from 'dotenv';
import axios from 'axios';
import { UnauthorizedException } from 'src/common/exceptions/customm-exceptions/un-authorized.exception';

dotenv.config();

@Injectable()
export class AuthService {
  async login(loginDto: LoginDto) {
    const url = `${process.env.KEYCLOAK_AUTH_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
    const data = new URLSearchParams();
    data.append('client_id', process.env.KEYCLOAK_CLIENT_ID??'');
    data.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET??'');
    data.append('grant_type', 'password');
    data.append('username', loginDto.name);
    data.append('password', loginDto.password);
    try {
      const response = await axios.post(url, data.toString(), {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
        idToken: response.data.id_token,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid username or password');
    }
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
