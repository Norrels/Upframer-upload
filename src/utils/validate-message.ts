export function validateMessage(content: string) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON message: ${error}`);
  }
}
