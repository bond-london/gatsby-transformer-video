import { PluginOptionsSchemaArgs } from "gatsby";

// eslint-disable-next-line import/no-unused-modules
export function pluginOptionsSchema(args: PluginOptionsSchemaArgs) {
  const { Joi } = args;
  return Joi.object({
    videoCacheFolder: Joi.string()
      .description("Location of the video cache")
      .default("./.bondvideoassets"),
    useRemoteCache: Joi.boolean()
      .description("Set true to enable the remote cache")
      .default(false),
    remoteConnectionString: Joi.string().description(
      "Connection string for the remote cache"
    ),
    remoteContainer: Joi.string().description("Name of the container to use"),
  });
}
