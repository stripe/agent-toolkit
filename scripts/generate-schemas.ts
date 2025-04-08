#!/usr/bin/env node

import axios from "axios";
import z from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { program } from "commander";

interface OpenAPIParameter {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  schema: {
    type: string;
    enum?: string[];
    minimum?: number;
    maximum?: number;
    default?: any;
  };
}

interface OpenAPIRequestBody {
  required?: boolean;
  content: {
    "application/x-www-form-urlencoded": {
      schema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
      };
    };
  };
}

interface OpenAPIPath {
  get?: {
    parameters?: OpenAPIParameter[];
    description?: string;
  };
  post?: {
    requestBody?: OpenAPIRequestBody;
    description?: string;
  };
}

function generateZodSchema(
  properties: Record<string, any>,
  required: string[] = []
): string {
  let schema = "z.object({\n";

  for (const [key, value] of Object.entries(properties)) {
    const isRequired = required.includes(key);
    let zodType = "z.string()";

    if (value.type === "string") {
      if (value.enum) {
        zodType = `z.enum([${value.enum
          .map((e: string) => `'${e}'`)
          .join(", ")}])`;
      } else {
        zodType = "z.string()";
      }
    } else if (value.type === "number" || value.type === "integer") {
      zodType = "z.number()";
      if (value.minimum !== undefined) {
        zodType += `.min(${value.minimum})`;
      }
      if (value.maximum !== undefined) {
        zodType += `.max(${value.maximum})`;
      }
    } else if (value.type === "boolean") {
      zodType = "z.boolean()";
    }

    if (!isRequired) {
      zodType += ".optional()";
    }

    if (value.default !== undefined) {
      zodType += `.default(${JSON.stringify(value.default)})`;
    }

    if (value.description) {
      zodType += `.describe('${value.description.replace(/'/g, "\\'")}')`;
    }

    schema += `    ${key}: ${zodType},\n`;
  }

  schema += "  })";
  return schema;
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getResourceNameFromPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

function generatePromptString(
  resourceName: string,
  method: "create" | "list",
  properties: Record<string, any>,
  required: string[] = [],
  description?: string
): string {
  const capitalizedResource = capitalizeFirstLetter(resourceName);
  const methodStr = method === "create" ? "create" : "fetch a list of";

  let prompt = `export const ${method}${capitalizedResource}Prompt = (_context: Context = {}) => \`
This tool will ${methodStr} ${resourceName} in Stripe.
${description ? `\n${description.replace(/`/g, "\\`")}\n` : ""}
${
  Object.keys(properties).length > 0
    ? `It takes ${
        Object.keys(properties).length === 1
          ? "one argument"
          : "the following arguments"
      }:`
    : "It takes no input."
}`;

  if (Object.keys(properties).length > 0) {
    prompt += "\n";
    for (const [key, value] of Object.entries(properties)) {
      const isRequired = required.includes(key);
      const type = value.type === "integer" ? "int" : value.type;
      const escapedDescription = value.description
        ? value.description.replace(/`/g, "\\`")
        : "";
      prompt += `- ${key} (${type}${
        !isRequired ? ", optional" : ""
      }): ${escapedDescription}\n`;
    }
  }

  prompt += "`;\n";
  return prompt;
}

async function fetchExampleCode(
  path: string,
  method: "get" | "post"
): Promise<string | null> {
  try {
    const response = await axios.get(
      `https://docs.stripe.com/_endpoint/generate-example-snippet?path=${path}&verb=${method}&args=%7B%7D`
    );
    return response.data.node || null;
  } catch (error) {
    console.warn(
      `Warning: Could not fetch example code for ${method.toUpperCase()} ${path}`
    );
    return null;
  }
}

function writeToolFile(
  resourceName: string,
  schemaContent: string,
  promptContent: string,
  exampleCode: { get?: string | null; post?: string | null }
) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const fileName = `${resourceName}.tool.ts`;
  const filePath = path.join(currentDir, fileName);

  let examplesSection = "";
  if (exampleCode.get || exampleCode.post) {
    examplesSection = "\n// Example Usage\n";
    if (exampleCode.get) {
      examplesSection += "// List Example:\n";
      examplesSection += `/*\n${exampleCode.get}\n*/\n\n`;
    }
    if (exampleCode.post) {
      examplesSection += "// Create Example:\n";
      examplesSection += `/*\n${exampleCode.post}\n*/\n`;
    }
  }

  const fileContent = `// Generated Zod Schema
import { z } from 'zod';
import { Context } from '../src/types';

${schemaContent}

// Generated Prompt
${promptContent}
${examplesSection}`;

  fs.writeFileSync(filePath, fileContent);
  console.log(`Generated ${fileName}`);
}

async function main() {
  program
    .option(
      "-s, --spec <spec>",
      "OpenAPI spec url",
      "https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.sdk.json"
    )
    .requiredOption("-p, --path <path>", "API path to generate schema for")
    .parse(process.argv);

  const options = program.opts();

  try {
    const response = await axios.get(options.spec);
    const spec = response.data;

    const pathData = spec.paths[options.path] as OpenAPIPath;
    if (!pathData) {
      console.error(`Path ${options.path} not found in spec`);
      process.exit(1);
    }

    const resourceName = getResourceNameFromPath(options.path);
    let schemaContent = "";
    let promptContent = "";

    // Fetch example code for both GET and POST methods
    const exampleCode = {
      get: pathData.get ? await fetchExampleCode(options.path, "get") : null,
      post: pathData.post ? await fetchExampleCode(options.path, "post") : null,
    };

    if (pathData.post) {
      const requestBody = pathData.post.requestBody;
      if (requestBody?.content?.["application/x-www-form-urlencoded"]?.schema) {
        const schema =
          requestBody.content["application/x-www-form-urlencoded"].schema;
        schemaContent += `export const create${capitalizeFirstLetter(
          resourceName
        )}Parameters = (_context: Context = {}): z.AnyZodObject =>\n  ${generateZodSchema(
          schema.properties,
          schema.required
        )};\n\n`;
        promptContent += generatePromptString(
          resourceName,
          "create",
          schema.properties,
          schema.required,
          pathData.post.description
        );
      }
    }

    if (pathData.get) {
      const parameters = pathData.get.parameters || [];
      const properties: Record<string, any> = {};
      const required: string[] = [];

      parameters.forEach((param) => {
        if (param.in === "query") {
          properties[param.name] = {
            type: param.schema.type,
            description: param.description,
            ...(param.schema.enum && { enum: param.schema.enum }),
            ...(param.schema.minimum && { minimum: param.schema.minimum }),
            ...(param.schema.maximum && { maximum: param.schema.maximum }),
            ...(param.schema.default && { default: param.schema.default }),
          };
          if (param.required) {
            required.push(param.name);
          }
        }
      });

      schemaContent += `export const list${capitalizeFirstLetter(
        resourceName
      )}Parameters = (_context: Context = {}): z.AnyZodObject =>\n  ${generateZodSchema(
        properties,
        required
      )};\n\n`;
      promptContent += generatePromptString(
        resourceName,
        "list",
        properties,
        required,
        pathData.get.description
      );
    }

    writeToolFile(resourceName, schemaContent, promptContent, exampleCode);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }
}

main();
