const KEY='hmJourneyV2';
const achievements=[
{id:'first',name:'👟 FIRST RUN',desc:'Dokonči první zaznamenaný běh.',kind:'first'},
{id:'1k',name:'1️⃣ 1K CLUB',desc:'Uběhni 1 km souvisle.',km:1},
{id:'2k',name:'2️⃣ 2K CLUB',desc:'Uběhni 2 km souvisle.',km:2},
{id:'3k',name:'3️⃣ 3K CLUB',desc:'Uběhni 3 km souvisle.',km:3},
{id:'4k',name:'4️⃣ 4K CLUB',desc:'Uběhni 4 km souvisle.',km:4},
{id:'5k',name:'⭐ 5K FINISHER',desc:'Uběhni 5 km souvisle.',km:5},
{id:'75k',name:'🏃 GOING LONGER',desc:'Uběhni 7,5 km souvisle.',km:7.5},
{id:'10k',name:'🥉 10K FINISHER',desc:'Uběhni 10 km souvisle.',km:10},
{id:'125k',name:'🧱 ENDURANCE BUILDER',desc:'Uběhni 12,5 km souvisle.',km:12.5},
{id:'15k',name:'🚀 15K FINISHER',desc:'Uběhni 15 km souvisle.',km:15},
{id:'18k',name:'🏰 ALMOST THERE',desc:'Uběhni 18 km souvisle.',km:18},
{id:'20k',name:'👑 20K CLUB',desc:'Uběhni 20 km souvisle.',km:20},
{id:'hm',name:'🏆 HALF-MARATHON FINISHER',desc:'Uběhni 21,1 km souvisle.',km:21.1},
{id:'25total',name:'25K TOTAL',desc:'Naběhej celkem 25 km.',total:25},
{id:'50total',name:'50K TOTAL',desc:'Naběhej celkem 50 km.',total:50},
{id:'100total',name:'💯 100K CLUB',desc:'Naběhej celkem 100 km.',total:100},
{id:'3runs',name:'🔥 GETTING STARTED',desc:'Dokonči 3 běhy.',runs:3},
{id:'10runs',name:'🔥 CONSISTENCY I',desc:'Dokonči 10 běhů.',runs:10}
];

let data=JSON.parse(localStorage.getItem(KEY)||'null')||{
 workouts:[], readiness:'green',
 week:[
   {offset:0,title:'Easy Run',detail:'30 min · RPE 3–4'},
   {offset:1,title:'PULL / volno',detail:'Podle regenerace'},
   {offset:2,title:'Easy Run',detail:'25–30 min'},
   {offset:3,title:'LEGS + core',detail:'Nepřehnat objem'},
   {offset:4,title:'Recovery',detail:'Chůze / volno'},
   {offset:5,title:'Easy / delší',detail:'30–35 min'},
   {offset:6,title:'Volno',detail:'Regenerace'}
 ]
};

function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function fmt(n){return (+n).toLocaleString('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:2})}
function getRuns(){return data.workouts.filter(w=>w.type==='Běh')}
function compute(){
 const runs=getRuns();
 const total=runs.reduce((a,w)=>a+(+w.km||0),0);
 const cont=runs.filter(w=>w.continuous==='yes');
 const longest=Math.max(0,...cont.map(w=>+w.km||0));
 const unlocked=achievements.filter(a=>{
   if(a.kind==='first') return runs.length>0;
   if(a.km) return longest>=a.km;
   if(a.total) return total>=a.total;
   if(a.runs) return runs.length>=a.runs;
   return false;
 });
 const xp=runs.length*10 + data.workouts.filter(w=>w.type==='Posilovna').length*5 + unlocked.length*10;
 const levels=[
  [0,1,'ROOKIE RUNNER',60],[60,2,'BEGINNER RUNNER',120],[120,3,'5K RUNNER',190],[190,4,'ENDURANCE RUNNER',280],
  [280,5,'10K RUNNER',400],[400,6,'LONG DISTANCE RUNNER',550],[550,7,'HALF-MARATHON READY',700],[700,8,'HALF-MARATHON FINISHER',800]
 ];
 let lv=levels[0]; for(const x of levels){if(xp>=x[0])lv=x}
 return {runs,total,longest,unlocked,xp,level:lv[1],name:lv[2],threshold:lv[3],prev:lv[0]};
}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',2200)}
function datePlus(offset){const d=new Date();d.setDate(d.getDate()+offset);return d}
function czDate(d){return d.toLocaleDateString('cs-CZ',{weekday:'short',day:'numeric',month:'numeric'})}
function renderWeek(){
 const box=document.getElementById('weekGrid');
 box.innerHTML=data.week.map((x,i)=>`<div class="day ${i===0?'todayDay':''}">
   <strong>${czDate(datePlus(x.offset))}</strong>
   <div>${x.title}</div><div class="muted small" style="margin-top:6px">${x.detail}</div>
 </div>`).join('');
}
function resetWeek(){
 data.week=[
   {offset:0,title:'Easy Run',detail:'30 min · RPE 3–4'},
   {offset:1,title:'PULL / volno',detail:'Podle regenerace'},
   {offset:2,title:'Easy Run',detail:'25–30 min'},
   {offset:3,title:'LEGS + core',detail:'Nepřehnat objem'},
   {offset:4,title:'Recovery',detail:'Chůze / volno'},
   {offset:5,title:'Easy / delší',detail:'30–35 min'},
   {offset:6,title:'Volno',detail:'Regenerace'}
 ];save();renderWeek();toast('Týdenní plán obnoven');
}
function addWorkout(){
 const w={
  id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  date:document.getElementById('date').value,
  type:document.getElementById('type').value,
  km:+document.getElementById('km').value||0,
  minutes:+document.getElementById('minutes').value||0,
  rpe:+document.getElementById('rpe').value||0,
  continuous:document.getElementById('continuous').value,
  plan:document.getElementById('plan').value.trim(),
  note:document.getElementById('note').value.trim()
 };
 data.workouts.push(w); save(); render(); toast('Trénink uložen');
}
function removeWorkout(id){if(confirm('Smazat tento záznam?')){data.workouts=data.workouts.filter(w=>w.id!==id);save();render()}}
function exportData(){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='half-marathon-journey-backup.json';a.click();URL.revokeObjectURL(a.href);
}
function importData(){
 const f=document.getElementById('importFile').files[0]; if(!f)return alert('Vyber JSON zálohu.');
 const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);save();render();toast('Záloha obnovena')}catch(e){alert('Neplatný soubor')}};r.readAsText(f);
}
function clearAll(){if(confirm('Opravdu vymazat všechna data?')){localStorage.removeItem(KEY);location.reload()}}
function drawChart(){
 const c=document.getElementById('chart'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
 const runs=getRuns().filter(w=>w.date).sort((a,b)=>a.date.localeCompare(b.date));
 const byWeek={};
 runs.forEach(w=>{
  const d=new Date(w.date+'T12:00:00'); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day);
  const k=d.toISOString().slice(0,10); byWeek[k]=(byWeek[k]||0)+(+w.km||0);
 });
 const entries=Object.entries(byWeek).slice(-10);
 ctx.fillStyle='#9aa6b6';ctx.font='13px system-ui';
 if(!entries.length){ctx.fillText('Zatím nejsou data pro graf.',20,35);return}
 const max=Math.max(...entries.map(x=>x[1]),1), pad=38, W=c.width-pad*2,H=c.height-pad*2;
 ctx.strokeStyle='#263244'; ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,c.height-pad);ctx.lineTo(c.width-pad,c.height-pad);ctx.stroke();
 entries.forEach((e,i)=>{
   const x=pad+i*(W/Math.max(1,entries.length-1)), y=c.height-pad-(e[1]/max)*H;
   if(i){const p=entries[i-1],px=pad+(i-1)*(W/Math.max(1,entries.length-1)),py=c.height-pad-(p[1]/max)*H;ctx.strokeStyle='#69e58d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(x,y);ctx.stroke()}
   ctx.fillStyle='#5aa7ff';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#9aa6b6';ctx.font='11px system-ui';ctx.fillText(e[0].slice(5),x-15,c.height-14);
 });
}
function render(){
 const s=compute();
 document.getElementById('levelBadge').textContent=`LVL ${s.level} · ${s.name}`;
 document.getElementById('longest').textContent=fmt(s.longest)+' km';
 document.getElementById('totalKm').textContent=fmt(s.total)+' km';
 document.getElementById('runCount').textContent=s.runs.length;
 document.getElementById('achCount').textContent=`${s.unlocked.length} / ${achievements.length}`;
 const hp=Math.min(100,s.longest/21.1*100);document.getElementById('hmPct').textContent=Math.round(hp)+' %';document.getElementById('hmBar').style.width=hp+'%';
 document.getElementById('xpText').textContent=s.xp+' XP'; const xpPct=Math.min(100,(s.xp-s.prev)/(s.threshold-s.prev)*100);document.getElementById('xpBar').style.width=xpPct+'%';document.getElementById('xpNext').textContent=`Do dalšího levelu: ${Math.max(0,s.threshold-s.xp)} XP`;
 const next=achievements.find(a=>a.km&&s.longest<a.km);document.getElementById('nextGoal').textContent=next?next.desc.replace('Uběhni ','').replace(' souvisle.',''):'Half marathon dokončen!';
 document.getElementById('logRows').innerHTML=[...data.workouts].sort((a,b)=>b.date.localeCompare(a.date)).map(w=>`<tr><td>${w.date||''}</td><td>${w.type}</td><td>${w.plan||'—'}</td><td>${w.km||'—'}</td><td>${w.minutes||'—'}</td><td>${w.rpe||'—'}</td><td>${w.continuous==='yes'?'Ano':'Ne'}</td><td>${w.note||''}</td><td><button class="danger" onclick="removeWorkout('${w.id}')">×</button></td></tr>`).join('');
 document.getElementById('achGrid').innerHTML=achievements.map(a=>`<div class="${s.unlocked.some(x=>x.id===a.id)?'on':''}"><b>${s.unlocked.some(x=>x.id===a.id)?'✅':'🔒'} ${a.name}</b><span class="muted small">${a.desc}</span></div>`).join('');
 document.getElementById('recordsBox').innerHTML=`<p><b>Nejdelší souvislý běh:</b> ${fmt(s.longest)} km</p><p><b>Celkem naběháno:</b> ${fmt(s.total)} km</p><p><b>Počet běhů:</b> ${s.runs.length}</p>`;
 const avg=s.runs.length?s.runs.reduce((a,w)=>a+(w.rpe||0),0)/s.runs.length:0;
 document.getElementById('statsBox').innerHTML=`<p><b>Průměrné RPE běhů:</b> ${avg?fmt(avg):'—'}</p><p><b>XP:</b> ${s.xp}</p><p><b>Level:</b> ${s.level}</p><p><b>Readiness:</b> ${data.readiness.toUpperCase()}</p>`;
 document.querySelectorAll('.readyBtns button').forEach(b=>b.classList.toggle('selected',b.dataset.r===data.readiness));
 renderWeek();drawChart();
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.tab).classList.add('active');if(b.dataset.tab==='dashboard')drawChart();
}));
document.querySelectorAll('.readyBtns button').forEach(b=>b.addEventListener('click',()=>{data.readiness=b.dataset.r;save();render();toast('Readiness aktualizována')}));
document.getElementById('date').value=new Date().toISOString().slice(0,10);
render();
