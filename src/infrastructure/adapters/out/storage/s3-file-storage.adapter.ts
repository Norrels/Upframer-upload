import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";
import {
  FileData,
  FileStoragePort,
} from "../../../../domain/ports/out/storage/file-storage.port";
import { config } from "../../../../env";

export class S3FileStorageAdapter implements FileStoragePort {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = config.AWS_S3_BUCKET_NAME;

    this.s3Client = new S3Client({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        ...(config.AWS_SESSION_TOKEN && {
          sessionToken: config.AWS_SESSION_TOKEN,
        }),
      },
    });
  }

  async saveFile(fileData: FileData, filename: string): Promise<string> {
    try {
      const buffer = await this.streamToBuffer(fileData.file);

      const key = `uploads/${filename}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: this.getContentType(filename),
      });

      await this.s3Client.send(command);

      const s3Url = `https://${this.bucketName}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;

      console.log("File uploaded to S3:", s3Url);
      return s3Url;
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw new Error(`Failed to upload file to S3: ${error}`);
    }
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const readable = stream as Readable;

      readable.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      readable.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      readable.on("error", (error) => {
        reject(error);
      });
    });
  }

  async getPresignedUrl(
    fileUrl: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return presignedUrl;
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  private getContentType(filename: string): string {
    const extension = filename.toLowerCase().split(".").pop();

    if (extension === "mp4") {
      return "video/mp4";
    }

    throw new Error(
      `Invalid file type: ${extension}. Only MP4 videos are allowed.`
    );
  }
}
