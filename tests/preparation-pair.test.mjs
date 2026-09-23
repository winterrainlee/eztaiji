import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {compileData, stableJSON, asDataScript, validateDeploymentReferences} from '../scripts/compile-data.mjs';

const source=JSON.parse(await readFile(new URL('../training/datasets/yijian.json',import.meta.url),'utf8'));
const fresh=()=>structuredClone(source);
const qishiEnd='p002-m06-end';

function freeze(x){if(x&&typeof x==='object'){Object.freeze(x);Object.values(x).forEach(freeze);}return x;}

test('current partial dataset has three starts and 28 numbered motions',()=>{
  const d=compileData(fresh());
  assert.equal(d.navigation.order.length,31);
  assert.equal(d.catalog.postures.p001.motionCount,1);
  assert.equal(d.catalog.postures.p002.motionCount,6);
  assert.equal(d.catalog.postures.p003.motionCount,21);
});

test('preparation keeps only its verified start view',()=>{
  const d=compileData(fresh());
  assert.deepEqual(d.catalog.postures.p001.motionViewIds,[]);
  assert.equal(d.states['p001-start'].feet.left.position.status,'unknown');
  assert.equal(d.states['p001-start'].feet.right.supportRole.status,'known');
  assert.equal(d.views['p001-start-view'].events.length,0);
  assert.equal(d.navigation.edges['p001-start-view'].next,'p002-start-view');
});

test('qishi start uses an explicit learning coordinate guide',()=>{
  const d=compileData(fresh());
  assert.equal(d.views['p002-start-view'].stateId,'p002-start');
  assert.equal(d.states['p002-start'].feet.left.position.basis,'illustration');
  assert.deepEqual(d.states['p002-start'].feet.left.position.value,{x:0,y:0});
  assert.deepEqual(d.states['p002-start'].feet.right.position.value,{x:1,y:0});
});

test('instructions, interpretations, principles and checks survive verbatim',()=>{
  const d=compileData(fresh());
  for(const [id,m] of Object.entries(source.motions)){
    assert.deepEqual(d.views[id+'-view'].instruction,m.instruction);
    assert.deepEqual(d.views[id+'-view'].checks,m.checks);
  }
  for(const [id,x]of Object.entries(source.interpretations))assert.deepEqual(d.interpretations[id],x);
  for(const [id,x]of Object.entries(source.principles))assert.deepEqual(d.principles[id],x);
});

test('input can be deeply frozen and never changes',()=>{
  const x=freeze(fresh()),before=stableJSON(x);compileData(x);assert.equal(stableJSON(x),before);
});

test('repeated compilation and dictionary insertion order are deterministic',()=>{
  const x=fresh(),y=fresh();y.states=Object.fromEntries(Object.entries(y.states).reverse());
  assert.equal(stableJSON(compileData(x)),stableJSON(compileData(y)));
});

test('C regions are not replaced with invented point coordinates',()=>{
  const d=compileData(fresh());
  for(const s of Object.values(d.states)){
    if(s.center.location.status==='known'&&s.center.location.value.kind==='region'){
      assert.equal('x' in s.center.location.value,false);
    }
  }
});

test('authoring and private source locations stay out of deployment data',()=>{
  const d=compileData(fresh());
  assert.equal('authoring'in d,false);
  for(const s of Object.values(d.sources)){
    assert.deepEqual(Object.keys(s).sort(),['id','note','title','url']);
    assert.equal('location'in s,false);
  }
});

test('unverified preparation contact produces no confirmed badge',()=>{
  const d=compileData(fresh());
  assert.equal(d.views['p001-start-view'].contactSymbols.left,null);
  assert.equal(d.views['p001-start-view'].contactSymbols.right,null);
});

test('genuine explicitly reviewed source may authorize a contact badge',()=>{
  const x=fresh();
  x.sources.primary={id:'primary',kind:'document',reviewStatus:'checked',location:'test only',public:{id:'primary',title:'test only',url:null,note:'synthetic'}};
  x.states[qishiEnd].feet.left.groundContact={status:'known',value:'toe',basis:'source',precision:'qualitative',evidence:[{sourceId:'primary',locator:'test only',support:'explicit'}]};
  assert.equal(compileData(x).views['p002-m06-view'].contactSymbols.left,'Toe');
});

test('a missing qishi end propagates as an unknown lanquewei start',()=>{
  const x=fresh();x.motions['p002-m06'].endStateId=null;const d=compileData(x);
  assert.equal(d.views['p003-start-view'].stateId,null);
  assert.equal(d.views['p002-m06-view'].instruction.status,'known');
});

test('lanquewei start shares qishi final state without replaying qishi events',()=>{
  const d=compileData(fresh());
  assert.equal(d.views['p003-start-view'].stateId,qishiEnd);
  assert.deepEqual(d.views['p003-start-view'].events,[]);
  assert.deepEqual(d.views['p003-start-view'].principleIds,[]);
  assert.equal(d.views['p003-start-view'].interpretationIds.includes('p002-m06-principle'),false);
});

test('global principle is referenced without duplicating its content',()=>{
  const d=compileData(fresh()),v=d.views['p002-m03-view'];
  assert.deepEqual(v.principleIds,['gp-nonrigidity']);
  assert.equal(d.principles['gp-nonrigidity'].title,'경직하지 않고 변화 가능성을 유지하기');
});

test('bad principle ID fails rather than disappearing',()=>{
  const x=fresh();x.motions['p002-m03'].principleIds=['missing-principle'];
  assert.throws(()=>compileData(x),/missing reference/);
});

test('collection data without global-principle fields still compiles',()=>{
  const x=fresh();delete x.principles;for(const m of Object.values(x.motions))delete m.principleIds;
  const d=compileData(x);assert.deepEqual(d.principles,{});assert.deepEqual(d.views['p002-m03-view'].principleIds,[]);
});

test('bad state ID fails rather than falling back',()=>{
  const x=fresh();x.motions['p002-m06'].endStateId='missing';assert.throws(()=>compileData(x),/missing reference/);
});

test('first posture must still have an explicit initial state',()=>{
  const x=fresh();x.postures.p001.start={kind:'unregistered'};assert.throws(()=>compileData(x),/first posture/);
});

test('unresolved source IDs fail',()=>{
  const x=fresh();delete x.sources['tsaifucius-yijian64'];assert.throws(()=>compileData(x),/missing reference/);
});

test('same-day training notes are represented by one source',()=>{
  const d=compileData(fresh());
  assert.ok(d.sources['sifu-2026-09-23']);
  assert.equal(d.sources['sifu-2026-09-23-prep1'],undefined);
  assert.equal(d.sources['sifu-2026-09-23-qishi-rise'],undefined);
  assert.equal(d.sources['sifu-2026-09-23-nonrigidity'],undefined);
});

test('only the verified preparation motion remains',()=>{
  const d=compileData(fresh());
  assert.equal(d.sources['legacy-preparation'],undefined);
  assert.ok(source.motions['p001-m01']);
  for(const id of ['p001-m02','p001-m03','p001-m04'])assert.equal(source.motions[id],undefined);
  assert.equal(d.states['p001-start'].feet.left.position.basis,'illustration');
  assert.equal(d.views['p001-m01-view'].instruction.basis,'observation');
});

test('unsupported groups fail instead of being discarded',()=>{
  const x=fresh();x.groups.g={id:'g'};assert.throws(()=>compileData(x),/not supported/);
});

test('unsupported checkpoints fail explicitly',()=>{
  const x=fresh();x.motions['p002-m01'].checkpointStateIds=['p001-start'];assert.throws(()=>compileData(x),/outside preparation-pilot/);
});

test('wrong next-state coordinate frame fails',()=>{
  const x=fresh();x.coordinateFrames.other={...structuredClone(x.coordinateFrames['yijian-front']),id:'other'};
  x.states[qishiEnd].coordinateFrameId='other';assert.throws(()=>compileData(x),/cross-frame/);
});

test('corrupt output navigation is rejected',()=>{
  const d=compileData(fresh());d.navigation.edges['p001-start-view'].next=null;
  assert.throws(()=>validateDeploymentReferences(d),/edge mismatch/);
});

test('script serialization does not execute content as code',()=>{
  const x=fresh();x.motions['p002-m01'].instruction.value='</script><script>globalThis.PWNED=true</script>\u2028';
  const d=compileData(x),context={};vm.runInNewContext(asDataScript(d),context);
  assert.equal(context.PWNED,undefined);assert.equal(stableJSON(context.EZTAIJI_DATA),stableJSON(d));
});
