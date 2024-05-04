export { t, z } from "./deps.ts";

import { type Schema, type Infer, toJSONSchema, validate } from "./deps.ts";

/**
 * Needed to access environment variables in Node.js and Bun.
 */
declare const process: {
  env: {
    PARSEDOG_API_KEY: string;
  };
};

/**
 * Extracts data from a document using provided schema.
 *
 * The document can be url or binary content of a file.
 * Supported file types are PDF, JPEG, PNG, GIF and WEBP.
 */
export async function extractData<OutputSchema extends Schema>(params: {
  schema: OutputSchema;
  document: string;
}): Promise<Infer<OutputSchema>> {
  const { schema, document } = params;
  const res = await fetch("https://api.parsedog.io/extractData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${
        globalThis.Deno
          ? Deno.env.get("PARSEDOG_API_KEY")
          : process.env.PARSEDOG_API_KEY
      }`,
    },
    body: JSON.stringify({
      document,
      schema: JSON.stringify(await toJSONSchema(schema)),
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  const result = await validate(schema, data);
  if (!result.success) {
    throw new Error("Validation failed");
  }

  return result.data;
}
