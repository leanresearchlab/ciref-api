import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('refact')
  extractRefacts(@Body() body): Promise<any> {
    return this.appService.extractRefacts(body.username, body.url);
  }

  @Post('payload')
  a(@Body() body) {
    return true;
    // return this.appService.extractRefacts(body.name, body.url);
  }

  @Get('info')
  getRefactsInfo(
    @Query('url') url: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ): Promise<any> {
    return this.appService.getRefactsInfo(url, startDate, endDate);
  }

  @Get('user/:username')
  getUserFromUsername(@Param(':username') username: string): Promise<any> {
    return this.appService.getUser(username);
  }

  @Get('refacts/users')
  getRefactsAndUsers(
    @Query('repoUrl') repoUrl: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ): Promise<any> {
    return this.appService.getUsersAndRefacts(repoUrl, startDate, endDate);
  }

  @Post('duel')
  getDuelBetweenUsers(
    @Body() body: any,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ): Promise<any> {
    return this.appService.getDuelBetweenUsers(
      body.repoUrl,
      body.user1,
      body.user2,
      startDate,
      endDate,
    );
  }

  @Get('refactPoints')
  getRefactsPointsByType(@Query('repoUrl') repoUrl: string): Promise<any> {
    return this.appService.getRefactPointsByType(repoUrl);
  }

  @Get('refacts/time')
  getRefactsBasedOnTime(
    @Query('repoId') repoId: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ): Promise<any> {
    return this.appService.getRefactByTime(
      repoId,
      startDate ?? undefined,
      endDate ?? undefined,
    );
  }

  @Get('refacts/paths')
  getPathsMoreRefactored(
    @Query('repoUrl') repoUrl: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ): Promise<any> {
    return this.appService.getPathsMoreRefactored(repoUrl, startDate, endDate);
  }

  @Get('refacts/points/users')
  getRefactsByPointsPerUsers(
    @Query('repoUrl') repoUrl: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ): Promise<any> {
    return this.appService.getRefactsByPointsPerUsers(
      repoUrl,
      startDate,
      endDate,
    );
  }
}
