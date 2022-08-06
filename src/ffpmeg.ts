import { join, dirname, basename } from "path";
import { ensureDir, rename } from "fs-extra";

import type { Actions, NodePluginArgs, Reporter } from "gatsby";
import { GatsbyVideoInformation } from "./types";
import { videoCache } from "./onPluginInit";
import {
  SingleVideoProcessingArgs,
  VideoProcessingArgs,
  VIDEO_PROCESSING_JOB_NAME,
} from "./gatsby-worker";
import { FfprobeData } from "fluent-ffmpeg";

let actions: Actions;

export function setActions(_actions: Actions) {
  actions = _actions;
}

async function createJob(
  inputFileName: string,
  outputDir: string,
  args: VideoProcessingArgs,
  reporter: Reporter
) {
  if (!actions) {
    return reporter.panic("Actions are not setup");
  }

  const result = actions.createJobV2({
    name: VIDEO_PROCESSING_JOB_NAME,
    inputPaths: [inputFileName],
    outputDir,
    args: args as Record<string, unknown>,
  });
  return result;
}

export async function getVideoInformation(
  videoPath: string,
  reporter: Reporter
): Promise<GatsbyVideoInformation> {
  const data = (await createJob(
    videoPath,
    dirname(videoPath),
    {},
    reporter
  )) as FfprobeData;
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
  videos: {
    key: string;
    ext: string;
    options: string[];
    label: string;
  }[]
) {
  const { reporter, createContentDigest, pathPrefix } = args;
  const instances: SingleVideoProcessingArgs[] = [];
  const jobInfo = [];
  const results: {
    [key: string]: { publicFile: string; publicRelativeUrl: string };
  } = {};

  const inputFileName = basename(inputName);
  const publicDir = join(process.cwd(), "public", "static", inputDigest);
  await ensureDir(publicDir);
  for (const { key, ext, options, label } of videos) {
    const digestObject = {
      parent: inputDigest,
      options,
    };
    const digest = createContentDigest(digestObject);
    const outputName = `${name}-${digest}${ext}`;
    const publicFile = join(publicDir, outputName);
    const publicRelativeUrl = `${pathPrefix}/static/${inputDigest}/${outputName}`;

    reporter.verbose(`${label}: Transforming video`);
    try {
      await videoCache.getFromCache(outputName, publicFile);
      reporter.verbose(`${label}: Used already cached file`);
      results[key] = { publicFile, publicRelativeUrl };
      continue;
    } catch (err) {
      /* do nothing as this basically means the file wasn't there */
    }

    reporter.info(`${label}: Using ffmpeg to transform video ${inputFileName}`);
    const tempName = `temp-${outputName}`;
    const tempPublicFile = join(publicDir, tempName);
    instances.push({ options, outputName: tempName, label });
    jobInfo.push({
      tempPublicFile,
      publicFile,
      outputName,
      publicRelativeUrl,
      key,
    });
  }
  await createJob(inputName, publicDir, { instances }, reporter);

  for (const {
    tempPublicFile,
    publicFile,
    outputName,
    publicRelativeUrl,
    key,
  } of jobInfo) {
    try {
      await rename(tempPublicFile, publicFile);
    } catch {
      // ignore
    }
    await videoCache.addToCache(publicFile, outputName);
    results[key] = { publicFile, publicRelativeUrl };
  }

  return results;
}
