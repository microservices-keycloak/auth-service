import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { GlobalRpcExceptionFilter } from './common/filters/all-exception.filter';

async function bootstrap() {
  

const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:admin@localhost:5672'],
      queue: 'auth_queue',
      queueOptions: { durable: true, autoDelete: false },
    },
  });
  app.useGlobalFilters(new GlobalRpcExceptionFilter());
  console.log("auth service is running...")

  await app.listen();
}
bootstrap();
