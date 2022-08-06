import { getVideoData, workerTransformVideo } from "./worker";
import { join } from "path";

export const VIDEO_PROCESSING_JOB_NAME = "VIDEO_PROCESSING";

export interface SingleVideoProcessingArgs {
  options: string[];
  label: string;
  outputName: string;
}
export interface VideoProcessingArgs {
  instances?: SingleVideoProcessingArgs[];
}

interface JobArgs {
  inputPaths: { path: string; contentDigest: string }[];
  outputDir: string;
  args: VideoProcessingArgs;
}

// eslint-disable-next-line import/no-unused-modules
export async function VIDEO_PROCESSING({
  inputPaths,
  outputDir,
  args,
}: JobArgs) {
  const inputFileName = inputPaths[0].path;
  if (!args.instances) {
    const result = await getVideoData(inputFileName);
    return result;
  }

  await workerTransformVideo(
    inputFileName,
    args.instances.map((i) => ({
      output: join(outputDir, i.outputName),
      options: i.options,
      label: i.label,
    }))
  );
}
