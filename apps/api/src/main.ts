import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import helmet from 'helmet'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(helmet())
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new TransformInterceptor())

  const port = process.env.PORT ?? 4003
  await app.listen(port)
  console.log(`API rodando em http://localhost:${port}`)
}

bootstrap()
