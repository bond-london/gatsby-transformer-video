import React from "react";
import { GatsbyTransformedVideo } from "../types";

export function getGatsbyVideo(
  transformed: Record<string, unknown> | unknown | null
) {
  if (transformed) {
    return transformed as GatsbyTransformedVideo;
  }
}

export const GatsbyVideo: React.FC<
  {
    videoData: GatsbyTransformedVideo;
    noPoster?: boolean;
  } & React.DetailedHTMLProps<
    React.VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  >
> = (allProps) => {
  const { videoData, noPoster, muted, ...otherProps } = allProps;
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      muted={!videoData.hasAudio || muted}
      {...otherProps}
      width={videoData.width}
      height={videoData.height}
      poster={noPoster ? undefined : videoData.poster}
    >
      <source type="video/webm" src={videoData.webm} />
      <source type="video/mp4" src={videoData.mp4} />
    </video>
  );
};
