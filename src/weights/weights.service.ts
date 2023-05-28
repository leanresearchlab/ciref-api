import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Weight } from './DTOs/Weights';

@Injectable()
export class WeightsService {
  constructor(private prisma: PrismaService) {}

  async newRepoWeights(
    repoUrl,
    {
      add,
      change,
      extract,
      inline,
      merge,
      modify,
      move,
      remove,
      rename,
      replace,
      split,
    }: Weight,
  ): Promise<any> {
    const findRepo = await this.prisma.repo.findFirst({
      where: { repoUrl },
    });

    if (!findRepo)
      throw new HttpException('Repo not found', HttpStatus.BAD_REQUEST);

    const findWeights = await this.prisma.weights.findFirst({
      where: { Repo: { repoUrl } },
    });

    if (findWeights) {
      await this.prisma.weights.delete({ where: { id: findWeights.id } });
    }

    await this.prisma.weights.create({
      data: {
        add: add ?? 1,
        change: change ?? 1,
        extract: extract ?? 1,
        inline: inline ?? 1,
        merge: merge ?? 1,
        modify: modify ?? 1,
        move: move ?? 1,
        remove: remove ?? 1,
        rename: rename ?? 1,
        replace: replace ?? 1,
        split: split ?? 1,
        repoId: findRepo.id,
      },
    });
  }

  async getWeights(repoUrl: string): Promise<any> {
    return this.prisma.weights.findFirst({
      where: { Repo: { repoUrl } },
    });
  }
}
