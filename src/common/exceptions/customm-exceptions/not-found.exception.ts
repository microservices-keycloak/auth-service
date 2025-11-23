import { RpcException } from "@nestjs/microservices";
import { StatusCode } from "../status-code";

export class NotFoundRpcException extends RpcException {
  constructor(message: string) {
    super({ statusCode: StatusCode.NOT_FOUND, message, error: 'Not Found' });
  }
}
