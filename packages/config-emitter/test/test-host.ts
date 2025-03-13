import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { TypeconfTestLibrary } from "../src/testing/index.js";

export async function createMyTestHost() {
  return createTestHost({
    libraries: [TypeconfTestLibrary], // Add other libraries you depend on in your tests
  });
}
export async function createMyTestRunner() {
  const host = await createMyTestHost();
  return createTestWrapper(host, { autoUsings: [] });
}