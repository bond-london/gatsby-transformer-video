import { join, basename } from "path";
import { copy, ensureDir, rename } from "fs-extra";

import pathToFfmpeg from "ffmpeg-static";
import { path as pathToFfprobe } from "ffprobe-static";

import ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import { FileSystemNode } from "gatsby-source-filesystem";
import { NodePluginArgs, Reporter } from "gatsby";
import { GatsbyVideoInformation } from "./types";
const localCacheDir = "./.bondvideoassets";

function createCommandForVideo(videoPath: string) {
  const command = ffmpeg({ source: videoPath, logger: console });
  command.setFfmpegPath(pathToFfmpeg);
  command.setFfprobePath(pathToFfprobe);
  return command;
}

async function getVideoData(videoPath: string): Promise<FfprobeData> {
  const command = createCommandForVideo(videoPath);
  return new Promise<FfprobeData>((resolve, reject) => {
    command.ffprobe((err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

export async function getVideoInformation(
  videoPath: string
): Promise<GatsbyVideoInformation> {
  const data = await getVideoData(videoPath);
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

interface ProgressInformation {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: number;
  percent: number;
}

function runFfmpeg(
  input: string,
  output: string,
  options: string[],
  reporter: Reporter,
  label: string
) {
  return new Promise<void>((resolve, reject) => {
    let lastPercent = 0;
    const command = createCommandForVideo(input)
      .addOutputOption(options)
      //   .on("start", console.log)
      .on("error", reject)
      .on("end", resolve)
      .on("progress", (progress: ProgressInformation) => {
        if (progress.percent > lastPercent + 10) {
          const percent = Math.floor(progress.percent);
          reporter.info(`${label}: Progress - ${percent}%`);
          lastPercent = progress.percent;
        }
      })
      .output(output);
    command.run();
  });
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
  const cacheDir = join(process.cwd(), localCacheDir);
  const cacheFile = join(cacheDir, outputName);
  const publicDir = join(process.cwd(), "public", "static", inputDigest);
  const publicFile = join(publicDir, outputName);
  const publicRelativeUrl = `${pathPrefix}/static/${inputDigest}/${outputName}`;

  const inputFileName = basename(inputName);

  reporter.verbose(`${label}: Transforming video`);
  await ensureDir(publicDir);
  try {
    await copy(cacheFile, publicFile, { dereference: false });
    reporter.verbose(`${label}: Used already cached file`);
    return { publicFile, publicRelativeUrl };
  } catch (err) {
    /* do nothing as this basically means the file wasn't there */
  }

  reporter.info(`${label}: Using ffmpeg to transform video ${inputFileName}`);
  await ensureDir(cacheDir);
  const tempCacheFile = join(cacheDir, `temp-${outputName}`);
  await runFfmpeg(inputName, tempCacheFile, options, reporter, label);
  await rename(tempCacheFile, cacheFile);
  await copy(cacheFile, publicFile, { dereference: false });
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
