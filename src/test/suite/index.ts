import * as path from "node:path";
import { fileURLToPath } from "node:url";
import Mocha from "mocha";
import { glob } from "glob";

export async function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: "tdd",
		color: true
	});

	const testsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

	const files = await glob('**/int_**.test.js', { cwd: testsRoot })

	// Add files to the test suite
	files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

	// VS Code treats resolution of run() as "tests finished". mocha.run()
	// only schedules the suite, so the promise must stay pending until the
	// callback reports the outcome.
	await new Promise<void>((resolve, reject) => {
		try {
			mocha.run(failures => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		} catch (err) {
			console.error(err);
			reject(err);
		}
	});
}
