import React, { CSSProperties, useMemo } from "react";
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
    objectFit?: CSSProperties["objectFit"];
    objectPosition?: CSSProperties["objectPosition"];
  } & React.DetailedHTMLProps<
    React.VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  >
> = (allProps) => {
  const {
    videoData,
    noPoster,
    muted,
    objectFit,
    objectPosition,
    style,
    className,
    controls = false,
    ...otherProps
  } = allProps;
  const realStyle = useMemo(() => {
    const realStyle: CSSProperties = {
      ...style,
      objectFit: objectFit || "cover",
      objectPosition,
    };
    return realStyle;
  }, [objectFit, objectPosition, style]);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      muted={!videoData.hasAudio || muted}
      {...otherProps}
      style={realStyle}
      width={videoData.width}
      height={videoData.height}
      poster={noPoster ? undefined : videoData.poster}
      className={className}
      controls={controls}
    >
      <source type="video/webm" src={videoData.webm} />
      <source type="video/mp4" src={videoData.mp4} />
    </video>
  );
};
