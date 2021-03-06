import type { Node, NodePluginArgs } from "gatsby";
import { FileSystemNode } from "gatsby-source-filesystem";
import type { IGatsbyResolverContext } from "gatsby/dist/schema/type-definitions";
import {
  createMp4VideoTransform,
  createScreenshotOptions,
  createWebmVideoTransform,
  getVideoInformation,
  transformVideo,
  transformVideoNode,
} from "./ffpmeg";
import { GatsbyTransformedVideo, TransformArgs } from "./types";

export async function createTransformedVideo(
  source: Node,
  transformArgs: TransformArgs,
  context: IGatsbyResolverContext<Node, TransformArgs>,
  args: NodePluginArgs
): Promise<GatsbyTransformedVideo> {
  const { reporter, getNodeAndSavePathDependency } = args;
  if (!source.parent) {
    console.error("source missing", source);
    return reporter.panic(`source node ${source.id} has no parent`);
  }
  const details = getNodeAndSavePathDependency(
    source.parent,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    context.path
  ) as FileSystemNode;

  const { width, muted } = transformArgs;

  const mp4 = await transformVideoNode(
    args,
    details,
    ".mp4",
    createMp4VideoTransform(width, muted),
    createLabel(details, transformArgs, "mp4")
  );
  const webm = await transformVideoNode(
    args,
    details,
    ".webm",
    createWebmVideoTransform(width, muted),
    createLabel(details, transformArgs, "webm")
  );
  const poster = await transformVideo(
    args,
    webm.publicFile,
    details.internal.contentDigest,
    details.name,
    ".jpg",
    createScreenshotOptions(),
    createLabel(details, transformArgs, "poster")
  );
  const info = await getVideoInformation(mp4.publicFile);

  const result = {
    ...info,
    mp4: mp4.publicRelativeUrl,
    webm: webm.publicRelativeUrl,
    poster: poster.publicRelativeUrl,
  };
  return result;
}

function createLabel(
  details: FileSystemNode,
  transformArgs: TransformArgs,
  stage: string
) {
  const widthInfo = transformArgs.width
    ? ` (width ${transformArgs.width})`
    : "";
  const audioInfo = transformArgs.muted ? " muted" : "";
  return `${stage}: ${details.name}${widthInfo}${audioInfo}`;
}
