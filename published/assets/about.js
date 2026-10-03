(()=>{
  const list=document.getElementById('principles-list');
  if(!list)return;
  const d=globalThis.EZTAIJI_DATA;
  const text=claim=>claim?.status==='known'?claim.value:'';
  const basisLabel=claim=>({source:'자료',observation:'현장 기록',inference:'프로젝트 해석',illustration:'학습용 예시'}[claim?.basis]||'');
  const evidenceIds=principle=>{
    const ids=new Set();
    for(const claim of [principle.summary,principle.explanation,principle.example]){
      for(const e of claim?.evidence||[])ids.add(e.sourceId);
    }
    return [...ids];
  };
  if(!d?.principles){
    list.replaceChildren(Object.assign(document.createElement('p'),{className:'note',textContent:'공통원리 데이터를 불러오지 못했어.'}));
    return;
  }
  const items=Object.values(d.principles).sort((a,b)=>(a.order??999)-(b.order??999)||a.title.localeCompare(b.title,'ko'));
  list.replaceChildren();
  if(!items.length){
    list.append(Object.assign(document.createElement('p'),{className:'note',textContent:'아직 등록된 공통원리가 없어.'}));
    return;
  }
  for(const principle of items){
    const card=document.createElement('article');card.className='principle-card';
    const h=document.createElement('h3');h.textContent=(principle.order?principle.order+'. ':'')+principle.title;card.append(h);
    const label=basisLabel(principle.summary);
    if(label){const meta=document.createElement('div');meta.className='principle-label';meta.textContent=label;card.append(meta);}
    const summary=text(principle.summary);
    if(summary){const p=document.createElement('p');p.textContent=summary;card.append(p);}
    const explanation=text(principle.explanation);
    if(explanation&&explanation!==summary){const p=document.createElement('p');p.textContent=explanation;card.append(p);}
    const example=text(principle.example);
    if(example){const p=document.createElement('p');p.className='note';p.textContent='예: '+example;card.append(p);}
    const sources=evidenceIds(principle).map(id=>d.sources?.[id]).filter(Boolean);
    if(sources.length){
      const box=document.createElement('div');box.className='principle-sources';box.append('근거 · ');
      sources.forEach((source,i)=>{
        if(i)box.append(' · ');
        if(/^https?:\/\//i.test(source.url||'')){
          const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=source.title;box.append(a);
        }else box.append(source.title);
      });
      card.append(box);
    }
    list.append(card);
  }
})();
