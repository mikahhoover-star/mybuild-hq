import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const html=readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m=>!m[1].includes('application/ld+json'))
  .map(m=>m[2]).filter(x=>x.trim());
assert.ok(scripts.length>=2,'Expected app and auth scripts');
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
