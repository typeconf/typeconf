# Compile V2 Tests

This directory contains comprehensive end-to-end tests for the Compile V2 functionality.

## Overview

The Compile V2 system provides a powerful TypeScript-to-schema compilation pipeline that:

1. **Analyzes TypeScript types** from either files or string content
2. **Generates Zod and JSON schemas** for runtime validation
3. **Processes configuration files** with type inference and validation
4. **Outputs results** either as structured data or files

## Key Features

### String-Based Input Processing
- Accept TypeScript type definitions as strings instead of requiring files
- Process configuration files from string content
- Enables programmatic usage and testing without file I/O

### Flexible Output Handling
- Core compilation returns structured results (types, schemas, configs)
- File output is optional via `outputDir` parameter
- Decoupled design allows CLI and tests to handle output differently

### Type-Safe Configuration
- Automatic type inference from config file names
- Schema validation of configuration content
- Support for complex TypeScript constructs

## API Usage

### Basic Type Analysis
```typescript
const result = await compileV2(configDir, {
  typeDefinitions: [
    {
      name: "DatabaseConfig",
      content: `
        export interface DatabaseConfig {
          host: string;
          port: number;
          ssl: boolean;
        }
      `
    }
  ]
});

// Access results directly
console.log(result.types);        // Type definitions found
console.log(result.schemas);      // Generated Zod/JSON schemas
console.log(result.configs);      // Processed configurations
```

### With File Output
```typescript
const result = await compileV2(configDir, {
  outputDir: "./output",  // Files will be written here
  typeDefinitions: [...],
  configFiles: [...]
});
```

### Working with Schemas
```typescript
// Get specific schema
const dbSchema = result.schemas.get("DatabaseConfig");
console.log(dbSchema.zodSchema);    // Zod schema object
console.log(dbSchema.jsonSchema);   // JSON schema object

// Generate string representations
const schemaGenerator = new SchemaGenerator();
const zodString = await schemaGenerator.generateZodSchemasString(result.schemas);
const jsonString = await schemaGenerator.generateJsonSchemasString(result.schemas);
```

## Test Structure

### End-to-End Tests (`test/e2e/compile-v2.test.ts`)

**TypeScript to Zod Schema Translation**
- Basic interface conversion
- Complex nested structures with optional properties
- Type aliases and union types
- Proper handling of required vs optional fields

**TypeScript to JSON Schema Translation**
- Object property mapping
- Nested object structures
- Array types and collections
- Union type representations

**Complete Workflow Testing**
- Full pipeline: types → schemas → config processing
- Real-world configuration scenarios
- Multi-type projects with dependencies

**File vs String Processing**
- Equivalence testing between file-based and string-based inputs
- Backward compatibility verification

**Output Generation**
- File output when `outputDir` is specified
- No file output when `outputDir` is omitted
- Schema string generation capabilities

**Error Handling**
- Empty type definitions
- Duplicate type names
- Invalid TypeScript syntax

## Test Coverage

The test suite covers:
- ✅ 15 comprehensive end-to-end tests
- ✅ TypeScript interface analysis
- ✅ Zod schema generation
- ✅ JSON schema generation
- ✅ Configuration file processing
- ✅ Type inference from file names
- ✅ Optional vs required property handling
- ✅ Nested object structures
- ✅ Array and union types
- ✅ File output generation
- ✅ Error scenarios and edge cases

## Running Tests

```bash
# Run all tests
npm test

# Run with verbose output
npm test -- --reporter=verbose

# Run specific test file
npm test test/e2e/compile-v2.test.ts
```

## Design Principles

1. **Separation of Concerns**: Core compilation logic is separate from output handling
2. **Testability**: Direct access to generator results without file I/O dependencies  
3. **Flexibility**: Support both programmatic usage and CLI file output
4. **Backward Compatibility**: Existing file-based workflows continue to work
5. **Performance**: String-based processing enables faster testing cycles 