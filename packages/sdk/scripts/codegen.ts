// generates src/gen/ from openapi.yaml; programmatic so output patches can land in this script.

import { createClient } from "@hey-api/openapi-ts";

await createClient({
  input: "./openapi.yaml",
  output: {
    path: "./src/gen",
    tsConfigPath: "./tsconfig.json",
    clean: true,
    format: "prettier",
  },
  plugins: [
    { name: "@hey-api/typescript", exportFromIndex: false },
    {
      name: "@hey-api/sdk",
      exportFromIndex: false,
      auth: false, // bearer attached in src/client.ts
      operations: { strategy: "flat" }, // tree-shakeable named fns; class wrapper in src/client.ts
    },
    {
      name: "@hey-api/client-fetch",
      exportFromIndex: false,
      baseUrl: "https://api.docfork.com",
    },
  ],
});
