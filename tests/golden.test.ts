import { describe, it, expect } from 'vitest';
import { convertJsonToXml } from '../services/xmlConverter';
import { CanonicalWorkflow } from '../types';
import apFixture from './fixtures/ap_high_value_vendors.json';
import joinFixture from './fixtures/join_dedup_sample.json';

describe('Golden tests – end-to-end YXMD generation', () => {
  describe('AP High-Value Vendors workflow', () => {
    const xml = convertJsonToXml(apFixture as CanonicalWorkflow);

    it('produces valid XML envelope', () => {
      expect(xml).toContain('<?xml version="1.0"?>');
      expect(xml).toContain('<AlteryxDocument yxmdVer="2025.2">');
    });

    it('contains all 6 nodes', () => {
      expect(xml).toContain('ToolID="1"');
      expect(xml).toContain('ToolID="2"');
      expect(xml).toContain('ToolID="3"');
      expect(xml).toContain('ToolID="4"');
      expect(xml).toContain('ToolID="5"');
      expect(xml).toContain('ToolID="6"');
    });

    it('has correct tool plugins in order', () => {
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.InputData.InputData"');
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Formula.Formula"');
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Filter.Filter"');
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Summarize.Summarize"');
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Sort.Sort"');
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.OutputData.OutputData"');
    });

    it('has 5 connections forming a linear chain', () => {
      // N1(Input) -> N2(Formula)
      expect(xml).toContain('<Origin ToolID="1" Connection="Output"');
      expect(xml).toContain('<Destination ToolID="2" Connection="Input"');
      // N2(Formula) -> N3(Filter)
      expect(xml).toContain('<Origin ToolID="2" Connection="Output"');
      expect(xml).toContain('<Destination ToolID="3" Connection="Input"');
      // N3(Filter) -> N4(Summarize)  uses "True" anchor
      expect(xml).toContain('<Origin ToolID="3" Connection="True"');
      expect(xml).toContain('<Destination ToolID="4" Connection="Input"');
      // N4(Summarize) -> N5(Sort)
      expect(xml).toContain('<Origin ToolID="4" Connection="Output"');
      expect(xml).toContain('<Destination ToolID="5" Connection="Input"');
      // N5(Sort) -> N6(Output)
      expect(xml).toContain('<Origin ToolID="5" Connection="Output"');
      expect(xml).toContain('<Destination ToolID="6" Connection="Input"');
    });

    it('contains specific configuration values', () => {
      expect(xml).toContain('>AP_Transactions.csv</File>');
      expect(xml).toContain('expression="YEAR(Invoice_Date)"');
      expect(xml).toContain('<Expression>Amount &gt;= 100000</Expression>');
      expect(xml).toContain('field="Amount" action="Sum" rename="Total_Amount"');
      expect(xml).toContain('field="Total_Amount" order="Descending"');
      expect(xml).toContain('>high_value_vendors.yxdb</File>');
    });
  });

  describe('Join + Dedup + Sample workflow', () => {
    const xml = convertJsonToXml(joinFixture as CanonicalWorkflow);

    it('produces valid XML envelope', () => {
      expect(xml).toContain('<?xml version="1.0"?>');
      expect(xml).toContain('<AlteryxDocument yxmdVer="2025.2">');
    });

    it('contains all 7 nodes', () => {
      for (let i = 1; i <= 7; i++) {
        expect(xml).toContain(`ToolID="${i}"`);
      }
    });

    it('has correct tool plugins for new tools', () => {
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Join.Join"');
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Unique.Unique"');
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.AlteryxSelect.AlteryxSelect"');
      expect(xml).toContain('Plugin="AlteryxBasePluginsGui.Sample.Sample"');
    });

    it('Join node uses "Join" output anchor in connections', () => {
      expect(xml).toContain('<Origin ToolID="3" Connection="Join"');
    });

    it('Unique node uses "Unique" output anchor in connections', () => {
      expect(xml).toContain('<Origin ToolID="4" Connection="Unique"');
    });

    it('contains specific configuration values', () => {
      expect(xml).toContain('LeftField="Vendor_ID" RightField="Vendor_ID"');
      expect(xml).toContain('field="Invoice_Num"');
      expect(xml).toContain('field="Vendor_ID" selected="True"');
      expect(xml).toContain('field="Amount" selected="True"');
      expect(xml).toContain('<N>50</N>');
      expect(xml).toContain('>joined_data.yxdb</File>');
    });
  });
});
