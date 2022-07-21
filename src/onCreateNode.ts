import type { CreateNodeArgs, NodeInput } from "gatsby";
import { FileSystemNode } from "gatsby-source-filesystem";

// eslint-disable-next-line import/no-unused-modules
export async function onCreateNode(args: CreateNodeArgs) {
  const {
    node,
    createNodeId,
    actions: { createNode, createParentChildLink },
  } = args;

  if (node.internal.type !== "File") return;

  const fsNode = node as FileSystemNode;
  if (fsNode.internal.mediaType?.startsWith("video/") !== true) return;

  const videoNode: NodeInput = {
    id: createNodeId(`${node.id} >> GatsbyVideo`),
    children: [],
    parent: node.id,
    internal: {
      contentDigest: node.internal.contentDigest,
      type: "GatsbyVideo",
    },
  };

  await createNode(videoNode);
  createParentChildLink({ parent: node, child: videoNode });
}
