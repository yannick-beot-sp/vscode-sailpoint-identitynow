import { escapeXml } from './stringUtils';

export const CLOUD_RULE_XML_TYPES = [
    'AttributeGenerator',
    'BeforeProvisioning',
    'BuildMap',
    'Correlation',
    'IdentityAttribute',
    'ManagerCorrelation',
    'Transform',
];

export const DEFAULT_RULE_XML_DESCRIPTION = 'Describe your rule here.';

export interface RuleXmlParams {
    name: string;
    type: string;
    description: string;
    source: string;
}

export function wrapCdata(content: string): string {
    return content.replaceAll(']]>', ']]]]><![CDATA[>');
}

export function buildRuleXml(params: RuleXmlParams): string {
    const name = escapeXml(params.name);
    const type = escapeXml(params.type);
    const description = escapeXml(params.description);
    const source = wrapCdata(params.source ?? '');

    return `<?xml version='1.0' encoding='UTF-8'?>
<!DOCTYPE Rule PUBLIC "sailpoint.dtd" "sailpoint.dtd">
<Rule name="${name}" type="${type}">
  <Description>${description}</Description>
  <Source><![CDATA[
${source}
]]></Source>
</Rule>
`;
}
