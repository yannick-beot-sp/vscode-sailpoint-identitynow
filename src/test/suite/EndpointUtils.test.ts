import * as assert from 'assert';
import { it, describe } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { EndpointUtils } from '../../utils/EndpointUtils';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	// vscode.window.showInformationMessage('Start all tests.');
	describe('EndpointUtils.getBaseUrl()', () => {
		const tests = [
			{ args: 'enterprisexxx', expected: 'https://enterprisexxx.api.identitynow.com' },
			{ args: 'enterprisexxx.identitynow.com', expected: 'https://enterprisexxx.api.identitynow.com' },
			{ args: 'enterprisexxx.identitynow-else.com', expected: 'https://enterprisexxx.api.identitynow-else.com' },
			{ args: 'enterprisexxx.identitysoon.com', expected: 'https://enterprisexxx.api.cloud.sailpoint.com' },
			{ args: 'enterprisexxx.saas.sailpointdomain.com', expected: 'https://enterprisexxx.api.saas.sailpointdomain.com' }
		];
		tests.forEach(({ args, expected }) => {
			it(`correctly compute API endpoint for ${args}`, () => {
				const endpoint = EndpointUtils.getBaseUrl(args);
				assert.strictEqual(endpoint, expected);
			});
		});
	});

});
