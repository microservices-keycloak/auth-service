import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class GlobalRpcExceptionFilter implements RpcExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const error = exception.getError();

    const unifiedError = {
      statusCode: error['statusCode'] || 500,
      message: error['message'] || 'RPC Error',
      error: error['error'] || 'RpcException',
    };

    return throwError(() => unifiedError);
  }
}
