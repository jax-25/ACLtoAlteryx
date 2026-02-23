
import { GoogleGenAI } from "@google/genai";
import { SchemaField } from "../types";

const SCHEMA_INFERENCE_SYSTEM_INSTRUCTION = `
You are a highly skilled data analyst specializing in Alteryx.
Your task is to analyze a raw CSV text sample and infer its schema.
Respond with a JSON array where each object contains a "name" and a "type".
The "type" MUST be a valid Alteryx data type.

Common Alteryx Data Types:
- V_WString: Variable-length wide string (for most text).
- V_String: Variable-length narrow string.
- Int64: 64-bit integer (for whole numbers).
- Double: Double-precision floating-point number (for decimals).
- Date: YYYY-MM-DD.
- DateTime: YYYY-MM-DD HH:MM:SS.

RULES:
1. Analyze the first few rows to determine the most appropriate data type.
2. If a column contains mixed types (e.g., numbers and text), default to V_WString.
3. Clean the column names: remove quotes, trim whitespace.
4. Your response MUST be only the raw JSON array, nothing else.

Example Input:
"Vendor ID","Invoice Date","Amount"
"V-1001","2023-01-15","150.75"
"V-1002","2023-01-16","2,345.00"

Example Output:
[
  {"name": "Vendor_ID", "type": "V_WString"},
  {"name": "Invoice_Date", "type": "Date"},
  {"name": "Amount", "type": "Double"}
]
`;

const ACL_TO_CANONICAL_JSON_SYSTEM_INSTRUCTION = `
You are an AI assistant embedded inside an app that converts ACL analytics code into a canonical JSON representation of an Alteryx-style workflow.
Your output is not the final XML.
Your only job is to:
Read ACL code.
Identify workflow nodes/tools and their relationships.
Emit canonical JSON that matches a strict envelope and per-node structure so that downstream code can safely convert it to XML (.yxmd) without using an LLM.

1. Overall Envelope You Must Always Return
You must always return JSON with this exact high-level structure:
{
  "workflow": {
    "version": "1.0",
    "source": "ACL",
    "schema_version": "v1"
  },
  "nodes": [],
  "connections": [],
  "unmapped_acl": []
}
Do not change the top-level keys. Do not add additional top-level keys. If there are no connections or unmapped ACL lines, return empty arrays.

2. Node-Level Structure
Each entry in nodes must follow this structure:
{
  "node_id": "N1",
  "schema_id": "Input",
  "acl_source": "...",
  "config": {}
}
- node_id: Must be unique per node (e.g., "N1", "N2").
- schema_id: Must be one of: "Input", "Output", "Filter", "Summarize", "Sort", "Formula".
- acl_source: The raw ACL line(s) this node represents.
- config: Node-specific settings.

3. Specific Node Schema Examples

- Input:
  "schema_id": "Input",
  "config": { "table_name": "AP_Transactions" }

- Output:
  "schema_id": "Output",
  "config": { "table_name": "final_summary.yxdb" }

- Filter:
  "schema_id": "Filter",
  "config": { "filter_expression": "Amount >= 100000" }

- Summarize:
  - IMPORTANT RULE: If the ACL command includes 'SUBTOTAL', the action in 'agg_fields' MUST be 'Sum'.
  "schema_id": "Summarize",
  "config": {
    "group_fields": ["Vendor_ID"],
    "agg_fields": [
      { "field": "Amount", "action": "Sum", "rename": "Total_Amount" }
    ]
  }

- Formula:
  - Group multiple consecutive 'DEFINE FIELD ... COMPUTED' statements into a single Formula node.
  "schema_id": "Formula",
  "config": {
    "formulas": [
      { "field": "Inv_Year", "expression": "YEAR(Invoice_Date)" },
      { "field": "High_Value", "expression": "IF(Amount >= 100000, 1, 0)" }
    ]
  }

- Sort:
  - A leading '-' on a field name in ACL (e.g., -Amount) indicates 'Descending' order.
  "schema_id": "Sort",
  "config": {
    "sort_keys": [
      { "field": "Risk_Score", "order": "Ascending" },
      { "field": "Amount", "order": "Descending" }
    ],
    "output_table": "AP_Sorted_RiskScore"
  }

4. Connections Between Nodes
If one step depends on another, create a connection object using the node_ids. If the order is linear, chain them sequentially.
"connections": [ { "from": "N1", "to": "N2" } ]

5. Handling Unmapped ACL
If you cannot confidently map an ACL line, add it to the 'unmapped_acl' array.

6. Output Format Rules
Output only valid JSON. No comments. No extra text. All strings must use double quotes. No trailing commas. If you cannot parse the ACL, return a valid envelope with empty arrays and an explanation in 'unmapped_acl'.

7. What You Must NOT Do
- Do not output XML.
- Do not invent new top-level JSON keys or schema_ids.
- Do not summarize the script; be a structured translator.
`;


const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

const MAX_ACL_INPUT_SIZE = 500_000; // ~500KB of ACL text

export const getSchemaFromSample = async (csvContent: string): Promise<SchemaField[]> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `COMMAND: ANALYZE AND INFER SCHEMA. CSV DATA:\n\n${csvContent}`,
      config: {
        systemInstruction: SCHEMA_INFERENCE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.0,
      },
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from schema inference.");
    
    const schema = JSON.parse(text);
    if (!Array.isArray(schema)) {
      throw new Error("Schema inference returned non-array: expected [{name, type}, ...].");
    }
    return schema;

  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Gemini Schema Inference Error:", error);
    throw new Error(`Failed to infer schema from sample data: ${detail}`);
  }
};

export const parseAclToCanonicalJson = async (
  aclText: string,
  fileName: string,
  schemas: Record<string, SchemaField[] | null>
): Promise<string> => {
  try {
    if (aclText.length > MAX_ACL_INPUT_SIZE) {
      throw new Error(
        `ACL script is too large (${(aclText.length / 1024).toFixed(0)} KB). ` +
        `Maximum supported size is ${(MAX_ACL_INPUT_SIZE / 1024).toFixed(0)} KB. ` +
        `Consider splitting the script into smaller modules.`
      );
    }

    const ai = getClient();

    const schemaText = Object.entries(schemas)
      .map(([fileName, columns]) => {
        if (columns) {
          const columnDefs = columns.map(c => `${c.name} (${c.type})`).join(', ');
          return `- Input table "${fileName}" has columns: [${columnDefs}]`;
        }
        return `- Input table "${fileName}" schema is not provided.`;
      })
      .join('\n');

    const prompt = `
    COMMAND: PARSE THIS SCRIPT TEXT INTO THE CANONICAL JSON WORKFLOW FORMAT.

    CONTEXT:
    The user has provided the following data sources and schemas:
    ${schemaText}
    
    METADATA:
    Main Script Filename: ${fileName}
    
    --- START OF SCRIPT SOURCE ---
    ${aclText}
    --- END OF SCRIPT SOURCE ---
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: ACL_TO_CANONICAL_JSON_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from canonical JSON generation step.");

    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.connections)) {
      throw new Error(
        "LLM response is not a valid canonical workflow. " +
        'Expected {nodes: [], connections: [], ...}.'
      );
    }

    return text;
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Gemini Canonical JSON Parsing Error:", error);
    throw new Error(`Failed to parse script "${fileName}" into Canonical JSON: ${detail}`);
  }
};
