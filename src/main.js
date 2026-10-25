import { ECGEngine } from './ecgEngine.js';

const $=i=>document.getElementById(i),N=720,GAP=24;
const PTS=[{id:'PT-90412',name:'Aarav Mehta',info:'54 y · Male · Chest pain follow-up',hr:72},{id:'PT-90377',name:'Sunita Verma',info:'61 y · Female · Routine screening',hr:64},{id:'PT-90503',name:'Rohan Iyer',info:'38 y · Male · Palpitations',hr:88}];
const SC={I:.75,II:1,V1:.6};
let eng=new ECGEngine(),cur=PTS[0],lead='II',th=.035,run=false,sound=true,last=0,acc=0,head=0,el=0,lastEx=-9,inA=false,acked=false,ev=[],uiT=0;
let O=new Float32Array(N).fill(NaN),B=new Float32Array(N).fill(NaN),E=new Float32Array(N);
const cv=$('ecg'),c=cv.getContext('2d');
const rate=()=>cur.hr*2.618;

function grid(w,h){c.fillStyle='#04121a';c.fillRect(0,0,w,h);
  for(let i=0;i<=w;i+=10){c.strokeStyle=i%50?'#0b2530':'#123a48';c.beginPath();c.moveTo(i+.5,0);c.lineTo(i+.5,h);c.stroke()}
  for(let j=0;j<=h;j+=10){c.strokeStyle=j%50?'#0b2530':'#123a48';c.beginPath();c.moveTo(0,j+.5);c.lineTo(w,j+.5);c.stroke()}}
function draw(){
  const r=cv.getBoundingClientRect(),w=r.width,h=r.height,d=devicePixelRatio||1;
  if(cv.width!==Math.round(w*d)){cv.width=w*d;cv.height=h*d;c.setTransform(d,0,0,d,0,0)}
  grid(w,h);const s=SC[lead],X=i=>i/(N-1)*w,Y=v=>h-((v*s+.5)/2.3)*h;
  const path=(A,col,lw,dash,glow)=>{c.beginPath();c.setLineDash(dash||[]);c.strokeStyle=col;c.lineWidth=lw;c.lineJoin='round';c.shadowColor=glow||'transparent';c.shadowBlur=glow?10:0;
    let pen=false;for(let i=0;i<N;i++){const gap=((i-head+N)%N)<GAP;if(isNaN(A[i])||gap){pen=false;continue}pen?c.lineTo(X(i),Y(A[i])):c.moveTo(X(i),Y(A[i]));pen=true}c.stroke();c.setLineDash([]);c.shadowBlur=0};
  path(B,'#5f8190',1.2,[5,4]);path(O,'#4dffb8',2.2,null,'#4dffb8');
  c.strokeStyle='#ff5d6c';c.lineWidth=4;c.lineCap='round';c.shadowColor='#ff5d6c';c.shadowBlur=12;
  for(let i=1;i<N;i++){const gap=((i-head+N)%N)<GAP;if(!gap&&E[i]>th&&E[i-1]>th&&!isNaN(O[i-1])){c.beginPath();c.moveTo(X(i-1),Y(O[i-1]));c.lineTo(X(i),Y(O[i]));c.stroke()}}
  c.shadowBlur=0;
}
function step(){
  const s=eng.next();O[head]=s.o;B[head]=s.b;E[head]=s.e;head=(head+1)%N;el+=1/rate();
  if(s.e>th)lastEx=el;
  const a=el-lastEx<.2;
  if(a&&!inA){inA=true;acked=false;ev.push({t:el,pt:cur.id,pk:s.e,lead});beep();logUI()}
  if(!a)inA=false;
  if(inA)ev[ev.length-1].pk=Math.max(ev[ev.length-1].pk,s.e);
  return s}
function beep(){if(!sound)return;try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.value=.08;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.25)}catch(e){}}
function ui(s){
  $('status').classList.toggle('bad',inA);$('sv').textContent=inA?'Anomaly detected':'Normal';
  $('sp').textContent=inA?'ST-segment deviation from the healthy baseline.':'Signal matches the learned healthy baseline.';
  $('alert').classList.toggle('on',inA&&!acked);
  $('mse').textContent=s.e.toFixed(3);$('hr').textContent=cur.hr+Math.round((Math.random()-.5)*2);
  $('sub').textContent='Streaming · '+el.toFixed(0)+' s elapsed · '+cur.name;findings()}
function findings(){const a=inA;
  const R=(n,o,rg,dv,m,bad)=>`<div class="row ${bad?'bad':''}"><i></i><div><span>Segment</span><b>${n}</b></div><div><span>Observed</span><b>${o}</b></div><div><span>Normal range</span>${rg}</div><div><span>${bad?'Finding':'Interpretation'}</span>${m} <small style="color:var(--muted)">(${dv})</small></div><span class="chip">${bad?'Abnormal':'Normal'}</span></div>`;
  $('t-find').innerHTML=R('P wave','0.12 mV','0.08 – 0.16 mV','+0.01 mV','Normal atrial depolarization')+R('QRS complex','88 ms','80 – 100 ms','0 ms','Normal ventricular depolarization')+
  R('ST segment',a?'+0.45 mV':'+0.02 mV','−0.05 to +0.10 mV',a?'+0.40 mV':'+0.01 mV',a?'Acute ST elevation, ischemia risk':'Normal isoelectric baseline',a)}
function logUI(){$('cnt').textContent='('+ev.length+')';
  $('t-log').innerHTML=ev.length?ev.slice().reverse().map(e=>`<div class="ev"><span><b style="color:var(--bad)">ST elevation</b> · ${e.pt} · Lead ${e.lead}<br><span style="color:var(--muted)">Peak error ${e.pk.toFixed(3)}</span></span><span class="num">${e.t.toFixed(1)} s</span></div>`).join(''):'<div class="p"><p style="margin:0">No anomalies detected yet. Start the stream to begin monitoring.</p></div>'}
function report(){const per=PTS.map(p=>[p,ev.filter(e=>e.pt===p.id).length]);
  $('rsub').textContent='Anomaly events recorded in this session';
  $('rep').innerHTML=per.map(([p,n])=>`<div class="ev"><span><b>${p.name}</b> · ${p.id}<br><span style="color:var(--muted)">${p.info}</span></span><span class="chip" style="${n?'background:var(--bad-soft);color:var(--bad)':''}">${n} ${n===1?'event':'events'}</span></div>`).join('')}
function plist(){$('ptlist').innerHTML=PTS.map((p,i)=>`<button class="pt" data-i="${i}"><h3>${p.name}</h3><p>${p.id}<br>${p.info}</p><span class="chip">Baseline ${p.hr} bpm</span></button>`).join('');
  $('pt').innerHTML=PTS.map((p,i)=>`<option value="${i}">${p.name} (${p.id})</option>`).join('')}
function setPt(i){cur=PTS[i];$('pt').value=i;eng=new ECGEngine();O.fill(NaN);B.fill(NaN);E.fill(0);head=0;inA=false;acked=true;lastEx=-9;$('hr').textContent=cur.hr;$('alert').classList.remove('on');show('monitor')}
function show(v){['monitor','patients','reports'].forEach(k=>$('v-'+k).classList.toggle('hide',k!==v));
  document.querySelectorAll('nav [data-v]').forEach(b=>b.toggleAttribute('aria-current',b.dataset.v===v)&&0);
  document.querySelectorAll('nav [data-v]').forEach(b=>b.dataset.v===v?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
  if(v==='reports')report()}
function seg(id,fn){const g=$(id);g.onclick=e=>{const b=e.target.closest('button');if(!b)return;g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));fn(b)}}
function loop(ts){if(run){acc+=(ts-last)/1000*rate();last=ts;let n=Math.min(Math.floor(acc),40),s;acc-=Math.floor(acc);
  while(n-->0)s=step();if(s&&ts-uiT>100){uiT=ts;ui(s)}}draw();requestAnimationFrame(loop)}
document.querySelectorAll('nav [data-v]').forEach(b=>b.onclick=()=>show(b.dataset.v));
$('ptlist').onclick=e=>{const b=e.target.closest('.pt');if(b)setPt(+b.dataset.i)};
$('pt').onchange=e=>setPt(+e.target.value);
$('stream').onclick=function(){run=!run;last=performance.now();this.classList.toggle('live',run);this.querySelector('span').textContent=run?'Pause stream':'Start stream';
  this.querySelector('svg').innerHTML=run?'<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>':'<path d="M6 4l14 8-14 8z"/>';if(!run)$('sub').textContent='Paused · '+cur.name};
$('inject').onclick=()=>{if(!run)$('stream').click();eng.trigger()};
$('ack').onclick=()=>{acked=true;$('alert').classList.remove('on')};
seg('lead',b=>{lead=b.textContent;$('tag').textContent='Lead '+lead+' · 25 mm/s'});
seg('sens',b=>{th=+b.dataset.t;$('thv').textContent=th.toFixed(3)});
seg('snd',b=>{sound=b.classList.contains('x')});
seg('tabs',b=>{['find','log','about'].forEach(k=>$('t-'+k).classList.toggle('hide',k!==b.dataset.t))});
$('theme').onclick=()=>{const r=document.documentElement,d=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.dataset.theme=d?'light':'dark'};
plist();findings();logUI();requestAnimationFrame(loop);
