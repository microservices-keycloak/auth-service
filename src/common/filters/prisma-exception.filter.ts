import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';

@Catch()
export class PrismaExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {

    // Unique constraint
    if (exception.code === 'P2002') {
      const fields = (exception.meta?.target || []).join(', ');
      return super.catch(
        new RpcException({
          statusCode: 409,
          message: `${fields} already exists`,
          error: 'Conflict',
        }),
        host,
      );
    }

    // Record not found
    if (exception.code === 'P2025') {
      return super.catch(
        new RpcException({
          statusCode: 404,
          message: 'Record not found',
          error: 'Not Found',
        }),
        host,
      );
    }

    // Foreign key constraint
    if (exception.code === 'P2003') {
      return super.catch(
        new RpcException({
          statusCode: 400,
          message: 'Invalid foreign key reference',
          error: 'Bad Request',
        }),
        host,
      );
    }

    // Default fallback
    return super.catch(
      new RpcException({
        statusCode: 500,
        message: exception.message || 'Internal microservice error',
        error: 'Internal Server Error',
      }),
      host,
    );
  }
}
