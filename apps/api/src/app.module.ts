import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './database/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { CompaniesModule } from './modules/companies/companies.module'
import { LeadsModule } from './modules/leads/leads.module'
import { PipelineModule } from './modules/pipeline/pipeline.module'
import { ConversationsModule } from './modules/conversations/conversations.module'
import { MessagesModule } from './modules/messages/messages.module'
import { WebhooksModule } from './modules/webhooks/webhooks.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { ReportsModule } from './modules/reports/reports.module'
import { PlansModule } from './modules/plans/plans.module'
import { ProfileModule } from './modules/profile/profile.module'
import { FinanceModule } from './modules/finance/finance.module'
import { ContractsModule } from './modules/contracts/contracts.module'
import { AdminModule } from './modules/admin/admin.module'
import { EmailModule } from './modules/email/email.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    LeadsModule,
    PipelineModule,
    ConversationsModule,
    MessagesModule,
    WebhooksModule,
    DashboardModule,
    ReportsModule,
    PlansModule,
    ProfileModule,
    FinanceModule,
    ContractsModule,
    AdminModule,
    EmailModule,
  ],
})
export class AppModule {}
