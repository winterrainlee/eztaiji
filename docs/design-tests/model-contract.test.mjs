// Design-only contract probe. Synthetic fixtures, no production imports.
// This is NOT a complete schema validator, martial-arts verification, or UI test.
// Run: node docs/design-tests/model-contract.test.mjs
import assert from 'node:assert/strict';

const unknown = () => ({status:'unknown', reason:'unrecorded'});
const illustration = value => ({status:'known', value, basis:'illustration',
  precision:'approximate', evidence:[], note:'Synthetic design fixture; not a recorded movement.'});
const documented = value => ({status:'known', value, basis:'source',
  precision:'qualitative', evidence:[{sourceId:'example-note', locator:'fixture only', support:'explicit'}]});
const clone = value => structuredClone(value);

function requireItem(items, id, label) {
  const item = items[id];
  if (!item) throw new Error(`${label}: missing reference ${id}`);
  return item;
}
function resolveEnd(d, motionId) {
  const motion = requireItem(d.motions, motionId, 'motion');
  if (motion.endStateId === null) return {status:'missing', reason:'end state unrecorded'};
  return {status:'resolved', state:requireItem(d.states, motion.endStateId, 'state')};
}
function resolveStart(d, postureId, trail = new Set()) {
  if (trail.has(postureId)) throw new Error('cyclic start reference');
  const nextTrail = new Set(trail).add(postureId);
  const p = requireItem(d.postures, postureId, 'posture');
  const index = d.postureIds.indexOf(postureId);
  if (index < 0) throw new Error('posture is outside this dataset');
  if (p.start.kind === 'initial') {
    if (index !== 0) throw new Error('initial state is only allowed for the first posture');
    return {status:'resolved', state:requireItem(d.states, p.start.stateId, 'state')};
  }
  if (p.start.kind !== 'previousEnd') throw new Error('unsupported start kind');
  const previous = requireItem(d.postures, p.start.postureId, 'posture');
  // Validate the reference chain too; do not hide a broken ancestor.
  resolveStart(d, previous.id, nextTrail);
  if (index === 0 || d.postureIds[index - 1] !== previous.id)
    throw new Error('start must reference the immediate predecessor');
  if (!previous.motionIds.length) return {status:'missing', reason:'previous motion slots unrecorded'};
  return resolveEnd(d, previous.motionIds.at(-1));
}
function validateClaim(c, sources) {
  if (!c || !['known','unknown','not_applicable'].includes(c.status))
    throw new Error('invalid claim status');
  if (c.status !== 'known') {
    if ('value' in c) throw new Error('unknown/non-applicable claim must not contain a value');
    if (!c.reason) throw new Error('missing claim reason');
    return;
  }
  if (c.value === null || c.value === undefined) throw new Error('known claim requires a value');
  if (!['source','observation','inference','illustration'].includes(c.basis))
    throw new Error('invalid claim basis');
  if (!['qualitative','approximate','measured'].includes(c.precision))
    throw new Error('invalid claim precision');
  if (!Array.isArray(c.evidence)) throw new Error('claim evidence must be an array');
  if (['source','observation','inference'].includes(c.basis) && !c.evidence.length)
    throw new Error('claim requires evidence');
  if (['inference','illustration'].includes(c.basis) && !c.note)
    throw new Error('interpretive claim requires a note');
  for (const e of c.evidence) {
    requireItem(sources, e.sourceId, 'source');
    if (!e.locator || !['explicit','contextual'].includes(e.support))
      throw new Error('invalid evidence locator/support');
  }
}
function contactLabelAllowed(claim, sources) {
  validateClaim(claim, sources);
  return claim.status === 'known' && ['source','observation'].includes(claim.basis)
    && claim.evidence.some(e => e.support === 'explicit');
}
function makeView(d, postureId, kind, motionId) {
  const p = requireItem(d.postures, postureId, 'posture');
  if (kind === 'start') return {postureId, kind, resolution:resolveStart(d, postureId),
    instruction:p.introduction, events:[]};
  if (kind !== 'motion' || !p.motionIds.includes(motionId)) throw new Error('invalid view target');
  const m = d.motions[motionId];
  return {postureId, kind, motionId, resolution:resolveEnd(d, motionId),
    instruction:m.instruction, events:m.events};
}
function steps(d) {
  return d.postureIds.flatMap(postureId => [{postureId, kind:'start'},
    ...d.postures[postureId].motionIds.map(motionId => ({postureId, kind:'motion', motionId}))]);
}
function countMotions(d) {
  return d.postureIds.reduce((n, id) => n + d.postures[id].motionIds.length, 0);
}
function validateFrames(d, postureId, motionId) {
  const p = requireItem(d.postures, postureId, 'posture');
  const i = p.motionIds.indexOf(motionId);
  if (i < 0) throw new Error('motion outside posture');
  const start = i === 0 ? resolveStart(d, postureId) : resolveEnd(d, p.motionIds[i-1]);
  const m = d.motions[motionId];
  const states = [start, ...m.checkpointStateIds.map(id => ({status:'resolved',
    state:requireItem(d.states, id, 'checkpoint')})), resolveEnd(d, motionId)]
    .filter(r => r.status === 'resolved').map(r => r.state);
  if (new Set(states.map(s => s.coordinateFrameId)).size > 1)
    throw new Error('coordinate frame mismatch');
}
function validateGroupRange(d, groupId, motionIds) {
  const g = requireItem(d.groups, groupId, 'group');
  const p = requireItem(d.postures, g.postureId, 'group posture');
  if (!g.motionIds.every(id => p.motionIds.includes(id))) throw new Error('group crosses postures');
  const selected = motionIds ?? g.motionIds;
  const indices = selected.map(id => g.motionIds.indexOf(id));
  if (!indices.length || indices.some((n, i) => n < 0 || (i > 0 && n !== indices[i-1] + 1)))
    throw new Error('scope must be a contiguous ordered range within its group');
}
function validateBefore(events, pairs) {
  const graph = new Map(events.map(e => [e.id, []]));
  for (const [a,b] of pairs) {
    if (!graph.has(a) || !graph.has(b)) throw new Error('missing event reference');
    graph.get(a).push(b);
  }
  const visiting = new Set(), done = new Set();
  function visit(id) {
    if (visiting.has(id)) throw new Error('cyclic before relation');
    if (done.has(id)) return;
    visiting.add(id); graph.get(id).forEach(visit); visiting.delete(id); done.add(id);
  }
  graph.forEach((_, id) => visit(id));
}
function fixture() {
  const state = id => ({id, coordinateFrameId:'world', feet:{
    left:{position:illustration({x:0,y:0}), supportRole:unknown(), groundContact:unknown()},
    right:{position:illustration({x:1,y:0}), supportRole:unknown(), groundContact:unknown()}},
    center:{location:unknown()}, body:{heading:unknown()}});
  return {
    sources:{'example-note':{id:'example-note', kind:'design-example'}},
    postureIds:['p-a','p-b'],
    postures:{
      'p-a':{id:'p-a', name:'Same display name', start:{kind:'initial', stateId:'s-initial'},
        motionIds:['a-1','a-2'], introduction:'Before A'},
      'p-b':{id:'p-b', name:'Same display name', start:{kind:'previousEnd', postureId:'p-a'},
        motionIds:['b-1'], introduction:'Before B'}},
    states:Object.fromEntries(['s-initial','s-a1','s-a2','s-b1','s-mid'].map(id => [id,state(id)])),
    motions:{
      'a-1':{id:'a-1', endStateId:'s-a1', checkpointStateIds:[], events:[], instruction:'A first'},
      'a-2':{id:'a-2', endStateId:'s-a2', checkpointStateIds:[],
        events:[{id:'heel-change', detail:documented({target:'leftFoot', kind:'heel-raise'})}],
        instruction:'Raise heel in A'},
      'b-1':{id:'b-1', endStateId:'s-b1', checkpointStateIds:[], events:[], instruction:'B first'}},
    groups:{'g-a':{id:'g-a', postureId:'p-a', motionIds:['a-1','a-2']}}
  };
}

let passed = 0;
function test(name, run) { run(); passed++; console.log(`PASS ${name}`); }

test('start and previous end share the same state object', () => {
  const d=fixture(); assert.equal(resolveStart(d,'p-b').state, resolveEnd(d,'a-2').state);
});
test('updating the source state is visible through the next start reference', () => {
  const d=fixture(); d.states['s-a2'].body.heading=illustration({kind:'sector',sector:'right'});
  assert.equal(resolveStart(d,'p-b').state.body.heading.value.sector,'right');
});
test('shared state does not copy instruction or replay previous events', () => {
  const d=fixture(), end=makeView(d,'p-a','motion','a-2'), start=makeView(d,'p-b','start');
  assert.equal(end.resolution.state,start.resolution.state);
  assert.equal(start.instruction,'Before B'); assert.equal(end.events.length,1); assert.deepEqual(start.events,[]);
});
test('same display name does not merge two posture occurrences', () => {
  const d=fixture(); assert.notEqual(resolveStart(d,'p-a').state.id,resolveStart(d,'p-b').state.id);
});
test('missing previous end stays missing instead of falling back to an earlier state', () => {
  const d=fixture(); d.motions['a-2'].endStateId=null;
  assert.equal(resolveStart(d,'p-b').status,'missing');
});
test('broken state references raise errors instead of looking like unrecorded data', () => {
  const d=fixture(); d.motions['a-2'].endStateId='does-not-exist';
  assert.throws(()=>resolveStart(d,'p-b'),/missing reference/);
});
test('cyclic posture starts are rejected', () => {
  const d=fixture(); d.postures['p-a'].start={kind:'previousEnd',postureId:'p-b'};
  assert.throws(()=>resolveStart(d,'p-b'),/cyclic/);
});
test('a non-adjacent previous posture is rejected', () => {
  const d=fixture(); d.postureIds.push('p-c');
  d.postures['p-c']={id:'p-c',start:{kind:'previousEnd',postureId:'p-a'},motionIds:[]};
  assert.throws(()=>resolveStart(d,'p-c'),/immediate predecessor/);
});
test('start views and checkpoints do not increase numbered motion count', () => {
  const d=fixture(); d.motions['a-1'].checkpointStateIds=['s-mid'];
  assert.equal(countMotions(d),3); assert.equal(steps(d).length,5);
  assert.deepEqual(steps(d)[3],{postureId:'p-b',kind:'start'});
});
test('missing coordinates do not remove an available instruction', () => {
  const d=fixture(); d.motions['b-1'].endStateId=null;
  const v=makeView(d,'p-b','motion','b-1');
  assert.equal(v.resolution.status,'missing'); assert.equal(v.instruction,'B first');
});
test('unknown current fields do not inherit known previous fields', () => {
  const d=fixture(); d.states['s-a1'].feet.left.groundContact=documented('toe');
  assert.equal(makeView(d,'p-a','motion','a-2').resolution.state.feet.left.groundContact.status,'unknown');
});
test('unknown is not zero and cannot contain an invented value', () => {
  const d=fixture(); validateClaim(unknown(),d.sources);
  assert.throws(()=>validateClaim({status:'unknown',reason:'unrecorded',value:0},d.sources),/must not contain/);
});
test('direct contact evidence allows a symbol while inference does not', () => {
  const d=fixture(), direct=documented('toe'), inferred={...clone(direct),basis:'inference',note:'Hypothesis only'};
  assert.equal(contactLabelAllowed(direct,d.sources),true);
  assert.equal(contactLabelAllowed(inferred,d.sources),false);
});
test('contextual evidence alone cannot authorize a contact symbol', () => {
  const d=fixture(), c=documented('toe'); c.evidence[0].support='contextual';
  assert.equal(contactLabelAllowed(c,d.sources),false);
});
test('claims require real referenced source records in this fixture', () => {
  const d=fixture(), c=documented('toe'); c.evidence[0].sourceId='missing';
  assert.throws(()=>validateClaim(c,d.sources),/missing reference/);
});
test('qualitative C stays a region rather than being promoted to numeric coordinates', () => {
  const d=fixture(); d.states['s-a2'].center.location=documented({kind:'region',anchor:'rightFoot'});
  const c=makeView(d,'p-b','start').resolution.state.center.location.value;
  assert.equal(c.kind,'region'); assert.equal('x' in c,false);
});
test('left and right support can both be shared without forced inversion', () => {
  const d=fixture(), s=d.states['s-a2'];
  s.feet.left.supportRole=documented('shared'); s.feet.right.supportRole=documented('shared');
  const f=makeView(d,'p-b','start').resolution.state.feet;
  assert.equal(f.left.supportRole.value,'shared'); assert.equal(f.right.supportRole.value,'shared');
});
test('cross-frame checkpoint comparisons are rejected', () => {
  const d=fixture(); d.motions['a-1'].checkpointStateIds=['s-mid']; d.states['s-mid'].coordinateFrameId='other';
  assert.throws(()=>validateFrames(d,'p-a','a-1'),/frame mismatch/);
});
test('group interpretations validate full and partial scope, rejecting other occurrences', () => {
  const d=fixture(); validateGroupRange(d,'g-a'); validateGroupRange(d,'g-a',['a-2']);
  assert.throws(()=>validateGroupRange(d,'g-a',['b-1']),/scope/);
  assert.throws(()=>validateGroupRange(d,'g-a',['a-2','a-1']),/scope/);
});
test('event list order need not impose timing but explicit before cycles are rejected', () => {
  const e=[{id:'first'},{id:'second'}]; validateBefore(e,[]); validateBefore(e,[['second','first']]);
  assert.throws(()=>validateBefore(e,[['first','second'],['second','first']]),/cyclic/);
});
console.log(`\n${passed} design contract probes passed. No production/UI or martial-content validation was performed.`);
