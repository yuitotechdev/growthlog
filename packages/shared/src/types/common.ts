export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}


