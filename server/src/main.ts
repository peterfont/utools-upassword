import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe());

  // 配置CORS
  app.enableCors();

  // 配置Swagger文档
  const config = new DocumentBuilder()
    .setTitle('UPassword API')
    .setDescription('密码管理系统API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 启动应用
  await app.listen(8081);
  console.log('应用已启动: http://localhost:8081');
}

bootstrap();