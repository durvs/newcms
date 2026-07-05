import 'reflect-metadata';
import './env';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(helmet());
	app.enableCors();
	app.setGlobalPrefix('api');

	const swaggerConfig = new DocumentBuilder()
		.setTitle('NewCMS API')
		.setDescription('Content management system REST API')
		.setVersion('0.1.0')
		.addBearerAuth()
		.addBasicAuth()
		.addTag('health')
		.addTag('posts')
		.addTag('users')
		.addTag('auth')
		.addTag('taxonomies')
		.addTag('options')
		.build();

	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup('api/docs', app, document);

	const port = process.env['API_PORT'] ?? 3001;
	await app.listen(port);
	console.log(`\n🚀 NewCMS API running on http://localhost:${port}`);
	console.log(`📖 Swagger docs at http://localhost:${port}/api/docs\n`);
}

bootstrap();
