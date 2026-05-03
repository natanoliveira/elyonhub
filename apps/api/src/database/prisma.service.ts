import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    const loggingEnabled = process.env.PRISMA_LOG === 'true'

    super({
      log: loggingEnabled
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],
    })

    if (loggingEnabled) {
      // @ts-expect-error — evento tipado pelo Prisma mas não exposto no extend
      this.$on('query', (e: any) => {
        this.logger.debug(`[query] ${e.query}`)
        this.logger.debug(`[params] ${e.params} — ${e.duration}ms`)
      })

      // @ts-expect-error
      this.$on('info', (e: any) => {
        this.logger.log(`[info] ${e.message}`)
      })
    }

    // @ts-expect-error
    this.$on('warn', (e: any) => {
      this.logger.warn(`[warn] ${e.message}`)
    })

    // @ts-expect-error
    this.$on('error', (e: any) => {
      this.logger.error(`[error] ${e.message}`)
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
