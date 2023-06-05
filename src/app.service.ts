import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private api: HttpService, private prisma: PrismaService) {}
  async extractRefacts(username: string, url: string, branch: string): Promise<any> {
    try {
      const findRepo = await this.prisma.repo.findFirst({
        where: { repoUrl: url },
      });

      console.log(url, branch);

      if (!findRepo)
        throw new HttpException('Repo not found', HttpStatus.BAD_REQUEST);
        
      const response = await this.api.axiosRef.post(
        `${process.env.REFACTORINGMINER_API}/refact/all`,
        { name: findRepo.repoName, url, branch },
      );

      const results = await Promise.all(
        response.data.map((item) =>
          this.api.axiosRef.get(
            `https://api.github.com/repos/${username}/${findRepo.repoName}/commits/${item.commitId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.API_GITHUB_TOKEN}`,
              },
            },
          ),
        ),
      );
      // console.log(results);

      const authors = results.map((i) => ({
        login: i.data.author.login,
        avatar: i.data.author.avatar_url,
        commit_id: i.data.sha,
        commit_date: new Date(
          new Date(i.data.commit.author.date).setHours(0, 0, 0, 0),
        ),
      }));

      const formatted = response.data.map((refact, index) => {
        const leftSideLocations = refact.leftSideLocations.map((location) => ({
          filePath: location.filePath,
          side: 'left',
        }));
        const rightSideLocations = refact.rightSideLocations.map(
          (location) => ({
            filePath: location.filePath,
            side: 'right',
          }),
        );
        delete refact.rightSideLocations;
        delete refact.leftSideLocations;
        return {
          ...refact,
          ...authors[index],
          locations: [...leftSideLocations, ...rightSideLocations],
        };
      });

      formatted.forEach(async (element) => {
        const findRefact = await this.prisma.refact.findFirst({
          where: {
            AND: [{ repoId: findRepo.id }, { uuid_id: element.id }],
          },
        });
        if (!findRefact) {
          await this.prisma.refact
            .create({
              data: {
                repoId: findRepo.id,
                uuid_id: element.id,
                type: element.type,
                description: element.description,
                commit_id: element.commit_id,
                commit_date: element.commit_date,
                login: element.login,
                avatar: element.avatar,
                locations: { createMany: { data: element.locations } },
              },
            })
            .catch((e) => console.log(e));
        }
      });
      return formatted;
    } catch (error) {
      console.log(error);
    }
  }

  async getRefactsInfo(
    url: string,
    initialDate: Date,
    endDate: Date,
  ): Promise<any> {
    try {
      const findRepo = await this.prisma.repo.findFirst({
        where: { repoUrl: url },
      });

      if (!findRepo)
        throw new HttpException('Repo not found', HttpStatus.BAD_REQUEST);
      const results = await this.prisma.refact.findMany({
        where: {
          repoId: findRepo.id,
          AND: [
            { commit_date: { gte: initialDate } },
            { commit_date: { lte: endDate } },
          ],
        },
      });
      /**
       * add - 11
       * remove - 11
       * move - 10
       * rename - 9
       * change - 9
       * extract - 8
       * split - 6
       * merge - 5
       * replace - 5
       * modify - 4
       * inline - 4
       */
      const a = results.reduce((acc, i) => {
        const types = [
          'add',
          'remove',
          'move',
          'rename',
          'change',
          'extract',
          'split',
          'merge',
          'replace',
          'modify',
          'inline',
          'others',
        ];
        const findType = types.findIndex((e) => {
          return i?.type
            .split(' ')
            .find((a) => a.toLowerCase() === e.toLowerCase());
        });
        const typeIndex = findType !== -1 ? findType : types.length - 1;

        if (acc[types[typeIndex]]) {
          acc[types[typeIndex]]['total'] += 1;
          acc[types[typeIndex]][i?.type]
            ? (acc[types[typeIndex]][i?.type] += 1)
            : (acc[types[typeIndex]][i?.type] = 1);
          return acc;
        }
        acc[types[typeIndex]] = {};
        acc[types[typeIndex]]['total'] = 1;
        acc[types[typeIndex]][i?.type] = 1;
        return acc;
      }, {});
      return a;
    } catch (error) {
      console.log(error);
    }
  }
  async getRefactPointsByType(url: string): Promise<any> {
    try {
      const findRepo = await this.prisma.repo.findFirst({
        where: { repoUrl: url },
        include: {
          weights: {
            select: {
              add: true,
              remove: true,
              move: true,
              rename: true,
              change: true,
              extract: true,
              split: true,
              merge: true,
              replace: true,
              modify: true,
              inline: true,
            },
          },
        },
      });

      if (!findRepo)
        throw new HttpException('Repo not found', HttpStatus.BAD_REQUEST);

      const results = await this.prisma.refact.findMany({
        where: { repoId: findRepo.id },
      });

      const a = results.reduce((acc, i) => {
        let weight = 1;
        if (findRepo.weights.length) {
          const findWeight = Object.entries(findRepo.weights[0]).find((el) => {
            return i.type.toLocaleLowerCase().includes(el[0]);
          });
          weight = !!findWeight ? findWeight[1] : 1;
        }

        if (acc[i?.type]) {
          acc[i?.type] += 1 * weight;
          return acc;
        }
        acc[i?.type] = 1 * weight;
        return acc;
      }, {});

      return a;
    } catch (error) {
      console.log(error);
    }
  }
  async getUser(username: string): Promise<any> {
    return this.prisma.user.findFirst({ where: { username } });
  }

  async getUsersAndRefacts(
    repoUrl: string,
    initialDate: Date,
    endDate: Date,
  ): Promise<any> {
    const findRepo = await this.prisma.repo.findFirst({
      where: { repoUrl },
    });

    if (!findRepo)
      throw new HttpException('Repo not found', HttpStatus.BAD_REQUEST);

    const results = await this.prisma.refact.findMany({
      select: { login: true, avatar: true, type: true },
      where: {
        repoId: findRepo.id,
        AND: [
          { commit_date: { gte: initialDate } },
          { commit_date: { lte: endDate } },
        ],
      },
    });

    const data = results.reduce((acc, it) => {
      if (acc[it.login]) {
        if (acc[it.login].hasOwnProperty(it.type)) {
          acc[it.login][it.type] += 1;
          acc[it.login]['total'] += 1;
          return acc;
        }
        acc[it.login][it.type] = 1;
        acc[it.login]['total'] += 1;
        return acc;
      }
      acc[it.login] = {};
      acc[it.login]['avatar'] = it.avatar;
      acc[it.login]['total'] = 1;
      acc[it.login][it.type] = 1;
      return acc;
    }, {});

    const formattedData = Object.entries(data).map((i: any) => {
      const total = i[1].total;
      const avatar = i[1].avatar;
      delete i[1].total;
      delete i[1].avatar;
      return {
        user: { login: i[0], avatar },
        total,
        refacts: i[1],
      };
    });

    return formattedData.sort((a, b) => b.total - a.total);
  }

  async getDuelBetweenUsers(
    repoUrl: string,
    user1: string,
    user2: string,
    initialDate: Date,
    endDate: Date,
  ): Promise<any> {
    const findRepo = await this.prisma.repo.findFirst({
      where: { repoUrl },
    });

    if (!findRepo)
      throw new HttpException('Repo not found', HttpStatus.BAD_REQUEST);

    const results = await this.prisma.refact.findMany({
      select: { login: true, avatar: true, type: true },
      where: {
        repoId: findRepo.id,
        AND: [
          { commit_date: { gte: initialDate } },
          { commit_date: { lte: endDate } },
        ],
        OR: [{ login: { contains: user1 } }, { login: { contains: user2 } }],
      },
    });
    const usersRefacts = results.reduce((acc, item) => {
      if (acc[item.login]) {
        acc[item.login].push(item);
        return acc;
      }
      acc[item.login] = [];
      return acc;
    }, {});

    const a = Object.entries(usersRefacts).map((userRefacts: any) => {
      const refacts = userRefacts[1].reduce((acc, i) => {
        const types = [
          'add',
          'remove',
          'move',
          'rename',
          'change',
          'extract',
          'split',
          'merge',
          'replace',
          'modify',
          'inline',
          'others',
        ];
        const findType = types.findIndex((e) => {
          return i?.type
            .split(' ')
            .find((a) => a.toLowerCase() === e.toLowerCase());
        });
        const typeIndex = findType !== -1 ? findType : types.length - 1;

        if (acc[types[typeIndex]]) {
          acc[types[typeIndex]]['total'] += 1;
          acc[types[typeIndex]][i?.type]
            ? (acc[types[typeIndex]][i?.type] += 1)
            : (acc[types[typeIndex]][i?.type] = 1);
          return acc;
        }
        acc[types[typeIndex]] = {};
        acc[types[typeIndex]]['total'] = 1;
        acc[types[typeIndex]][i?.type] = 1;
        return acc;
      }, {});
      return {
        user: userRefacts[0],
        refacts,
      };
    });
    return a;
  }

  async getRefactByTime(
    repoId: string,
    initialDate: Date,
    endDate: Date,
  ): Promise<any> {
    return await this.prisma.refact.groupBy({
      by: ['repoId', 'commit_date'],
      _count: { _all: true, id: true },
      orderBy: { commit_date: 'asc' },
      where: {
        AND: [
          { repo: { repoId } },
          { commit_date: { gte: initialDate } },
          { commit_date: { lte: endDate } },
        ],
      },
    });
  }

  async getPathsMoreRefactored(
    repoUrl: string,
    initialDate: Date,
    endDate: Date,
  ): Promise<any> {
    const response = await this.prisma.refact.findMany({
      select: {
        login: true,
        type: true,
        description: true,
        locations: { where: { side: 'left' } },
      },
      where: {
        AND: [
          { commit_date: { gte: initialDate } },
          { commit_date: { lte: endDate } },
          { repo: { repoUrl } },
        ],
      },
    });
    // const groupBy = (arr, keys) => {
    //   return arr.reduce((storage, item) => {
    //     const objKey = keys.map((key) => `${item[key]}`).join(':'); //should be some unique delimiter that wont appear in your keys
    //     if (storage[objKey]) {
    //       storage[objKey]['refacts'].push(item);
    //       storage[objKey].total += 1;
    //     } else {
    //       storage[objKey] = {};
    //       storage[objKey]['refacts'] = [item];
    //       storage[objKey].total = 1;
    //     }
    //     return storage;
    //   }, {});
    // };

    // const response = await this.prisma.refact.findMany({
    //   select: {
    //     commit_date: true,

    //     locations: { select: { filePath: true }, where: { side: 'left' } },
    //   },
    //   orderBy: { commit_date: 'asc' },
    //   where: {
    //     AND: [
    //       { repo: { repoUrl } },
    //       { commit_date: { gte: initialDate } },
    //       { commit_date: { lte: endDate } },
    //     ],
    //   },
    // });
    // const formatted = groupBy(response, ['commit_date']);

    const formattedWithTypes = response.reduce((acc, item) => {
      const a = item.locations.reduce((acc2, item2) => {
        if (acc2[item2.filePath]) {
          acc2[item2.filePath].total += 1;
          return acc2;
        }
        acc2[item2.filePath] = { total: 1 };
        return acc2;
      }, {});

      acc.push({
        type: item.type,
        path: [Object.keys(a)[0]],
        total: Object.values<any>(a)[0].total,
      });
      return acc;
    }, []);

    const formatted = formattedWithTypes.reduce((acc, item) => {
      const types = [
        'add',
        'remove',
        'move',
        'rename',
        'change',
        'extract',
        'split',
        'merge',
        'replace',
        'modify',
        'inline',
        'others',
      ];
      const findType = types.findIndex((e) => {
        return item?.type
          .split(' ')
          .find((a) => a.toLowerCase() === e.toLowerCase());
      });
      const typeIndex = findType !== -1 ? findType : types.length - 1;

      if (acc[item.path]) {
        if (acc[item.path][types[typeIndex]]) {
          acc[item.path].total += 1;
          acc[item.path][types[typeIndex]] += 1;
          return acc;
        }
        acc[item.path].total += 1;
        acc[item.path][types[typeIndex]] = 1;
        return acc;
      }
      acc[item.path] = {};
      acc[item.path].total = 1;
      acc[item.path][types[typeIndex]] = 1;
      return acc;
    }, {});

    return formatted;
  }
  /**
   *
   * @param repoId
   * @param initialDate
   * @param endDate
   */
  async getRefactsByPointsPerUsers(
    repoUrl: string,
    initialDate: Date,
    endDate: Date,
  ): Promise<any> {
    const findRepo = await this.prisma.repo.findFirst({
      where: { repoUrl: repoUrl },
      include: {
        weights: {
          select: {
            add: true,
            remove: true,
            move: true,
            rename: true,
            change: true,
            extract: true,
            split: true,
            merge: true,
            replace: true,
            modify: true,
            inline: true,
          },
        },
      },
    });

    if (!findRepo)
      throw new HttpException('Repo not found', HttpStatus.BAD_REQUEST);

    const results = await this.prisma.refact.findMany({
      where: {
        AND: [
          { commit_date: { gte: initialDate } },
          { commit_date: { lte: endDate } },
          { repoId: findRepo.id },
        ],
      },
    });
    const data = results.reduce((acc, it) => {
      let weight = 1;

      if (findRepo.weights.length) {
        const findWeight = Object.entries(findRepo.weights[0]).find((el) => {
          return it.type.toLocaleLowerCase().includes(el[0]);
        });
        weight = !!findWeight ? findWeight[1] : 1;
      }

      if (acc[it.login]) {
        if (acc[it.login].hasOwnProperty(it.type)) {
          acc[it.login][it.type] += 1 * weight;
          acc[it.login]['total'] += 1 * weight;
          return acc;
        }
        acc[it.login][it.type] = 1 * weight;
        acc[it.login]['total'] += 1 * weight;
        return acc;
      }
      acc[it.login] = {};
      acc[it.login]['avatar'] = it.avatar;
      acc[it.login]['total'] = 1 * weight;
      acc[it.login][it.type] = 1 * weight;
      return acc;
    }, {});

    const formattedData = Object.entries(data).map((i: any) => {
      const total = i[1].total;
      const avatar = i[1].avatar;
      delete i[1].total;
      delete i[1].avatar;
      return {
        user: { login: i[0], avatar },
        total,
        refacts: i[1],
      };
    });

    return formattedData.sort((a, b) => b.total - a.total);
  }
}
