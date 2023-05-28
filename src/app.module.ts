import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from "@nestjs/axios";
import { RepoModule } from './repo/repo.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { WeightsModule } from './weights/weights.module';

@Module({
  imports: [HttpModule, RepoModule, PrismaModule, WeightsModule],
  controllers: [AppController],
  providers: [AppService,PrismaService],
})
export class AppModule implements OnModuleInit {
  constructor(private prismaService: PrismaService) {}

  async onModuleInit() {
    await this.prismaService.onModuleInit();
  }
}
