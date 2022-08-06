import { CreateResolversArgs, Node } from "gatsby";
import { FileSystemNode } from "gatsby-source-filesystem";
import { IGatsbyResolverContext } from "gatsby/dist/schema/type-definitions";
import { getVideoInformation } from "./ffpmeg";
import { GatsbyVideoInformation } from "./types";

type ResolverArgs = {
  // no resolver args
};

export function createResolvers(args: CreateResolversArgs) {
  const { createResolvers, reporter } = args;

  createResolvers({
    File: {
      childGatsbyVideo: {
        async resolve(
          source: FileSystemNode,
          resolverArgs: ResolverArgs,
          context: IGatsbyResolverContext<Node, ResolverArgs>,
          info: unknown
        ) {
          if (!source.internal.mediaType?.startsWith("video/")) {
            return null;
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          const main = (await (info as any).originalResolver(
            source,
            resolverArgs,
            context,
            info
          )) as GatsbyVideoInformation;
          const videoInformation = await getVideoInformation(
            source.absolutePath,
            reporter
          );

          return {
            ...main,
            ...videoInformation,
          };
        },
      },
    },
  });
}
