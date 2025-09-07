// Type definitions for alon-js
// Project: https://github.com/yourusername/alon-js
// Definitions by: Your Name <https://github.com/yourusername>

export interface ALONConfig {
  indent: number;
  maxDepth: number;
  maxLength: number;
  dateFormat: 'iso' | 'timestamp';
}

export interface ValidationSchema {
  [key: string]: string | ValidationSchema | ValidationSchema[];
}

export interface ALON {
  /**
   * Serializes a JavaScript value to ALON format string
   * @param value - The value to serialize
   * @param name - Optional object name
   * @param indent - Starting indentation level
   * @returns ALON format string
   */
  serialize(value: any, name?: string | null, indent?: number): string;

  /**
   * Deserializes an ALON format string to JavaScript value
   * @param str - ALON format string
   * @returns Parsed JavaScript value
   */
  deserialize(str: string): any;

  /**
   * Serializes with pretty formatting (alias for serialize)
   * @param value - The value to serialize
   * @param name - Optional object name
   * @returns Pretty formatted ALON string
   */
  pretty(value: any, name?: string | null): string;

  /**
   * Serializes to compact single-line format
   * @param value - The value to serialize
   * @param name - Optional object name
   * @returns Minified ALON string
   */
  minify(value: any, name?: string | null): string;

  /**
   * Deep clones any JavaScript value
   * @param value - The value to clone
   * @returns Deep cloned value
   */
  clone<T>(value: T): T;

  /**
   * Deep equality comparison between two values
   * @param a - First value
   * @param b - Second value
   * @returns True if values are deeply equal
   */
  equal(a: any, b: any): boolean;

  /**
   * Deep merge two objects
   * @param target - Target object
   * @param source - Source object to merge
   * @returns Merged object
   */
  merge<T, U>(target: T, source: U): T & U;

  /**
   * Validates data against a simple schema
   * @param schema - Validation schema
   * @param data - Data to validate
   * @returns True if data matches schema
   */
  validate(schema: ValidationSchema, data: any): boolean;

  /**
   * Configuration object
   */
  config: ALONConfig;
}

declare const ALON: ALON;
export default ALON;