
import { GoogleGenAI } from "@google/genai";

const ALTERYX_JSON_SYSTEM_INSTRUCTION = `
You are an expert Alteryx Workflow Architect. 
Your task is to parse raw ACL (Audit Command Language) or Script Text into a structured **Alteryx JSON Intermediate Representation (IR)**.

**Goal:** 
Map linear script logic into a Directed Acyclic Graph (DAG) of Alteryx Tools.

**Mapping Logic:**
1. **INPUT/OPEN** -> \`InputData\` Tool
2. **EXTRACT/FILTER IF** -> \`Filter\` Tool
3. **SUMMARIZE ON** -> \`Summarize\` Tool
4. **SORT ON** -> \`Sort\` Tool
5. **DEFINE FIELD** -> \`Formula\` Tool
6. **JOIN** -> \`Join\` Tool
7. **OUTPUT** -> \`OutputData\` Tool

**CRITICAL SYNTAX RULES (MUST FOLLOW):**
1. **Formula Syntax**: You MUST use Alteryx specific syntax.
   - ✅ CORRECT: \`IF [Amount] > 1000 THEN "High" ELSE "Low" ENDIF\`
   - ❌ INCORRECT: \`IF([Amount] > 1000, "High", "Low")\` (Do NOT use Excel style)
   - ✅ CORRECT: \`DateTimeYear(DateTimeParse([Date_String], "%Y-%m-%d"))\` (Parse CSV strings before using Date functions)
   
2. **Data Types**: 
   - CSV inputs are Strings by default. If performing math, wrap in \`ToNumber([Field])\`.
   - If performing Date logic on CSV inputs, wrap in \`DateTimeParse([Field], "%Y-%m-%d")\`.

**Required JSON Output Schema:**
{
  "workflowName": "string",
  "nodes": [
    {
      "id": number,
      "toolType": "InputData" | "Filter" | "Summarize" | "Sort" | "Formula" | "Join" | "Select" | "OutputData",
      "configuration": {
        // Tool specific props
        "fileName": "string (for inputs)",
        "fileFormat": "string (e.g. 'csv', 'yxdb')", 
        "expression": "string (for filters/formulas - USE STRICT ALTERYX SYNTAX)",
        "summaries": [ { "field": "string", "action": "GroupBy|Sum|Count" } ],
        "sortFields": [ { "field": "string", "order": "Asc|Desc" } ],
        "formulas": [ { "field": "string", "expression": "string", "type": "string (e.g. Int64, V_WString)" } ]
      },
      "annotation": "string (Short description of step)"
    }
  ],
  "connections": [
    { 
      "fromId": number, 
      "toId": number, 
      "fromAnchor": "Output" | "True" | "False" | "Left" | "Right" | "Join", 
      "toAnchor": "Input" | "Left" | "Right" 
    }
  ]
}
`;

const ALTERYX_XML_SYSTEM_INSTRUCTION = `
You are an Alteryx XML Engine. 
Your input is a **JSON Plan** representing an Alteryx Workflow.
Your task is to convert this JSON plan into a valid **Alteryx .yxmd XML** document.

**STRICT OUTPUT RULES:**
1. Root Element: \`<AlteryxDocument yxmdVer="2023.1">\`
2. Structure:
   \`\`\`xml
   <AlteryxDocument>
     <Nodes>
       <!-- Tool definitions -->
     </Nodes>
     <Connections>
       <!-- Wires -->
     </Connections>
   </AlteryxDocument>
   \`\`\`

**FILE FORMATTING RULES (Crucial for Execution):**
- **CSV Files**: Use \`FileFormat="0"\`. Example: \`<File FileFormat="0">data.csv</File>\`
- **YXDB Files**: Use \`FileFormat="19"\`. Example: \`<File FileFormat="19">output.yxdb</File>\`
- **XLSX Files**: Use \`FileFormat="25"\`.
- DO NOT use generic tags like \`<FileType>Abcd</FileType>\`. Rely on the \`FileFormat\` attribute inside \`<File>\`.

**PLUGIN MAPPINGS:**
- InputData: \`Plugin="AlteryxBasePluginsGui.InputData.InputData"\`
- Filter: \`Plugin="AlteryxBasePluginsGui.Filter.Filter"\`
- Summarize: \`Plugin="AlteryxBasePluginsGui.Summarize.Summarize"\`
- Sort: \`Plugin="AlteryxBasePluginsGui.Sort.Sort"\`
- Formula: \`Plugin="AlteryxBasePluginsGui.Formula.Formula"\`
- Join: \`Plugin="AlteryxBasePluginsGui.Join.Join"\`
- OutputData: \`Plugin="AlteryxBasePluginsGui.OutputData.OutputData"\`

**XML TEMPLATE EXAMPLES:**

*Formula Tool (Strict Syntax):*
\`\`\`xml
<Node ToolID="5">
  <GuiSettings Plugin="AlteryxBasePluginsGui.Formula.Formula">
    <Position x="354" y="54" />
  </GuiSettings>
  <Properties>
    <Configuration>
      <FormulaFields>
        <FormulaField field="Risk_Score" type="Int64" size="8" expression="([High_Value] * 2) + IF [Days] > 10 THEN 1 ELSE 0 ENDIF" />
      </FormulaFields>
    </Configuration>
  </Properties>
</Node>
\`\`\`

*Input Tool (CSV):*
\`\`\`xml
<Node ToolID="1">
  <GuiSettings Plugin="AlteryxBasePluginsGui.InputData.InputData">
    <Position x="54" y="54" />
  </GuiSettings>
  <Properties>
    <Configuration>
      <File FileFormat="0">transactions.csv</File>
      <FormatSpecificOptions>
        <HeaderRow>True</HeaderRow>
      </FormatSpecificOptions>
    </Configuration>
  </Properties>
</Node>
\`\`\`

**Return ONLY raw XML string. No Markdown blocks.**
`;

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseAclToJson = async (aclText: string, fileName: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // Explicit prompt construction as requested
    const prompt = `
    COMMAND: PARSE THIS ACL TEXT INTO ALTERYX WORKFLOW JSON (NODES & CONNECTIONS).
    
    METADATA:
    Filename: ${fileName}
    
    --- START OF ACL SOURCE ---
    ${aclText}
    --- END OF ACL SOURCE ---
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: ALTERYX_JSON_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1, // Low temperature for deterministic graph generation
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from JSON generation step.");
    return text;
  } catch (error) {
    console.error("Gemini JSON Parsing Error:", error);
    throw new Error("Failed to parse ACL into Alteryx Graph.");
  }
};

export const generateAclXml = async (jsonPlan: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
      COMMAND: CONVERT THIS JSON GRAPH INTO ALTERYX .YXMD XML.
      
      Current JSON Plan:
      ${jsonPlan}
      `,
      config: {
        systemInstruction: ALTERYX_XML_SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    let text = response.text;
    if (!text) throw new Error("Empty response from XML generation step.");
    
    // Cleanup any potential markdown leakage
    text = text.replace(/```xml/g, '').replace(/```/g, '').trim();
    
    // Ensure XML Header exists
    if (!text.startsWith('<?xml')) {
       text = `<?xml version="1.0"?>\n${text}`;
    }
    
    return text;
  } catch (error) {
    console.error("Gemini XML Conversion Error:", error);
    throw new Error("Failed to convert Alteryx Plan to XML.");
  }
};
