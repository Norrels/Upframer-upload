import { randomUUID } from "node:crypto";

export class VideoId {
  private readonly value: string;

  constructor() {
    this.value = randomUUID();
  }

  getValue(): string {
    return this.value;
  }
}
