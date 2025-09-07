# Riv-JS

**Riv** (Awesome Lightweight Object Notation) is a human-readable data serialization format that extends beyond JSON's limitations, supporting advanced JavaScript types while maintaining simplicity and readability.

## 🚀 Features

- **Human-readable format** with clean syntax
- **Advanced type support**: Date, RegExp, Set, Map, BigInt, Symbol, Error, ArrayBuffer
- **Circular reference detection**
- **Configurable serialization**
- **Utility functions** for deep cloning, merging, and validation
- **Zero dependencies**
- **Lightweight** (~8KB minified)

## 📦 Installation

```bash
npm install alon-js
```

## 🔧 Usage

### Basic Example

```javascript
const Riv = require('alon-js');

const data = {
  name: "John Doe",
  age: 30,
  active: true,
  tags: ["developer", "javascript"],
  profile: {
    theme: "dark",
    lang: "en"
  }
};

// Serialize to Riv format
const serialized = Riv.serialize(data, 'user');
console.log(serialized);
/*
@user
  :name => "John Doe"
  :age => 30
  :active => #yes
  :tags => <"developer" "javascript">
  :profile =>
    @
      :theme => "dark"
      :lang => "en"
*/

// Deserialize back to JavaScript object
const deserialized = Riv.deserialize(serialized);
console.log(deserialized);
```

### Advanced Types

```javascript
const complexData = {
  date: new Date('2024-01-01'),
  regex: /test\d+/gi,
  bigNumber: 9007199254740991n,
  set: new Set([1, 2, 3]),
  map: new Map([['key1', 'value1'], ['key2', 42]]),
  buffer: new ArrayBuffer(4),
  error: new Error('Something went wrong'),
  symbol: Symbol('unique'),
  special: {
    nan: NaN,
    infinity: Infinity,
    negInfinity: -Infinity,
    nil: null
  }
};

const serialized = Riv.serialize(complexData);
const restored = Riv.deserialize(serialized);

// All types are perfectly preserved!
console.log(restored.date instanceof Date); // true
console.log(restored.regex instanceof RegExp); // true
console.log(typeof restored.bigNumber === 'bigint'); // true
```

## 📚 API Reference

### Core Functions

#### `Riv.serialize(value, name?, indent?)`
Converts a JavaScript value to Riv format string.

- **value**: Any JavaScript value
- **name**: Optional object name
- **indent**: Starting indentation level
- **Returns**: Riv format string

#### `Riv.deserialize(str)`
Parses an Riv format string back to JavaScript value.

- **str**: Riv format string
- **Returns**: JavaScript value

### Utility Functions

#### `Riv.pretty(value, name?)`
Alias for `serialize()` with pretty formatting.

#### `Riv.minify(value, name?)`
Serializes to compact single-line format.

#### `Riv.clone(value)`
Deep clones any JavaScript value.

```javascript
const original = { nested: { data: [1, 2, 3] } };
const cloned = Riv.clone(original);
// Completely independent copy
```

#### `Riv.equal(a, b)`
Deep equality comparison.

```javascript
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { a: 1, b: { c: 2 } };
console.log(Riv.equal(obj1, obj2)); // true
```

#### `Riv.merge(target, source)`
Deep merge objects.

```javascript
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { b: { d: 3 }, e: 4 };
const merged = Riv.merge(obj1, obj2);
// Result: { a: 1, b: { c: 2, d: 3 }, e: 4 }
```

#### `Riv.validate(schema, data)`
Simple schema validation.

```javascript
const schema = {
  name: 'string',
  age: 'number',
  tags: ['string']
};

const validData = {
  name: 'John',
  age: 30,
  tags: ['dev', 'js']
};

console.log(Riv.validate(schema, validData)); // true
```

## ⚙️ Configuration

```javascript
// Access configuration
const config = Riv.config;

// Modify settings
config.indent = 4;           // Indentation size (default: 2)
config.maxDepth = 50;        // Max nesting depth (default: 100)
config.dateFormat = 'timestamp'; // 'iso' or 'timestamp' (default: 'iso')
```

## 🎯 Riv Format Syntax

### Primitives
```
#nil          // null/undefined
#yes          // true
#no           // false
"text"        // strings
42            // numbers
#nan          // NaN
#inf          // Infinity
#-inf         // -Infinity
```

### Collections
```
<item1 item2>           // arrays
@                       // objects
  :key => value
@name                   // named objects
  :prop => "value"
```

### Special Types
```
#date:"2024-01-01T00:00:00.000Z"    // Date
#regex:"/pattern/flags"              // RegExp
#big:123456789                       // BigInt
#symbol:"description"                // Symbol
#error:"message"                     // Error
#set:<1 2 3>                        // Set
#map:<<key1 value1> <key2 value2>>  // Map
#buffer:"1,2,3,4"                   // ArrayBuffer
```

## 🔄 JSON Compatibility

Riv can parse basic JSON syntax for easy migration:

```javascript
const jsonString = '{"name": "John", "active": true}';
const parsed = Riv.deserialize(jsonString); // Works!
```

## 🚀 Performance

Riv is optimized for both speed and memory efficiency:

- **Streaming parser** for large datasets
- **Circular reference detection** with WeakSet
- **Minimal memory allocation** during parsing
- **Fast serialization** with optimized string building

## 🛡️ Error Handling

Riv provides detailed error messages with context:

```javascript
try {
  Riv.deserialize('invalid { syntax }');
} catch (error) {
  console.log(error.message);
  // "Invalid token '{' at position 8 | Context: "invalid { syn""
}
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Comparison with JSON

| Feature | JSON | Riv |
|---------|------|------|
| Dates | ❌ String only | ✅ Native Date |
| RegExp | ❌ No support | ✅ Full support |
| BigInt | ❌ No support | ✅ Native BigInt |
| Set/Map | ❌ No support | ✅ Native support |
| Comments | ❌ No support | ✅ Planned |
| Circular refs | ❌ Throws error | ✅ Detection |
| Human readable | ⚠️ Limited | ✅ Excellent |
| Size | ✅ Compact | ⚠️ Slightly larger |

---

**Made with ❤️ for the JavaScript community**
