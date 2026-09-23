import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {compileData, stableJSON, asDataScript, validateDeploymentReferences} from '../scripts/compile-data.mjs';
const source=JSON.parse(await readFile(new URL('../training/datasets/yijian.json',import.meta.url),'utf8'));
const fresh=()=>structuredClone(source);
const prepEnd='p001-m04-end';
const end='p002-m06-end';
function addNext(d) {
  // Synthetic next posture only tests linking; it is NOT 太極起勢 content.
  d.sections[0].postureIds.push('test-next');
  d.postures['test-next']={id:'test-next',number:3,name:'TEST ONLY',start:{kind:'previousEnd',postureId:'p002'},motionIds:['test-next-m01'],introduction:structuredClone(d.postures.p002.introduction)};
  d.motions['test-next-m01']={...structuredClone(d.motions['p001-m01']),id:'test-next-m01',events:[],endStateId:null};
}
function freeze(x) {if(x&&typeof x==='object'){Object.freeze(x);Object.values(x).forEach(freeze);}return x;}
test('current partial dataset has two starts and ten numbered motions',()=>{const d=compileData(fresh());assert.equal(d.navigation.order.length,12);assert.equal(d.catalog.postures.p001.motionCount,4);assert.equal(d.catalog.postures.p002.motionCount,6);});
test('initial state is explicit and start never replays motion events',()=>{const d=compileData(fresh());assert.equal(d.states['p001-start'].feet.left.position.status,'known');assert.equal(d.views['p001-start-view'].events.length,0);});
test('instructions, principles and checks survive verbatim',()=>{const d=compileData(fresh());for(const [id,m] of Object.entries(source.motions)){assert.deepEqual(d.views[id+'-view'].instruction,m.instruction);assert.deepEqual(d.views[id+'-view'].checks,m.checks);}for(const [id,x]of Object.entries(source.interpretations))assert.deepEqual(d.interpretations[id],x);for(const [id,x]of Object.entries(source.principles))assert.deepEqual(d.principles[id],x);});
test('input can be deeply frozen and never changes',()=>{const x=freeze(fresh()),before=stableJSON(x);compileData(x);assert.equal(stableJSON(x),before);});
test('repeated compilation and dictionary insertion order are deterministic',()=>{const x=fresh(),y=fresh();y.states=Object.fromEntries(Object.entries(y.states).reverse());assert.equal(stableJSON(compileData(x)),stableJSON(compileData(y)));});
test('C regions are not replaced with legacy cx numbers',()=>{const d=compileData(fresh());for(const s of Object.values(d.states)){if(s.center.location.status==='known'){assert.equal(s.center.location.value.kind,'region');assert.equal('x' in s.center.location.value,false);}}});
test('pixel/authoring/source location metadata stays out',()=>{const d=compileData(fresh());assert.equal('authoring'in d,false);assert.equal('legacyRendering'in d,false);for(const s of Object.values(d.sources)){assert.deepEqual(Object.keys(s).sort(),['id','note','title','url']);assert.equal('location'in s,false);}});
test('legacy-only contact claims produce no confirmed badges',()=>{const d=compileData(fresh());for(const v of Object.values(d.views)){assert.equal(v.contactSymbols.left,null);assert.equal(v.contactSymbols.right,null);for(const e of v.events)assert.equal(e.symbol,null);}});
test('genuine explicitly reviewed source may authorize a contact badge',()=>{const x=fresh();x.sources.primary={id:'primary',kind:'document',reviewStatus:'checked',location:'test only',public:{id:'primary',title:'test only',url:null,note:'synthetic'}};x.states[prepEnd].feet.left.groundContact={status:'known',value:'toe',basis:'source',precision:'qualitative',evidence:[{sourceId:'primary',locator:'test only',support:'explicit'}]};assert.equal(compileData(x).views['p001-m04-view'].contactSymbols.left,'Toe');});
test('unknown contact does not inherit the previous state',()=>{const d=compileData(fresh());assert.equal(d.states[prepEnd].feet.right.groundContact.status,'unknown');});
test('a missing end still allows instructions and propagates missing start',()=>{const x=fresh();addNext(x);x.motions['p002-m06'].endStateId=null;const d=compileData(x);assert.equal(d.views['test-next-start-view'].stateId,null);assert.equal(d.views['p002-m06-view'].instruction.status,'known');});
test('next start shares final state but not events or previous explanations',()=>{const x=fresh();addNext(x);const d=compileData(x);assert.equal(d.views['test-next-start-view'].stateId,end);assert.deepEqual(d.views['test-next-start-view'].events,[]);assert.equal(d.views['test-next-start-view'].interpretationIds.includes('p002-m06-principle'),false);});
test('global principle is referenced without duplicating its content',()=>{const d=compileData(fresh()),v=d.views['p002-m03-view'];assert.deepEqual(v.principleIds,['gp-nonrigidity']);assert.equal(d.principles['gp-nonrigidity'].title,'경직하지 않고 변화 가능성을 유지하기');});
test('bad principle ID fails rather than disappearing',()=>{const x=fresh();x.motions['p002-m03'].principleIds=['missing-principle'];assert.throws(()=>compileData(x),/missing reference/);});
test('bad state ID fails rather than falling back',()=>{const x=fresh();x.motions['p002-m06'].endStateId='missing';assert.throws(()=>compileData(x),/missing reference/);});
test('a predecessor cycle fails',()=>{const x=fresh();addNext(x);x.postures.p001.start={kind:'previousEnd',postureId:'test-next'};assert.throws(()=>compileData(x),/first posture/);});
test('unresolved source IDs fail',()=>{const x=fresh();delete x.sources['legacy-preparation'];assert.throws(()=>compileData(x),/missing reference/);});
test('unsupported groups fail instead of being discarded',()=>{const x=fresh();x.groups.g={id:'g'};assert.throws(()=>compileData(x),/not supported/);});
test('unsupported checkpoints fail explicitly',()=>{const x=fresh();x.motions['p001-m01'].checkpointStateIds=['p001-start'];assert.throws(()=>compileData(x),/outside preparation-pilot/);});
test('wrong next-state coordinate frame fails',()=>{const x=fresh();x.coordinateFrames.other={...structuredClone(x.coordinateFrames['yijian-front']),id:'other'};x.states[end].coordinateFrameId='other';assert.throws(()=>compileData(x),/cross-frame/);});
test('corrupt output navigation is rejected',()=>{const d=compileData(fresh());d.navigation.edges['p001-start-view'].next=null;assert.throws(()=>validateDeploymentReferences(d),/edge mismatch/);});
test('pending combat interpretation stays pending',()=>{assert.equal(compileData(fresh()).interpretations['p001-application'].availability,'pending');});
test('script serialization does not execute content as code',()=>{const x=fresh();x.motions['p001-m01'].instruction.value='</script><script>globalThis.PWNED=true</script>\u2028';const d=compileData(x),context={};vm.runInNewContext(asDataScript(d),context);assert.equal(context.PWNED,undefined);assert.equal(stableJSON(context.EZTAIJI_DATA),stableJSON(d));});
