import pathToFfmpeg from "ffmpeg-static";
import { path as pathToFfprobe } from "ffprobe-static";

import ffmpeg, { FfprobeData } from "fluent-ffmpeg";

function createCommandForVideo(videoPath: string) {
  const command = ffmpeg({ source: videoPath, logger: console });
  command.setFfmpegPath(pathToFfmpeg);
  command.setFfprobePath(pathToFfprobe);
  return command;
}

interface ProgressInformation {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: number;
  percent: number;
}

// eslint-disable-next-line import/no-unused-modules
export async function runFfmpeg(
  input: string,
  output: string,
  options: string[],
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
          console.log(`${label}: Progress - ${percent}%`);
          lastPercent = progress.percent;
        }
      })
      .output(output);
    command.run();
  });
}

// eslint-disable-next-line import/no-unused-modules
export async function getVideoData(videoPath: string): Promise<FfprobeData> {
  const command = createCommandForVideo(videoPath);
  return new Promise<FfprobeData>((resolve, reject) => {
    command.ffprobe((err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}
