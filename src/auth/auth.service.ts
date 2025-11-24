import { Injectable } from '@nestjs/common';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
import dotenv from 'dotenv';
import axios from 'axios';
import { UnauthorizedException } from 'src/common/exceptions/customm-exceptions/un-authorized.exception';
import { JwksClient } from 'jwks-rsa';
import jwtDecode from 'jwt-decode';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

dotenv.config();

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService){}
  async login(loginDto: LoginDto) {
    const url = `${process.env.KEYCLOAK_AUTH_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
    const data = new URLSearchParams();
    data.append('client_id', process.env.KEYCLOAK_CLIENT_ID??'');
    data.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET??'');
    data.append('grant_type', 'password');
    data.append('scope', 'openid profile email');
    data.append('username', loginDto.username);
    data.append('password', loginDto.password);
    try {
      const response = await axios.post(url, data.toString(), {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
      const responseData = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
        id_token: response.data.id_token,
      };

       if (!responseData.id_token) {
        throw new UnauthorizedException('Missing id_token from Keycloak');
      }


      const payload: any = await this.verifyIdToken(responseData.id_token);
      const keycloakId = payload.sub;
      const email = payload.email;
      const firstName = payload.given_name;
      const lastName = payload.family_name;
      const username = payload.preferred_username ?? payload.username;

      // upsert into your user service DB
      const localUser = await this.upsertFromKeycloak({
        keycloakId,
        email,
        firstName,
        lastName,
        username,
      });

      return {
        accessToken: responseData.access_token,
        refreshToken: responseData.refresh_token,
        idToken: responseData.id_token,
        profile: {
          keycloakId,
          email,
          firstName,
          lastName,
          username,
          localUserId: localUser.id, // useful
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid username or password');
    }
  }

  private async getSigningKey(kid: string) {
    const client = new JwksClient({
      jwksUri: `${process.env.KEYCLOAK_AUTH_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
    });
    return new Promise<string>((resolve, reject) => {
      client.getSigningKey(kid, (err, key) => {
        if (err) return reject(err);
        const signingKey = (key as any).getPublicKey();
        resolve(signingKey);
      });
    });
  }

  async verifyIdToken(idToken: string) {
    // quick decode to get kid
    const decodedHeader: any = jwt.decode(idToken, { complete: true });
    const kid = decodedHeader?.header?.kid;
    if (!kid) throw new UnauthorizedException('Invalid token');

    const pubKey = await this.getSigningKey(kid);
    // verify signature + claims
    const payload = jwt.verify(idToken, pubKey, {
      algorithms: ['RS256'],
      issuer: `${process.env.KEYCLOAK_AUTH_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      audience: process.env.KEYCLOAK_CLIENT_ID,
    });
    return payload;
  }

  async upsertFromKeycloak(dto: {
    keycloakId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  }) {
    return this.prisma.user.upsert({
      where: {
        keycloakId: dto.keycloakId,
      },
      create: {
        keycloakId: dto.keycloakId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
      },
      update: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
      },
    });
  }

  async getByKeycloakId(keycloakId: string) {
    return this.prisma.user.findUnique({
      where: { keycloakId },
    });
  }
}

