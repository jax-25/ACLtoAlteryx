import { describe, it, expect } from 'vitest';
import { convertJsonToXml } from '../services/xmlConverter';
import { CanonicalWorkflow } from '../types';

const makeWorkflow = (
  nodes: CanonicalWorkflow['nodes'],
  connections: CanonicalWorkflow['connections'] = [],
  unmapped: string[] = []
): CanonicalWorkflow => ({
  workflow: { version: '1.0', source: 'ACL', schema_version: 'v1' },
  nodes,
  connections,
  unmapped_acl: unmapped,
});

describe('convertJsonToXml', () => {
  it('returns a valid YXMD document envelope', () => {
    const xml = convertJsonToXml(makeWorkflow([]));
    expect(xml).toContain('<?xml version="1.0"?>');
    expect(xml).toContain('<AlteryxDocument yxmdVer="2025.2">');
    expect(xml).toContain('<Nodes>');
    expect(xml).toContain('<Connections>');
    expect(xml).toContain('</AlteryxDocument>');
  });

  describe('Input node', () => {
    it('generates correct Input tool XML', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Input',
          acl_source: 'OPEN AP_Transactions',
          config: { table_name: 'AP_Transactions.csv' },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.InputData.InputData"');
      expect(xml).toContain('ToolID="1"');
      expect(xml).toContain('FileFormat="0"');
      expect(xml).toContain('>AP_Transactions.csv</File>');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxInputData"');
    });

    it('handles yxdb file format', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Input',
          acl_source: 'OPEN data.yxdb',
          config: { table_name: 'data.yxdb' },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('FileFormat="19"');
    });

    it('handles xlsx file format', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Input',
          acl_source: 'OPEN data.xlsx',
          config: { table_name: 'data.xlsx' },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('FileFormat="25"');
    });

    it('defaults to CSV format for unknown extensions', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Input',
          acl_source: 'OPEN data.txt',
          config: { table_name: 'data.txt' },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('FileFormat="0"');
    });

    it('defaults table_name to input.csv if missing', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Input',
          acl_source: 'OPEN',
          config: {},
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('>input.csv</File>');
    });
  });

  describe('Output node', () => {
    it('generates correct Output tool XML', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Output',
          acl_source: 'SAVE result.yxdb',
          config: { table_name: 'result.yxdb' },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.OutputData.OutputData"');
      expect(xml).toContain('FileFormat="19"');
      expect(xml).toContain('>result.yxdb</File>');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxOutputData"');
    });

    it('defaults table_name to output.yxdb if missing', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Output',
          acl_source: 'SAVE',
          config: {},
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('>output.yxdb</File>');
    });
  });

  describe('Filter node', () => {
    it('generates correct Filter tool XML', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Filter',
          acl_source: 'IF Amount >= 100000',
          config: { filter_expression: 'Amount >= 100000' },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Filter.Filter"');
      expect(xml).toContain('<Expression>Amount &gt;= 100000</Expression>');
      expect(xml).toContain('<Mode>Custom</Mode>');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxFilter"');
    });

    it('defaults filter_expression to 1=1 if missing', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Filter',
          acl_source: 'IF',
          config: {},
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('<Expression>1=1</Expression>');
    });
  });

  describe('Summarize node', () => {
    it('generates correct Summarize tool XML with group and agg fields', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Summarize',
          acl_source: 'SUMMARIZE Amount SUBTOTAL Vendor_ID',
          config: {
            group_fields: ['Vendor_ID'],
            agg_fields: [
              { field: 'Amount', action: 'Sum', rename: 'Total_Amount' },
            ],
          },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Summarize.Summarize"');
      expect(xml).toContain('field="Vendor_ID" action="GroupBy" rename="Vendor_ID"');
      expect(xml).toContain('field="Amount" action="Sum" rename="Total_Amount"');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxSummarize"');
    });

    it('handles missing agg_fields gracefully', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Summarize',
          acl_source: 'SUMMARIZE',
          config: { group_fields: ['Vendor_ID'] },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('field="Vendor_ID" action="GroupBy"');
    });

    it('auto-generates rename for agg fields when not provided', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Summarize',
          acl_source: 'SUMMARIZE',
          config: {
            group_fields: [],
            agg_fields: [{ field: 'Amount', action: 'Sum' }],
          },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('rename="Sum_Amount"');
    });
  });

  describe('Formula node', () => {
    it('generates correct Formula tool XML', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Formula',
          acl_source: 'DEFINE FIELD Inv_Year COMPUTED YEAR(Invoice_Date)',
          config: {
            formulas: [
              { field: 'Inv_Year', expression: 'YEAR(Invoice_Date)' },
            ],
          },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Formula.Formula"');
      expect(xml).toContain('expression="YEAR(Invoice_Date)"');
      expect(xml).toContain('field="Inv_Year"');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxFormula"');
    });

    it('handles multiple formulas in a single node', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Formula',
          acl_source: 'DEFINE ...',
          config: {
            formulas: [
              { field: 'A', expression: '1+1' },
              { field: 'B', expression: '2+2' },
            ],
          },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('field="A"');
      expect(xml).toContain('field="B"');
    });

    it('handles empty formulas array', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Formula',
          acl_source: 'DEFINE',
          config: { formulas: [] },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('<FormulaFields>');
      expect(xml).toContain('<DefaultAnnotationText>Formula</DefaultAnnotationText>');
    });
  });

  describe('Sort node', () => {
    it('generates correct Sort tool XML', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Sort',
          acl_source: 'SORT ON Risk_Score -Amount',
          config: {
            sort_keys: [
              { field: 'Risk_Score', order: 'Ascending' },
              { field: 'Amount', order: 'Descending' },
            ],
          },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Sort.Sort"');
      expect(xml).toContain('field="Risk_Score" order="Ascending"');
      expect(xml).toContain('field="Amount" order="Descending"');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxSort"');
    });
  });

  describe('Connections', () => {
    it('generates correct connection XML for linear workflow', () => {
      const wf = makeWorkflow(
        [
          { node_id: 'N1', schema_id: 'Input', acl_source: 'OPEN', config: { table_name: 'data.csv' } },
          { node_id: 'N2', schema_id: 'Filter', acl_source: 'IF', config: { filter_expression: 'x > 1' } },
          { node_id: 'N3', schema_id: 'Output', acl_source: 'SAVE', config: { table_name: 'out.csv' } },
        ],
        [
          { from: 'N1', to: 'N2' },
          { from: 'N2', to: 'N3' },
        ]
      );
      const xml = convertJsonToXml(wf);
      // N1 -> N2: Input -> Filter
      expect(xml).toContain('<Origin ToolID="1" Connection="Output"');
      expect(xml).toContain('<Destination ToolID="2" Connection="Input"');
      // N2 -> N3: Filter -> Output (Filter uses "True" anchor)
      expect(xml).toContain('<Origin ToolID="2" Connection="True"');
      expect(xml).toContain('<Destination ToolID="3" Connection="Input"');
    });

    it('skips connections with invalid node references', () => {
      const wf = makeWorkflow(
        [{ node_id: 'N1', schema_id: 'Input', acl_source: '', config: {} }],
        [{ from: 'N1', to: 'N99' }]
      );
      const xml = convertJsonToXml(wf);
      expect(xml).not.toContain('ToolID="99"');
    });
  });

  describe('Unknown/unmapped nodes', () => {
    it('generates a comment for unknown schema_id', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Unknown',
          acl_source: 'SOME COMMAND',
          config: {},
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('<!-- UNMAPPED NODE: Unknown');
    });
  });

  describe('XML escaping', () => {
    it('escapes special characters in file names', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Input',
          acl_source: '',
          config: { table_name: 'data<file>&"name\'.csv' },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('data&lt;file&gt;&amp;&quot;name&apos;.csv');
    });

    it('escapes special characters in filter expressions', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Filter',
          acl_source: '',
          config: { filter_expression: 'A > 1 & B < 2' },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('A &gt; 1 &amp; B &lt; 2');
    });
  });

  describe('Join node', () => {
    it('generates correct Join tool XML', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Join',
          acl_source: 'JOIN PKEY Vendor_ID SKEY Vendor_ID',
          config: {
            join_fields: [
              { left: 'Vendor_ID', right: 'Vendor_ID' },
            ],
          },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Join.Join"');
      expect(xml).toContain('LeftField="Vendor_ID"');
      expect(xml).toContain('RightField="Vendor_ID"');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxJoin"');
    });

    it('handles multiple join fields', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Join',
          acl_source: 'JOIN ...',
          config: {
            join_fields: [
              { left: 'Vendor_ID', right: 'VendorID' },
              { left: 'Date', right: 'InvoiceDate' },
            ],
          },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('LeftField="Vendor_ID" RightField="VendorID"');
      expect(xml).toContain('LeftField="Date" RightField="InvoiceDate"');
    });
  });

  describe('Select node', () => {
    it('generates correct Select tool XML', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Select',
          acl_source: 'EXTRACT FIELDS Vendor_ID Amount',
          config: {
            select_fields: [
              { field: 'Vendor_ID', selected: true },
              { field: 'Amount', selected: true },
            ],
          },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.AlteryxSelect.AlteryxSelect"');
      expect(xml).toContain('field="Vendor_ID" selected="True"');
      expect(xml).toContain('field="Amount" selected="True"');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxSelect"');
    });
  });

  describe('Sample node', () => {
    it('generates correct Sample tool XML', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Sample',
          acl_source: 'SAMPLE 100',
          config: { n: 100, method: 'First' },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Sample.Sample"');
      expect(xml).toContain('<N>100</N>');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxSample"');
    });
  });

  describe('Unique node', () => {
    it('generates correct Unique tool XML', () => {
      const wf = makeWorkflow([
        {
          node_id: 'N1',
          schema_id: 'Unique',
          acl_source: 'DUPLICATES ON Vendor_ID',
          config: {
            unique_fields: ['Vendor_ID', 'Invoice_Num'],
          },
        },
      ]);
      const xml = convertJsonToXml(wf);
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Unique.Unique"');
      expect(xml).toContain('field="Vendor_ID"');
      expect(xml).toContain('field="Invoice_Num"');
      expect(xml).toContain('EngineDllEntryPoint="AlteryxUnique"');
    });
  });
});
