import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Repo } from '@prisma/client';
import { RepoService } from './repo.service';

@Controller('repo')
export class RepoController {
  constructor(private repoService: RepoService) {}

  @Post()
  async createRepo(@Body() repo: Repo): Promise<Repo> {
    return await this.repoService.create(repo);
  }

  @Get(':username')
  async listRepos(@Param('username') username: string): Promise<any> {
    return await this.repoService.listFromUser(username);
  }

  @Get('/people/:repoId')
  async listRepoPeople(@Param('repoId') repoId: string): Promise<any> {
    return await this.repoService.listPeopleFromRepo(repoId);
  }
}
