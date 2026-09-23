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
  const qishiSupport=value=>known(value,'inference','qualitative','預備式 마지막 지지 상태를 이어받고, 太極起勢 6동에 별도 換重이 없어 유지하는 것으로 읽은 프로젝트 해석이야.');
  const qishiState=(id,arms,organization)=>({id,coordinateFrameId:'yijian-front',
    feet:{
      left:foot(pos(0,0),heading('front'),qishiSupport('shi')),
      right:foot(pos(1,0),heading('front'),qishiSupport('xu'))
    },
    center:{location:region('leftFoot')},
    body:{heading:heading('front'),organization:known(organization,'source','qualitative','접근 가능한 太極起勢 기록을 바탕으로 정리했어.')},
    arms:{
      left:{configuration:known(arms,'source','qualitative','접근 가능한 太極起勢 기록을 바탕으로 정리했어.')},
      right:{configuration:known(arms,'source','qualitative','접근 가능한 太極起勢 기록을 바탕으로 정리했어.')}
    }
  });
  const states={
    'p001-start':state('p001-start',
      foot(pos(.65,0),heading('front-left'),support('xu'),contact('sole'),false),
      foot(pos(1,0),heading('front-right'),support('shi'),contact('sole'),false),
      region('rightFoot')),

    'p001-m01-end':state('p001-m01-end',foot(pos(.65,0),heading('front-left'),support('xu'),contact('toe'),true),foot(pos(1,0),heading('front-right'),support('shi')),region('rightFoot')),
    'p001-m02-end':state('p001-m02-end',foot(pos(0,0),heading('front-left'),support('xu'),contact('toe')),foot(pos(1,0),heading('front-right'),support('shi')),region('rightFoot')),
    'p001-m03-end':state('p001-m03-end',foot(pos(0,0),heading('front'),support('shi'),contact('sole'),false),foot(pos(1,0),heading('front-right'),support('xu')),region('leftFoot')),
    'p001-m04-end':state('p001-m04-end',foot(pos(0,0),heading('front'),support('shi')),foot(pos(1,0),heading('front'),support('xu')),region('leftFoot'))
  };
  Object.assign(states,{
    'p002-m01-end':qishiState('p002-m01-end','두 손이 몸 앞쪽으로 약 20도 떠오른다.','머리는 위로 세우고 몸은 정면을 유지하며 어깨를 풀어 손이 자연히 떠오르게 한다.'),
    'p002-m02-end':qishiState('p002-m02-end','두 팔이 전방으로 떠올라 어깨 높이에 이르고 손목은 자연스럽게 풀린다.','양쪽 견갑이 서서히 열리고 어깨는 긴장을 더하지 않는다.'),
    'p002-m03-end':qishiState('p002-m03-end','손목은 原空位를 유지하고 팔꿈치가 내려가며 손바닥과 손끝이 앞으로 평평하게 떠오른다.','어깨를 편안하게 두고 팔꿈치를 느슨하게 아래로 풀어준다.'),
    'p002-m04-end':qishiState('p002-m04-end','팔꿈치를 계속 풀며 손등이 양 어깨 쪽으로 가까워지고 손목이 약 90도로 접힌다.','팔꿈치와 어깨의 긴장을 더하지 않고 계속 풀어준다.'),
    'p002-m05-end':qishiState('p002-m05-end','손끝은 原空位를 유지하고 팔꿈치와 손목이 내려가며 손바닥이 세로로 선다.','어깨를 풀고 상완은 약 45도 사선으로 남기며 팔꿈치를 가라앉힌다.'),
    'p002-m06-end':qishiState('p002-m06-end','팔꿈치 끝은 原空位를 유지하고 두 손바닥은 앞아래로 천천히 내려간다.','머리부터 발까지 위에서 아래로 차례로 풀어준다.')
  });
  const prep=[
    {title:'왼발을 비워, 움직일 준비',instruction:'오른다리로 몸을 받치며 가볍게 가라앉아. 왼발 뒤꿈치를 살짝 들어 발끝만 닿게 둬. 팔은 자연스럽게 내려놓아.',checks:['왼발 뒤꿈치를 들려고 몸을 기울이지 않아.','어깨를 올리지 말고 편안히 숨 쉬어.'],principle:'왼발을 옆으로 보내려면 먼저 그 발의 지지를 덜어내야 해. 발끝이 바닥에 닿아 있어도 주된 지지는 오른다리가 맡아.',yy:['虛','實','왼발을 비워 움직일 여지를 둔다.','오른다리가 몸을 받친다.','오른다리가 받쳐주는 만큼 왼발이 가벼워져. 한쪽의 지지와 다른 쪽의 비움은 함께 일어나.'],state:'p001-m01-end',contacts:{left:'Toe',right:null},events:[{id:'p001-m01-e1',target:'leftFoot',kind:'heel_raise',description:text('왼발 뒤꿈치를 살짝 든다.'),symbol:'Heel ↑'}]},
    {title:'빈 왼발을 옆으로 열어',instruction:'오른발에 지지를 유지하며 왼발을 왼쪽으로 옮겨. 어깨너비 자리에서 발끝을 비스듬히 가볍게 대고, 양손도 조금 열어.',checks:['중심이 왼발을 따라 급히 쏠리지 않는지 봐.','발 간격은 사부님이 지도한 어깨너비로 맞춰.'],principle:'발이 먼저 새 자리에 도착하고 중심이 뒤따라가. 왼발이 멀어졌다고 바로 체중을 싣는 건 아니야.',yy:['虛','實','왼발을 비워 움직일 여지를 둔다.','오른다리가 몸을 받친다.','왼발은 새 자리를 찾지만 오른다리가 계속 받쳐. 발의 위치 변화와 지지의 변화를 나누어 읽어.'],state:'p001-m02-end',contacts:{left:'Toe',right:null},events:[]},
    {title:'왼발을 정렬하며 지지를 옮겨',instruction:'왼발을 정면으로 정렬하고 뒤꿈치를 내려놓으며 왼다리에 지지를 옮겨. 양팔은 다리 앞 바깥쪽으로 돌아오고, 오른발은 가벼워져.',checks:['왼무릎이 발끝 방향에서 크게 어긋나지 않게 해.','오른발을 돌리기 전에 어느 다리가 지지하는지 느껴봐.'],principle:'이제 왼발이 몸을 받쳐. 오른발을 비워두면 다음 동작에서 발끝을 안쪽으로 정렬하기 쉬워져.',yy:['虛','實','오른발이 정렬할 여지를 갖는다.','왼다리가 몸을 받친다.','지지가 왼다리로 옮겨가며 오른발을 비울 여지가 생겨. 앞 동작과 허실의 역할이 바뀌는 지점이야.'],state:'p001-m03-end',contacts:{left:null,right:null},events:[{id:'p001-m03-e2',target:'leftFoot',kind:'heel_lower',description:text('왼발 뒤꿈치를 내린다.'),symbol:'Heel ↓'}]},
    {title:'오른발을 나란히 정렬해',instruction:'왼다리의 지지를 유지하며 오른발 끝을 안쪽으로 돌려. 두 발을 정면으로 나란히 두고, 어깨를 풀어 손이 다리 앞 바깥쪽에 내려오게 해.',checks:['두 발이 나란해져도 지지는 왼다리에 남겨둬.','오른발을 억지로 비틀거나 어깨를 누르지 않아.'],principle:'오른발은 정렬을 돕는 가벼운 발이야. 오른발에 체중이 많이 남아 있으면 돌릴 때 무릎까지 비틀기 쉬워.',yy:['虛','實','오른발이 정렬할 여지를 갖는다.','왼다리가 몸을 받친다.','왼다리가 받치는 동안 가벼운 오른발을 정렬해. 양발이 나란하다는 모양과 어느 발이 받치는가는 달라.'],state:'p001-m04-end',contacts:{left:null,right:null},events:[]}
  ];
  const qishi=[
    {title:'두 손을 몸 앞에서 가볍게 띄워',instruction:'預備式 마지막 상태에서 몸은 정면을 유지해. 어깨를 들지 말고 두 손이 몸 앞쪽으로 약 20도, 자료상 약 15cm 떠오르게 해. 손을 들어 올린다기보다 어깨와 팔의 긴장을 풀었을 때 앞쪽으로 부풀어 오르는 느낌으로 시작해.',checks:['어깨가 귀 쪽으로 올라가지 않아.','손을 앞으로 밀어내기보다 가볍게 떠오르게 해.','왼발 지지와 몸의 정면이 흔들리지 않는지 봐.'],principle:'팔을 국소적으로 들어 올리는 것보다 몸통의 축은 가라앉고 어깨는 풀린 상태에서 손이 가볍게 떠오르게 해. 외형이 열려도 중심과 지지는 흩어지지 않는 게 핵심이야.',yy:['開','合','두 손과 팔의 외형은 몸에서 조금 열리기 시작해.','발의 지지와 몸의 축은 안쪽으로 모아 유지해.','자료의 「形開氣合」을 신체적으로 읽으면, 바깥 모양은 열리되 중심은 흩어지지 않는 관계로 볼 수 있어.'],state:'p002-m01-end',contacts:{left:null,right:null},events:[]},
    {title:'두 팔을 어깨 높이까지 띄워',instruction:'두 팔을 천천히 앞쪽으로 더 띄워 어깨 높이까지 올려. 뒤쪽 견갑이 서서히 열리고 손목은 풀어서 손바닥이 자연스럽게 아래로 늘어지게 둬. 두 손의 폭은 대략 어깨너비를 유지해.',checks:['팔이 올라갈수록 어깨는 오히려 편안해.','양손 높이가 어깨선 근처에서 균형을 이뤄.','손목과 손가락에 불필요하게 힘을 주지 않아.'],principle:'높이를 만들려고 어깨를 으쓱하는 게 아니라, 견갑과 어깨 관절의 여유를 유지한 채 팔 전체가 떠오르는 흐름으로 봐. 손목은 끝까지 힘으로 고정하지 않아.',yy:['鬆','升','어깨·손목은 풀려 아래로 가라앉을 여지를 가져.','그 이완을 유지한 채 팔 전체는 위로 떠올라.','한쪽은 풀림, 다른 한쪽은 상승이라서 위로 간다고 위쪽 관절까지 긴장시킬 필요가 없어.'],state:'p002-m02-end',contacts:{left:null,right:null},events:[]},
    {title:'손목 자리는 두고 손바닥을 평평하게 세워',instruction:'두 손목의 原空位, 즉 공간상의 자리는 뒤로 거두지 않아. 팔꿈치를 느슨하게 아래로 가라앉히면 그 변화에 따라 손바닥과 손끝이 떠올라 앞으로 평평하게 펴져. 손끝은 앞, 손바닥은 아래를 향해.',checks:['손목이 몸 쪽으로 후퇴하지 않아.','팔꿈치는 아래로 풀리고 어깨는 들리지 않아.','손끝은 앞, 손바닥은 아래를 향하되 손가락을 빳빳하게 펴지 않아.'],principle:'여기서 原空位가 핵심이야. 손목을 몸 쪽으로 당겨 모양을 만드는 게 아니라, 손목의 공간 위치를 기준점으로 남겨두고 팔꿈치가 침강하면서 전완의 각도가 바뀌어. 한 관절의 내려감이 손끝의 올라감을 만든 셈이야.',yy:['不動','動','손목의 공간 위치는 기준점처럼 남겨둬.','팔꿈치는 내려가고 손바닥·손끝의 방향은 변해.','한 부분을 고정된 기준으로 두면 다른 부분의 변화가 선명해져. 原空位를 이해하기 좋은 동작이야.'],state:'p002-m03-end',contacts:{left:null,right:null},events:[]},
    {title:'팔꿈치를 풀어 손등을 어깨 쪽으로 거둬',instruction:'팔꿈치를 계속 느슨하게 풀어. 그 결과 손등이 양쪽 어깨 쪽으로 평평하게 가까워지고, 손목은 약 90도로 접혀. 손을 힘으로 당긴다기보다 팔꿈치가 풀리면서 손의 위치가 따라오는 흐름으로 연습해.',checks:['손을 세게 당기지 않아.','팔꿈치가 옆으로 들리지 않고 아래로 풀려 있어.','손목의 접힘 때문에 손가락까지 굳지 않아.'],principle:'거둔다고 해서 어깨나 이두근으로 손을 끌어당기는 게 아니야. 팔꿈치의 이완과 전완의 접힘이 손의 후퇴를 만들어. 움직이는 손보다 그 원인을 팔꿈치와 어깨에서 찾아보면 좋아.',yy:['收','鬆','손은 몸 쪽으로 거두어져.','그 거둠을 만드는 쪽은 힘을 더하는 게 아니라 팔꿈치를 푸는 일이야.','겉으로는 收지만 안쪽에서는 鬆이 일어나야 모양이 부드럽게 만들어져.'],state:'p002-m04-end',contacts:{left:null,right:null},events:[]},
    {title:'손끝은 原空位, 팔꿈치를 가라앉혀',instruction:'이번에는 두 손끝의 原空位를 남겨둬. 손끝을 아래로 끌지 말고, 어깨를 풀면서 팔꿈치 끝을 가라앉혀. 손목도 따라 내려오며 손바닥은 세로로 서는 太極掌 모양이 돼.',checks:['손끝이 아래로 같이 떨어지지 않아.','팔꿈치가 내려갈 때 어깨도 편안하게 풀려 있어.','세로 손바닥을 만들려고 손목만 억지로 꺾지 않아.'],principle:'3동작에서는 손목이 기준점이었다면 이번엔 손끝이 기준점이야. 끝점을 공간에 남겨두고 팔꿈치를 아래로 보내면 팔의 구조가 재배열돼. 손을 세운다보다 팔꿈치를 가라앉힌 결과 손바닥이 선다고 이해하면 훨씬 자연스러워.',yy:['定','沉','손끝은 공간의 기준점으로 남아 있어.','팔꿈치와 손목은 아래로 침강해.','끝점의 定과 근위부의 沉이 동시에 일어나면서 팔 전체의 구조가 바뀌어.'],state:'p002-m05-end',contacts:{left:null,right:null},events:[]},
    {title:'팔꿈치는 原空位, 손바닥을 앞아래로 가라앉혀',instruction:'두 팔꿈치 끝은 옆구리보다 약간 앞의 原空位에 남겨둬. 팔꿈치를 느슨하게 풀면서 두 손바닥이 앞아래 방향으로 천천히 가라앉아 몸과 약 160도, 즉 아래로 길게 뻗은 사선이 되게 해. 낙하산이 공기를 받듯 급히 누르지 말고 천천히 내려.',checks:['팔꿈치가 손을 따라 앞으로 쫓아가지 않아.','손바닥을 힘으로 눌러내리지 않아.','머리·목·어깨에서 발까지 위에서 아래로 차례로 풀리는지 느껴봐.'],principle:'이번엔 팔꿈치가 공간의 임시 기준점이 되고 전완이 그 아래에서 열리며 내려가. 팔로 바닥을 누르기보다 중력과 이완을 이용해 손이 떨어지는 느낌이 좋아. 자료가 말하는 공기 저항을 느끼는 낙하산 비유도 이 속도를 설명해.',yy:['定','落','팔꿈치 끝은 공간의 기준점으로 남아 있어.','손바닥과 전완은 앞아래로 천천히 내려가.','팔꿈치의 定이 있기 때문에 손의 落이 단순히 팔 전체가 무너지는 동작이 되지 않아.'],state:'p002-m06-end',contacts:{left:null,right:null},events:[]}
  ];
  const interpretations={};
  prep.forEach((m,i)=>{
    const n=i+1,mid=`p001-m${String(n).padStart(2,'0')}`;
    interpretations[`${mid}-principle`]={id:`${mid}-principle`,category:'principle',scope:{kind:'motion',motionId:mid},availability:'present',content:{explanation:text(m.principle)}};
    interpretations[`${mid}-yinyang`]={id:`${mid}-yinyang`,category:'yinYang',scope:{kind:'motion',motionId:mid},availability:'present',content:{terms:m.yy.slice(0,2),first:text(m.yy[2]),second:text(m.yy[3]),relation:text(m.yy[4])}};
  });
  interpretations['p001-application']={id:'p001-application',category:'application',scope:{kind:'posture',postureId:'p001'},availability:'present',content:{applicationType:'preparation',assumption:text('상대의 움직임에 맞춰 한 발을 옮겨야 한다고 가정해.'),response:text('한 다리가 몸을 받치는 동안 다른 발을 가볍게 옮기고 정렬해. 자리를 잡은 뒤 지지 역할을 바꿔.'),possibleResult:text('받치는 발과 움직일 발을 구분해, 다음 이동이나 대응을 준비하는 과정으로 읽을 수 있어.'),limitations:text('예비식의 준비 구조를 이해하기 위한 가정이야. 특정 공격을 막는 독립 기술이라고 단정하지 않아.')}};
  qishi.forEach((m,i)=>{
    const n=i+1,mid=`p002-m${String(n).padStart(2,'0')}`;
    interpretations[`${mid}-principle`]={id:`${mid}-principle`,category:'principle',scope:{kind:'motion',motionId:mid},availability:'present',content:{explanation:text(m.principle)}};
    interpretations[`${mid}-yinyang`]={id:`${mid}-yinyang`,category:'yinYang',scope:{kind:'motion',motionId:mid},availability:'present',content:{terms:m.yy.slice(0,2),first:text(m.yy[2]),second:text(m.yy[3]),relation:text(m.yy[4])}};
  });
  interpretations['p002-application']={id:'p002-application',category:'application',scope:{kind:'posture',postureId:'p002'},availability:'present',content:{applicationType:'preparation',assumption:text('상대와 팔이 접촉하거나 곧 접촉할 상황에서, 손의 한 지점을 바로 밀어내거나 잡아당기지 않고 구조를 바꿔야 한다고 가정해.'),response:text('손목·손끝·팔꿈치 중 한 지점을 공간의 기준으로 남겨두고 다른 관절을 풀거나 침강시켜 팔의 각도와 구조를 바꿔.'),possibleResult:text('접촉점을 크게 밀거나 당기지 않으면서도 몸 안쪽의 구조를 바꾸는 감각을 익히는 준비가 될 수 있어.'),limitations:text('太極起勢의 정식 전투 용법을 확정한 설명은 아니야. 여기서는 原空位와 鬆·沉의 구조가 접촉 상황에 어떻게 이어질 수 있는지만 본다.')}};
  const sections=taijiCatalog.map(s=>({id:`s${String(s.id).padStart(2,'0')}`,name:s.name,postureIds:s.poses.map(p=>`p${String(p.id).padStart(3,'0')}`)}));
  const postures={},views={},order=[];
  for(const section of taijiCatalog){
    for(const pose of section.poses){
      const pid=`p${String(pose.id).padStart(3,'0')}`,startId=`${pid}-start-view`,motionViewIds=[];
      postures[pid]={id:pid,number:pose.id,name:pose.name,motionCount:pose.count,startViewId:startId,motionViewIds};
      const startState=pose.id===1?'p001-start':pose.id===2?'p001-m04-end':null;
      const startInstruction=pose.id===1
        ? known('양 발꿈치를 붙이고 발끝을 바깥으로 연 外八字로 곧게 서. 오른발을 實로 두고 왼다리는 풀어 虛로 두며, 팔은 자연스럽게 내려 중지를 바지선 가까이에 두고 손바닥은 안쪽을 향하게 해.','source','qualitative','접근 가능한 易簡1–64식의 預備勢 準備動作·站姿 기록을 바탕으로 정리했어.')
        : pose.id===2
          ? known('預備式 4동작이 끝난 상태가 그대로 太極起勢의 시작 상태야. 왼발이 주로 받치고 두 발은 정면으로 나란한 상태에서 손·팔의 변화가 시작돼.','inference','qualitative','앞 자세의 마지막 상태를 다음 자세의 시작으로 읽는 프로젝트 연결 규칙이야.')
          : known('이전 자세를 마친 상태에서 다음 움직임을 준비해. 세부 설명은 모으는 중이야.','illustration','qualitative','아직 동작 자료를 채우는 중인 화면이야.');
      views[startId]={id:startId,kind:'start',postureId:pid,motionId:null,motionNumber:null,title:`${pose.name} · 시작 상태`,stateId:startState,fromStateId:null,instruction:startInstruction,checks:[],events:[],contactSymbols:{left:null,right:null},interpretationIds:pose.id===1?['p001-application']:pose.id===2?['p002-application']:[],sourceIds:(pose.id===1||pose.id===2)?['tsaifucius-yijian64']:[]};
      order.push(startId);
      let from=startState;
      for(let n=1;n<=pose.count;n++){
        const mid=`${pid}-m${String(n).padStart(2,'0')}`,vid=`${mid}-view`;
        const collection=pose.id===1?prep:pose.id===2?qishi:null,p=collection?.[n-1]||null,stateId=p?.state||null;
        const applicationId=pose.id===1?'p001-application':pose.id===2?'p002-application':null;
        const sourceId=pose.id===1?'legacy-preparation':pose.id===2?'tsaifucius-yijian64':null;
        views[vid]={id:vid,kind:'motion',postureId:pid,motionId:mid,motionNumber:n,title:p?.title||`${pose.name} · ${n}동작`,stateId,fromStateId:from,instruction:p?known(p.instruction,'source','qualitative',pose.id===2?'접근 가능한 易簡1–64식 太極起勢 기록을 바탕으로 정리한 내용이야. 현장 지도와 다르면 사부님의 지도를 우선해.':'접근 가능한 기존 수련 기록을 바탕으로 옮긴 내용이야. 원문·실연 대조는 이어서 보완해.'):unknown('unrecorded'),checks:p?p.checks.map(text):[],events:p?.events||[],contactSymbols:p?.contacts||{left:null,right:null},interpretationIds:p?[`${mid}-principle`,`${mid}-yinyang`,applicationId].filter(Boolean):[],sourceIds:p&&sourceId?[sourceId]:[]};
        order.push(vid);motionViewIds.push(vid);from=stateId;
      }
    }
  }
  const edges={};order.forEach((id,i)=>edges[id]={previous:order[i-1]||null,next:order[i+1]||null});
  const data={formatVersion:'0.1.0',profile:'collection-ui',meta:{datasetId:'yijian',datasetRevision:'preparation-start-003',coverage:{kind:'partial',note:'預備式 시작 상태·4동작과 太極起勢 시작 상태·6동작을 연결했고 나머지는 수집 중이야.'}},coordinateFrames:{'yijian-front':{id:'yijian-front',origin:'太極起勢 종료 기준',axes:{x:'initial-right',y:'initial-front'},unit:'initial-stance-width',footReference:'foot-shape-center-projection'}},catalog:{sections,postures},navigation:{order,edges},states,views,interpretations,sources:{
    'legacy-preparation':{id:'legacy-preparation',title:'eztaiji 기존 예비식 4동작과 학습용 도해',url:'https://github.com/winterrainlee/eztaiji/blob/b228b007d48756bdf83d6d2d3a0050a2b34a7f5e/training/datasets/yijian.json',note:'접근 가능한 기존 수련 기록을 바탕으로 모은 자료야. 원문과 사부님 실연의 대조는 이어서 보완해.'},
    'tsaifucius-yijian64':{id:'tsaifucius-yijian64',title:'Tsaifucius Tai Chi Notes · 易簡1–64式文字敘述',url:'https://tsaitaiji.blogspot.com/2024/03/1-64.html',note:'預備勢의 준비 자세와 太極起勢 1–6동의 순서·原空位·鬆肘·손바닥 방향 설명을 이번 수집에서 직접 확인한 온라인 기록이야. 현장 지도와 다르면 사부님의 지도를 우선해.'}
  }};
  globalThis.EZTAIJI_DATA=data;
  globalThis.EZTAIJI_READY=Promise.resolve(data);
})();