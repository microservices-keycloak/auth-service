import { RpcException } from "@nestjs/microservices";
import { StatusCode } from "../status-code";

export class UnauthorizedException extends RpcException {
  constructor(message: string) {
    super({ statusCode: StatusCode.UNAUTHORIZED, message, error: 'UnAuthorized' });
  }
}
