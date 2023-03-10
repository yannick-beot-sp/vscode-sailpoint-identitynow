import * as assert from 'assert';
import { it, describe } from 'mocha';
import { titleCase } from '../../utils/titleCase';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('titleCase Test Suite', () => {
	// vscode.window.showInformationMessage('Start all tests.');
	describe('titleCase', () => {
		const tests = [
			{ args: 'report.accounts.folder', expected: 'Report Accounts Folder' },
		];
		tests.forEach(({ args, expected }) => {
			it(`should correctly format ${args}`, () => {
				const humanReadableString = titleCase(args);
				assert.strictEqual(humanReadableString, expected);
			});
		});
	});

});
