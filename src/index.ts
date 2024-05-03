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
 * @param schema - The schema used to extract data from the document.
 * @param document - The document from which to extract data. Can be URL or binary content of the file. Accepts PDF, PNG, JPEG, GIF and WEBP.
 * @returns A promise that resolves to the extracted data.
 * @throws If the extraction fails or the extracted data does not match the schema.
 */
export async function extractData<OutputSchema extends Schema>(
  schema: OutputSchema,
  document: string
): Promise<Infer<OutputSchema>> {
  const res = await fetch("http://api.parsedog.io/v0/extractData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${
        "Deno" in window
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
