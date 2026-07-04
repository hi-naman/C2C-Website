export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;
