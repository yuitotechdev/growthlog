export class HttpError extends Error {
  public statusCode: number;
  public error: string;

  constructor(message: string, statusCode: number, error: string) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request') {
    super(message, 400, 'BadRequest');
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'Unauthorized');
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'Forbidden');
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found') {
    super(message, 404, 'NotFound');
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'Conflict');
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500, 'InternalServerError');
  }
}


