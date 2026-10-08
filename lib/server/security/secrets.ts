import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ENVELOPE_VERSION = "v1";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function decodeKey(base64Key: string): Buffer {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64Key)) {
    throw new Error("Credential encryption key must be canonical base64 encoding 32 bytes.");
  }

  const key = Buffer.from(base64Key, "base64");
  if (key.length !== KEY_BYTES || key.toString("base64") !== base64Key) {
    throw new Error("Credential encryption key must be canonical base64 encoding 32 bytes.");
  }

  return key;
}

function encodePart(value: Uint8Array): string {
  return Buffer.from(value).toString("base64url");
}

function decodePart(value: string): Buffer {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Encrypted credential envelope is malformed.");
  }

  return Buffer.from(value, "base64url");
}

export function encryptSecret(plaintext: string, base64Key: string): string {
  const key = decodeKey(base64Key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: AUTH_TAG_BYTES });
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return [ENVELOPE_VERSION, encodePart(iv), encodePart(cipher.getAuthTag()), encodePart(ciphertext)].join(".");
}

export function decryptSecret(envelope: string, base64Key: string): string {
  const [version, encodedIv, encodedTag, encodedCiphertext, extra] = envelope.split(".");
  if (version !== ENVELOPE_VERSION || !encodedIv || !encodedTag || encodedCiphertext === undefined || extra !== undefined) {
    throw new Error("Encrypted credential envelope is malformed or uses an unsupported version.");
  }

  const iv = decodePart(encodedIv);
  const tag = decodePart(encodedTag);
  const ciphertext = decodePart(encodedCiphertext);
  if (iv.length !== IV_BYTES || tag.length !== AUTH_TAG_BYTES) {
    throw new Error("Encrypted credential envelope is malformed.");
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", decodeKey(base64Key), iv, { authTagLength: AUTH_TAG_BYTES });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Encrypted credential could not be authenticated or decrypted.");
  }
}
