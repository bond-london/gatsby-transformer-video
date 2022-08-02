import { join, basename } from "path";
import { ensureDir, rename } from "fs-extra";

import { FileSystemNode } from "gatsby-source-filesystem";
import { NodePluginArgs } from "gatsby";
import { GatsbyVideoInformation } from "./types";
import { videoCache } from "./onPluginInit";
import { WorkerPool } from "gatsby-worker";

const workerPool = new WorkerPool<typeof import("./worker")>(
  require.resolve("./worker"),
  { numWorkers: 1, silent: false }
);

export async function getVideoInformation(
  videoPath: string
): Promise<GatsbyVideoInformation> {
  const data = await workerPool.single.getVideoData(videoPath);
  console.log("got data", data);
  const videoStream = data.streams.find((s) => s.codec_type === "video");
  const audioStream = data.streams.find((s) => s.codec_type === "audio");
  if (!videoStream) {
    throw new Error(`Failed to find video stream in ${videoPath}`);
  }
  if (!videoStream.width || !videoStream.height || !videoStream.duration) {
    throw new Error(`Video is empty for ${videoPath}`);
  }
  return {
    width: videoStream.width,
    height: videoStream.height,
    duration: videoStream.duration,
    hasAudio: !!audioStream,
  };
}

export function createScreenshotOptions() {
  return ["-vframes 1"];
}
export function createWebmVideoTransform(
  targetWidth?: number,
  muted?: boolean
) {
  return [
    "-c:v libvpx-vp9",
    "-crf 40",
    targetWidth ? `-vf scale=${targetWidth}:-2` : `-vf scale=0:0`,
    "-deadline best",
    muted ? "-an" : "-c:a libvorbis",
  ];
}

export function createMp4VideoTransform(targetWidth?: number, muted?: boolean) {
  return [
    "-c:v libx265",
    "-crf 32",
    targetWidth ? `-vf scale=${targetWidth}:-2` : `-vf scale=0:0`,
    "-preset veryslow",
    "-tag:v hvc1",
    "-movflags",
    "faststart",
    muted ? "-an" : "-c:a aac",
  ];
}

export async function transformVideo(
  args: NodePluginArgs,
  inputName: string,
  inputDigest: string,
  name: string,
  ext: string,
  options: string[],
  label: string
) {
  const { reporter, createContentDigest, pathPrefix } = args;
  const digestObject = {
    parent: inputDigest,
    options,
  };
  const digest = createContentDigest(digestObject);
  const outputName = `${name}-${digest}${ext}`;
  const publicDir = join(process.cwd(), "public", "static", inputDigest);
  const publicFile = join(publicDir, outputName);
  const publicRelativeUrl = `${pathPrefix}/static/${inputDigest}/${outputName}`;

  const inputFileName = basename(inputName);

  reporter.verbose(`${label}: Transforming video`);
  await ensureDir(publicDir);
  try {
    await videoCache.getFromCache(outputName, publicFile);
    reporter.verbose(`${label}: Used already cached file`);
    return { publicFile, publicRelativeUrl };
  } catch (err) {
    /* do nothing as this basically means the file wasn't there */
  }

  reporter.info(`${label}: Using ffmpeg to transform video ${inputFileName}`);
  const tempPublicFile = join(publicDir, `temp-${outputName}`);
  await workerPool.single.runFfmpeg(inputName, tempPublicFile, options, label);
  await rename(tempPublicFile, publicFile);
  await videoCache.addToCache(publicFile, outputName);
  reporter.info(`${label}: Used newly transformed file for ${inputFileName}`);

  return { publicFile, publicRelativeUrl };
}

export function transformVideoNode(
  args: NodePluginArgs,
  input: FileSystemNode,
  ext: string,
  options: string[],
  label: string
) {
  return transformVideo(
    args,
    input.absolutePath,
    input.internal.contentDigest,
    input.name,
    ext,
    options,
    label
  );
}
