import { BasicTestRunner, expectDiagnostics } from "@typespec/compiler/testing";
import { createMyTestRunner } from "./test-host.js";
import { beforeEach, describe, it } from "vitest";
import { strictEqual } from "node:assert";


describe("my library", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createMyTestRunner();
  });

  // Check everything works fine
  it("does this", async () => {
    const { Foo } = await runner.compile(`
      @test model Foo {}
    `);
    strictEqual(Foo.kind, "Model");
  });

});