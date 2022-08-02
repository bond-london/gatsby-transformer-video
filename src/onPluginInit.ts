import { NodePluginArgs } from "gatsby";
import { RemoteCache } from "./remoteCache";
import { PluginOptions } from "./types";
import { Cache } from "./cache";
import { join } from "path";

export let videoCache: Cache;

export async function onPluginInit(
  { reporter }: NodePluginArgs,
  {
    useRemoteCache,
    remoteConnectionString,
    remoteContainer,
    videoCacheFolder,
  }: PluginOptions
) {
  reporter.info("Initialising bond transformer video");

  const cacheFolder = join(process.cwd(), videoCacheFolder);

  if (useRemoteCache) {
    if (!remoteConnectionString || !remoteContainer) {
      return reporter.panic(
        "Need a remote connection string and remote container is using the remote cache"
      );
    }
    try {
      const remoteCache = await RemoteCache.create(
        remoteConnectionString,
        remoteContainer
      );
      videoCache = new Cache(cacheFolder, remoteCache);
    } catch (error) {
      return reporter.panic("Failed to create remote cache", error as Error);
    }
  } else {
    videoCache = new Cache(cacheFolder);
  }
}
