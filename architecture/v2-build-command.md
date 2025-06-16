# V2 Build Command Design

## Overview

The v2 build command is a new approach to building configuration packages that focuses on TypeScript type definitions and schema generation rather than TypeSpec compilation.

## Requirements

1. Read a config directory
2. Find .ts files containing type definitions
3. Generate Zod and JSON schema for all type definitions
4. Transform config.ts files that import these types and export objects to JSON files according to the schema

## Architecture

### Input Structure

The v2 build expects:

- `.ts` files with type definitions (interface/type declarations)
- `config.ts` files that import these types and export configuration objects

### Output Structure

- Zod schemas for each type definition
- JSON schemas for each type definition
- JSON configuration files generated from config.ts files

### Implementation Approach

1. **Type Discovery**: Use TypeScript compiler API to find all type definitions in .ts files
2. **Schema Generation**:
   - Use `ts-to-zod` library to generate Zod schemas from TypeScript types
   - Use `zod-to-json-schema` to convert Zod schemas to JSON schemas
3. **Config Processing**:
   - Use TypeScript compiler to evaluate config.ts files
   - Validate the exported objects against generated schemas
   - Output as JSON files

### Key Components

#### 1. TypeDefinitionAnalyzer

- Scans directory for .ts files
- Extracts interface and type declarations
- Maps types to their source files

#### 2. SchemaGenerator

- Converts TypeScript types to Zod schemas
- Generates JSON schemas from Zod schemas
- Handles complex types, unions, generics

#### 3. ConfigProcessor

- Evaluates config.ts files
- Validates against schemas
- Outputs JSON configuration files

### File Structure

```
src/
├── compile-v2/
│   ├── compile-v2.ts          # Main entry point
│   ├── type-analyzer.ts       # Type definition discovery
│   ├── schema-generator.ts    # Zod/JSON schema generation
│   └── config-processor.ts    # Config file processing
```

## Dependencies

- `ts-to-zod`: Generate Zod schemas from TypeScript
- `zod-to-json-schema`: Convert Zod schemas to JSON schemas
- `typescript`: Compiler API for type analysis
- `zod`: Runtime validation library

## CLI Integration

Add new command: `typeconf build-v2 <configDir>`
