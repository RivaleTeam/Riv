// Riv - Simplified and Clean
'use strict';

// CONFIG
const CONFIG = {
  indent: 2,
  maxDepth: 100,
  maxLength: 1000000,
  dateFormat: 'iso' // 'iso' | 'timestamp'
};

// UTILITIES
const ESCAPE_MAP = {
  '"': '\\"', '\\': '\\\\', '\n': '\\n', '\r': '\\r', 
  '\t': '\\t', '\b': '\\b', '\f': '\\f'
};

const UNESCAPE_MAP = {
  '\\"': '"', '\\\\': '\\', '\\n': '\n', '\\r': '\r',
  '\\t': '\t', '\\b': '\b', '\\f': '\f'
};

function escape(str) {
  return str.replace(/["\\n\r\t\b\f]/g, char => ESCAPE_MAP[char] || char);
}

function unescape(str) {
  return str.replace(/\\["\\nrtbf]/g, match => UNESCAPE_MAP[match] || match);
}

function checkCircular(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return;
  if (seen.has(obj)) throw new Error('Circular reference');
  seen.add(obj);
  
  if (Array.isArray(obj)) {
    obj.forEach(val => checkCircular(val, seen));
  } else {
    Object.values(obj).forEach(val => checkCircular(val, seen));
  }
  
  seen.delete(obj);
}

function indent(level) {
  return ' '.repeat(CONFIG.indent * level);
}

// SERIALIZER
function serialize(value, name = null, level = 0) {
  if (level > CONFIG.maxDepth) throw new Error('Max depth exceeded');
  
  // Primitives
  if (value === null) return '#nil';
  if (value === undefined) return '#nil';
  if (typeof value === 'boolean') return value ? '#yes' : '#no';
  if (typeof value === 'string') return `"${escape(value)}"`;
  if (typeof value === 'number') {
    if (isNaN(value)) return '#nan';
    if (value === Infinity) return '#inf';
    if (value === -Infinity) return '#-inf';
    return String(value);
  }
  if (typeof value === 'bigint') return `#big:${value}`;
  
  // Special objects
  if (value instanceof Date) {
    const dateStr = CONFIG.dateFormat === 'timestamp' 
      ? value.getTime().toString() 
      : value.toISOString();
    return `#date:"${dateStr}"`;
  }
  if (value instanceof RegExp) return `#regex:"${escape(value.toString())}"`;
  if (value instanceof Error) return `#error:"${escape(value.message)}"`;
  if (value instanceof Set) return `#set:<${Array.from(value).map(v => serialize(v, null, level + 1)).join(' ')}>`;
  if (value instanceof Map) {
    const entries = Array.from(value.entries())
      .map(([k, v]) => `<${serialize(k, null, level + 1)} ${serialize(v, null, level + 1)}>`)
      .join(' ');
    return `#map:<${entries}>`;
  }
  if (ArrayBuffer && value instanceof ArrayBuffer) return `#buffer:"${Array.from(new Uint8Array(value)).join(',')}"`;
  
  checkCircular(value);
  
  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return '<>';
    const items = value.map(v => serialize(v, null, level + 1));
    const inline = items.join(' ');
    
    if (inline.length < 60 && !inline.includes('\n')) {
      return `<${inline}>`;
    }
    
    return '<\n' + items.map(item => indent(level + 1) + item).join('\n') + '\n' + indent(level) + '>';
  }
  
  // Objects
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([k, v]) => typeof v !== 'function');
    if (entries.length === 0) return name ? `@${name}` : '@';
    
    const header = name ? `@${name}\n` : '@\n';
    const props = entries.map(([k, v]) => {
      const val = serialize(v, null, level + 1);
      const hasNewlines = val.includes('\n');
      
      if (hasNewlines) {
        const lines = val.split('\n').map(line => indent(level + 2) + line).join('\n');
        return indent(level + 1) + `:${k} =>\n${lines}`;
      }
      
      return indent(level + 1) + `:${k} => ${val}`;
    });
    
    return header + props.join('\n');
  }
  
  return '#nil';
}

// DESERIALIZER
function deserialize(str) {
  if (!str || typeof str !== 'string') throw new Error('Invalid input');
  if (str.length > CONFIG.maxLength) throw new Error('Input too long');
  
  let pos = 0;
  const len = str.length;
  
  function skip() {
    while (pos < len && /[ \t]/.test(str[pos])) pos++;
  }
  
  function skipLine() {
    while (pos < len && /\s/.test(str[pos])) pos++;
  }
  
  function parseString() {
    if (str[pos] !== '"') throw new Error(`Expected " at ${pos}`);
    pos++;
    let result = '';
    
    while (pos < len && str[pos] !== '"') {
      if (str[pos] === '\\' && pos + 1 < len) {
        result += str[pos] + str[pos + 1];
        pos += 2;
      } else {
        result += str[pos++];
      }
    }
    
    if (pos >= len) throw new Error('Unterminated string');
    pos++; // skip closing "
    return unescape(result);
  }
  
  function parseNumber() {
    const start = pos;
    if (str[pos] === '-') pos++;
    while (pos < len && /[\d.]/.test(str[pos])) pos++;
    if (pos < len && /[eE]/.test(str[pos])) {
      pos++;
      if (str[pos] === '+' || str[pos] === '-') pos++;
      while (pos < len && /\d/.test(str[pos])) pos++;
    }
    
    const numStr = str.slice(start, pos);
    const result = Number(numStr);
    if (isNaN(result)) throw new Error(`Invalid number: ${numStr}`);
    return result;
  }
  
  function parseSpecial() {
    if (str.startsWith('#nil', pos)) { pos += 4; return null; }
    if (str.startsWith('#yes', pos)) { pos += 4; return true; }
    if (str.startsWith('#no', pos)) { pos += 3; return false; }
    if (str.startsWith('#nan', pos)) { pos += 4; return NaN; }
    if (str.startsWith('#inf', pos)) { pos += 4; return Infinity; }
    if (str.startsWith('#-inf', pos)) { pos += 5; return -Infinity; }
    
    if (str.startsWith('#big:', pos)) {
      pos += 5;
      const start = pos;
      while (pos < len && /[\d-]/.test(str[pos])) pos++;
      return BigInt(str.slice(start, pos));
    }
    
    if (str.startsWith('#date:', pos)) {
      pos += 6;
      const dateStr = parseString();
      const date = CONFIG.dateFormat === 'timestamp' 
        ? new Date(parseInt(dateStr))
        : new Date(dateStr);
      if (isNaN(date.getTime())) throw new Error(`Invalid date: ${dateStr}`);
      return date;
    }
    
    if (str.startsWith('#regex:', pos)) {
      pos += 7;
      const regexStr = parseString();
      const match = regexStr.match(/^\/(.*)\/([gimuy]*)$/);
      return match ? new RegExp(match[1], match[2]) : new RegExp(regexStr);
    }
    
    if (str.startsWith('#error:', pos)) {
      pos += 7;
      const message = parseString();
      return new Error(message);
    }
    
    if (str.startsWith('#buffer:', pos)) {
      pos += 8;
      const data = parseString().split(',').map(n => parseInt(n));
      return new Uint8Array(data).buffer;
    }
    
    if (str.startsWith('#set:', pos)) {
      pos += 5;
      return new Set(parseArray());
    }
    
    if (str.startsWith('#map:', pos)) {
      pos += 5;
      const entries = parseArray();
      const map = new Map();
      entries.forEach(entry => {
        if (Array.isArray(entry) && entry.length === 2) {
          map.set(entry[0], entry[1]);
        }
      });
      return map;
    }
    
    // Fallback to JSON compatibility
    if (str.startsWith('true', pos)) { pos += 4; return true; }
    if (str.startsWith('false', pos)) { pos += 5; return false; }
    if (str.startsWith('null', pos)) { pos += 4; return null; }
    
    return undefined;
  }
  
  function parseArray() {
    if (str[pos] !== '<') throw new Error(`Expected < at ${pos}`);
    pos++;
    const result = [];
    
    while (pos < len) {
      skip();
      if (pos >= len) throw new Error('Unterminated array');
      if (str[pos] === '>') { pos++; break; }
      result.push(parseValue());
    }
    
    return result;
  }
  
  function parseObject() {
    if (str[pos] !== '@') throw new Error(`Expected @ at ${pos}`);
    pos++;
    
    // Parse optional name
    let name = '';
    while (pos < len && /[^\s\n\r]/.test(str[pos])) name += str[pos++];
    
    // Skip to next line after object declaration
    while (pos < len && str[pos] !== '\n' && /\s/.test(str[pos])) pos++;
    if (pos < len && str[pos] === '\n') pos++;
    
    const result = {};
    
    // Determine base indentation level
    let baseIndent = 0;
    let tempPos = pos;
    while (tempPos < len && str[tempPos] === ' ') {
      baseIndent++;
      tempPos++;
    }
    
    while (pos < len) {
      // Check current line indentation
      let currentIndent = 0;
      let lineStart = pos;
      while (pos < len && str[pos] === ' ') {
        currentIndent++;
        pos++;
      }
      
      // Skip empty lines
      if (pos < len && str[pos] === '\n') {
        pos++;
        continue;
      }
      
      // If indentation is less than base, we've reached end of object
      if (currentIndent < baseIndent && pos < len && str[pos] !== '\n') {
        pos = lineStart; // Reset position
        break;
      }
      
      // End of input or start of new top-level element
      if (pos >= len || (currentIndent === 0 && (str[pos] === '@' || str[pos] === '>' || str[pos] === '<'))) {
        if (currentIndent === 0) pos = lineStart; // Reset position
        break;
      }
      
      if (str[pos] === ':') {
        pos++;
        let key = '';
        while (pos < len && /[^\s=\n\r]/.test(str[pos])) key += str[pos++];
        
        // Skip spaces before =>
        while (pos < len && str[pos] === ' ') pos++;
        
        if (str.slice(pos, pos + 2) !== '=>') throw new Error(`Expected => at ${pos}`);
        pos += 2;
        
        // Skip spaces after =>
        while (pos < len && str[pos] === ' ') pos++;
        
        // Check if value is on next line (multiline value)
        if (pos < len && str[pos] === '\n') {
          pos++; // Skip newline
          // Skip indentation for the value
          while (pos < len && str[pos] === ' ') pos++;
        }
        
        result[key] = parseValue();
        
        // Skip to end of line
        while (pos < len && str[pos] !== '\n') pos++;
        if (pos < len && str[pos] === '\n') pos++;
      } else {
        // Skip unknown characters or move to next line
        while (pos < len && str[pos] !== '\n') pos++;
        if (pos < len && str[pos] === '\n') pos++;
      }
    }
    
    if (name) result._name = name;
    return result;
  }
  
  function parseValue() {
    // Don't skip newlines here, let parseObject handle indentation
    while (pos < len && /[ \t]/.test(str[pos])) pos++;
    
    if (pos >= len) throw new Error('Unexpected end');
    
    const special = parseSpecial();
    if (special !== undefined) return special;
    
    const char = str[pos];
    if (char === '"') return parseString();
    if (char === '<') return parseArray();
    if (char === '@') return parseObject();
    if (/[\d-]/.test(char)) return parseNumber();
    
    throw new Error(`Invalid token '${char}' at ${pos}`);
  }
  
  try {
    const result = parseValue();
    skipLine();
    if (pos < len) throw new Error(`Unexpected content at ${pos}`);
    return result;
  } catch (error) {
    const context = str.slice(Math.max(0, pos - 10), pos + 10);
    throw new Error(`${error.message} | Context: "${context}"`);
  }
}

// UTILITIES
function pretty(value, name) {
  return serialize(value, name);
}

function minify(value, name) {
  return serialize(value, name).replace(/\n\s*/g, ' ').trim();
}

function clone(value) {
  return deserialize(serialize(value));
}

function merge(target, source) {
  const result = clone(target);
  
  function deepMerge(tgt, src) {
    for (const key in src) {
      if (src[key] && typeof src[key] === 'object' && !Array.isArray(src[key])) {
        tgt[key] = tgt[key] || {};
        deepMerge(tgt[key], src[key]);
      } else {
        tgt[key] = src[key];
      }
    }
    return tgt;
  }
  
  return deepMerge(result, source);
}

function validate(schema, data) {
  function check(schemaNode, dataNode, path = '') {
    if (schemaNode === null) return dataNode === null;
    if (typeof schemaNode === 'string') {
      if (schemaNode === 'any') return true;
      if (schemaNode === 'array') return Array.isArray(dataNode);
      if (schemaNode === 'object') return typeof dataNode === 'object' && !Array.isArray(dataNode);
      return typeof dataNode === schemaNode;
    }
    if (Array.isArray(schemaNode)) {
      if (!Array.isArray(dataNode)) return false;
      return dataNode.every((item, i) => check(schemaNode[0], item, `${path}[${i}]`));
    }
    if (typeof schemaNode === 'object') {
      if (typeof dataNode !== 'object' || Array.isArray(dataNode)) return false;
      for (const key in schemaNode) {
        if (!check(schemaNode[key], dataNode[key], `${path}.${key}`)) return false;
      }
      return true;
    }
    return false;
  }
  
  return check(schema, data);
}

function equal(a, b) {
  try {
    return serialize(a) === serialize(b);
  } catch {
    return false;
  }
}

// TESTING
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🧪 Testing Riv...\n');
  
  const test = {
    name: "Test User",
    age: 30,
    active: true,
    data: null,
    tags: ["dev", "js"],
    meta: { theme: "dark" },
    numbers: [1, 2.5, NaN, Infinity],
    date: new Date('2024-01-01'),
    regex: /test/gi,
    set: new Set([1, 2, 3]),
    big: 123n,
    error: new Error('Test error'),
    buffer: new ArrayBuffer(4)
  };
  
  console.log('Original:', test);
  
  const serialized = serialize(test, 'user');
  console.log('\nSerialized:\n', serialized);
  
  const deserialized = deserialize(serialized);
  console.log('\nDeserialized:', deserialized);
  
  console.log('\nEqual?', equal(test, deserialized));
  console.log('\nMinified:', minify(test, 'user'));
  
  // Test new utilities
  const obj1 = { a: 1, b: { c: 2 } };
  const obj2 = { b: { d: 3 }, e: 4 };
  console.log('\nMerge test:', merge(obj1, obj2));
  
  const schema = { name: 'string', age: 'number', tags: ['string'] };
  const validData = { name: 'John', age: 30, tags: ['dev'] };
  const invalidData = { name: 'John', age: '30', tags: ['dev'] };
  
  console.log('\nValidation (valid):', validate(schema, validData));
  console.log('Validation (invalid):', validate(schema, invalidData));
  
  console.log('\nConfig test - timestamp dates:');
  CONFIG.dateFormat = 'timestamp';
  const timestampTest = serialize(new Date());
  console.log('Timestamp format:', timestampTest);
  CONFIG.dateFormat = 'iso'; // reset
  
  console.log('\n✅ Tests completed!');
}

// EXPORT
const Riv = { 
  serialize, 
  deserialize, 
  pretty, 
  minify, 
  clone, 
  equal, 
  merge,
  validate,
  config: CONFIG 
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Riv;
} else if (typeof window !== 'undefined') {
  window.Riv = Riv;
}

// Export default for ES6 modules
if (typeof exports !== 'undefined') {
  exports.default = Riv;
}
