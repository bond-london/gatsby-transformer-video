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
  } & React.DetailedHTMLProps<
    React.VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  >
> = (allProps) => {
  const { videoData, muted, ...otherProps } = allProps;
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      width={videoData.width}
      height={videoData.height}
      poster={videoData.poster}
      muted={!videoData.hasAudio || muted}
      {...otherProps}
    >
      <source type="video/webm" src={videoData.webm} />
      <source type="video/mp4" src={videoData.mp4} />
    </video>
  );
};
