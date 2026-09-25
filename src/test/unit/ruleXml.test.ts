import * as assert from 'assert';
import { it, describe } from 'mocha';
import { buildRuleXml, wrapCdata } from '../../utils/ruleXml';

suite('ruleXml Test Suite', () => {
	describe('buildRuleXml', () => {
		it('should generate a Rule XML from name, type, description and source', () => {
			const xml = buildRuleXml({
				name: 'Example Rule',
				type: 'Transform',
				description: 'Describe your rule here.',
				source: '  // Add your logic here.',
			});
			assert.strictEqual(xml, `<?xml version='1.0' encoding='UTF-8'?>
<!DOCTYPE Rule PUBLIC "sailpoint.dtd" "sailpoint.dtd">
<Rule name="Example Rule" type="Transform">
  <Description>Describe your rule here.</Description>
  <Source><![CDATA[
  // Add your logic here.
]]></Source>
</Rule>
`);
		});

		it('should escape XML special characters in attributes and description', () => {
			const xml = buildRuleXml({
				name: 'A & B "rule"',
				type: 'IdentityAttribute',
				description: 'Less than < and greater than >',
				source: 'return "ok";',
			});
			assert.ok(xml.includes('name="A &amp; B &quot;rule&quot;"'));
			assert.ok(xml.includes('<Description>Less than &lt; and greater than &gt;</Description>'));
		});
	});

	describe('wrapCdata', () => {
		it('should split CDATA if the source contains the terminator', () => {
			assert.strictEqual(wrapCdata('foo]]>bar'), 'foo]]]]><![CDATA[>bar');
		});
	});
});
