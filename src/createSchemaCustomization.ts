import type { CreateSchemaCustomizationArgs, Node } from "gatsby";
import type { IGatsbyResolverContext } from "gatsby/dist/schema/type-definitions";
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLJSON,
  GraphQLNonNull,
} from "gatsby/graphql";
import { createTransformedVideo } from "./transformer";
import { TransformArgs } from "./types";

export function createSchemaCustomization(args: CreateSchemaCustomizationArgs) {
  const {
    actions: { createTypes },
    schema,
  } = args;
  const gatsbyVideoType = schema.buildObjectType({
    name: "GatsbyVideo",
    interfaces: [`Node`],
    extensions: {
      infer: true,
      childOf: {
        types: [`File`],
      },
    },
    fields: {
      width: { type: GraphQLInt },
      height: { type: GraphQLInt },
      duration: { type: GraphQLFloat },
      hasAudio: { type: GraphQLBoolean },
      transformed: {
        type: new GraphQLNonNull(GraphQLJSON),
        args: {
          width: { type: GraphQLInt },
          muted: { type: GraphQLBoolean, defaultValue: true },
        },
        resolve: (
          source: Node,
          transformArgs: TransformArgs,
          context: IGatsbyResolverContext<Node, TransformArgs>
        ) => createTransformedVideo(source, transformArgs, context, args),
      },
    },
  });
  createTypes([gatsbyVideoType]);
}
