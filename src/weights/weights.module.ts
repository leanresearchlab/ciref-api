import { Module } from '@nestjs/common';
import { WeightsService } from './weights.service';
import { WeightsController } from './weights.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [WeightsService, PrismaService],
  controllers: [WeightsController],
})
export class WeightsModule {}
