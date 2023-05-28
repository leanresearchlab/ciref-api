import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { Repo } from './DTOs/repo.dto';

@Injectable()
export class RepoService {
  constructor(private prismaService: PrismaService) {}

  async create(repo: Repo): Promise<any> {
    const response = await this.prismaService.repo.create({
      data: {
        repoId: repo.repoId.toString(),
        repoUrl: repo.repoUrl,
        repoName: repo.repoName,
        username: repo.username,
      },
    });
    const user = await this.prismaService.user.findFirst({
      where: { username: { equals: repo.username } },
    });
    await this.prismaService.user.update({
      where: { email: user.email },
      data: { firstAccess: true },
    });
    return response;
  }

  async listFromUser(username: string): Promise<Repo[]> {
    return this.prismaService.repo.findMany({ where: { username } });
  }

  async listPeopleFromRepo(repoId: string): Promise<any[]> {
    return this.prismaService.refact.findMany({
      distinct: ['login'],
      select: { login: true, avatar: true },
      where: { repo: { repoId } },
    });
  }
}
