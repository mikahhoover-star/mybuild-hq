import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const html=readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m=>m[1]).filter(x=>x.trim());
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
console.log('Static checks passed');
