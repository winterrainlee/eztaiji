/* Collection-stage deployment data for the current practice UI. Browser reads display data only. */
'use strict';
(() => {
  const known=(value,basis='inference',precision='qualitative',note='수집 단계의 프로젝트 기록이야.')=>({status:'known',value,basis,precision,evidence:[],note});
  const unknown=(reason='unverified')=>({status:'unknown',reason});
  const text=value=>known(value,'inference','qualitative','접근 가능한 기존 수련 기록을 바탕으로 정리한 프로젝트 해석이야. 원문·실연 대조는 이어서 보완해.');
  const pos=(x,y)=>known({x,y},'illustration','approximate','학습용 근사 배치야. 실측값이 아니야.');
  const heading=sector=>known({kind:'sector',sector},'illustration','qualitative','기존 도해의 방향 범주를 옮긴 학습용 표현이야.');
  const support=value=>known(value,'source','qualitative','접근 가능한 기존 수련 기록에 명시된 지지 관계야.');
  const contact=value=>known(value,'source','qualitative','접근 가능한 기존 수련 기록에 명시된 접촉 정보야. 원문·실연 대조는 이어서 보완해.');
  const region=anchor=>known({kind:'region',anchor},'illustration','qualitative','기존 도해의 중심 위치를 질적 영역으로 옮긴 표현이야.');
  const emptyFoot=()=>({position:unknown(),heading:unknown(),supportRole:unknown(),groundContact:unknown(),heelRaised:unknown()});
  const emptyState=id=>({id,coordinateFrameId:'yijian-front',feet:{left:emptyFoot(),right:emptyFoot()},center:{location:unknown()},body:{heading:unknown(),organization:unknown()},arms:{left:{configuration:unknown()},right:{configuration:unknown()}}});
  const foot=(positionValue,headingValue,supportValue,contactValue=null,heel=null)=>({
    position:positionValue,heading:headingValue,supportRole:supportValue,
    groundContact:contactValue||unknown(),heelRaised:heel===null?unknown():known(heel,'source','qualitative','접근 가능한 기존 수련 기록에 명시된 뒤꿈치 상태야.')
  });
  const state=(id,left,right,center)=>({id,coordinateFrameId:'yijian-front',feet:{left,right},center:{location:center},body:{heading:heading('front'),organization:unknown()},arms:{left:{configuration:unknown()},right:{configuration:unknown()}}});
  const states={
    'p001-start':emptyState('p001-start'),
    'p001-m01-end':state('p001-m01-end',foot(pos(.65,0),heading('front-left'),support('xu'),contact('toe'),true),foot(pos(1,0),heading('front-right'),support('shi')),region('rightFoot')),
    'p001-m02-end':state('p001-m02-end',foot(pos(0,0),heading('front-left'),support('xu'),contact('toe')),foot(pos(1,0),heading('front-right'),support('shi')),region('rightFoot')),
    'p001-m03-end':state('p001-m03-end',foot(pos(0,0),heading('front'),support('shi'),contact('sole'),false),foot(pos(1,0),heading('front-right'),support('xu')),region('leftFoot')),
    'p001-m04-end':state('p001-m04-end',foot(pos(0,0),heading('front'),support('shi')),foot(pos(1,0),heading('front'),support('xu')),region('leftFoot'))
  };
  const prep=[
    {title:'왼발을 비워, 움직일 준비',instruction:'오른다리로 몸을 받치며 가볍게 가라앉아. 왼발 뒤꿈치를 살짝 들어 발끝만 닿게 둬. 팔은 자연스럽게 내려놓아.',checks:['왼발 뒤꿈치를 들려고 몸을 기울이지 않아.','어깨를 올리지 말고 편안히 숨 쉬어.'],principle:'왼발을 옆으로 보내려면 먼저 그 발의 지지를 덜어내야 해. 발끝이 바닥에 닿아 있어도 주된 지지는 오른다리가 맡아.',yy:['虛','實','왼발을 비워 움직일 여지를 둔다.','오른다리가 몸을 받친다.','오른다리가 받쳐주는 만큼 왼발이 가벼워져. 한쪽의 지지와 다른 쪽의 비움은 함께 일어나.'],state:'p001-m01-end',contacts:{left:'Toe',right:null},events:[{id:'p001-m01-e1',target:'leftFoot',kind:'heel_raise',description:text('왼발 뒤꿈치를 살짝 든다.'),symbol:'Heel ↑'}]},
    {title:'빈 왼발을 옆으로 열어',instruction:'오른발에 지지를 유지하며 왼발을 왼쪽으로 옮겨. 어깨너비 자리에서 발끝을 비스듬히 가볍게 대고, 양손도 조금 열어.',checks:['중심이 왼발을 따라 급히 쏠리지 않는지 봐.','발 간격은 사부님이 지도한 어깨너비로 맞춰.'],principle:'발이 먼저 새 자리에 도착하고 중심이 뒤따라가. 왼발이 멀어졌다고 바로 체중을 싣는 건 아니야.',yy:['虛','實','왼발을 비워 움직일 여지를 둔다.','오른다리가 몸을 받친다.','왼발은 새 자리를 찾지만 오른다리가 계속 받쳐. 발의 위치 변화와 지지의 변화를 나누어 읽어.'],state:'p001-m02-end',contacts:{left:'Toe',right:null},events:[]},
    {title:'왼발을 정렬하며 지지를 옮겨',instruction:'왼발을 정면으로 정렬하고 뒤꿈치를 내려놓으며 왼다리에 지지를 옮겨. 양팔은 다리 앞 바깥쪽으로 돌아오고, 오른발은 가벼워져.',checks:['왼무릎이 발끝 방향에서 크게 어긋나지 않게 해.','오른발을 돌리기 전에 어느 다리가 지지하는지 느껴봐.'],principle:'이제 왼발이 몸을 받쳐. 오른발을 비워두면 다음 동작에서 발끝을 안쪽으로 정렬하기 쉬워져.',yy:['虛','實','오른발이 정렬할 여지를 갖는다.','왼다리가 몸을 받친다.','지지가 왼다리로 옮겨가며 오른발을 비울 여지가 생겨. 앞 동작과 허실의 역할이 바뀌는 지점이야.'],state:'p001-m03-end',contacts:{left:null,right:null},events:[{id:'p001-m03-e2',target:'leftFoot',kind:'heel_lower',description:text('왼발 뒤꿈치를 내린다.'),symbol:'Heel ↓'}]},
    {title:'오른발을 나란히 정렬해',instruction:'왼다리의 지지를 유지하며 오른발 끝을 안쪽으로 돌려. 두 발을 정면으로 나란히 두고, 어깨를 풀어 손이 다리 앞 바깥쪽에 내려오게 해.',checks:['두 발이 나란해져도 지지는 왼다리에 남겨둬.','오른발을 억지로 비틀거나 어깨를 누르지 않아.'],principle:'오른발은 정렬을 돕는 가벼운 발이야. 오른발에 체중이 많이 남아 있으면 돌릴 때 무릎까지 비틀기 쉬워.',yy:['虛','實','오른발이 정렬할 여지를 갖는다.','왼다리가 몸을 받친다.','왼다리가 받치는 동안 가벼운 오른발을 정렬해. 양발이 나란하다는 모양과 어느 발이 받치는가는 달라.'],state:'p001-m04-end',contacts:{left:null,right:null},events:[]}
  ];
  const interpretations={};
  prep.forEach((m,i)=>{
    const n=i+1,mid=`p001-m${String(n).padStart(2,'0')}`;
    interpretations[`${mid}-principle`]={id:`${mid}-principle`,category:'principle',scope:{kind:'motion',motionId:mid},availability:'present',content:{explanation:text(m.principle)}};
    interpretations[`${mid}-yinyang`]={id:`${mid}-yinyang`,category:'yinYang',scope:{kind:'motion',motionId:mid},availability:'present',content:{terms:m.yy.slice(0,2),first:text(m.yy[2]),second:text(m.yy[3]),relation:text(m.yy[4])}};
  });
  interpretations['p001-application']={id:'p001-application',category:'application',scope:{kind:'posture',postureId:'p001'},availability:'present',content:{applicationType:'preparation',assumption:text('상대의 움직임에 맞춰 한 발을 옮겨야 한다고 가정해.'),response:text('한 다리가 몸을 받치는 동안 다른 발을 가볍게 옮기고 정렬해. 자리를 잡은 뒤 지지 역할을 바꿔.'),possibleResult:text('받치는 발과 움직일 발을 구분해, 다음 이동이나 대응을 준비하는 과정으로 읽을 수 있어.'),limitations:text('예비식의 준비 구조를 이해하기 위한 가정이야. 특정 공격을 막는 독립 기술이라고 단정하지 않아.')}};
  const sections=taijiCatalog.map(s=>({id:`s${String(s.id).padStart(2,'0')}`,name:s.name,postureIds:s.poses.map(p=>`p${String(p.id).padStart(3,'0')}`)}));
  const postures={},views={},order=[];
  for(const section of taijiCatalog){
    for(const pose of section.poses){
      const pid=`p${String(pose.id).padStart(3,'0')}`,startId=`${pid}-start-view`,motionViewIds=[];
      postures[pid]={id:pid,number:pose.id,name:pose.name,motionCount:pose.count,startViewId:startId,motionViewIds};
      const startState=pose.id===1?'p001-start':pose.id===2?'p001-m04-end':null;
      views[startId]={id:startId,kind:'start',postureId:pid,motionId:null,motionNumber:null,title:`${pose.name} · 시작 상태`,stateId:startState,fromStateId:null,instruction:pose.id===1?known('권가 시작 전 상태야. 1동작이 끝난 상태와 구분하며, 확인되지 않은 좌표·허실·접촉은 비워뒀어.','illustration','qualitative','프로젝트의 시작 상태 설명이야.'):known('이전 자세를 마친 상태에서 다음 움직임을 준비해. 세부 설명은 모으는 중이야.','illustration','qualitative','아직 동작 자료를 채우는 중인 화면이야.'),checks:[],events:[],contactSymbols:{left:null,right:null},interpretationIds:pose.id===1?['p001-application']:[],sourceIds:[]};
      order.push(startId);
      let from=startState;
      for(let n=1;n<=pose.count;n++){
        const mid=`${pid}-m${String(n).padStart(2,'0')}`,vid=`${mid}-view`,p=pose.id===1?prep[n-1]:null,stateId=p?.state||null;
        views[vid]={id:vid,kind:'motion',postureId:pid,motionId:mid,motionNumber:n,title:p?.title||`${pose.name} · ${n}동작`,stateId,fromStateId:from,instruction:p?known(p.instruction,'source','qualitative','접근 가능한 기존 수련 기록을 바탕으로 옮긴 내용이야. 원문·실연 대조는 이어서 보완해.'):unknown('unrecorded'),checks:p?p.checks.map(text):[],events:p?.events||[],contactSymbols:p?.contacts||{left:null,right:null},interpretationIds:p?[`${mid}-principle`,`${mid}-yinyang`,'p001-application']:[],sourceIds:p?['legacy-preparation']:[]};
        order.push(vid);motionViewIds.push(vid);from=stateId;
      }
    }
  }
  const edges={};order.forEach((id,i)=>edges[id]={previous:order[i-1]||null,next:order[i+1]||null});
  const data={formatVersion:'0.1.0',profile:'collection-ui',meta:{datasetId:'yijian',datasetRevision:'collection-ui-2026-09-23',coverage:{kind:'partial',note:'예비식 4동작을 먼저 연결하고 나머지는 수집 중이야.'}},coordinateFrames:{'yijian-front':{id:'yijian-front',origin:'太極起勢 종료 기준',axes:{x:'initial-right',y:'initial-front'},unit:'initial-stance-width',footReference:'foot-shape-center-projection'}},catalog:{sections,postures},navigation:{order,edges},states,views,interpretations,sources:{'legacy-preparation':{id:'legacy-preparation',title:'eztaiji 기존 예비식 4동작과 학습용 도해',url:'https://github.com/winterrainlee/eztaiji/blob/b228b007d48756bdf83d6d2d3a0050a2b34a7f5e/training/datasets/yijian.json',note:'접근 가능한 기존 수련 기록을 바탕으로 모은 자료야. 원문과 사부님 실연의 대조는 이어서 보완해.'}}};
  globalThis.EZTAIJI_DATA=data;
  globalThis.EZTAIJI_READY=Promise.resolve(data);
})();