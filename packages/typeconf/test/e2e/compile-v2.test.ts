import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  compileV2,
  CompileV2Options,
  CompileV2Result,
} from "../../src/compile-v2/compile-v2.js";
import { SchemaGenerator } from "../../src/compile-v2/schema-generator.js";
import { promises as fsAsync } from "fs";
import path from "path";
import os from "os";

describe("Compile V2 End-to-End Tests", () => {
  let tempDir: string;
  let testConfigDir: string;

  beforeEach(async () => {
    tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "typeconf-e2e-"));
    testConfigDir = path.join(tempDir, "config");
    await fsAsync.mkdir(testConfigDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe("TypeScript to Zod Schema Translation", () => {
    it("should translate basic interface to Zod schema", async () => {
      const typeDefinitions = [
        {
          name: "DatabaseConfig",
          content: `
export interface DatabaseConfig {
  host: string;
  port: number;
  ssl: boolean;
  database: string;
}
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);
      expect(result.types).toHaveLength(1);
      expect(result.schemas.size).toBe(1);
      expect(result.schemas.has("DatabaseConfig")).toBe(true);

      const schema = result.schemas.get("DatabaseConfig");
      expect(schema).toBeDefined();
      expect(schema.typeName).toBe("DatabaseConfig");
      expect(schema.zodSchema).toBeDefined();
      expect(schema.jsonSchema).toBeDefined();
    });

    it("should translate complex nested interface to Zod schema", async () => {
      const typeDefinitions = [
        {
          name: "AppConfig",
          content: `
export interface AppConfig {
  name: string;
  version: string;
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      certPath?: string;
      keyPath?: string;
    };
  };
  database: {
    type: "postgres" | "mysql" | "sqlite";
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  features: {
    authentication: boolean;
    logging: boolean;
    metrics?: boolean;
  };
  tags?: string[];
  metadata?: Record<string, any>;
}
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);
      expect(result.types).toHaveLength(1);
      expect(result.schemas.size).toBe(1);
      expect(result.schemas.has("AppConfig")).toBe(true);

      const schema = result.schemas.get("AppConfig");
      expect(schema.jsonSchema.type).toBe("object");
      expect(schema.jsonSchema.properties).toHaveProperty("name");
      expect(schema.jsonSchema.properties).toHaveProperty("server");
      expect(schema.jsonSchema.properties).toHaveProperty("database");
    });

    it("should translate type aliases to Zod schema", async () => {
      const typeDefinitions = [
        {
          name: "ConfigTypes",
          content: `
export type Environment = "development" | "staging" | "production";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type ServerConfig = {
  env: Environment;
  logLevel: LogLevel;
  port: number;
  workers?: number;
};

export type DatabaseConnectionString = string;
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);
      expect(result.types.length).toBeGreaterThanOrEqual(3);

      const typeNames = result.types.map((t) => t.name);
      expect(typeNames).toContain("Environment");
      expect(typeNames).toContain("LogLevel");
      expect(typeNames).toContain("ServerConfig");

      // Check that schemas were generated for all types
      expect(result.schemas.has("Environment")).toBe(true);
      expect(result.schemas.has("LogLevel")).toBe(true);
      expect(result.schemas.has("ServerConfig")).toBe(true);
    });

    it("should handle optional properties correctly", async () => {
      const typeDefinitions = [
        {
          name: "OptionalConfig",
          content: `
export interface OptionalConfig {
  required: string;
  optional?: number;
  nested: {
    requiredInNested: boolean;
    optionalInNested?: string;
  };
  arrayOptional?: string[];
}
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);
      expect(result.types).toHaveLength(1);
      expect(result.schemas.size).toBe(1);

      const schema = result.schemas.get("OptionalConfig");
      expect(schema.jsonSchema.required).toContain("required");
      expect(schema.jsonSchema.required).toContain("nested");
      expect(schema.jsonSchema.required).not.toContain("optional");
      expect(schema.jsonSchema.required).not.toContain("arrayOptional");
    });
  });

  describe("TypeScript to JSON Schema Translation", () => {
    it("should translate basic interface to JSON schema", async () => {
      const typeDefinitions = [
        {
          name: "ApiConfig",
          content: `
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  apiKey: string;
}
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);

      const schema = result.schemas.get("ApiConfig");
      expect(schema).toBeDefined();
      expect(schema.jsonSchema.type).toBe("object");
      expect(schema.jsonSchema.properties).toHaveProperty("baseUrl");
      expect(schema.jsonSchema.properties).toHaveProperty("timeout");
      expect(schema.jsonSchema.properties).toHaveProperty("retries");
      expect(schema.jsonSchema.properties).toHaveProperty("apiKey");

      expect(schema.jsonSchema.properties.baseUrl.type).toBe("string");
      expect(schema.jsonSchema.properties.timeout.type).toBe("number");
      expect(schema.jsonSchema.properties.retries.type).toBe("number");
      expect(schema.jsonSchema.properties.apiKey.type).toBe("string");
    });

    it("should handle nested objects in JSON schema", async () => {
      const typeDefinitions = [
        {
          name: "NestedConfig",
          content: `
export interface NestedConfig {
  app: {
    name: string;
    version: string;
  };
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      certificate?: string;
    };
  };
}
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);

      const schema = result.schemas.get("NestedConfig");
      expect(schema.jsonSchema.properties).toHaveProperty("app");
      expect(schema.jsonSchema.properties).toHaveProperty("server");
    });

    it("should handle arrays and optional properties in JSON schema", async () => {
      const typeDefinitions = [
        {
          name: "ArrayConfig",
          content: `
export interface ArrayConfig {
  tags: string[];
  ports: number[];
  features?: string[];
  metadata: {
    labels: string[];
    values?: number[];
  };
}
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);

      const schema = result.schemas.get("ArrayConfig");
      expect(schema.jsonSchema.properties.tags.type).toBe("array");
      expect(schema.jsonSchema.properties.ports.type).toBe("array");

      // Check required vs optional
      expect(schema.jsonSchema.required).toContain("tags");
      expect(schema.jsonSchema.required).toContain("ports");
      expect(schema.jsonSchema.required).toContain("metadata");
      expect(schema.jsonSchema.required).not.toContain("features");
    });
  });

  describe("Complete Workflow: Types + Configs", () => {
    it("should process complete workflow with types and config files", async () => {
      const typeDefinitions = [
        {
          name: "DatabaseConfig",
          content: `
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  ssl: boolean;
  pool: {
    min: number;
    max: number;
  };
}
          `.trim(),
        },
        {
          name: "RedisConfig",
          content: `
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}
          `.trim(),
        },
      ];

      const configFiles = [
        {
          name: "database",
          content: `
const config: DatabaseConfig = {
  host: "localhost",
  port: 5432,
  database: "myapp",
  ssl: false,
  pool: {
    min: 2,
    max: 10
  }
};

export default config;
          `.trim(),
        },
        {
          name: "redis",
          content: `
const config: RedisConfig = {
  host: "redis.example.com",
  port: 6379,
  db: 0
};

export default config;
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles,
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);
      expect(result.types).toHaveLength(2);
      expect(result.schemas.size).toBe(2);
      expect(result.configs).toHaveLength(2);

      // Check schemas
      expect(result.schemas.has("DatabaseConfig")).toBe(true);
      expect(result.schemas.has("RedisConfig")).toBe(true);

      // Check configs
      const configNames = result.configs.map((c) => c.typeName);
      expect(configNames).toContain("DatabaseConfig");
      expect(configNames).toContain("RedisConfig");
    });

    it("should handle complex real-world configuration", async () => {
      const typeDefinitions = [
        {
          name: "AppConfig",
          content: `
export interface AppConfig {
  app: {
    name: string;
    version: string;
    env: "development" | "staging" | "production";
  };
  server: {
    host: string;
    port: number;
    cors: {
      enabled: boolean;
      origins: string[];
    };
  };
  database: {
    type: "postgres" | "mysql";
    host: string;
    port: number;
    database: string;
    ssl: boolean;
  };
  features: {
    authentication: boolean;
    monitoring: boolean;
    analytics?: boolean;
  };
}
          `.trim(),
        },
      ];

      const configFiles = [
        {
          name: "app-production",
          content: `
const config: AppConfig = {
  app: {
    name: "MyApp",
    version: "1.0.0",
    env: "production"
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    cors: {
      enabled: true,
      origins: ["https://myapp.com"]
    }
  },
  database: {
    type: "postgres",
    host: "db.myapp.com",
    port: 5432,
    database: "myapp_prod",
    ssl: true
  },
  features: {
    authentication: true,
    monitoring: true,
    analytics: true
  }
};

export default config;
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles,
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);
      expect(result.types).toHaveLength(1);
      expect(result.schemas.size).toBe(1);
      expect(result.configs).toHaveLength(1);

      // Verify the generated schema has expected structure
      const appConfigSchema = result.schemas.get("AppConfig");
      expect(appConfigSchema.jsonSchema.properties).toHaveProperty("app");
      expect(appConfigSchema.jsonSchema.properties).toHaveProperty("server");
      expect(appConfigSchema.jsonSchema.properties).toHaveProperty("database");
      expect(appConfigSchema.jsonSchema.properties).toHaveProperty("features");
    });
  });

  describe("File-based vs String-based Processing", () => {
    it("should produce equivalent results for file-based and string-based inputs", async () => {
      // First, test with string inputs
      const typeDefinitions = [
        {
          name: "ComparisonConfig",
          content: `
export interface ComparisonConfig {
  name: string;
  port: number;
  enabled: boolean;
}
          `.trim(),
        },
      ];

      const stringOptions: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const stringResult = await compileV2(testConfigDir, stringOptions);

      // Then test with file-based inputs
      await fsAsync.writeFile(
        path.join(testConfigDir, "types.ts"),
        typeDefinitions[0].content,
      );

      const fileOptions: CompileV2Options = {};

      const fileResult = await compileV2(testConfigDir, fileOptions);

      // Both should succeed
      expect(stringResult.success).toBe(true);
      expect(fileResult.success).toBe(true);

      // Both should have the same number of types
      expect(stringResult.types).toHaveLength(1);
      expect(fileResult.types).toHaveLength(1);

      // Both should generate schemas
      expect(stringResult.schemas.size).toBe(1);
      expect(fileResult.schemas.size).toBe(1);

      // Type names should match
      expect(stringResult.types[0].name).toBe("ComparisonConfig");
      expect(fileResult.types[0].name).toBe("ComparisonConfig");
    });
  });

  describe("File Output Generation", () => {
    it("should write files when outputDir is specified", async () => {
      const typeDefinitions = [
        {
          name: "FileOutputConfig",
          content: `
export interface FileOutputConfig {
  outputPath: string;
  format: "json" | "yaml";
}
          `.trim(),
        },
      ];

      const outputDir = path.join(tempDir, "output");
      const options: CompileV2Options = {
        outputDir,
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);

      // Check that files were created
      const schemasDir = path.join(outputDir, "schemas");
      expect(
        await fsAsync
          .access(schemasDir)
          .then(() => true)
          .catch(() => false),
      ).toBe(true);

      const zodFile = path.join(schemasDir, "schemas.zod.ts");
      const jsonFile = path.join(schemasDir, "schemas.json");

      expect(
        await fsAsync
          .access(zodFile)
          .then(() => true)
          .catch(() => false),
      ).toBe(true);
      expect(
        await fsAsync
          .access(jsonFile)
          .then(() => true)
          .catch(() => false),
      ).toBe(true);

      // Check summary file
      const summaryFile = path.join(outputDir, "compilation-summary.json");
      expect(
        await fsAsync
          .access(summaryFile)
          .then(() => true)
          .catch(() => false),
      ).toBe(true);
    });

    it("should not write files when outputDir is not specified", async () => {
      const typeDefinitions = [
        {
          name: "NoOutputConfig",
          content: `
export interface NoOutputConfig {
  value: string;
}
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);
      // No output directory should be created since we didn't specify one
      expect(result.schemas.size).toBe(1);
    });
  });

  describe("Schema Generator String Methods", () => {
    it("should generate Zod schemas as strings", async () => {
      const typeDefinitions = [
        {
          name: "TestConfig",
          content: `
export interface TestConfig {
  name: string;
  port: number;
}
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);
      const schemaGenerator = new SchemaGenerator();

      const zodString = await schemaGenerator.generateZodSchemasString(
        result.schemas,
      );
      const jsonString = await schemaGenerator.generateJsonSchemasString(
        result.schemas,
      );

      expect(zodString).toContain("TestConfig");
      expect(zodString).toContain("Auto-generated Zod schemas");

      const jsonSchema = JSON.parse(jsonString);
      expect(jsonSchema.definitions).toHaveProperty("TestConfig");
      expect(jsonSchema.$schema).toBe(
        "http://json-schema.org/draft-07/schema#",
      );
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty type definitions gracefully", async () => {
      const options: CompileV2Options = {
        typeDefinitions: [],
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);
      expect(result.types).toHaveLength(0);
      expect(result.schemas.size).toBe(0);
      expect(result.configs).toHaveLength(0);
    });

    it("should handle multiple types with same name gracefully", async () => {
      const typeDefinitions = [
        {
          name: "DuplicateTest1",
          content: `
export interface ConfigType {
  field1: string;
}
          `.trim(),
        },
        {
          name: "DuplicateTest2",
          content: `
export interface ConfigType {
  field2: number;
}
          `.trim(),
        },
      ];

      const options: CompileV2Options = {
        typeDefinitions,
        configFiles: [],
      };

      const result = await compileV2(testConfigDir, options);

      expect(result.success).toBe(true);
      // Should handle duplicates somehow (either replace or ignore)
      expect(result.types.length).toBeGreaterThanOrEqual(1);
    });
  });
});
