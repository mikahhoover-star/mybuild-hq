import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const html=readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m=>!m[1].includes('application/ld+json'))
  .map(m=>m[2]).filter(x=>x.trim());
assert.equal(scripts.length,2,'Expected exactly one app script and one auth script');
const dir=mkdtempSync(join(tmpdir(),'mybuildhq-check-'));
try {
  for(let i=0;i<scripts.length;i++){
    const file=join(dir,'script-'+i+'.js');
    writeFileSync(file,scripts[i]);
    execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
  }
} finally {rmSync(dir,{recursive:true,force:true});}
const manifest=JSON.parse(readFileSync('manifest.webmanifest','utf8'));
assert.equal(manifest.start_url,'/mybuild-hq/');
assert.equal(manifest.display,'standalone');
assert.ok(html.includes('rel="manifest"'));
assert.ok(html.includes("functions.invoke('verify-gumroad-license'"));
assert.ok(!html.includes("localStorage.getItem(LICENSE_STORAGE_KEY)"));
assert.ok(html.includes("from('purchase_entitlements')"));
assert.ok(html.includes("from('project_data')"));
assert.ok(html.includes("function resetPassword()"));
assert.ok(html.includes("function finishPasswordReset()"));
assert.ok(!html.includes('\\n<link'), 'Head must not contain literal backslash-n');
const migration=readFileSync('supabase/migrations/20261008_customer_access.sql','utf8');
for(const action of ['Read own paid project','Insert own paid project','Update own paid project','Delete own paid project']){
  assert.ok(migration.includes(action), 'Missing RLS policy '+action);
}
assert.ok(migration.includes("e.status = 'active'"),'Project access must require an active entitlement');
assert.ok(!html.includes('https://api.gumroad.com/v2/licenses/verify'), 'Browser must not verify Gumroad directly');
console.log('Static checks passed');

const js=scripts.join('\n');
for (const match of html.matchAll(/\bonclick="([A-Za-z_$][\w$]*)\(/g)) {
  assert.ok(new RegExp('function\\s+'+match[1]+'\\s*\\(').test(js),
    'Missing click handler: '+match[1]);
}
for (const match of html.matchAll(/\bonchange="([A-Za-z_$][\w$]*)\(/g)) {
  assert.ok(new RegExp('function\\s+'+match[1]+'\\s*\\(').test(js),
    'Missing change handler: '+match[1]);
}
assert.ok(!/onchange="toggleMap\('checks'/.test(html),
  'Custom checklist items must not use inline JavaScript');
console.log('HTML handler checks passed');

assert.ok(html.includes('function validProject('),'Project data must be validated');
assert.ok(html.includes('function cloudRevisionKey('),'Cloud revisions must be scoped by account');
assert.ok(html.includes('Number.isFinite(a)'),'Budget values must be validated');
assert.ok(html.includes("confirm('Delete this item?')"),'Destructive deletion must ask for confirmation');
assert.ok(readFileSync('supabase/config.toml','utf8').includes('verify_jwt = true'),
  'Purchase function must require JWT verification');
assert.equal(migration.split("e.product_id = 'TDVYHTW6fumm_w_qSr5rcQ=='").length-1,5,
  'Every read and write RLS policy must require the correct paid product');
console.log('Extended regression checks passed');

assert.ok(html.includes('minimumFractionDigits:2'), 'Financial values must show cents');
assert.ok(html.includes('Use a unique checklist item under 300 characters.'), 'Duplicate checklist guard required');
assert.ok(html.includes("['checks','phases'].includes(map)"), 'Checklist toggle must validate target');
console.log('Financial and checklist checks passed');

assert.equal((html.match(/<\/html>/gi)||[]).length,1,'Exactly one HTML document closing tag required');
assert.equal((html.match(/const SUPABASE_URL =/g)||[]).length,1,'Supabase auth script must not be duplicated');
console.log('Document integrity checks passed');

assert.ok(html.includes('function clearBrowserProjectForAccountSwitch()'),
  'Shared devices need an explicit safe account switching path');
assert.ok(html.includes('Export Browser Backup'),
  'Offer a backup before browser data clearing');
assert.ok(html.includes('function signOutFromLicenseGate()'),
  'Unlicensed accounts must be able to sign out');
console.log('Account switching checks passed');
