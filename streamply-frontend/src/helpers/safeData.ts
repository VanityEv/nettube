// Safe utilities for handling undefined/null values
export const safeString = (value: any, defaultValue: string = ''): string => {
  if (value === null || value === undefined || value === 'null' || value === 'undefined') {
    return defaultValue;
  }
  return String(value);
};

export const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === 'null' || value === 'undefined') {
    return defaultValue;
  }
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

export const safeArray = <T>(value: any, defaultValue: T[] = []): T[] => {
  if (!Array.isArray(value)) {
    return defaultValue;
  }
  return value;
};

export const safeObject = <T extends Record<string, any>>(value: any, defaultValue: T = {} as T): T => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultValue;
  }
  return value;
};

export const safeBool = (value: any, defaultValue: boolean = false): boolean => {
  if (value === null || value === undefined || value === 'null' || value === 'undefined') {
    return defaultValue;
  }
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
};

export const safeDate = (value: any, defaultValue?: Date): Date | null => {
  if (value === null || value === undefined || value === 'null' || value === 'undefined') {
    return defaultValue || null;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? (defaultValue || null) : date;
};

// Safe rendering helpers
export const renderSafe = (value: any, fallback: string = 'N/A'): string => {
  return safeString(value, fallback);
};

export const renderSafeNumber = (value: any, fallback: string = '0'): string => {
  const num = safeNumber(value);
  return num === 0 && !value ? fallback : num.toString();
};

// Safe navigation helpers
export const safeGet = <T>(obj: any, path: string, defaultValue?: T): T | undefined => {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result === null || result === undefined ? defaultValue : result;
  } catch (error) {
    return defaultValue;
  }
};

// Type guards
export const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value.length > 0 && value !== 'null' && value !== 'undefined';
};

export const isValidNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

export const isValidArray = (value: any): value is Array<any> => {
  return Array.isArray(value) && value.length > 0;
};

export const isValidObject = (value: any): value is Record<string, any> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};
