// src/lib/type-guards.ts
/**
 * Type Guards
 * Utility functions for runtime type checking and type narrowing
 */

// Basic type guards
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = <T = unknown>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isFunction = <T extends (...args: never[]) => unknown>(value: unknown): value is T => {
  return typeof value === 'function';
};

export const isNull = (value: unknown): value is null => {
  return value === null;
};

export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined;
};

export const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

// Complex type guards
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isNonEmptyString = (value: unknown): value is string => {
  return isString(value) && value.trim().length > 0;
};

export const isNonEmptyArray = <T = unknown>(value: unknown): value is T[] => {
  return isArray(value) && value.length > 0;
};

export const isRecord = <K extends string | number | symbol, V = unknown>(
  value: unknown
): value is Record<K, V> => {
  return isObject(value);
};

// Error type guards
export const isError = (value: unknown): value is Error => {
  return value instanceof Error;
};

export const hasErrorMessage = (error: unknown): error is { message: string } => {
  return isObject(error) && 'message' in error && isString(error['message']);
};

export const hasStatusCode = (error: unknown): error is { statusCode: number } => {
  return isObject(error) && 'statusCode' in error && isNumber(error['statusCode']);
};

// API response type guards
export const isApiResponse = <T>(
  response: unknown,
  dataValidator?: (data: unknown) => data is T
): response is { data: T; status: number } => {
  if (!isObject(response)) return false;

  const res = response;
  if (!('data' in res) || !('status' in res)) return false;
  if (!isNumber(res['status'])) return false;

  if (dataValidator) {
    return dataValidator(res['data']);
  }

  return true;
};

// Product type guards
export const hasPrice = (value: unknown): value is { price: number } => {
  return isObject(value) && 'price' in value && isNumber(value['price']);
};

export const hasId = (value: unknown): value is { id: string } => {
  return isObject(value) && 'id' in value && isString(value['id']);
};

export const hasName = (value: unknown): value is { name: string } => {
  return isObject(value) && 'name' in value && isString(value['name']);
};

// Utility type guard factory
export const createPropertyGuard = <K extends string, V>(
  key: K,
  valueGuard: (value: unknown) => value is V
) => {
  return (obj: unknown): obj is Record<K, V> => {
    return isObject(obj) && key in obj && valueGuard(obj[key]);
  };
};

// Array element type guard
export const isArrayOf = <T>(
  value: unknown,
  elementGuard: (element: unknown) => element is T
): value is T[] => {
  return isArray(value) && value.every(elementGuard);
};

// Partial type guard
export const isPartialOf = <T extends Record<string, unknown>>(
  value: unknown,
  guards: { [K in keyof T]?: (value: unknown) => value is T[K] }
): value is Partial<T> => {
  if (!isObject(value)) return false;

  for (const [key, guard] of Object.entries(guards)) {
    if (key in value && guard) {
      const propertyValue = value[key];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (!guard(propertyValue)) {
        return false;
      }
    }
  }

  return true;
};

// Strict type guard
export const isExactShape = <T extends Record<string, unknown>>(
  value: unknown,
  shape: { [K in keyof T]: (value: unknown) => value is T[K] }
): value is T => {
  if (!isObject(value)) return false;

  const valueKeys = Object.keys(value);
  const shapeKeys = Object.keys(shape);

  // Check if all required keys exist
  if (!shapeKeys.every((key) => valueKeys.includes(key))) return false;

  // Check if all values match their guards
  for (const [key, guard] of Object.entries(shape)) {
    const propertyValue = value[key];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (!guard(propertyValue)) return false;
  }

  return true;
};

// Union type guard helper
export const isOneOf = <T extends readonly unknown[]>(
  value: unknown,
  options: T
): value is T[number] => {
  return options.includes(value);
};

// Enum type guard factory
export const createEnumGuard = <T extends Record<string, string | number>>(enumObj: T) => {
  const values = Object.values(enumObj);
  return (value: unknown): value is T[keyof T] => {
    return typeof value === 'string' || typeof value === 'number' ? values.includes(value) : false;
  };
};

// Safe property access
export const safeGet = <T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K]
): T[K] => {
  return obj?.[key] ?? defaultValue;
};

// Type assertion with validation
export const assertType = <T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): T => {
  if (!guard(value)) {
    throw new TypeError(errorMessage || 'Type assertion failed');
  }
  return value;
};

// Narrow type helper
export const narrow = <T, U extends T>(value: T, guard: (value: T) => value is U): U | null => {
  return guard(value) ? value : null;
};
