/**
 * Prisma's Json columns accept any JSON-serializable value. We cast through
 * this helper so repository code compiles identically whether or not
 * `prisma generate` has produced the full client types yet.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonInput = any;

export const toJson = (value: unknown): JsonInput => value as JsonInput;
