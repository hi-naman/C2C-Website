const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // CRITICAL: forces HttpOnly cookie inclusion
  };

  const response = await fetch(url, config);

  if (response.status === 204) {
    return {} as T;
  }

  let result: any;
  try {
    result = await response.json();
  } catch (err) {
    throw new ApiError('Failed to parse response body', response.status);
  }

  if (!response.ok || result.success === false) {
    const errorMsg = result.success === false ? result.message : response.statusText;
    throw new ApiError(
      errorMsg || 'An unknown network error occurred',
      response.status,
      result.errors || undefined
    );
  }
  if (result.data !== undefined) {
    return result.data as T;
  }

  return result as unknown as T;
}
export default apiClient;
