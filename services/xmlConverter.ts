
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
    .map((f: any) => `<SummarizeField field="${f.field}" action="${f.action}" rename="${f.rename || `${f.action}_${f.field}`}" />`)
    .join('\n');
  const groupByFields = (node.config.group_fields || [])
    .map((f: any) => `<SummarizeField field="${f}" action="GroupBy" rename="${f}" />`)
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
      .map((f: any) => `<Field field="${f.field}" order="${f.order}" />`)
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


const createJoinXml = (node: CanonicalNode, index: number): string => {
    const xPos = 54 + index * 150;
    const joinFields = (node.config.join_fields || [])
      .map((f: any) => `<Field LeftField="${f.left}" RightField="${f.right}" />`)
      .join('\n');

    return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.Join.Join">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <JoinInfo>
            ${joinFields}
          </JoinInfo>
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText />
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxJoin" />
    </Node>`;
}

const createSelectXml = (node: CanonicalNode, index: number): string => {
    const xPos = 54 + index * 150;
    const selectFields = (node.config.select_fields || [])
      .map((f: any) => `<SelectField field="${f.field}" selected="${f.selected ? 'True' : 'False'}" />`)
      .join('\n');

    return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.AlteryxSelect.AlteryxSelect">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <SelectFields>
            ${selectFields}
          </SelectFields>
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText />
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxSelect" />
    </Node>`;
}

const createSampleXml = (node: CanonicalNode, index: number): string => {
    const xPos = 54 + index * 150;
    const n = node.config.n || 1;
    const method = node.config.method || 'First';

    return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.Sample.Sample">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <Mode>${method}</Mode>
          <N>${n}</N>
          <GroupFields orderChanged="False" />
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText>${method} ${n} rows</DefaultAnnotationText>
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxSample" />
    </Node>`;
}

const createUniqueXml = (node: CanonicalNode, index: number): string => {
    const xPos = 54 + index * 150;
    const uniqueFields = (node.config.unique_fields || [])
      .map((f: string) => `<Field field="${f}" />`)
      .join('\n');

    return `
    <Node ToolID="${index + 1}">
      <GuiSettings Plugin="AlteryxBasePluginsGui.Unique.Unique">
        <Position x="${xPos}" y="54" />
      </GuiSettings>
      <Properties>
        <Configuration>
          <UniqueFields>
            ${uniqueFields}
          </UniqueFields>
        </Configuration>
        <Annotation DisplayMode="0">
          <Name />
          <DefaultAnnotationText />
          <Left value="False" />
        </Annotation>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" EngineDllEntryPoint="AlteryxUnique" />
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
    case 'Join':
      return createJoinXml(node, index);
    case 'Select':
      return createSelectXml(node, index);
    case 'Sample':
      return createSampleXml(node, index);
    case 'Unique':
      return createUniqueXml(node, index);
    default:
      console.warn(`Unknown schema_id: ${node.schema_id}. No XML will be generated for this node.`);
      return `<!-- UNMAPPED NODE: ${node.schema_id} - ${escapeXml(node.acl_source)} -->`;
  }
};

export const convertJsonToXml = (workflow: CanonicalWorkflow): string => {
  const nodeMap = new Map<string, number>();
  workflow.nodes.forEach((node, index) => {
    nodeMap.set(node.node_id, index + 1);
  });

  const nodesXml = workflow.nodes
    .map((node, index) => createNodeXml(node, index))
    .join('\n');

  const connectionsXml = workflow.connections
    .map(conn => {
        const fromToolID = nodeMap.get(conn.from);
        const toToolID = nodeMap.get(conn.to);
        if (!fromToolID || !toToolID) return '';
        
        const fromNode = workflow.nodes.find(n => n.node_id === conn.from);
        let fromAnchor = 'Output';
        if (fromNode?.schema_id === 'Filter') fromAnchor = 'True';
        else if (fromNode?.schema_id === 'Join') fromAnchor = 'Join';
        else if (fromNode?.schema_id === 'Unique') fromAnchor = 'Unique';

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
