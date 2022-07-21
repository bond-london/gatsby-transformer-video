import { copy, rename } from "fs-extra";
import { RemoteCache } from "./remoteCache";
import { join } from "path";

async function atomicCopyFile(sourceFileName: string, targetFileName: string) {
  const tempTargetFileName = targetFileName + ".tmp";
  await copy(sourceFileName, tempTargetFileName, { dereference: false });
  await rename(tempTargetFileName, targetFileName);
}

export class Cache {
  constructor(
    private readonly cacheDir: string,
    private readonly remoteCache?: RemoteCache
  ) {}

  public async getFromCache(name: string, targetFileName: string) {
    const localFileName = join(this.cacheDir, name);

    try {
      await atomicCopyFile(localFileName, targetFileName);
    } catch (error) {
      if (this.remoteCache) {
        await this.remoteCache.getFromCache(name, targetFileName);
        await atomicCopyFile(targetFileName, localFileName);
      } else {
        throw error;
      }
    }
  }

  public async addToCache(sourceFileName: string, name: string) {
    if (this.remoteCache) {
      await this.remoteCache.addToCache(sourceFileName, name);
    }
    const localFileName = join(this.cacheDir, name);
    await copy(sourceFileName, localFileName, { dereference: false });
  }
}
