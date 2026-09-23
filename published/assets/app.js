/* The browser reads compiled view data. It does not inspect the training dataset. */
'use strict';
(async function () {
  const $=id=>document.getElementById(id);
  const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
  const value=c=>c?.status==='known'?c.value:null;
  const text=c=>typeof value(c)==='string'?value(c):'';
  const basis=c=>c?.basis==='inference'?'해석':c?.basis==='illustration'?'학습용 근사':c?.basis==='source'?'자료 기록':c?.basis==='observation'?'관찰 기록':'미등록';
  function fail(error){$('app').hidden=true;const box=$('load-message');box.hidden=false;box.replaceChildren(el('h1','연습 데이터를 불러오지 못했어'),el('p','새로고침한 뒤 다시 확인해줘. 자료가 없는 동작과는 다른 로딩 오류야.'));const b=el('button','새로고침');b.onclick=()=>location.reload();box.append(b);console.error('eztaiji:',error);}
  try {
    // Plain-data and compressed-data transports share this promise contract.
    if(globalThis.EZTAIJI_READY) await globalThis.EZTAIJI_READY;
    const d=globalThis.EZTAIJI_DATA;
    if(!d||d.formatVersion!=='0.1.0'||!d.views||!d.catalog?.sections?.length||!d.navigation?.order?.length)throw Error('Unsupported or missing display data');
    let current=d.views[location.hash.slice(1)]?location.hash.slice(1):d.navigation.order[0];
    let pickerReturn=null;
    const postures=d.catalog.postures,sections=d.catalog.sections;
    const sectorAngle={'front':0,'front-right':45,'right':90,'back-right':135,'back':180,'back-left':225,'left':270,'front-left':315};
    const sectorText={'front':'기준 정면','front-right':'기준 오른쪽 앞','right':'기준 오른쪽','back-right':'기준 오른쪽 뒤','back':'기준 뒤','back-left':'기준 왼쪽 뒤','left':'기준 왼쪽','front-left':'기준 왼쪽 앞'};
    const contactText={toe:'발끝 접촉',forefoot:'앞꿈치 접촉',heel:'뒤꿈치 접촉',sole:'발바닥 접촉',none:'바닥에서 떨어짐',other:'자료에 기록된 접촉'};
    const regionText={leftFoot:'왼발 쪽',rightFoot:'오른발 쪽',betweenFeet:'두 발 사이',front:'기준 정면 쪽',back:'기준 뒤쪽'};
    const heading=c=>{const a=value(c);return !a?'미등록':a.kind==='sector'?sectorText[a.sector]:`${a.degrees}°${c.precision==='approximate'?' (근사)':''}`;};
    const claimLabel=(c,formatter=v=>String(v))=>c?.status==='known'?`${formatter(c.value)} · ${basis(c)}`:c?.status==='not_applicable'?'해당 없음':'미등록';
    const stateDescription=s=>{if(!s)return '몸 상태 미등록';const feet=['left','right'].map(side=>`${side==='left'?'왼발':'오른발'} ${claimLabel(s.feet[side].supportRole,v=>({shi:'실',xu:'허',shared:'함께 지지'})[v])}, 발끝 ${heading(s.feet[side].heading)}`).join('. ');const arms=[['left','왼팔'],['right','오른팔']].flatMap(([side,label])=>s.arms?.[side]?.direction?[`${label} 구조 방향 ${heading(s.arms[side].direction)}`]:[]).join('. ');return arms?`${feet}. ${arms}`:feet;};
    const svg=(tag,attrs={},label)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(label!==undefined)e.textContent=label;return e;};
    // One fixed world-to-view transform across the current training frames.
    function draw(v,s){
      const plot=$('plot');plot.replaceChildren(svg('title',{id:'diagram-title'},v.title),svg('desc',{id:'diagram-desc'},stateDescription(s)));
      const hasFeet=s&&['left','right'].some(k=>value(s.feet[k].position));
      plot.hidden=!hasFeet;$('plot-empty').hidden=hasFeet;
      $('plot-empty').textContent=v.kind==='start'?'시작 전의 배치는\n기록을 보완하는 중이야.':'이 동작의 좌표는 아직 없어.\n등록된 설명부터 살펴봐.';
      const c=value(s?.center?.location);
      $('center-summary').textContent=c?`C 중심 · ${c.kind==='region'?regionText[c.anchor]+' (영역)':`≈ (${c.x}, ${c.y})`}`:hasFeet?'C 중심 · 미등록':'';
      if(!hasFeet)return;
      const blue='#225bd6',red='#c43d3d',muted='#5e7184',x0=60,y0=138,unit=88;
      for(let x=26;x<=334;x+=27)plot.append(svg('path',{d:`M${x} 18V150`,stroke:'#dce5f0','stroke-width':.7}));
      for(let y=24;y<=150;y+=27)plot.append(svg('path',{d:`M26 ${y}H334`,stroke:'#dce5f0','stroke-width':.7}));
      plot.append(svg('path',{d:`M26 ${y0}H270 M${x0} 150V22`,stroke:'#aabdd1','stroke-width':1}));
      plot.append(svg('text',{x:x0,y:14,fill:muted,'font-size':11,'text-anchor':'middle'},'+y 정면'),svg('text',{x:274,y:y0+14,fill:muted,'font-size':11},'+x'));
      for(const n of [0,1,2])plot.append(svg('text',{x:x0+unit*n,y:166,fill:muted,'font-size':11,'text-anchor':'middle'},String(n)));
      function arrow(x,y,angle,length,color){const a=angle*Math.PI/180,dx=Math.sin(a),dy=-Math.cos(a),xx=x+dx*length,yy=y+dy*length;plot.append(svg('path',{d:`M${x} ${y}L${xx} ${yy}`,stroke:color,'stroke-width':2.4,'stroke-linecap':'round'}),svg('path',{d:`M${xx-dx*7-dy*4} ${yy-dy*7+dx*4}L${xx} ${yy}L${xx-dx*7+dy*4} ${yy-dy*7-dx*4}`,fill:'none',stroke:color,'stroke-width':2.2,'stroke-linejoin':'round'}));}
      for(const side of ['left','right']){
        const f=s.feet[side],p=value(f.position);if(!p)continue;const x=x0+p.x*unit,y=y0-p.y*unit,h=value(f.heading),role=value(f.supportRole);
        if(h)arrow(x,y-12,h.kind==='sector'?sectorAngle[h.sector]:h.degrees,32,blue);
        plot.append(svg('circle',{cx:x,cy:y,r:13,fill:role==='shi'?blue:role==='shared'?'#dce7fc':'#f4f7fc',stroke:role?blue:muted,'stroke-width':2.4,...(!role?{'stroke-dasharray':'3 2'}:{})}),svg('text',{x,y:y+4,fill:role==='shi'?'white':blue,'font-size':12,'text-anchor':'middle','font-weight':600},side==='left'?'左':'右'));
        const ah=value(s.arms?.[side]?.direction);
        if(ah){
          const aa=ah.kind==='sector'?sectorAngle[ah.sector]:ah.degrees,a=aa*Math.PI/180,dx=Math.sin(a),dy=-Math.cos(a),offset=side==='left'?-6:6;
          const ax=x+dx*14-dy*offset,ay=y+dy*14+dx*offset;
          arrow(ax,ay,aa,22,red);
        }
        if(!role)plot.append(svg('text',{x:x+18,y:y+4,fill:muted,'font-size':12},'?'));
        const labels=[v.contactSymbols[side],...v.events.filter(e=>e.target===side+'Foot'&&e.symbol).map(e=>e.symbol)].filter(Boolean);
        if(labels.length)plot.append(svg('text',{x,y:y+30,fill:'#704f99','font-size':11,'text-anchor':'middle'},labels.join(' · ')));
      }
      const b=value(s.body.heading);if(b){arrow(308,62,b.kind==='sector'?sectorAngle[b.sector]:b.degrees,28,blue);plot.append(svg('text',{x:308,y:91,fill:blue,'font-size':12,'font-weight':600,'text-anchor':'middle'},'B 몸 방향'));}
    }
    function fillDetails(s){const box=$('pose-details');box.replaceChildren();if(!s){box.append(el('p','이 상태의 좌표는 아직 등록하지 않았어.'));return;}
      for(const side of ['left','right']){const f=s.feet[side];box.append(el('h3',side==='left'?'왼발':'오른발'),el('p','위치: '+claimLabel(f.position,p=>`≈ (${p.x}, ${p.y})`)),el('p','지지: '+claimLabel(f.supportRole,v=>({shi:'● 실',xu:'○ 허',shared:'함께 지지'})[v])),el('p','발끝 방향: '+heading(f.heading)),el('p','접촉: '+claimLabel(f.groundContact,v=>contactText[v])),el('p','뒤꿈치: '+claimLabel(f.heelRaised,v=>v?'들려 있음':'들려 있지 않음')));}
      box.append(el('h3','몸과 중심'),el('p','몸 방향 B: '+heading(s.body.heading)),el('p',$('center-summary').textContent||'C 중심: 미등록'));for(const side of ['left','right']){const a=s.arms?.[side];if(!a)continue;box.append(el('h3',side==='left'?'왼팔':'오른팔'),el('p','구성: '+claimLabel(a.configuration)),el('p','구조 방향: '+heading(a.direction)));}
    }
    const sectionFor=id=>sections.find(s=>s.postureIds.includes(id));
    function render(){
      const v=d.views[current];if(!v)throw Error('Display view missing');const p=postures[v.postureId],s=v.stateId?d.states[v.stateId]:null,section=sectionFor(p.id);
      $('location-text').textContent=`${section.name} · ${p.number}. ${p.name}`;
      const position=v.kind==='start'?'시작 상태':`${v.motionNumber}동작 / ${p.motionCount}동작`;
      $('stage').textContent=`${p.name} · ${position}`;$('title').textContent=v.kind==='start'?`${p.name} · 시작 상태`:v.title;
      $('instruction').textContent=text(v.instruction)||(v.kind==='start'?'이전 자세를 마친 상태에서 다음 움직임을 준비해. 세부 설명은 모으는 중이야.':'이 동작의 설명은 모으는 중이야. 상단에서 예비식을 골라 먼저 살펴볼 수 있어.');
      const contacts=['left','right'].flatMap(side=>{const list=[v.contactSymbols[side],...v.events.filter(e=>e.target===side+'Foot'&&e.symbol).map(e=>e.symbol)].filter(Boolean);return list.length?[`${side==='left'?'왼발':'오른발'} · ${list.join(' / ')}`]:[];});
      $('contact-summary').hidden=!contacts.length;$('contact-summary').textContent=contacts.join('　')+(contacts.length?' · 기록 기준':'');
      const overview=$('start-overview');overview.replaceChildren();const ready=p.motionViewIds.filter(id=>text(d.views[id]?.instruction));overview.hidden=!(v.kind==='start'&&ready.length);
      if(!overview.hidden){overview.append(el('h2','이 자세의 흐름'));for(const id of ready){const m=d.views[id],row=el('div',undefined,'overview-step');row.append(el('span',`${m.motionNumber}동작`),el('div',m.title));overview.append(row);}}
      const related=v.interpretationIds.map(id=>d.interpretations[id]).filter(Boolean);
      const globalPrinciples=(v.principleIds||[]).map(id=>d.principles?.[id]).filter(Boolean);
      const gpSection=$('global-principles'),gpBody=$('global-principles-body');gpSection.hidden=!globalPrinciples.length;gpBody.replaceChildren();
      for(const principle of globalPrinciples){const item=el('div',undefined,'global-principle-item');item.append(el('strong',principle.title),el('p',text(principle.summary)));gpBody.append(item);}
      const why=related.filter(x=>x.category==='principle'&&x.availability==='present');$('why').hidden=!why.length;$('why-body').replaceChildren(...why.map(x=>el('p',text(x.content.explanation))));
      const yy=related.filter(x=>x.category==='yinYang'&&x.availability==='present');$('yin-yang').hidden=!yy.length;const yyBox=$('yin-yang-body');yyBox.replaceChildren();
      for(const x of yy){const c=x.content,pair=el('div',undefined,'pair');for(const[key,i]of [['first',0],['second',1]]){const a=el('div');a.append(el('strong',c.terms[i]),el('p',text(c[key])));pair.append(a);}yyBox.append(pair,el('p',text(c.relation),'relation'));}
      const apps=related.filter(x=>x.category==='application');$('application').hidden=!apps.length;const ab=$('application-body');ab.replaceChildren();
      for(const x of apps){if(x.availability!=='present'){ab.append(el('p',x.reason,'muted'));continue;}const c=x.content;ab.append(el('p',`${x.scope.kind==='posture'?p.name+' 전체':'이 동작'} · ${c.applicationType==='preparation'?'준비 구조로 읽기':'상황을 가정한 해석'}`,'scope'));for(const[key,label]of [['assumption','상황'],['response','대응'],['possibleResult','가능한 결과'],['limitations','읽을 때의 한계']]){ab.append(el('span',label,'scenario-label'),el('p',text(c[key]),key==='limitations'?'limitations':''));}}
      const checks=v.checks.map(text).filter(Boolean);$('checks').hidden=!checks.length;$('check-list').replaceChildren(...checks.map(t=>el('li',t)));
      const sb=$('source-list');sb.replaceChildren();for(const id of v.sourceIds){const source=d.sources[id];if(!source)continue;const item=el('div',undefined,'source-item');const a=el('a',source.title);if(/^https?:\/\//i.test(source.url||'')){a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';item.append(a);}else item.append(el('strong',source.title));item.append(el('p',source.note));sb.append(item);}if(!sb.childNodes.length)sb.append(el('p','아직 이 화면에 연결한 자료가 없어.'));
      draw(v,s);fillDetails(s);$('open-details').disabled=!s;
      const edges=d.navigation.edges[current];$('prev').disabled=edges.previous===null;$('next').disabled=edges.next===null;
      $('prev').textContent=v.kind==='start'&&edges.previous?'← 이전 자세':'← 이전';$('next').textContent=v.kind==='start'?'1동작 →':v.motionNumber===p.motionCount&&edges.next?'다음 자세 →':'다음 →';
      $('motion-current').textContent=v.kind==='start'?'시작 상태':`${v.motionNumber} / ${p.motionCount}동작`;
      $('explanation').scrollTop=0;$('sources').open=false;$('application').open=false;
      $('announce').textContent=`${section.name} ${p.name} ${position}. ${v.title}`;
      try{history.replaceState(null,'','#'+current);}catch{/* file viewers may limit history */}
    }
    function go(id){if(!id)return;try{current=id;render();}catch(e){fail(e);}}
    $('prev').onclick=()=>go(d.navigation.edges[current].previous);$('next').onclick=()=>go(d.navigation.edges[current].next);
    function options(select,items,selected){select.replaceChildren(...items.map(([value,label])=>{const o=el('option',label);o.value=value;return o;}));select.value=selected;}
    function fillPostures(sectionId,selected){const list=sections.find(s=>s.id===sectionId).postureIds;options($('posture-select'),list.map(id=>[id,`${postures[id].number}. ${postures[id].name}`]),selected||list[0]);}
    $('open-picker').onclick=()=>{const pid=d.views[current].postureId,s=sectionFor(pid);options($('section-select'),sections.map(s=>[s.id,s.name]),s.id);fillPostures(s.id,pid);pickerReturn=document.activeElement;$('picker-dialog').showModal();};
    $('section-select').onchange=()=>fillPostures($('section-select').value);
    $('close-picker').onclick=()=>$('picker-dialog').close();$('picker-dialog').addEventListener('close',()=>pickerReturn?.focus());
    $('apply-picker').onclick=()=>{const id=$('posture-select').value;go(postures[id].startViewId);$('picker-dialog').close();};
    $('open-details').onclick=()=>$('details-dialog').showModal();$('close-details').onclick=()=>$('details-dialog').close();$('details-dialog').addEventListener('close',()=>$('open-details').focus());
    for(const id of ['picker-dialog','details-dialog'])$(id).addEventListener('click',e=>{if(e.target!==$(id))return;const r=$(id).getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$(id).close();});
    document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(d.navigation.edges[current][e.key==='ArrowRight'?'next':'previous']);}});
    render();$('load-message').hidden=true;$('app').hidden=false;
  }catch(error){fail(error);}
})();
