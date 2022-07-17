# Gatsby transformer video

This attempts to be to videos what gatsby-plugin-image is to images!

Or at least it's the start.

Basically it takes a video and converts to webm/mp4 formats, extracts the first frame as a poster and provides a component to view it.

# Usage/installation

1. Install

```
yarn add @bond-london/gatsby-transformer-video
```

2. Configure gatsby-config

Add the following line into your gatsby-config

```
    "@bond-london/gatsby-transformer-video",
```

3. Use it in queries

```
childGatsbyVideo {
        id
        duration
        hasAudio
        width
        height
        transformed(width: 1024, muted: true) {
          width
          height
          hasAudio
          duration
          mp4
          webm
          poster
        }
      }
```

4. Use in the code

```
  const transformed = block.asset?.localFile?.childGatsbyVideo?.transformed;
  return (
      {transformed && (
        <GatsbyVideo
          className="w-full"
          videoData={transformed}
          autoPlay={true}
          loop={true}
        />
      )}
  );
```

And it starts working! If you have long videos it will take a long time to do the first conversion, but afterwards they are all cached.

# Internals

Not much to say apart from the types of data

The transformed video is a `GatsbyTransformedVideo` which is:

```
  width: number;
  height: number;
  duration: string | number;
  hasAudio: boolean;
  mp4: string;
  webm: string;
  poster: string;
```

The arguments to the transformed are simply the width and whether or not to mute the video.

The original duration, width, height and hasAudio flags are set on the original video.
