import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RepoController } from './repo.controller';
import { RepoService } from './repo.service';

@Module({
  imports: [PrismaModule],
  controllers: [RepoController],
  providers: [RepoService,PrismaService],
})
export class RepoModule {}
