import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync('index.html','utf8');
const slice=(start,end)=>{
  const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
  assert.ok(a>=0 && b>a, 'Missing source markers');
  return html.slice(a,b);
};
const defaults=slice('const EMPTY_PROJECT=','function initialProject()');
const create=runInNewContext(defaults+';EMPTY_PROJECT()', {});
const validate=(project)=>runInNewContext(defaults+';validProject(project)',{project});
assert.equal(validate(create),true,'Default project must be valid');
assert.equal(validate(null),false);
assert.equal(validate([]),false);
assert.equal(validate({...create,budget:[null]}),false);
assert.equal(validate({...create,quotes:['invalid']}),false);
assert.equal(validate({...create,customChecks:['x'.repeat(301)]}),false);
assert.equal(validate({...create,fields:{projectName:{nested:true}}}),false);
assert.equal(validate({...create,phases:{Foundation:'yes'}}),false);
assert.equal(validate({...create,checks:{Ready:1}}),false);
assert.equal(validate({...create,punch:[{issue:'Fix trim',done:false}]}),true);
const moneyCode=slice('function money(n)','function esc(s)');
assert.equal(runInNewContext(moneyCode+';money(12.5)'), '$12.50');
assert.equal(runInNewContext(moneyCode+';money(Number.POSITIVE_INFINITY)'), '$0.00');
const escapeCode=slice('function esc(s)','function saveFields()');
assert.equal(runInNewContext(escapeCode+';esc(value)',{value:'<img src=x onerror=alert(1)>'}),
  '&lt;img src=x onerror=alert(1)&gt;');
console.log('Project validation, money and escaping regression tests passed');

const edge=readFileSync('supabase/functions/verify-gumroad-license/index.ts','utf8');
assert.ok(edge.includes('AbortSignal.timeout(10000)'),'Gumroad verification must time out');
assert.ok(edge.includes("'Cache-Control': 'no-store'"),'Purchase responses must not be cached');
assert.ok(edge.includes("auth.auth.getUser(token)"),'Edge Function must verify user token');
assert.ok(edge.includes("purchase.email"),'Purchase must be bound to buyer email');
assert.ok(edge.includes("purchase.refunded"),'Refunded purchases must fail verification');
assert.ok(edge.includes("increment_uses_count: 'false'"),'Verification must not consume license uses');
console.log('Purchase verification source checks passed');
