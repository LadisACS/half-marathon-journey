const SUPABASE_URL = "https://xcaxyqroxowreznnwcci.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IuFqJ7YQFI8jrGDCtcpLBw__T3nN0O6";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const CACHE_KEY='hmJourneyCloudCache';
const OLD_KEYS=['hmJourneyV2','hmJourney'];
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

let state={
 user:null,
 workouts:[],
 readiness:'green',
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

function toast(msg, bad=false){
 const t=document.getElementById('toast');t.textContent=msg;t.style.display='block';
 t.style.background=bad?'#32181d':'#152119';t.style.borderColor=bad?'#7a2a36':'#2a6b42';
 setTimeout(()=>t.style.display='none',2600)
}
function fmt(n){return (+n).toLocaleString('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:2})}
function pace(km,min){
 if(!km||!min)return '—';
 const p=min/km, whole=Math.floor(p), sec=Math.round((p-whole)*60);
 return `${whole}:${String(sec===60?0:sec).padStart(2,'0')} min/km`;
}
function getRuns(){return state.workouts.filter(w=>w.workout_type==='Běh')}
function cache(){localStorage.setItem(CACHE_KEY,JSON.stringify({workouts:state.workouts,readiness:state.readiness,week:state.week}))}
function loadCache(){
 try{
  const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
  if(c){state.workouts=c.workouts||[];state.readiness=c.readiness||'green';state.week=c.week||state.week}
 }catch(e){}
}
function compute(){
 const runs=getRuns();
 const total=runs.reduce((a,w)=>a+(+w.distance_km||0),0);
 const cont=runs.filter(w=>w.continuous===true);
 const longest=Math.max(0,...cont.map(w=>+w.distance_km||0));
 const unlocked=achievements.filter(a=>{
   if(a.kind==='first') return runs.length>0;
   if(a.km) return longest>=a.km;
   if(a.total) return total>=a.total;
   if(a.runs) return runs.length>=a.runs;
   return false;
 });
 const xp=runs.length*10 + state.workouts.filter(w=>w.workout_type==='Posilovna').length*5 + unlocked.length*10;
 const levels=[
  [0,1,'ROOKIE RUNNER',60],[60,2,'BEGINNER RUNNER',120],[120,3,'5K RUNNER',190],[190,4,'ENDURANCE RUNNER',280],
  [280,5,'10K RUNNER',400],[400,6,'LONG DISTANCE RUNNER',550],[550,7,'HALF-MARATHON READY',700],[700,8,'HALF-MARATHON FINISHER',800]
 ];
 let lv=levels[0]; for(const x of levels){if(xp>=x[0])lv=x}
 return {runs,total,longest,unlocked,xp,level:lv[1],name:lv[2],threshold:lv[3],prev:lv[0]};
}
function datePlus(offset){const d=new Date();d.setDate(d.getDate()+offset);return d}
function czDate(d){return d.toLocaleDateString('cs-CZ',{weekday:'short',day:'numeric',month:'numeric'})}
function renderWeek(){
 document.getElementById('weekGrid').innerHTML=state.week.map((x,i)=>`<div class="day ${i===0?'todayDay':''}"><strong>${czDate(datePlus(x.offset))}</strong><div>${x.title}</div><div class="muted small" style="margin-top:6px">${x.detail}</div></div>`).join('');
}
async function saveUserState(){
 if(!state.user)return;
 const payload={user_id:state.user.id,readiness:state.readiness,weekly_plan:state.week,settings:{}};
 const {error}=await sb.from('user_state').upsert(payload,{onConflict:'user_id'});
 if(error)throw error;
}
async function resetWeek(){
 state.week=[
   {offset:0,title:'Easy Run',detail:'30 min · RPE 3–4'},
   {offset:1,title:'PULL / volno',detail:'Podle regenerace'},
   {offset:2,title:'Easy Run',detail:'25–30 min'},
   {offset:3,title:'LEGS + core',detail:'Nepřehnat objem'},
   {offset:4,title:'Recovery',detail:'Chůze / volno'},
   {offset:5,title:'Easy / delší',detail:'30–35 min'},
   {offset:6,title:'Volno',detail:'Regenerace'}
 ];
 try{await saveUserState();cache();renderWeek();toast('Týdenní plán uložen do cloudu')}catch(e){toast(e.message,true)}
}
async function loadCloud(){
 if(!state.user)return;
 document.getElementById('cloudStatus').textContent='Cloud: synchronizuji…';
 const [w,s]=await Promise.all([
   sb.from('workouts').select('*').order('workout_date',{ascending:false}),
   sb.from('user_state').select('*').eq('user_id',state.user.id).maybeSingle()
 ]);
 if(w.error)throw w.error;
 state.workouts=w.data||[];
 if(s.error)throw s.error;
 if(s.data){
   state.readiness=s.data.readiness||'green';
   if(Array.isArray(s.data.weekly_plan)&&s.data.weekly_plan.length)state.week=s.data.weekly_plan;
 } else {
   await saveUserState();
 }
 cache();render();
 document.getElementById('cloudStatus').textContent='Cloud: synchronizováno';
}
async function addWorkout(){
 if(!state.user)return toast('Nejdřív se přihlas.',true);
 const km=+document.getElementById('km').value||null;
 const min=+document.getElementById('minutes').value||null;
 const payload={
   user_id:state.user.id,
   workout_date:document.getElementById('date').value,
   workout_type:document.getElementById('type').value,
   distance_km:km,
   duration_minutes:min,
   rpe:+document.getElementById('rpe').value||null,
   continuous:document.getElementById('continuous').value==='yes',
   planned_workout:document.getElementById('plan').value.trim()||null,
   note:document.getElementById('note').value.trim()||null
 };
 const btn=document.getElementById('saveWorkoutBtn');btn.disabled=true;btn.textContent='Ukládám…';
 const {error}=await sb.from('workouts').insert(payload);
 btn.disabled=false;btn.textContent='Uložit do cloudu';
 if(error)return toast(error.message,true);
 document.getElementById('km').value='';document.getElementById('minutes').value='';document.getElementById('rpe').value='';document.getElementById('note').value='';
 await loadCloud();toast('Trénink uložen do cloudu');
}
async function removeWorkout(id){
 if(!confirm('Smazat tento záznam z cloudu?'))return;
 const {error}=await sb.from('workouts').delete().eq('id',id);
 if(error)return toast(error.message,true);
 await loadCloud();toast('Záznam smazán');
}
async function setReadiness(r){
 state.readiness=r;render();
 try{await saveUserState();cache();toast('Readiness uložena do cloudu')}catch(e){toast(e.message,true)}
}
async function migrateLocal(){
 if(!state.user)return;
 let old=null,source=null;
 for(const k of OLD_KEYS){
   try{const x=JSON.parse(localStorage.getItem(k)||'null');if(x&&Array.isArray(x.workouts)&&x.workouts.length){old=x;source=k;break}}catch(e){}
 }
 if(!old)return toast('V tomto prohlížeči nejsou stará lokální data.',true);
 if(!confirm(`Nalezeno ${old.workouts.length} starých záznamů. Nahrát je do cloudu?`))return;
 const rows=old.workouts.map(w=>({
   user_id:state.user.id,
   workout_date:w.date||new Date().toISOString().slice(0,10),
   workout_type:w.type||'Běh',
   distance_km:+w.km||null,
   duration_minutes:+w.minutes||null,
   rpe:+w.rpe||null,
   continuous:w.continuous==='yes'||w.continuous===true,
   planned_workout:w.plan||null,
   note:w.note||null
 }));
 const {error}=await sb.from('workouts').insert(rows);
 if(error)return toast(error.message,true);
 if(old.readiness)state.readiness=old.readiness;
 if(Array.isArray(old.week)&&old.week.length)state.week=old.week;
 await saveUserState();await loadCloud();
 toast(`Přeneseno ${rows.length} záznamů do cloudu`);
}
function exportData(){
 const blob=new Blob([JSON.stringify({workouts:state.workouts,readiness:state.readiness,week:state.week},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='half-marathon-cloud-backup.json';a.click();URL.revokeObjectURL(a.href);
}
function drawChart(){
 const c=document.getElementById('chart'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
 const runs=getRuns().filter(w=>w.workout_date).sort((a,b)=>a.workout_date.localeCompare(b.workout_date));
 const byWeek={};
 runs.forEach(w=>{
  const d=new Date(w.workout_date+'T12:00:00');const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);
  const k=d.toISOString().slice(0,10);byWeek[k]=(byWeek[k]||0)+(+w.distance_km||0);
 });
 const entries=Object.entries(byWeek).slice(-10);
 ctx.fillStyle='#9aa6b6';ctx.font='13px system-ui';
 if(!entries.length){ctx.fillText('Zatím nejsou data pro graf.',20,35);return}
 const max=Math.max(...entries.map(x=>x[1]),1),pad=38,W=c.width-pad*2,H=c.height-pad*2;
 ctx.strokeStyle='#263244';ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,c.height-pad);ctx.lineTo(c.width-pad,c.height-pad);ctx.stroke();
 entries.forEach((e,i)=>{
   const x=pad+i*(W/Math.max(1,entries.length-1)),y=c.height-pad-(e[1]/max)*H;
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
 document.getElementById('xpText').textContent=s.xp+' XP';const xpPct=Math.min(100,(s.xp-s.prev)/(s.threshold-s.prev)*100);document.getElementById('xpBar').style.width=xpPct+'%';document.getElementById('xpNext').textContent=`Do dalšího levelu: ${Math.max(0,s.threshold-s.xp)} XP`;
 const next=achievements.find(a=>a.km&&s.longest<a.km);document.getElementById('nextGoal').textContent=next?next.desc.replace('Uběhni ','').replace(' souvisle.',''):'Half marathon dokončen!';
 document.getElementById('logRows').innerHTML=state.workouts.map(w=>`<tr><td>${w.workout_date||''}</td><td>${w.workout_type}</td><td>${w.planned_workout||'—'}</td><td>${w.distance_km??'—'}</td><td>${w.duration_minutes??'—'}</td><td>${pace(+w.distance_km,+w.duration_minutes)}</td><td>${w.rpe??'—'}</td><td>${w.continuous?'Ano':'Ne'}</td><td>${w.note||''}</td><td><button class="danger" onclick="removeWorkout('${w.id}')">×</button></td></tr>`).join('');
 document.getElementById('achGrid').innerHTML=achievements.map(a=>`<div class="${s.unlocked.some(x=>x.id===a.id)?'on':''}"><b>${s.unlocked.some(x=>x.id===a.id)?'✅':'🔒'} ${a.name}</b><span class="muted small">${a.desc}</span></div>`).join('');
 document.getElementById('recordsBox').innerHTML=`<p><b>Nejdelší souvislý běh:</b> ${fmt(s.longest)} km</p><p><b>Celkem naběháno:</b> ${fmt(s.total)} km</p><p><b>Počet běhů:</b> ${s.runs.length}</p>`;
 const avg=s.runs.length?s.runs.reduce((a,w)=>a+(w.rpe||0),0)/s.runs.length:0;
 document.getElementById('statsBox').innerHTML=`<p><b>Průměrné RPE běhů:</b> ${avg?fmt(avg):'—'}</p><p><b>XP:</b> ${s.xp}</p><p><b>Level:</b> ${s.level}</p><p><b>Readiness:</b> ${state.readiness.toUpperCase()}</p>`;
 document.querySelectorAll('.readyBtns button').forEach(b=>b.classList.toggle('selected',b.dataset.r===state.readiness));
 renderWeek();drawChart();
}
async function signIn(){
 const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;
 const info=document.getElementById('authInfo');info.textContent='Přihlašuji…';
 const {error}=await sb.auth.signInWithPassword({email,password});
 if(error){info.textContent=error.message;return}
 info.textContent='';
}
async function signUp(){
 const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;
 const info=document.getElementById('authInfo');info.textContent='Vytvářím účet…';
 const redirectTo=window.location.origin+window.location.pathname;
 const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});
 if(error){info.textContent=error.message;return}
 if(data.session)info.textContent='Účet vytvořen a přihlášen.';
 else info.textContent='Účet vytvořen. Zkontroluj e-mail a potvrď registraci.';
}
async function logout(){await sb.auth.signOut()}
async function handleSession(session){
 state.user=session?.user||null;
 const ov=document.getElementById('authOverlay');
 if(!state.user){ov.classList.remove('hide');document.getElementById('cloudStatus').textContent='Cloud: odhlášeno';loadCache();render();return}
 ov.classList.add('hide');
 document.getElementById('cloudStatus').textContent=`Cloud: ${state.user.email}`;
 try{await loadCloud()}catch(e){document.getElementById('cloudStatus').textContent='Cloud: chyba synchronizace';toast(e.message,true)}
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.tab).classList.add('active');if(b.dataset.tab==='dashboard')drawChart();
}));
document.querySelectorAll('.readyBtns button').forEach(b=>b.addEventListener('click',()=>setReadiness(b.dataset.r)));
document.getElementById('loginBtn').addEventListener('click',signIn);
document.getElementById('signupBtn').addEventListener('click',signUp);
document.getElementById('logoutBtn').addEventListener('click',logout);
document.getElementById('saveWorkoutBtn').addEventListener('click',addWorkout);
document.getElementById('resetWeekBtn').addEventListener('click',resetWeek);
document.getElementById('migrateBtn').addEventListener('click',migrateLocal);
document.getElementById('exportBtn').addEventListener('click',exportData);
['km','minutes'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{
 document.getElementById('pacePreview').textContent=pace(+document.getElementById('km').value,+document.getElementById('minutes').value);
}));
document.getElementById('date').value=new Date().toISOString().slice(0,10);
loadCache();render();
sb.auth.onAuthStateChange((_event,session)=>handleSession(session));
sb.auth.getSession().then(({data})=>handleSession(data.session));
