import { randomUUID } from "crypto";

export const uuidGenerator = function (): string {
  const uuid = randomUUID().split("-").join("");
  let result = "";

  for (let i = 0; i < uuid.length; i++) {
    if (i % 2 === 0) {
      result = result + uuid[i];
    }
  }

  return result;
}
