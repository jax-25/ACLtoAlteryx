
import { CanonicalWorkflow, CanonicalNode } from '../types';

const escapeXml = (unsafe: string): string => {
  if (typeof unsafe !== 'string') {
    return '';
  }
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};


const getFileFormat = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'csv': return '0';
    case 'yxdb': return '19';
    case 'xlsx': return '25';
    default: return '0'; // Default to CSV
  }
};

const createInputXml = (node: CanonicalNode, index: number): string => {
  const xPos = 54 + index * 150;
  const fileName = node.config.table_name || 'input.csv';
  const fileFormat = getFileFormat(fileName);
  const escapedFileName = escapeXml(fileName);

  return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.InputData.InputData">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <File FileFormat="${fileFormat}">${escapedFileName}</File>
          <FormatSpecificOptions>
            <HeaderRow>True</HeaderRow>
            <FieldLen>254</FieldLen>
            <Delimeter>,</Delimeter>
            <IgnoreQuotes>DoubleQuotes</IgnoreQuotes>
          </FormatSpecificOptions>
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText>${escapedFileName}</DefaultAnnotationText>
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxInputData" />
    </Node>`;
};

const createOutputXml = (node: CanonicalNode, index: number): string => {
  const xPos = 54 + index * 150;
  const fileName = node.config.table_name || 'output.yxdb';
  const fileFormat = getFileFormat(fileName);
  const escapedFileName = escapeXml(fileName);

  return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.OutputData.OutputData">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <File FileFormat="${fileFormat}">${escapedFileName}</File>
          <FormatSpecificOptions>
            <PreserveFormat>True</PreserveFormat>
            <SingleFile>True</SingleFile>
          </FormatSpecificOptions>
          <MultiFile value="False" />
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText>${escapedFileName}</DefaultAnnotationText>
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxOutputData" />
    </Node>`;
};

const createFilterXml = (node: CanonicalNode, index: number): string => {
    const xPos = 54 + index * 150;
    const expression = node.config.filter_expression || '1=1';
    const escapedExpression = escapeXml(expression);
    return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.Filter.Filter">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <Expression>${escapedExpression}</Expression>
          <Mode>Custom</Mode>
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText>${escapedExpression}</DefaultAnnotationText>
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxFilter" />
    </Node>`;
}

const createSummarizeXml = (node: CanonicalNode, index: number): string => {
  const xPos = 54 + index * 150;
  const summarizeFields = (node.config.agg_fields || [])
    .map((f: any) => `<SummarizeField field="${escapeXml(f.field)}" action="${escapeXml(f.action)}" rename="${escapeXml(f.rename || `${f.action}_${f.field}`)}" />`)
    .join('\n');
  const groupByFields = (node.config.group_fields || [])
    .map((f: any) => `<SummarizeField field="${escapeXml(f)}" action="GroupBy" rename="${escapeXml(f)}" />`)
    .join('\n');

  return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.Summarize.Summarize">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <SummarizeFields>
            ${groupByFields}
            ${summarizeFields}
          </SummarizeFields>
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText />
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxSummarize" />
    </Node>`;
}

const createFormulaXml = (node: CanonicalNode, index: number): string => {
    const xPos = 54 + index * 150;
    const formulaFields = (node.config.formulas || [])
      .map((f: any) => `<FormulaField expression="${escapeXml(f.expression)}" field="${f.field}" size="1073741823" type="V_WString" />`)
      .join('\n');
    
    const annotationText = (node.config.formulas && node.config.formulas[0])
      ? escapeXml(`${node.config.formulas[0].field} = ${node.config.formulas[0].expression}`)
      : 'Formula';
  
    return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.Formula.Formula">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <FormulaFields>
            ${formulaFields}
          </FormulaFields>
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText>${annotationText}</DefaultAnnotationText>
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxFormula" />
    </Node>`;
}

const createSortXml = (node: CanonicalNode, index: number): string => {
    const xPos = 54 + index * 150;
    const sortFields = (node.config.sort_keys || [])
      .map((f: any) => `<Field field="${escapeXml(f.field)}" order="${escapeXml(f.order)}" />`)
      .join('\n');
  
    return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.Sort.Sort">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <SortInfo>
            ${sortFields}
          </SortInfo>
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText />
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxSort" />
    </Node>`;
}


const createNodeXml = (node: CanonicalNode, index: number): string => {
  switch (node.schema_id) {
    case 'Input':
      return createInputXml(node, index);
    case 'Output':
      return createOutputXml(node, index);
    case 'Filter':
      return createFilterXml(node, index);
    case 'Summarize':
      return createSummarizeXml(node, index);
    case 'Formula':
      return createFormulaXml(node, index);
    case 'Sort':
      return createSortXml(node, index);
    default:
      console.warn(`Unknown schema_id: ${node.schema_id}. No XML will be generated for this node.`);
      return `<!-- UNMAPPED NODE: ${node.schema_id} - ${escapeXml(node.acl_source)} -->`;
  }
};

export const convertJsonToXml = (workflow: CanonicalWorkflow): string => {
  if (!workflow || !Array.isArray(workflow.nodes) || !Array.isArray(workflow.connections)) {
    throw new Error(
      'Invalid workflow: expected an object with "nodes" and "connections" arrays. ' +
      'Received: ' + (workflow ? `nodes=${typeof workflow.nodes}, connections=${typeof workflow.connections}` : 'null/undefined')
    );
  }

  const nodeMap = new Map<string, number>();
  const schemaMap = new Map<string, string>();
  workflow.nodes.forEach((node, index) => {
    if (!node.node_id || !node.schema_id) {
      throw new Error(
        `Invalid node at index ${index}: missing required "node_id" or "schema_id". ` +
        `Got node_id="${node.node_id}", schema_id="${node.schema_id}".`
      );
    }
    nodeMap.set(node.node_id, index + 1);
    schemaMap.set(node.node_id, node.schema_id);
  });

  const nodesXml = workflow.nodes
    .map((node, index) => createNodeXml(node, index))
    .join('\n');

  const connectionsXml = workflow.connections
    .map(conn => {
        const fromToolID = nodeMap.get(conn.from);
        const toToolID = nodeMap.get(conn.to);
        if (fromToolID === undefined || toToolID === undefined) {
          console.warn(
            `Skipping connection: "${conn.from}" -> "${conn.to}". ` +
            `${fromToolID === undefined ? `Source node "${conn.from}" not found.` : ''} ` +
            `${toToolID === undefined ? `Destination node "${conn.to}" not found.` : ''}`
          );
          return '';
        }

        const fromAnchor = schemaMap.get(conn.from) === 'Filter' ? 'True' : 'Output';

        return `
    <Connection>
      <Origin ToolID="${fromToolID}" Connection="${fromAnchor}" />
      <Destination ToolID="${toToolID}" Connection="Input" />
    </Connection>`;
    })
    .join('\n');

  return `<?xml version="1.0"?>
<AlteryxDocument yxmdVer="2025.2">
  <Nodes>
    ${nodesXml}
  </Nodes>
  <Connections>
    ${connectionsXml}
  </Connections>
  <Properties>
    <Memory default="True" />
    <GlobalRecordLimit value="0" />
    <TempFiles default="True" />
    <Annotation on="True" includeToolName="False" />
    <ConvErrorLimit value="10" />
    <ConvErrorLimit_Stop value="False" />
    <CancelOnError value="False" />
    <DisableBrowse value="False" />
    <EnablePerformanceProfiling value="False" />
    <PredictiveToolsCodePage value="1252" />
    <DisableAllOutput value="False" />
    <ShowAllMacroMessages value="False" />
    <ShowConnectionStatusIsOn value="True" />
    <ShowConnectionStatusOnlyWhenRunning value="True" />
    <ZoomLevel value="0" />
    <LayoutType>Horizontal</LayoutType>
    <MetaInfo>
      <NameIsFileName value="True" />
      <Description />
      <RootToolName />
      <ToolVersion />
      <ToolInDb value="False" />
      <CategoryName />
      <SearchTags />
      <Author>Workflow Migrator</Author>
      <Company />
      <Copyright />
    </MetaInfo>
    <Events>
      <Enabled value="True" />
    </Events>
  </Properties>
</AlteryxDocument>`;
};
