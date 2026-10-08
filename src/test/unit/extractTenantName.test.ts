import * as assert from 'assert';
import { describe, it } from 'mocha';
import { extractTenantName, normalizeTenant } from '../../utils.js';

suite('extractTenantName Test Suite', () => {
	describe('extractTenantName', () => {
		const accepted = [
			{ args: 'company', expected: 'company' },
			{ args: '  company  ', expected: 'company' },
			{ args: 'company.identitynow.com', expected: 'company.identitynow.com' },
			{ args: 'Company.IdentityNow.com', expected: 'Company.IdentityNow.com' },
			{ args: 'https://company.identitynow.com', expected: 'company.identitynow.com' },
			{ args: 'https://company.identitynow.com/', expected: 'company.identitynow.com' },
			{ args: 'https://company.identitynow.com/ui/a/admin/dashboard', expected: 'company.identitynow.com' },
			{ args: 'https://Company.IdentityNow.com/ui?x=1#section', expected: 'Company.IdentityNow.com' },
			{ args: 'https://company.identitynow.com:443/ui', expected: 'company.identitynow.com' },
			{ args: '  https://company.identitynow.com/ui  ', expected: 'company.identitynow.com' },
			{ args: 'https://company', expected: 'company' },
		];
		accepted.forEach(({ args, expected }) => {
			it(`extracts '${expected}' from '${args}'`, () => {
				assert.strictEqual(extractTenantName(args), expected);
			});
		});

		const rejected = [
			'',
			'   ',
			'not a tenant',
			'http://company.identitynow-demo.com/ui',
			'HTTPS://company.identitynow.com',
			'company.identitynow.com/ui/admin',
			'//company.identitynow.com/ui',
			'ftp://company.identitynow.com',
			'https://',
			'https://.identitynow.com',
			'https://-company.identitynow.com',
		];
		rejected.forEach((args) => {
			it(`rejects '${args}'`, () => {
				assert.strictEqual(extractTenantName(args), undefined);
			});
		});
	});

	describe('normalizeTenant after URL extraction', () => {
		it('stores the FQDN extracted from a tenant URL', () => {
			const extracted = extractTenantName('https://Company.IdentityNow.com/ui/admin');
			assert.strictEqual(normalizeTenant(extracted!), 'company.identitynow.com');
		});

		it('appends the default domain when the URL host is a short name', () => {
			const extracted = extractTenantName('https://company');
			assert.strictEqual(normalizeTenant(extracted!), 'company.identitynow.com');
		});
	});
});
