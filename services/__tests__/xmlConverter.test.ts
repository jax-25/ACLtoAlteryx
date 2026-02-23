import { describe, it, expect } from 'vitest';
import { convertJsonToXml } from '../xmlConverter';
import { CanonicalWorkflow } from '../../types';

const makeWorkflow = (overrides: Partial<CanonicalWorkflow> = {}): CanonicalWorkflow => ({
  workflow: { version: '1.0', source: 'ACL', schema_version: 'v1' },
  nodes: [],
  connections: [],
  unmapped_acl: [],
  ...overrides,
});

describe('convertJsonToXml', () => {
  it('produces valid XML envelope for an empty workflow', () => {
    const xml = convertJsonToXml(makeWorkflow());
    expect(xml).toContain('<?xml version="1.0"?>');
    expect(xml).toContain('<AlteryxDocument');
    expect(xml).toContain('<Nodes>');
    expect(xml).toContain('<Connections>');
  });

  it('throws on null input with actionable message', () => {
    expect(() => convertJsonToXml(null as any)).toThrow(/Invalid workflow/);
  });

  it('throws on missing nodes array with descriptive context', () => {
    expect(() => convertJsonToXml({ nodes: 'bad' } as any)).toThrow(/nodes.*connections/);
  });

  it('throws on node missing node_id', () => {
    const wf = makeWorkflow({
      nodes: [{ node_id: '', schema_id: 'Input', acl_source: '', config: {} }],
    });
    expect(() => convertJsonToXml(wf)).toThrow(/Invalid node at index 0/);
  });

  it('renders an Input node', () => {
    const wf = makeWorkflow({
      nodes: [{ node_id: 'N1', schema_id: 'Input', acl_source: 'OPEN data.csv', config: { table_name: 'data.csv' } }],
    });
    const xml = convertJsonToXml(wf);
    expect(xml).toContain('ToolID="1"');
    expect(xml).toContain('InputData');
    expect(xml).toContain('data.csv');
  });

  it('renders a Filter node with connection anchor "True"', () => {
    const wf = makeWorkflow({
      nodes: [
        { node_id: 'N1', schema_id: 'Input', acl_source: '', config: { table_name: 'a.csv' } },
        { node_id: 'N2', schema_id: 'Filter', acl_source: '', config: { filter_expression: 'Amount > 100' } },
      ],
      connections: [{ from: 'N1', to: 'N2' }],
    });
    const xml = convertJsonToXml(wf);
    expect(xml).toContain('Connection="Output"');
  });

  it('uses "True" anchor when the source node is a Filter', () => {
    const wf = makeWorkflow({
      nodes: [
        { node_id: 'N1', schema_id: 'Filter', acl_source: '', config: { filter_expression: 'X > 1' } },
        { node_id: 'N2', schema_id: 'Output', acl_source: '', config: { table_name: 'out.yxdb' } },
      ],
      connections: [{ from: 'N1', to: 'N2' }],
    });
    const xml = convertJsonToXml(wf);
    expect(xml).toContain('Connection="True"');
  });

  it('escapes XML-special characters in Summarize field names', () => {
    const wf = makeWorkflow({
      nodes: [{
        node_id: 'N1', schema_id: 'Summarize', acl_source: '', config: {
          group_fields: ['A&B'],
          agg_fields: [{ field: '<Total>', action: 'Sum', rename: 'Sum_<Total>' }],
        },
      }],
    });
    const xml = convertJsonToXml(wf);
    expect(xml).toContain('A&amp;B');
    expect(xml).toContain('&lt;Total&gt;');
    expect(xml).toContain('Sum_&lt;Total&gt;');
  });

  it('escapes XML-special characters in Sort field names', () => {
    const wf = makeWorkflow({
      nodes: [{
        node_id: 'N1', schema_id: 'Sort', acl_source: '', config: {
          sort_keys: [{ field: 'A"B', order: 'Ascending' }],
        },
      }],
    });
    const xml = convertJsonToXml(wf);
    expect(xml).toContain('A&quot;B');
  });

  it('skips connections referencing non-existent nodes with a warning', () => {
    const wf = makeWorkflow({
      nodes: [{ node_id: 'N1', schema_id: 'Input', acl_source: '', config: {} }],
      connections: [{ from: 'N1', to: 'N99' }],
    });
    const xml = convertJsonToXml(wf);
    // Should not crash; the dangling connection is skipped
    expect(xml).toContain('<Connections>');
    expect(xml).not.toContain('ToolID="99"');
  });

  it('renders a multi-node linear workflow deterministically', () => {
    const wf = makeWorkflow({
      nodes: [
        { node_id: 'N1', schema_id: 'Input', acl_source: '', config: { table_name: 'in.csv' } },
        { node_id: 'N2', schema_id: 'Formula', acl_source: '', config: { formulas: [{ field: 'X', expression: '1+1' }] } },
        { node_id: 'N3', schema_id: 'Output', acl_source: '', config: { table_name: 'out.yxdb' } },
      ],
      connections: [{ from: 'N1', to: 'N2' }, { from: 'N2', to: 'N3' }],
    });
    const xml1 = convertJsonToXml(wf);
    const xml2 = convertJsonToXml(wf);
    expect(xml1).toBe(xml2);
  });
});
