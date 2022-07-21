import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { rename } from "fs-extra";

export class RemoteCache {
  public static async create(connectionString: string, containerName: string) {
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    return new RemoteCache(containerClient);
  }
  constructor(private readonly containerClient: ContainerClient) {}

  public async getFromCache(name: string, targetFileName: string) {
    const blob = this.containerClient.getBlockBlobClient(name);
    const tempTargetFileName = targetFileName + ".tmp";
    await blob.downloadToFile(tempTargetFileName);
    await rename(tempTargetFileName, targetFileName);
  }

  public async addToCache(sourceFileName: string, name: string) {
    const blob = this.containerClient.getBlockBlobClient(name);
    await blob.uploadFile(sourceFileName);
  }
}
