"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectConfigSchema = exports.DebuggingConfigSchema = exports.CatsInventorySchema = void 0;
var zod_1 = require("zod");
exports.CatsInventorySchema = zod_1.z.object({
    cats: zod_1.z.array(zod_1.z.string()),
    cutenessRatio: zod_1.z.number(),
});
exports.DebuggingConfigSchema = zod_1.z.object({
    logLevel: zod_1.z.number(),
    maxRetries: zod_1.z.number(),
    timeout: zod_1.z.any(),
});
exports.ProjectConfigSchema = zod_1.z.object({
    projectName: zod_1.z.string(),
    inventory: exports.CatsInventorySchema,
    debugging: exports.DebuggingConfigSchema,
});
var TYPECONF_SCHEMAS_MAP = {
    "simple/src/values.config.ts": exports.ProjectConfigSchema,
};
exports.default = TYPECONF_SCHEMAS_MAP;
