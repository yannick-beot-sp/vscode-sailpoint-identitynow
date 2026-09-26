import * as assert from "assert";
import { highlightJson, jsonDrawerScript } from "../../commands/identity/jsonDrawerSnippet";
import { buildAccessTableHtml } from "../../commands/identity/identityAccessHtml";
import { buildEventsTableHtml } from "../../commands/identity/identityEventsHtml";

suite("json drawer", () => {
	test("highlights json tokens and escapes html", () => {
		const highlighted = highlightJson('{\n  "name": "a<b&c",\n  "ok": true,\n  "n": -2.5,\n  "z": null\n}');

		assert.ok(highlighted.includes('<span class="json-key">"name"</span>:'));
		assert.ok(highlighted.includes('<span class="json-string">"a&lt;b&amp;c"</span>'));
		assert.ok(highlighted.includes('<span class="json-boolean">true</span>'));
		assert.ok(highlighted.includes('<span class="json-number">-2.5</span>'));
		assert.ok(highlighted.includes('<span class="json-null">null</span>'));
		assert.ok(!highlighted.includes("<b"));
	});

	test("injected highlighter matches highlightJson", () => {
		const script = jsonDrawerScript();
		const run = new Function(`${script}\nreturn highlightJson;`) as () => (json: string) => string;
		const injected = run();
		const sample = JSON.stringify({ id: "1", count: 3, enabled: false, note: null }, null, 2);

		assert.strictEqual(injected(sample), highlightJson(sample));
	});

	test("access and events tables lock columns and open a json drawer", () => {
		const accessHtml = buildAccessTableHtml("Ada", []);
		const eventsHtml = buildEventsTableHtml("Ada", []);

		for (const html of [accessHtml, eventsHtml]) {
			assert.ok(html.includes('id="json-drawer"'));
			assert.ok(html.includes("function openJsonDrawer"));
			assert.ok(html.includes("table-layout: fixed"));
			assert.ok(!html.includes("width: max-content"));
			assert.ok(html.includes("function applyColumnWidths"));
			const script = html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)?.[1];
			assert.ok(script);
			new Function(script!);
		}

		assert.ok(eventsHtml.includes("data-sort-key=\"status\""));
		assert.ok(eventsHtml.includes(">Details<"));
		assert.ok(eventsHtml.includes("data-sort-key=\"created\""));
		assert.ok(eventsHtml.includes("const columnMinWidths = [100, 90, 90, 90, 104, 84, 200]"));
		assert.ok(accessHtml.includes("showAccessJson"));
		assert.ok(eventsHtml.includes("showEventJson"));
	});
});
