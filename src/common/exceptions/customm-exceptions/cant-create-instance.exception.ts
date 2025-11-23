import { RpcException } from "@nestjs/microservices";
import { StatusCode } from "../status-code";

export class CantCreateInstance extends RpcException {
  constructor(message: string) {
    super({ statusCode: StatusCode.BAD_REQUEST, message, error: 'Cant Create Instance' });
  }
}
