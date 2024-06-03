import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CacheTime } from 'src/common/constant/cache-time';
import { User } from 'src/user/user.entity';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async setUser(userInput: User) {
    const key = 'user';

    const users = await this.cacheManager.get(key);

    const usersArr = (users as any[]) ?? [];

    if (users) {
      const existUser = usersArr.find(
        (user) => JSON.parse(user).id === userInput.id,
      );
      if (!existUser) {
        await this.cacheManager.set(
          key,
          usersArr.push(JSON.stringify(userInput)),
          CacheTime.AUTH,
        );
      }
    } else {
      await this.cacheManager.set(
        key,
        [...[JSON.stringify(userInput)]],
        CacheTime.AUTH,
      );
    }
  }

  async getUser(username: string): Promise<User> {
    const key = 'user';

    const users = ((await this.cacheManager.get(key)) as any[]) ?? [];

    const usersArr = (users as any[]) ?? [];

    const usersData = usersArr.map((user) => JSON.parse(user));

    return usersData.find((user) => user.username === username);
  }

  async deleteUser() {
    const key = 'user';
    await this.cacheManager.del(key);
  }

  async removeUser(username: string) {
    const key = 'user';

    const users = ((await this.cacheManager.get(key)) as any[]) ?? [];

    const usersArr = (users as any[]) ?? [];

    const existUserIndex = usersArr.findIndex(
      (user) => JSON.parse(user).username === username,
    );

    if (existUserIndex !== -1) {
      usersArr[existUserIndex] = undefined;
      await this.cacheManager.set(key, users, CacheTime.AUTH);
    }
  }
}
