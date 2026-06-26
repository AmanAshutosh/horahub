/** Typed application errors mapped to HTTP status codes by the API layer. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('Invalid request', 422, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests', 429);
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends AppError {
  constructor(what = 'Resource') {
    super(`${what} not found`, 404);
    this.name = 'NotFoundError';
  }
}
