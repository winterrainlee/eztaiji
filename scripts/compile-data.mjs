/** Preparation-pilot converter. Pure input/output; no network, disk writes, or UI.
 * JSON Schema validation is performed by the pilot harness before/after this module.
 * This is NOT the complete site build or deployment gate. Unsupported model features fail.
 */
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const own = (o, k) => Object.hasOwn(o, k);
const requireItem = (items, id, path) => {
  if (!items || !own(items, id)) throw new Error(`${path}: missing reference ${id}`);
  return items[id];
};
const check = (condition, message) => { if (!condition) throw new Error(message); };
const copy = value => structuredClone(value);
export function stableJSON(value) {
  const order = x => Array.isArray(x) ? x.map(order) : x && typeof x === 'object'
    ? Object.fromEntries(Object.keys(x).sort().map(k => [k, order(x[k])])) : x;
  return JSON.stringify(order(value));
}
function walkClaims(value, visit) {
  if (!value || typeof value !== 'object') return;
  if (['known', 'unknown', 'not_applicable'].includes(value.status)) { visit(value); return; }
  for (const item of Object.values(value)) walkClaims(item, visit);
}
function evidenceIds(value) {
  const ids = new Set();
  walkClaims(value, claim => (claim.evidence ?? []).forEach(e => ids.add(e.sourceId)));
  return [...ids].sort();
}
function validateReferences(d) {
  check(d.schemaVersion === '0.1.0' && d.profile === 'preparation-pilot', 'unsupported source version/profile');
  check(Object.keys(d.groups).length === 0, 'groups are not supported by preparation-pilot');
  const allIds = new Set();
  for (const key of ['postures','motions','states','sources','interpretations','principles','coordinateFrames']) {
    for (const [id, item] of Object.entries(d[key])) {
      check(id === item.id && /^[a-z][a-z0-9-]*$/.test(id), `${key}/${id}: ID mismatch/invalid ID`);
      check(!allIds.has(id), `${key}/${id}: duplicate global ID`); allIds.add(id);
    }
  }
  const order = d.sections.flatMap(s => s.postureIds), seen = new Set(), motionOwner = new Map();
  const sectionIds = d.sections.map(s => s.id);
  check(new Set(sectionIds).size === sectionIds.length, 'duplicate section ID');
  for (const [i, id] of order.entries()) {
    check(!seen.has(id), `posture ${id}: duplicate membership`); seen.add(id);
    const p = requireItem(d.postures, id, 'section');
    if (i === 0) {
      check(p.start.kind === 'initial', `${id}: first posture must use initial`);
      requireItem(d.states, p.start.stateId, `${id}/start`);
    } else {
      check(p.start.kind === 'previousEnd' && p.start.postureId === order[i-1], `${id}: start must reference immediate predecessor`);
    }
    check(p.motionIds.length > 0, `${id}: numbered motion slots required`);
    p.motionIds.forEach((mid, j) => {
      const m = requireItem(d.motions, mid, `${id}/motions`);
      check(!motionOwner.has(mid), `${mid}: duplicate motion ownership`); motionOwner.set(mid, id);
      check(m.number === j + 1, `${mid}: motion number/order mismatch`);
      check(m.checkpointStateIds.length === 0 && m.eventRelations.length === 0, `${mid}: checkpoints/timing are outside preparation-pilot`);
      if (m.endStateId !== null) requireItem(d.states, m.endStateId, `${mid}/endStateId`);
      for (const principleId of m.principleIds) requireItem(d.principles, principleId, `${mid}/principleIds`);
      for (const e of m.events) {
        check(!allIds.has(e.id), `${e.id}: duplicate event ID`); allIds.add(e.id);
      }
    });
  }
  check(seen.size === Object.keys(d.postures).length, 'unlisted posture');
  check(motionOwner.size === Object.keys(d.motions).length, 'unlisted motion');
  for (const s of Object.values(d.states)) requireItem(d.coordinateFrames, s.coordinateFrameId, `${s.id}/coordinateFrameId`);
  for (const x of Object.values(d.interpretations)) {
    check(['motion','posture'].includes(x.scope.kind), `${x.id}: unsupported interpretation scope`);
    requireItem(x.scope.kind === 'motion' ? d.motions : d.postures,
      x.scope.kind === 'motion' ? x.scope.motionId : x.scope.postureId, `${x.id}/scope`);
  }
  for (const source of Object.values(d.sources)) check(source.public.id === source.id, `${source.id}: public source ID mismatch`);
  walkClaims([d.states,d.motions,d.postures,d.interpretations,d.principles], claim => {
    check(!(claim.status !== 'known' && own(claim,'value')), 'unknown claim must not contain a value');
    for (const e of claim.evidence ?? []) requireItem(d.sources, e.sourceId, 'claim evidence');
  });
  return {order, motionOwner};
}
function explicitContact(claim, sources) {
  if (claim.status !== 'known' || !['source','observation'].includes(claim.basis)) return false;
  return claim.evidence.some(e => e.support === 'explicit' &&
    ['document','observation'].includes(sources[e.sourceId].kind) && sources[e.sourceId].reviewStatus === 'checked');
}
function projection(s) {
  // Allowlist at the record boundary; field types/Claim shapes are checked by the schemas.
  return Object.fromEntries(['id','coordinateFrameId','feet','center','body','arms'].map(k => [k, copy(s[k])]));
}
export function compileData(d) {
  const {order} = validateReferences(d);
  const out = {
    formatVersion:'0.1.0', profile:'preparation-pilot',
    meta:{datasetId:d.id, datasetRevision:d.revision, trainingSchemaVersion:d.schemaVersion,
      generatorVersion:'0.1.0', inputDigest:createHash('sha256').update(stableJSON(d)).digest('hex'), coverage:copy(d.coverage)},
    coordinateFrames:{}, catalog:{sections:copy(d.sections),postures:{}},
    navigation:{order:[],edges:{}}, states:{}, views:{}, principles:{}, interpretations:{}, sources:{}
  };
  const usedStates = new Set(), usedPrinciples = new Set(), usedInterpretations = new Set(), usedSources = new Set();
  let previousEnd = null;
  const add = (p, m, current, from) => {
    const id = m ? m.id+'-view' : p.id+'-start-view';
    const related = Object.values(d.interpretations).filter(x =>
      (x.scope.kind === 'posture' && x.scope.postureId === p.id) ||
      (m && x.scope.kind === 'motion' && x.scope.motionId === m.id)).map(x => x.id).sort();
    const principleIds = m ? copy(m.principleIds) : [];
    const state = current === null ? null : d.states[current];
    const symbols = {left:null,right:null};
    for (const side of ['left','right']) {
      const c = state?.feet[side].groundContact;
      if (c && explicitContact(c,d.sources)) symbols[side] = ({toe:'Toe',heel:'Heel'})[c.value] ?? null;
    }
    const view = {id,kind:m?'motion':'start',postureId:p.id,motionId:m?.id ?? null,
      motionNumber:m?.number ?? null,title:m?.title ?? p.name+' · 시작 상태',stateId:current,
      fromStateId:from,instruction:copy(m?.instruction ?? p.introduction),checks:copy(m?.checks ?? []),
      events:m ? m.events.map(e => ({...copy(e), symbol:explicitContact(e.description,d.sources)
        ? ({heel_raise:'Heel ↑',heel_lower:'Heel ↓'})[e.kind] ?? null : null})) : [],
      contactSymbols:symbols,principleIds,interpretationIds:related,sourceIds:[]};
    const displayed = [view.instruction,view.checks,view.events,state,
      ...(from === null ? [] : [d.states[from]]),...principleIds.map(x => d.principles[x]),...related.map(x => d.interpretations[x])];
    view.sourceIds = evidenceIds(displayed);
    view.sourceIds.forEach(x => usedSources.add(x)); principleIds.forEach(x => usedPrinciples.add(x)); related.forEach(x => usedInterpretations.add(x));
    if (current !== null) usedStates.add(current);
    if (from !== null) usedStates.add(from);
    if (current !== null && from !== null) check(d.states[current].coordinateFrameId === d.states[from].coordinateFrameId,
      `${id}: cross-frame transition is not supported`);
    out.views[id] = view; out.navigation.order.push(id);
    return id;
  };
  for (const pid of order) {
    const p=d.postures[pid], start=p.start.kind === 'initial' ? p.start.stateId : previousEnd;
    const startViewId=add(p,null,start,null), motionViewIds=[];
    let from=start;
    for (const mid of p.motionIds) {
      const m=d.motions[mid]; motionViewIds.push(add(p,m,m.endStateId,from)); from=m.endStateId;
    }
    previousEnd=from;
    out.catalog.postures[pid]={id:pid,number:p.number,name:p.name,motionCount:p.motionIds.length,startViewId,motionViewIds};
  }
  out.navigation.order.forEach((id,i,a) => {out.navigation.edges[id]={previous:a[i-1]??null,next:a[i+1]??null};});
  for (const id of [...usedStates].sort()) {
    out.states[id]=projection(d.states[id]);
    const fid=d.states[id].coordinateFrameId; out.coordinateFrames[fid]=copy(d.coordinateFrames[fid]);
  }
  for (const id of [...usedPrinciples].sort()) out.principles[id]=copy(d.principles[id]);
  for (const id of [...usedInterpretations].sort()) {
    const x=d.interpretations[id];
    out.interpretations[id]={id:x.id,category:x.category,scope:copy(x.scope),availability:x.availability,
      ...(x.availability==='present'?{content:copy(x.content)}:{reason:x.reason})};
  }
  for (const id of [...usedSources].sort()) {
    const s=d.sources[id].public;
    out.sources[id]={id:s.id,title:s.title,url:s.url,note:s.note};
  }
  validateDeploymentReferences(out);
  return out;
}
export function validateDeploymentReferences(d) {
  const order=d.navigation.order;
  check(new Set(order).size===order.length,'duplicate navigation view');
  check(order.length===Object.keys(d.views).length && order.length===Object.keys(d.navigation.edges).length,'navigation coverage mismatch');
  for (const [i,id] of order.entries()) {
    const v=requireItem(d.views,id,'navigation');
    check(d.navigation.edges[id]?.previous===(order[i-1]??null) && d.navigation.edges[id]?.next===(order[i+1]??null),'navigation edge mismatch');
    const p=requireItem(d.catalog.postures,v.postureId,`${id}/postureId`);
    if (v.kind==='start') {
      check(p.startViewId===id && v.motionId===null && v.events.length===0,'invalid start view');
    } else check(p.motionViewIds.includes(id),`${id}: view outside posture`);
    for (const sid of [v.stateId,v.fromStateId]) if (sid!==null) requireItem(d.states,sid,`${id}/state`);
    for (const x of v.principleIds) requireItem(d.principles,x,`${id}/principles`);
    for (const x of v.interpretationIds) requireItem(d.interpretations,x,`${id}/interpretations`);
    for (const x of v.sourceIds) requireItem(d.sources,x,`${id}/sources`);
  }
  for (const s of Object.values(d.states)) requireItem(d.coordinateFrames,s.coordinateFrameId,'state frame');
  walkClaims([d.views,d.states,d.principles,d.interpretations], c => {
    for(const e of c.evidence??[]) requireItem(d.sources,e.sourceId,'deployment evidence');
  });
}
export function asDataScript(d) {
  // JSON.parse avoids object-literal __proto__ semantics. Escape HTML/JS separators too.
  const literal=JSON.stringify(stableJSON(d)).replace(/[<>&\u2028\u2029]/g,c => '\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
  return '"use strict";\nglobalThis.EZTAIJI_DATA = JSON.parse('+literal+');\n';
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    let input=''; for await (const part of process.stdin) input+=part;
    const d=compileData(JSON.parse(input));
    process.stdout.write(process.argv.includes('--script')?asDataScript(d):stableJSON(d)+'\n');
  } catch(e) { console.error(e.message); process.exitCode=1; }
}
