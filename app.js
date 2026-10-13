/* SemillApp — ambiente vivo: cielo según la hora, sol, luna, nubes, hojas, luciérnagas, garúa y lluvia */
(function(){
const KEY="sa-ajustes";
const DEF={tema:"auto",clima:"despejado",anim:true};
let A={...DEF}; try{ A={...DEF,...JSON.parse(localStorage.getItem(KEY)||"{}")}; }catch(e){}
const listeners=[];
function settings(){ return A; }
function set(patch){ A={...A,...patch}; try{ localStorage.setItem(KEY,JSON.stringify(A)); }catch(e){} applyTheme(); listeners.forEach(f=>f(A)); }
function onChange(f){ listeners.push(f); }

function hourNow(){ const d=new Date(); return d.getHours()+d.getMinutes()/60; }
function env(){
  let h=hourNow(), phase;
  if(h>=5.5&&h<8.5) phase="amanecer"; else if(h>=8.5&&h<16.5) phase="dia"; else if(h>=16.5&&h<18.7) phase="atardecer"; else phase="noche";
  if(A.tema==="dia"&&phase==="noche"){ phase="dia"; h=11; }
  if(A.tema==="noche"){ phase="noche"; h=21; }
  return {phase,h,clima:A.clima,night:phase==="noche",anim:A.anim&&!reduced()};
}
const reduced=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function applyTheme(){ document.documentElement.setAttribute("data-theme",env().night?"dark":"light"); }

const SKY={
  amanecer:{despejado:["#F6B868","#FCE7C4"],garua:["#C9C3BC","#EDE7E0"],lluvia:["#8F9196","#C4C2C0"]},
  dia:{despejado:["#9FD3EF","#EAF6FC"],garua:["#C5CBD1","#ECEEF0"],lluvia:["#87919A","#BFC6CC"]},
  atardecer:{despejado:["#E9773A","#F8C98C"],garua:["#B7A9A0","#E2D6CC"],lluvia:["#7D7A80","#B3AEAD"]},
  noche:{despejado:["#0D1430","#2B2448"],garua:["#171A22","#2B2D35"],lluvia:["#0F1218","#20232A"]}
};
const hsh=(n)=>{ const x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };

function sky(c,w,h,e){
  const [a,b]=SKY[e.phase][e.clima]; const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,a); g.addColorStop(1,b);
  c.fillStyle=g; c.fillRect(0,0,w,h);
}
function sunPos(w,h,e,x0,x1){ // arco de este a oeste
  const f=Math.max(0,Math.min(1,(e.h-5.5)/13.2)); x0=x0??.1; x1=x1??.9;
  return [w*(x0+(x1-x0)*f), h*(.85-.65*Math.sin(Math.PI*f))];
}
function sun(c,w,h,t,e,r,x0,x1){
  if(e.night||e.clima==="lluvia") return;
  const [x,y]=sunPos(w,h,e,x0,x1), al=e.clima==="garua"?.45:1;
  c.save(); c.globalAlpha=al;
  const gl=c.createRadialGradient(x,y,r*.4,x,y,r*3.2); gl.addColorStop(0,"rgba(242,164,19,.55)"); gl.addColorStop(1,"rgba(242,164,19,0)");
  c.fillStyle=gl; c.beginPath(); c.arc(x,y,r*3.2,0,6.283); c.fill();
  if(e.clima==="despejado"){ c.save(); c.translate(x,y); c.rotate(t/9000); c.strokeStyle="rgba(242,164,19,.55)"; c.lineWidth=Math.max(1,r*.12); c.lineCap="round";
    for(let i=0;i<12;i++){ c.rotate(Math.PI/6); c.beginPath(); c.moveTo(r*1.35,0); c.lineTo(r*(1.75+.15*Math.sin(t/600+i)),0); c.stroke(); }
    c.restore(); }
  c.fillStyle="#F2A413"; c.beginPath(); c.arc(x,y,r,0,6.283); c.fill();
  c.fillStyle="rgba(255,236,180,.7)"; c.beginPath(); c.arc(x-r*.3,y-r*.3,r*.45,0,6.283); c.fill();
  c.restore();
}
function moon(c,w,h,t,e,r){
  if(!e.night) return;
  const x=w*.84, y=h*.62; c.save(); c.globalAlpha=e.clima==="despejado"?1:.5;
  const gl=c.createRadialGradient(x,y,r*.5,x,y,r*3); gl.addColorStop(0,"rgba(255,248,225,.35)"); gl.addColorStop(1,"rgba(255,248,225,0)");
  c.fillStyle=gl; c.beginPath(); c.arc(x,y,r*3,0,6.283); c.fill();
  c.fillStyle="#FFF6DD"; c.beginPath(); c.arc(x,y,r,0,6.283); c.fill();
  c.fillStyle=SKY.noche[e.clima][0]; c.beginPath(); c.arc(x+r*.45,y-r*.25,r*.85,0,6.283); c.fill();
  c.restore();
}
function stars(c,w,h,t,e,n){
  if(!e.night||e.clima==="lluvia") return;
  for(let i=0;i<n;i++){ const x=hsh(i)*w, y=hsh(i+50)*h*.75, tw=.35+.65*Math.abs(Math.sin(t/(900+hsh(i+9)*1500)+i));
    c.globalAlpha=(e.clima==="garua"?.35:1)*tw; c.fillStyle="#FFFFFF"; c.fillRect(x,y,hsh(i+3)>.85?2:1.2,hsh(i+3)>.85?2:1.2); }
  c.globalAlpha=1;
}
function clouds(c,w,h,t,e,s){
  const n=e.clima==="despejado"?2:e.clima==="garua"?5:6;
  const col=e.night?(e.clima==="despejado"?"rgba(180,180,210,.18)":"rgba(70,74,86,.7)"):(e.clima==="lluvia"?"rgba(110,118,126,.85)":e.clima==="garua"?"rgba(236,238,240,.9)":"rgba(255,255,255,.85)");
  for(let i=0;i<n;i++){ const sp=(6+hsh(i+20)*8)*s, span=w+160*s; const x=((hsh(i+30)*span+t/1000*sp)%span)-80*s, y=h*(.12+hsh(i+40)*.35), r=(14+hsh(i+60)*12)*s;
    c.fillStyle=col; c.beginPath(); c.ellipse(x,y,r*1.6,r*.55,0,0,6.283); c.ellipse(x-r*.7,y+r*.12,r*.9,r*.45,0,0,6.283); c.ellipse(x+r*.5,y-r*.25,r*.9,r*.6,0,0,6.283); c.fill(); }
}
function hills(c,w,h,e){
  const night=e.night; c.fillStyle=night?"#1B2238":"#C9D79A";
  c.beginPath(); c.moveTo(0,h); for(let x=0;x<=w;x+=w/24) c.lineTo(x,h*.78-Math.sin(x/w*5.2+1)*h*.07-Math.sin(x/w*11)*h*.03); c.lineTo(w,h); c.fill();
  c.fillStyle=night?"#141A2C":"#9DB25C";
  c.beginPath(); c.moveTo(0,h); for(let x=0;x<=w;x+=w/24) c.lineTo(x,h*.88-Math.sin(x/w*7+2.4)*h*.05); c.lineTo(w,h); c.fill();
}
function leaves(c,w,h,t,e,n,s){
  if(e.night||e.clima==="lluvia") return;
  const cols=["#6E8B2F","#9DB04A","#F2A413","#C9A24A"];
  for(let i=0;i<n;i++){ const P=8000+hsh(i+70)*7000, ph=(t/P+hsh(i+80))%1;
    const x=(hsh(i+90)*w*1.1-w*.1)+ph*w*.45+Math.sin(t/650+i)*14*s, y=-10*s+ph*(h+20*s), rot=t/(400+hsh(i)*500)+i;
    c.save(); c.translate(x,y); c.rotate(rot); c.scale(s,s*(.5+.5*Math.abs(Math.sin(t/300+i))));
    c.fillStyle=cols[i%4]; c.beginPath(); c.moveTo(0,-5); c.quadraticCurveTo(4,0,0,5); c.quadraticCurveTo(-4,0,0,-5); c.fill(); c.restore(); }
}
function birds(c,w,h,t,e,s){
  if(e.phase!=="amanecer"&&e.phase!=="dia"||e.clima==="lluvia") return;
  c.strokeStyle="rgba(35,31,31,.55)"; c.lineWidth=1.2*s; c.lineCap="round";
  for(let i=0;i<3;i++){ const span=w+120*s, x=((t/1000*(14+i*3)*s+i*90*s)%span)-60*s, y=h*(.2+i*.07)+Math.sin(t/500+i)*3*s, f=Math.sin(t/140+i)*2.5*s;
    c.beginPath(); c.moveTo(x-5*s,y-f); c.quadraticCurveTo(x-2*s,y-2*s,x,y); c.quadraticCurveTo(x+2*s,y-2*s,x+5*s,y-f); c.stroke(); }
}
function fireflies(c,w,h,t,e,n,s,y0){
  if(!e.night||e.clima==="lluvia") return;
  for(let i=0;i<n;i++){ const x=w*(.08+hsh(i+110)*.84)+Math.sin(t/(1300+i*90)+i)*18*s, y=(y0||h*.4)+hsh(i+120)*(h-(y0||h*.4))*.9+Math.cos(t/(1100+i*70)+i)*12*s;
    const a=.25+.75*Math.abs(Math.sin(t/(500+i*40)+i*2));
    const g=c.createRadialGradient(x,y,0,x,y,6*s); g.addColorStop(0,`rgba(255,214,90,${a})`); g.addColorStop(1,"rgba(255,214,90,0)");
    c.fillStyle=g; c.beginPath(); c.arc(x,y,6*s,0,6.283); c.fill(); }
}
function rain(c,w,h,t,e,s){
  if(e.clima==="despejado") return;
  const heavy=e.clima==="lluvia", n=heavy?90:55, len=(heavy?12:5)*s, sp=heavy?.55:.18;
  c.strokeStyle=e.night?(heavy?"rgba(170,190,220,.55)":"rgba(170,190,220,.35)"):(heavy?"rgba(70,90,110,.45)":"rgba(90,100,110,.3)");
  c.lineWidth=(heavy?1.2:.8)*s; c.beginPath();
  for(let i=0;i<n;i++){ const x=(hsh(i+200)*w*1.2+t*sp*.25)%(w*1.1)-w*.05, y=(hsh(i+300)*h+t*sp*(.8+hsh(i)*.4))%(h+len)-len;
    c.moveTo(x,y); c.lineTo(x-len*.25,y+len); }
  c.stroke();
}
const PHRASE={amanecer:"Buenos días",dia:"Buenos días",atardecer:"Buenas tardes",noche:"Buenas noches"};
const CLIMA={despejado:"despejado",garua:"garúa",lluvia:"lluvia"};
window.SAmbient={settings,set,onChange,env,applyTheme,sky,sun,moon,stars,clouds,hills,leaves,birds,fireflies,rain,PHRASE,CLIMA};
applyTheme(); setInterval(applyTheme,60000);
})();

/* SemillApp — núcleo de interfaz (compartido por la versión en Claude y la app instalable) */
(function(){
const CAMPUS = {
  upch:{name:"UPCH", ab:"UPCH", full:"Cayetano Heredia", x:208, y:68},
  pucp:{name:"PUCP", ab:"PUCP", full:"PUCP", x:162, y:158},
  up:{name:"U Pacífico", ab:"UP", full:"U del Pacífico", x:226, y:186},
  ulima:{name:"U Lima", ab:"UL", full:"U de Lima", x:380, y:190}
};
/* [palabra clave, tipo de planta, nombre, emoji, color de flor/fruto] */
const SPECIES_TABLE = [
  ["girasol","girasol","Girasol","🌻","#F2A413"],["lavanda","flor","Lavanda","🪻","#8E6CC0"],["rosa","flor","Rosa","🌹","#C62828"],
  ["tulip","flor","Tulipán","🌷","#E35D8F"],["manzanilla","flor","Manzanilla","🌼","#FFFFFF"],["cempas","flor","Cempasúchil","🌼","#F28C13"],
  ["tomate","fruto","Tomate","🍅","#C62828"],["ají amarillo","fruto","Ají amarillo","🌶️","#F2A413"],["aji amarillo","fruto","Ají amarillo","🌶️","#F2A413"],
  ["ají","fruto","Ají","🌶️","#C62828"],["aji","fruto","Ají","🌶️","#C62828"],["rocoto","fruto","Rocoto","🌶️","#C62828"],["pimiento","fruto","Pimiento","🫑","#C62828"],["fresa","fruto","Fresa","🍓","#C62828"],
  ["albahaca","hierba","Albahaca","🌿",null],["culantro","hierba","Culantro","🌿",null],["cilantro","hierba","Culantro","🌿",null],["hierbabuena","hierba","Hierbabuena","🌿",null],
  ["menta","hierba","Menta","🌿",null],["perejil","hierba","Perejil","🌿",null],["orégano","hierba","Orégano","🌿",null],["oregano","hierba","Orégano","🌿",null],["romero","hierba","Romero","🌿",null],["huacatay","hierba","Huacatay","🌿",null],
  ["maíz","maiz","Maíz","🌽","#F2A413"],["maiz","maiz","Maíz","🌽","#F2A413"],["quinua","grano","Quinua","🌾","#C62828"],["kiwicha","grano","Kiwicha","🌾","#B0306A"],
  ["palta","arbol","Palta","🥑","#3E5A1E"],["limón","arbol","Limón","🍋","#F2D513"],["limon","arbol","Limón","🍋","#F2D513"],["mango","arbol","Mango","🥭","#F28C13"],["naranj","arbol","Naranjo","🍊","#F28C13"],["papaya","arbol","Papaya","🍈","#F28C13"],["lúcuma","arbol","Lúcuma","🌳","#F2A413"],["lucuma","arbol","Lúcuma","🌳","#F2A413"],
  ["frijol","hierba","Frijol","🫘",null],["pallar","hierba","Pallar","🫘",null],["arveja","hierba","Arveja","🫛",null],["haba","hierba","Haba","🫛",null],
  ["lechuga","hortaliza","Lechuga","🥬",null],["zanahoria","hortaliza","Zanahoria","🥕","#F28C13"],["cebolla","hortaliza","Cebolla","🧅","#B0306A"],["zapallo","hortaliza","Zapallo","🎃","#F28C13"],["calabaza","hortaliza","Zapallo","🎃","#F28C13"]
];
const SUGGEST = ["Girasol","Tomate cherry","Albahaca","Culantro","Ají amarillo","Rocoto","Hierbabuena","Lavanda","Maíz morado","Quinua","Kiwicha","Zapallo loche","Frijol canario","Palta","Lechuga","Huacatay"];
function species(text){
  const t=(text||"").toLowerCase();
  const m=SPECIES_TABLE.find(r=>t.includes(r[0]));
  if(m) return {kind:m[1],name:m[2],emoji:m[3],color:m[4]};
  const clean=(text||"Planta").split(/[(,;/]| o | y /)[0].trim()||"Planta";
  return {kind:"hierba",name:clean.charAt(0).toUpperCase()+clean.slice(1),emoji:"🌱",color:null};
}
const H=3600e3, DAY=24*H;
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const S={filter:"all",forest:"upch",senales:[],ofertas:[],trueques:[],perfiles:[],perfLoaded:false,me:null,canWrite:true,A:null,sel:null};
const AMB=window.SAmbient;
const DOMAINS={"upch.pe":"upch","pucp.edu.pe":"pucp","pucp.pe":"pucp","ulima.edu.pe":"ulima","up.edu.pe":"up"};
function campusFromEmail(m){ m=(m||"").trim().toLowerCase(); const at=m.lastIndexOf("@"); if(at<1) return null; const d=m.slice(at+1);
  for(const k in DOMAINS){ if(d===k||d.endsWith("."+k)) return DOMAINS[k]; } return null; }
const perfil=id=>S.perfiles.find(p=>p.id===id)||null;
function initials(n){ return (n||"?").trim().split(/\s+/).slice(0,2).map(w=>w[0]||"").join("").toUpperCase()||"?"; }
function av(id,size,cls){ const p=perfil(id), n=id==="demo"?"Ejemplo":(p&&p.nombre)||S.A?.nameOf?.({autor:id})||"Estudiante"; size=size||22;
  return p&&p.foto?`<img class="av ${cls||""}" src="${esc(p.foto)}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px">`
    :`<span class="av ini ${cls||""}" style="width:${size}px;height:${size}px;font-size:${Math.round(size*.42)}px" aria-hidden="true">${esc(initials(n))}</span>`; }

/* ---------- utilidades de UI ---------- */
function toast(t){ const d=document.createElement("div"); d.className="toast"; d.textContent=t; document.body.appendChild(d); setTimeout(()=>d.remove(),2800); }
function closeSheet(){ $("#layer").innerHTML=""; }
function sheet(html,opts){
  const lock=!!(opts&&opts.lock);
  $("#layer").innerHTML=`<div class="scrim${lock?" lock":""}" id="scrim"><div class="sheet${opts&&opts.cls?" "+opts.cls:""}" role="dialog" aria-modal="true">${html}</div></div>`;
  $("#scrim").addEventListener("click",e=>{ if(e.target.id==="scrim"&&!lock) closeSheet(); });
  const f=$("#layer input, #layer select, #layer button"); f&&f.focus();
}
const sheetOpen=()=>!!$("#layer").innerHTML;

/* ---------- datos derivados ---------- */
const active=()=>S.senales.filter(s=>s.expira>Date.now());
const shown=()=>active().filter(s=>S.filter==="all"||s.campus===S.filter).sort((a,b)=>b.creado-a.creado);
const offersFor=s=>S.ofertas.filter(o=>o.senal_id===s.id).sort((a,b)=>a.creado-b.creado);
const isMine=r=>!!S.me && r.autor===S.me;
const left=ms=>{ const h=Math.max(0,ms-Date.now())/H; return h>=1?`vence en ${Math.floor(h)} h`:`vence en ${Math.max(1,Math.round(h*60))} min`; };
const ago=ms=>{ const h=(Date.now()-ms)/H; return h<1?`hace ${Math.max(1,Math.round(h*60))} min`:h<48?`hace ${Math.floor(h)} h`:`hace ${Math.floor(h/24)} días`; };
const who=r=> r.autor==="demo"?"Ejemplo":(isMine(r)?"Tú":((perfil(r.autor)||{}).nombre||S.A.nameOf(r)||"Estudiante"));
const fecha=ms=>new Date(ms).toLocaleDateString("es-PE",{day:"numeric",month:"short"});

function plants(campus){
  const list=[];
  S.trueques.forEach(t=>{
    if(t.campus_a===campus) list.push({id:t.id+"a",especie:t.especie_a,fecha:t.fecha,partner:t.campus_b,demo:t.autor==="demo"});
    if(t.campus_b===campus) list.push({id:t.id+"b",especie:t.especie_b,fecha:t.fecha,partner:t.campus_a,demo:t.autor==="demo"});
  });
  list.sort((a,b)=>a.fecha-b.fecha);
  const seen={};
  list.forEach(p=>{ p.sp=species(p.especie); const k=p.sp.name; const before=seen[k]||0; seen[k]=before+1;
    const age=(Date.now()-p.fecha)/DAY; p.stage=Math.min(4,Math.floor(age/2)+before); });
  return list;
}

/* ---------- render: chips, mapa, feed ---------- */
function renderChips(){
  const c={}; active().forEach(s=>c[s.campus]=(c[s.campus]||0)+1);
  const opts=[["all","Todas",active().length],...Object.entries(CAMPUS).map(([k,v])=>[k,v.name,c[k]||0])];
  $("#chips").innerHTML=opts.map(([k,n,cnt])=>`<button class="chip" aria-pressed="${S.filter===k}" data-f="${k}">${n} · ${cnt}</button>`).join("");
}
function renderMap(){
  const c={}; active().forEach(s=>c[s.campus]=(c[s.campus]||0)+1);
  const pins=Object.entries(CAMPUS).map(([k,v])=>{
    const n=c[k]||0, sel=S.filter===k, dim=S.filter!=="all"&&!sel, right=k==="ulima", below=k==="up";
    return `<g class="pin" data-f="${k}" role="button" tabindex="0" aria-label="${v.name}: ${n} señales" opacity="${dim?.35:1}">
      ${n?`<circle class="pulse" cx="${v.x}" cy="${v.y}" r="11" fill="#F2A413"/>`:""}
      <circle cx="${v.x}" cy="${v.y}" r="${sel?15:13}" fill="${sel?"#231F1F":"#F2A413"}" stroke="#231F1F" stroke-width="2"/>
      <text x="${v.x}" y="${v.y+4}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" fill="${sel?"#F2A413":"#231F1F"}">${n}</text>
      <text x="${below?v.x:right?v.x-19:v.x+19}" y="${below?v.y+31:v.y+4}" text-anchor="${below?"middle":right?"end":"start"}" font-family="Plus Jakarta Sans, sans-serif" font-size="12.5" font-weight="800" fill="var(--fg)" paint-order="stroke" stroke="var(--land)" stroke-width="3.5">${v.name}</text>
    </g>`;}).join("");
  $("#map").innerHTML=`<svg viewBox="0 0 440 262" role="img" aria-label="Mapa esquemático de Lima con los cuatro campus">
    <rect width="440" height="262" fill="var(--land)"/>
    <path d="M0,0 L44,0 L52,60 L58,112 L38,136 L70,150 L120,180 L180,212 L226,262 L0,262 Z" fill="var(--sea)"/>
    <path d="M440,66 C370,78 310,92 255,100 S130,104 56,110" fill="none" stroke="var(--river)" stroke-width="4" stroke-linecap="round"/>
    <path d="M150,198 L250,198 L330,193 L440,188" fill="none" stroke="var(--river)" stroke-width="2.5" stroke-dasharray="1 6" stroke-linecap="round"/>
    <text x="16" y="232" font-family="Plus Jakarta Sans, sans-serif" font-size="10.5" font-style="italic" fill="var(--muted)">Océano Pacífico</text>
    <text x="330" y="80" font-family="Plus Jakarta Sans, sans-serif" font-size="10" font-style="italic" fill="var(--muted)">Río Rímac</text>
    <text x="292" y="210" font-family="Plus Jakarta Sans, sans-serif" font-size="9.5" fill="var(--muted)">Av. Javier Prado</text>
    ${pins}</svg><span class="legend">LIMA · SOLO CAMPUS, SIN GPS</span>`;
}
function renderFeed(){
  const gate=S.A&&S.A.feedGate&&S.A.feedGate();
  if(gate){ $("#feed").innerHTML=gate; $("#feedCount").textContent=""; return; }
  const list=shown();
  $("#feedTitle").textContent=S.filter==="all"?"Señales activas":`Señales en ${CAMPUS[S.filter].name}`;
  $("#feedCount").textContent=list.length?`${list.length} activas`:"";
  if(!list.length){
    $("#feed").innerHTML=`<div class="empty"><div style="font-size:2rem" aria-hidden="true">🌱</div><div><b style="color:var(--fg)">Aún no hay señales${S.filter!=="all"?" en "+esc(CAMPUS[S.filter].name):""}.</b><br>Lanza la primera: cuenta qué semillas tienes o cuáles buscas.</div><button class="btn gold" data-act="new">Lanzar señal</button></div>`;
    return;
  }
  $("#feed").innerHTML=list.map(s=>{
    const v=CAMPUS[s.campus]||CAMPUS.upch, frac=Math.max(0,Math.min(1,(s.expira-Date.now())/(s.expira-s.creado)));
    const C=2*Math.PI*21, of=offersFor(s), mine=isMine(s), closed=of.find(o=>o.estado!=="pendiente"), done=of.find(o=>o.estado==="completada");
    const soon=s.expira-Date.now()<3*H, sp=species(s.especie);
    const offersHtml=(of.length||mine)?`<div class="offers">${of.length?of.map(o=>{
      let acts="";
      if(o.estado==="completada") acts=`<span class="timer">Trueque hecho ✓</span>`;
      else if(o.estado==="aceptada"){
        if(mine){ const tel=S.A.phoneFor(o);
          acts=`${tel?`<a class="btn small" href="${waLink(tel,s,o)}" target="_blank" rel="noopener">WhatsApp</a>`:`<span class="timer">Cargando contacto…</span>`}<button class="btn gold small" data-act="done" data-id="${o.id}">Trueque hecho</button>`;
        } else acts=`<span class="timer">Oferta aceptada</span>`;
      } else if(mine && !closed) acts=`<button class="btn ghost small" data-act="accept" data-id="${o.id}">Aceptar</button>`;
      return `<div class="offer ${o.estado!=="pendiente"?"ok":""}"><span class="with-av">${av(o.autor,24)}<span>${esc(who(o))} (${esc(CAMPUS[o.campus]?.name||"")}) ofrece <b>${esc(o.ofrece)}</b></span></span><span class="acts">${acts}</span></div>`;
    }).join(""):`<div class="offer"><span class="timer">Todavía nadie ofertó.</span></div>`}
    ${mine?`<div class="offer"><span></span><button class="btn ghost small" data-act="del" data-id="${s.id}">Borrar señal</button></div>`:""}</div>`:"";
    return `<article class="card">
      <div class="ring" aria-hidden="true"><svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="21" fill="none" stroke="var(--line)" stroke-width="2.5"/><circle cx="23" cy="23" r="21" fill="none" stroke="${soon?"#C62828":"#F2A413"}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-frac)}" transform="rotate(-90 23 23)"/></svg>${sp.emoji}</div>
      <div class="body">
        <div class="top"><span class="tag ${s.tipo}">${s.tipo==="tengo"?"Tengo":"Busco"}</span><span class="camp">${esc(v.name)}</span>${s.autor==="demo"?`<span class="tag ej">Ejemplo</span>`:""}</div>
        <div class="title">${esc(s.especie)}${s.cantidad?` <span style="font-weight:500;color:var(--muted)">· ${esc(s.cantidad)}</span>`:""}</div>
        <div class="cambio">${s.tipo==="tengo"?"Cambio por":"Ofrezco"}: <b>${esc(s.cambio||"lo que tengas")}</b></div>
        <div class="meta"><span class="timer with-av ${soon?"soon":""}">${av(s.autor,22)}<span>${esc(who(s))} · ${ago(s.creado)} · ${left(s.expira)}</span></span>
          ${!mine&&!closed?`<button class="btn small" data-act="offer" data-id="${s.id}">${s.tipo==="tengo"?"Ofrecer a cambio":"Yo tengo"}</button>`:""}
          ${!mine&&closed?`<span class="timer">${done?"Trueque cerrado":"En coordinación"}</span>`:""}
        </div>
      </div>${offersHtml}</article>`;
  }).join("");
}
function waLink(tel,s,o){
  const n=String(tel).replace(/\D/g,""), full=n.length===9?"51"+n:n;
  const msg=`Hola, vi tu oferta de ${o.ofrece} para mi señal de ${s.especie} en SemillApp. ¿Nos vemos en el Punto Verde de ${CAMPUS[s.campus].name}?`;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}

/* ---------- bosque isométrico ---------- */
const N=7, TW=44, TH=22, LW=360, LH=235, OX=180, OY=64, PS=1.5;
const iso=(x,y)=>[OX+(x-y)*TW/2, OY+(x+y)*TH/2];
function hash(str){ let h=2166136261; for(const ch of String(str)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619);} return (h>>>0)/4294967295; }
const SIGN=[0,N-1];
function cellsFor(campus){
  const cells=[]; for(let x=0;x<N;x++)for(let y=0;y<N;y++){ if(x===SIGN[0]&&y===SIGN[1]) continue; const d=Math.hypot(x-(N-1)/2,y-(N-1)/2)+hash(campus+x+"_"+y)*1.2+((x+y)%2?4:0); cells.push({x,y,d}); }
  return cells.sort((a,b)=>a.d-b.d);
}
function layout(campus){
  const ps=plants(campus), cells=cellsFor(campus), shownPs=ps.slice(-cells.length);
  shownPs.forEach((p,i)=>{ const c=cells[i]; p.x=c.x; p.y=c.y; [p.sx,p.sy]=iso(c.x,c.y); p.sy+=TH/2; p.phase=hash(p.id)*6.28; });
  return {all:ps, placed:shownPs.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y))};
}
const G={leaf:"#6E8B2F",dark:"#4F6B22",light:"#9DB04A",stem:"#5E7A26",trunk:"#7A5230",trunkD:"#5C3D22",outline:"#231F1F"};
function ell(c,x,y,rx,ry,rot,fill){ c.beginPath(); c.ellipse(x,y,rx,ry,rot||0,0,6.283); c.fillStyle=fill; c.fill(); }
function circ(c,x,y,r,fill,stroke){ c.beginPath(); c.arc(x,y,r,0,6.283); c.fillStyle=fill; c.fill(); if(stroke){c.lineWidth=.6;c.strokeStyle=stroke;c.stroke();} }
function stem(c,h,w,col){ c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(1.2,-h/2,0,-h); c.lineWidth=w; c.strokeStyle=col||G.stem; c.lineCap="round"; c.stroke(); }
function drawPlant(c,p,t){
  const st=p.stage, k=p.sp.kind, col=p.sp.color, r=hash(p.id);
  // sombra
  ell(c,0,0,6+st*1.6,3+st*.8,0,"rgba(35,31,31,.18)");
  c.save(); c.rotate(Math.sin(t/900+p.phase)*.035*(st+1)/5);
  if(st===0){ stem(c,7,1.4); ell(c,-3,-7,3,1.6,-.5,G.light); ell(c,3,-8,3,1.6,.5,G.leaf); c.restore(); return; }
  if(k==="girasol"){
    const h=12+st*7; stem(c,h,1.6+st*.3); ell(c,-4,-h*.45,4.5,2,-.6,G.leaf); ell(c,4,-h*.6,4.5,2,.6,G.dark);
    const R=2.2+st*1.3;
    if(st===1){ circ(c,0,-h,2.6,G.light); }
    else { for(let i=0;i<12;i++){ const a=i/12*6.283; ell(c,Math.cos(a)*R*1.25,-h+Math.sin(a)*R*1.25,R*.75,R*.32,a,"#F2A413"); }
      circ(c,0,-h,R,"#6B4423",G.outline); }
  } else if(k==="flor"){
    const n=1+Math.min(st,3);
    for(let i=0;i<n;i++){ const dx=(i-(n-1)/2)*4, h=9+st*3.5+(i%2)*3; c.save(); c.translate(dx,0); stem(c,h,1.2);
      if(p.sp.name==="Lavanda"){ for(let j=0;j<4+st;j++) circ(c,0,-h+j*1.6,1.3,col); }
      else if(st>=2){ for(let j=0;j<5;j++){const a=j/5*6.283; circ(c,Math.cos(a)*2,-h+Math.sin(a)*2,1.8,col||"#F2A413",G.outline);} circ(c,0,-h,1.2,"#F2A413"); }
      else circ(c,0,-h,1.8,G.light); c.restore(); }
    ell(c,-3,-3,3.5,1.6,-.4,G.leaf); ell(c,3,-3,3.5,1.6,.4,G.dark);
  } else if(k==="fruto"){
    const R=4+st*2.2; stem(c,R*.8,1.6,G.trunk);
    circ(c,-R*.5,-R*1.1,R*.75,G.dark); circ(c,R*.5,-R*1.1,R*.75,G.leaf); circ(c,0,-R*1.6,R*.8,G.leaf); circ(c,-R*.2,-R*1.75,R*.4,G.light);
    if(st>=2){ const n=(st-1)*3; for(let i=0;i<n;i++){ const a=hash(p.id+i)*6.283, d=hash(p.id+"d"+i)*R*.8; circ(c,Math.cos(a)*d,-R*1.3+Math.sin(a)*d*.7,1.3+st*.25,col||"#C62828",G.outline);} }
  } else if(k==="maiz"){
    const h=16+st*8; c.beginPath(); c.moveTo(0,0); c.lineTo(0,-h); c.lineWidth=2+st*.3; c.strokeStyle=G.stem; c.stroke();
    for(let i=1;i<=st+1;i++){ const y=-h*i/(st+2), s=i%2?1:-1; c.beginPath(); c.moveTo(0,y); c.quadraticCurveTo(s*7,y-5,s*10,y+2); c.lineWidth=1.6; c.strokeStyle=i%2?G.leaf:G.dark; c.stroke(); }
    if(st>=3){ ell(c,2.5,-h*.55,1.8,4,.3,"#F2A413"); ell(c,2.5,-h*.55,1.9,4.1,.3,"rgba(0,0,0,0)"); }
    c.beginPath(); for(let i=-1;i<=1;i++){ c.moveTo(0,-h); c.lineTo(i*3,-h-4);} c.lineWidth=1; c.strokeStyle="#C9A24A"; c.stroke();
  } else if(k==="grano"){
    const h=12+st*6; stem(c,h,1.6); ell(c,-3,-h*.4,3.5,1.5,-.5,G.leaf); ell(c,3,-h*.55,3.5,1.5,.5,G.dark);
    if(st>=2){ for(let i=0;i<4+st*3;i++){ const a=hash(p.id+i)*6.283, d=hash(p.id+"g"+i)*(1.5+st); circ(c,Math.cos(a)*d*.7,-h-2+Math.sin(a)*d,1.1+st*.15,col||"#C62828"); } }
  } else if(k==="arbol"){
    const h=7+st*5, w=1.6+st*.7; c.beginPath(); c.moveTo(-w,0); c.lineTo(-w*.6,-h); c.lineTo(w*.6,-h); c.lineTo(w,0); c.closePath(); c.fillStyle=G.trunk; c.fill();
    const R=4+st*2.6; circ(c,-R*.55,-h-R*.3,R*.75,G.dark); circ(c,R*.55,-h-R*.3,R*.75,G.dark); circ(c,0,-h-R*.9,R*.85,G.leaf); circ(c,-R*.25,-h-R*1.1,R*.4,G.light);
    if(st>=3){ for(let i=0;i<(st-2)*4;i++){ const a=hash(p.id+i)*6.283, d=hash(p.id+"t"+i)*R*.75; circ(c,Math.cos(a)*d,-h-R*.6+Math.sin(a)*d*.6,1.4+st*.2,col||"#F2A413",G.outline);} }
  } else if(k==="hortaliza"){
    const R=2.5+st*1.4;
    for(let i=0;i<5+st;i++){ const a=i/(5+st)*6.283; ell(c,Math.cos(a)*R*.7,-R*.6+Math.sin(a)*R*.35,R*.7,R*.45,a,i%2?G.leaf:G.light); }
    circ(c,0,-R*.7,R*.45,G.light);
    if(col&&st>=2) circ(c,R*.9,-R*.2,1.2+st*.6,col,G.outline);
  } else { // hierba / leguminosas / genérica
    const n=3+st*2;
    for(let i=0;i<n;i++){ const a=-1.4+i/(n-1||1)*2.8, len=5+st*2.6+hash(p.id+i)*3; c.save(); c.rotate(a*.45); stem(c,len,1,G.stem); ell(c,0,-len,1.8+st*.35,3+st*.5,0,i%2?G.leaf:G.light); c.restore(); }
  }
  c.restore();
}
function drawIsland(c,campus,t,surface){
  const e=AMB.env(); AMB.sky(c,LW,LH,e); AMB.stars(c,LW,LH*.7,t,e,40); AMB.sun(c,LW,LH*.75,t,e,11); AMB.moon(c,LW,LH*.75,t,e,9); AMB.clouds(c,LW,LH*.6,t,e,.8); AMB.birds(c,LW,LH*.6,t,e,.9);
  // costado de la isla
  const [lx,ly]=iso(0,N), [rx,ry]=iso(N,0), [bx,by]=iso(N,N), D=16;
  c.beginPath(); c.moveTo(lx,ly); c.lineTo(bx,by); c.lineTo(bx,by+D); c.lineTo(lx,ly+D); c.closePath(); c.fillStyle="#8B5E3C"; c.fill();
  c.beginPath(); c.moveTo(bx,by); c.lineTo(rx,ry); c.lineTo(rx,ry+D); c.lineTo(bx,by+D); c.closePath(); c.fillStyle="#6E4A2F"; c.fill();
  c.beginPath(); c.moveTo(lx,ly); c.lineTo(bx,by); c.lineTo(rx,ry); c.lineWidth=3; c.strokeStyle="#7E9A3A"; c.stroke();
  for(let i=0;i<9;i++){ const u=hash(campus+"s"+i), x=lx+(bx-lx)*u, y=ly+(by-ly)*u+6+hash(i+campus)*7; circ(c,x,y,1.2,"#5C3D22"); }
  // baldosas de pasto
  for(let x=0;x<N;x++)for(let y=0;y<N;y++){ const [cx,cy]=iso(x,y), h=hash(campus+x+":"+y);
    c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+TW/2,cy+TH/2); c.lineTo(cx,cy+TH); c.lineTo(cx-TW/2,cy+TH/2); c.closePath();
    c.fillStyle=h<.33?"#A9BE5C":h<.66?"#B3C766":"#9FB553"; c.fill(); c.lineWidth=.5; c.strokeStyle="rgba(35,31,31,.08)"; c.stroke(); }
  // letrero del Punto Verde
  const [sx,sy0]=iso(SIGN[0],SIGN[1]), sy=sy0+TH/2;
  c.fillStyle=G.trunkD; c.fillRect(sx-1,sy-14,2,14);
  c.fillStyle="#F2A413"; c.strokeStyle=G.outline; c.lineWidth=1; c.beginPath(); c.rect(sx-14,sy-24,28,11); c.fill(); c.stroke();
  c.fillStyle=G.outline; c.font="700 7px JetBrains Mono, monospace"; c.textAlign="center"; c.fillText(CAMPUS[campus].ab,sx,sy-16.5);
}
function drawForest(c,campus,t,surface,sel){
  const L=layout(campus); drawIsland(c,campus,t,surface);
  L.placed.forEach(p=>{ c.save(); c.translate(p.sx,p.sy); if(sel===p.id){ ell(c,0,0,15,7.5,0,"rgba(242,164,19,.6)"); } c.scale(PS,PS); drawPlant(c,p,t); c.restore(); });
  const e=AMB.env();
  if(e.night){ c.fillStyle="rgba(12,18,48,.38)"; c.fillRect(0,0,LW,LH); } else if(e.phase==="atardecer"){ c.fillStyle="rgba(233,119,58,.10)"; c.fillRect(0,0,LW,LH); }
  if(e.clima!=="despejado"){ c.fillStyle=e.clima==="lluvia"?"rgba(40,50,60,.16)":"rgba(200,205,210,.12)"; c.fillRect(0,0,LW,LH); }
  AMB.fireflies(c,LW,LH,t,e,12,.8,OY+20); AMB.leaves(c,LW,LH,t,e,7,.9); AMB.rain(c,LW,LH,t,e,.8);
  return L;
}
let FL=null, raf=0, lastDraw=0;
function forestCanvas(){
  const cv=$("#forest"); if(!cv) return null;
  const w=Math.max(280,cv.clientWidth||520), dpr=Math.min(2,window.devicePixelRatio||1);
  const W=Math.round(w*dpr), Hh=Math.round(w*dpr*LH/LW); if(cv.width!==W||cv.height!==Hh){ cv.width=W; cv.height=Hh; }
  return cv;
}
function paintForest(t){
  const cv=forestCanvas(); if(!cv) return; const c=cv.getContext("2d"); const k=cv.width/LW;
  c.setTransform(k,0,0,k,0,0); FL=drawForest(c,S.forest,t,css("--surface")||"#fff",S.sel?.id);
}
const reduce=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function paintHero(t){
  const cv=$("#hero"); if(!cv) return; const w=Math.max(280,cv.clientWidth||520), hh=cv.clientHeight||170, dpr=Math.min(2,window.devicePixelRatio||1);
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(hh*dpr)){ cv.width=Math.round(w*dpr); cv.height=Math.round(hh*dpr); }
  const c=cv.getContext("2d"); c.setTransform(dpr,0,0,dpr,0,0); const e=AMB.env();
  AMB.sky(c,w,hh,e); AMB.stars(c,w,hh,t,e,70); c.save(); c.translate(0,hh*.3); AMB.sun(c,w,hh*.7,t,e,16,.6,.92); c.restore(); AMB.moon(c,w,hh,t,e,14); AMB.clouds(c,w,hh,t,e,1.1); AMB.birds(c,w,hh,t,e,1.2);
  AMB.hills(c,w,hh,e); AMB.fireflies(c,w,hh,t,e,9,1,hh*.6); AMB.leaves(c,w,hh,t,e,9,1.3); AMB.rain(c,w,hh,t,e,1);
}
function renderHero(){
  const e=AMB.env(), me=perfil(S.me), first=me&&me.nombre?me.nombre.trim().split(/\s+/)[0]:"";
  const el=$("#heroText"); if(!el) return;
  el.innerHTML=`<div class="greet">${AMB.PHRASE[e.phase]}${first?`, <em>${esc(first)}</em>`:""}</div><div class="hsub">Lima · ${AMB.CLIMA[e.clima]} · ${active().length} ${active().length===1?"señal":"señales"}</div>`;
  $("#heroWrap").classList.toggle("dark",e.night||e.phase==="atardecer"||e.clima==="lluvia");
  const mb=$("#meBtn"); if(mb) mb.innerHTML=S.me&&me?av(S.me,38,"me"):`<span class="av ini me" style="width:38px;height:38px;font-size:15px">⚙</span>`;
}
function loop(t){ const anim=AMB.env().anim; if(t-lastDraw>(anim?40:60000)){ paintForest(t); paintHero(t); lastDraw=t; } raf=requestAnimationFrame(loop); }
function startLoop(){ cancelAnimationFrame(raf); lastDraw=0; raf=requestAnimationFrame(loop); }
document.addEventListener("visibilitychange",()=>{ if(document.hidden) cancelAnimationFrame(raf); else startLoop(); });
AMB.onChange(()=>{ renderHero(); renderMap(); lastDraw=0; });
function renderForest(){
  const counts={}; Object.keys(CAMPUS).forEach(k=>counts[k]=plants(k).length);
  const order=Object.keys(CAMPUS).sort((a,b)=>counts[b]-counts[a]);
  $("#rank").innerHTML=Object.keys(CAMPUS).map(k=>`<button aria-pressed="${S.forest===k}" data-forest="${k}"><span class="medal">${order.indexOf(k)+1}.º</span><b>${counts[k]}</b>${CAMPUS[k].name}</button>`).join("");
  const ps=plants(S.forest), sp=new Set(ps.map(p=>p.sp.name)).size;
  $("#fCount").textContent=ps.length; $("#fLbl").textContent=ps.length===1?"planta":"plantas";
  $("#fName").innerHTML=`Bosque de <b>${esc(CAMPUS[S.forest].full)}</b><br>${sp} ${sp===1?"especie":"especies"}`;
  if(S.sel && !ps.find(p=>p.id===S.sel.id)) S.sel=null;
  showInfo(); paintForest(performance.now());
}
const STAGE_NAMES=["Brote","Plántula","Planta","Florecida","Madura"], TREE_STAGES=["Brote","Plántula","Arbolito","Árbol joven","Árbol"];
function showInfo(){
  const p=S.sel, el=$("#pInfo");
  if(!p){ el.textContent=plants(S.forest).length?"Toca una planta para ver de qué trueque nació.":"Este bosque aún está vacío: el primer trueque cerrado de esta universidad planta su primera semilla."; return; }
  const names=p.sp.kind==="arbol"?TREE_STAGES:STAGE_NAMES;
  el.innerHTML=`<b>${p.sp.emoji} ${esc(p.sp.name)}</b> · ${names[p.stage]}<br>Trueque ${esc(CAMPUS[S.forest].name)} ↔ ${esc(CAMPUS[p.partner]?.name||"")} · ${fecha(p.fecha)}${p.demo?" · ejemplo":""}`;
}
function pickAt(ev){
  const cv=$("#forest"); if(!FL) return; const r=cv.getBoundingClientRect();
  const x=(ev.clientX-r.left)/r.width*LW, y=(ev.clientY-r.top)/r.height*LH;
  let best=null, bd=1e9;
  FL.placed.forEach(p=>{ const top=p.sy-(14+p.stage*9)*PS; if(Math.abs(x-p.sx)<16 && y>top-6 && y<p.sy+7){ const d=Math.abs(x-p.sx)+Math.abs(y-(p.sy-6))*.3-(p.x+p.y)*.5; if(d<bd){bd=d;best=p;} } });
  S.sel=best; showInfo(); paintForest(performance.now());
}
async function saveForest(){
  const W=1080, Hh=1350, cv=document.createElement("canvas"); cv.width=W; cv.height=Hh; const c=cv.getContext("2d");
  c.fillStyle="#FFFFFF"; c.fillRect(0,0,W,Hh);
  c.fillStyle="#F2A413"; c.fillRect(0,0,W,22);
  const logo=document.querySelector(".brand img"); try{ c.drawImage(logo,72,92,120,120); }catch(e){}
  const ps=plants(S.forest), sp=new Set(ps.map(p=>p.sp.name)).size;
  c.fillStyle="#231F1F"; c.textAlign="left"; c.font="400 76px 'Instrument Serif', Georgia, serif"; c.fillText("Bosque "+CAMPUS[S.forest].name,214,160);
  c.fillStyle="#6E6766"; c.font="500 32px 'Plus Jakarta Sans', sans-serif"; c.fillText(`${ps.length} plantas · ${sp} especies · SemillApp`,216,206);
  c.save(); c.translate(0,300); const k=W/LW; c.scale(k,k); drawForest(c,S.forest,performance.now(),"#FFFFFF",null); c.restore();
  c.fillStyle="#231F1F"; c.fillRect(0,Hh-170,W,170);
  c.fillStyle="#F2A413"; c.font="italic 400 52px 'Instrument Serif', Georgia, serif"; c.fillText("Cada trueque de semillas planta algo.",72,Hh-96);
  c.fillStyle="#FFFFFF"; c.font="500 28px 'Plus Jakarta Sans', sans-serif"; c.fillText("UPCH · U Lima · PUCP · U Pacífico — Puntos Verdes",72,Hh-50);
  const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
  try{ await S.A.saveFile(blob,`bosque-${S.forest}.png`); }catch(e){ if(e&&e.code!=="declined") toast("No se pudo guardar la imagen aquí."); }
}

/* ---------- acciones ---------- */
async function guard(){ if(!S.canWrite){ toast("Tu acceso es de solo lectura."); return false; } return await ensureReady(false); }
async function newSignal(){
  if(!(await guard())) return;
  let tipo="tengo"; const defCampus=((perfil(S.me)||{}).campus||S.A.defaultCampus?.())||(S.filter!=="all"?S.filter:"upch");
  sheet(`<h3>Lanzar señal</h3>
    <div class="seg" id="seg"><button type="button" aria-pressed="true" data-t="tengo">Tengo semillas</button><button type="button" aria-pressed="false" data-t="busco">Busco semillas</button></div>
    <form id="f" style="display:flex;flex-direction:column;gap:12px">
      <label for="f-esp">Especie<input id="f-esp" list="sp" required maxlength="40" placeholder="Ej. Girasol"></label><datalist id="sp">${SUGGEST.map(s=>`<option value="${s}">`).join("")}</datalist>
      <div class="row2"><label>Cantidad <small>opcional</small><input id="f-cant" maxlength="30" placeholder="20 semillas"></label>
      <label>Campus<select id="f-camp">${Object.entries(CAMPUS).map(([k,v])=>`<option value="${k}" ${k===defCampus?"selected":""}>${v.name}</option>`).join("")}</select></label></div>
      <label><span id="f-cl">Cambio por</span><input id="f-cambio" maxlength="60" placeholder="Albahaca, tomate o lo que tengas"></label>
      <label>Duración<select id="f-dur"><option value="24">24 horas</option><option value="48">48 horas</option><option value="72">72 horas</option></select></label>
      <div class="actions"><button type="button" class="btn ghost" id="f-x">Cancelar</button><button class="btn gold" id="f-ok">Lanzar señal</button></div>
    </form>`);
  $("#seg").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return; tipo=b.dataset.t;
    $("#seg").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); $("#f-cl").textContent=tipo==="tengo"?"Cambio por":"Ofrezco a cambio"; });
  $("#f-x").onclick=closeSheet;
  $("#f").addEventListener("submit",async e=>{ e.preventDefault(); const now=Date.now();
    const doc={tipo,especie:$("#f-esp").value.trim(),cantidad:$("#f-cant").value.trim(),cambio:$("#f-cambio").value.trim(),campus:$("#f-camp").value,creado:now,expira:now+(+$("#f-dur").value)*H};
    if(!doc.especie) return; $("#f-ok").disabled=true;
    try{ await S.A.add("senales",doc); closeSheet(); S.filter=doc.campus; render(); toast("Señal lanzada en "+CAMPUS[doc.campus].name); }
    catch(err){ fail(err); $("#f-ok").disabled=false; } });
}
async function offer(id){
  if(!(await guard())) return; const s=S.senales.find(x=>x.id===id); if(!s) return;
  sheet(`<h3>${s.tipo==="tengo"?"Ofrecer a cambio de":"Tengo"} ${esc(s.especie)}</h3>
    <form id="f" style="display:flex;flex-direction:column;gap:12px">
      <label>${s.tipo==="tengo"?"¿Qué ofreces?":"¿Qué le darías?"}<input id="o-of" required maxlength="60" placeholder="${s.tipo==="tengo"?"Ej. Albahaca, 1 sobre":"Ej. Lavanda, 10 semillas"}"></label>
      <div class="row2"><label>Tu campus<select id="o-camp">${Object.entries(CAMPUS).map(([k,v])=>`<option value="${k}" ${k===(((perfil(S.me)||{}).campus||S.A.defaultCampus?.())||s.campus)?"selected":""}>${v.name}</option>`).join("")}</select></label>
      <label>Tu WhatsApp <small>solo para coordinar</small><input id="o-tel" inputmode="tel" required maxlength="15" placeholder="987 654 321"></label></div>
      <p class="note">${esc(S.A.phoneNote)}</p>
      <div class="actions"><button type="button" class="btn ghost" id="f-x">Cancelar</button><button class="btn" id="f-ok">Enviar oferta</button></div>
    </form>`);
  $("#f-x").onclick=closeSheet;
  $("#f").addEventListener("submit",async e=>{ e.preventDefault();
    const tel=$("#o-tel").value.replace(/\D/g,""); if(tel.length<9){ toast("Revisa tu número: deben ser 9 dígitos."); return; }
    const doc={senal_id:s.id,ofrece:$("#o-of").value.trim(),campus:$("#o-camp").value,creado:Date.now(),estado:"pendiente",telefono:tel};
    $("#f-ok").disabled=true;
    try{ await S.A.add("ofertas",doc); closeSheet(); toast("Oferta enviada"); }catch(err){ fail(err); $("#f-ok").disabled=false; } });
}
async function accept(oid){ try{ await S.A.update("ofertas",oid,{estado:"aceptada"}); toast("Oferta aceptada: coordina la entrega por WhatsApp"); }catch(e){ fail(e); } }
async function complete(oid){
  const o=S.ofertas.find(x=>x.id===oid), s=o&&S.senales.find(x=>x.id===o.senal_id); if(!s) return;
  const a = s.tipo==="tengo" ? o.ofrece : s.especie;      // lo que recibe el campus de la señal
  const b = s.tipo==="tengo" ? s.especie : (s.cambio||o.ofrece); // lo que recibe el campus de quien ofertó
  try{
    await S.A.add("trueques",{oferta_id:o.id,campus_a:s.campus,especie_a:species(a).name,campus_b:o.campus,especie_b:species(b).name,fecha:Date.now()});
    await S.A.update("ofertas",oid,{estado:"completada"});
    S.forest=s.campus; S.sel=null; render();
    toast(`Se plantó ${species(a).name.toLowerCase()} en el bosque de ${CAMPUS[s.campus].name}`);
    document.getElementById("bosques").scrollIntoView({behavior:reduce()?"auto":"smooth"});
  }catch(e){ fail(e); }
}
async function del(id){ try{ await S.A.remove("senales",id); toast("Señal borrada"); }catch(e){ fail(e); } }
function fail(err){
  const code=err&&err.code;
  if(code==="invalid_argument"||code==="forbidden"){ S.canWrite=false; toast("No tienes permiso para publicar aquí."); }
  else if(code==="quota_exceeded") toast("La base de datos está llena: borra señales vencidas.");
  else toast((err&&err.userMessage)||"No se pudo guardar. Intenta de nuevo en un momento.");
}

/* ---------- ciclo ---------- */
function render(){ renderHero(); renderChips(); renderMap(); renderFeed(); renderForest(); }
let pend=0; function soft(){ clearTimeout(pend); pend=setTimeout(()=>{ if(sheetOpen()) renderForest(); else render(); },40); }
document.addEventListener("click",e=>{
  const f=e.target.closest("[data-f]"); if(f){ S.filter=(S.filter===f.dataset.f&&f.dataset.f!=="all")?"all":f.dataset.f; render(); return; }
  const fo=e.target.closest("[data-forest]"); if(fo){ S.forest=fo.dataset.forest; S.sel=null; renderForest(); return; }
  const a=e.target.closest("[data-act]"); if(!a) return; const id=a.dataset.id;
  ({new:newSignal,offer:()=>offer(id),accept:()=>accept(id),done:()=>complete(id),del:()=>del(id)})[a.dataset.act]?.();
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!document.querySelector(".scrim.lock")) closeSheet();
  if((e.key==="Enter"||e.key===" ")&&e.target.classList?.contains("pin")){ e.preventDefault(); e.target.dispatchEvent(new MouseEvent("click",{bubbles:true})); }
  if(e.target.id==="forest"&&(e.key==="ArrowRight"||e.key==="ArrowLeft"||e.key==="Enter")&&FL&&FL.placed.length){
    e.preventDefault(); const arr=FL.placed, i=S.sel?arr.findIndex(p=>p.id===S.sel.id):-1; const n=(i+(e.key==="ArrowLeft"?-1:1)+arr.length)%arr.length; S.sel=arr[n]; showInfo(); paintForest(performance.now()); }
});
window.addEventListener("resize",()=>{ paintForest(performance.now()); paintHero(performance.now()); });

let unsubs=[], booted=false;
async function connect(adapter){
  unsubs.forEach(u=>{ try{u&&u();}catch(e){} }); unsubs=[];
  S.A=adapter; S.senales=[]; S.ofertas=[]; S.trueques=[]; S.perfiles=[]; S.perfLoaded=false; S.sel=null; S.me=null;
  if(!booted){ booted=true;
    $("#fab").onclick=newSignal; $("#saveForest").onclick=saveForest; $("#meBtn").onclick=()=>window.SAProfile.settings(); $("#forest").addEventListener("click",pickAt);
    startLoop(); setInterval(()=>{ if(!sheetOpen()) render(); },60000); }
  render();
  const info=await adapter.init({S,soft,toast,sheet,closeSheet,CAMPUS,render});
  S.me=info.me; S.canWrite=info.canWrite!==false;
  const m=$("#mode"); m.textContent=info.label; m.classList.toggle("live",!!info.live);
  ["senales","ofertas","trueques","perfiles"].forEach(col=>unsubs.push(adapter.subscribe(col,rows=>{ S[col]=rows;
    if(col==="perfiles"&&!S.perfLoaded){ S.perfLoaded=true; if(S.canWrite) setTimeout(()=>ensureReady(true),300); }
    soft(); adapter.afterChange&&adapter.afterChange(S).then(ch=>ch&&soft()); })));
  render();
}
let readyP=null;
async function ensureReady(gate){
  if(readyP) return readyP;
  readyP=(async()=>{
    const A=S.A;
    if(A.signIn && !A.hasSession()){ const ok=await A.signIn(gate); if(!ok) return false; S.me=A.myId(); }
    if(!S.me) return true;
    if(!perfil(S.me)){
      const p=await window.SAProfile.edit({onboard:true,needEmail:!A.verifiedEmail,email:A.verifiedEmail?A.verifiedEmail():""});
      if(!p) return false;
      try{ await A.saveProfile(p); S.perfiles=[...S.perfiles.filter(x=>x.id!==S.me),{id:S.me,...p}]; render(); toast(`¡Bienvenida/o, ${p.nombre.split(" ")[0]}!`); }catch(e){ fail(e); return false; }
    }
    return true;
  })();
  try{ return await readyP; } finally { readyP=null; }
}
window.SemillApp={start:connect,connect,species,CAMPUS,toast,sheet,closeSheet,state:S,render,ready:()=>ensureReady(false),perfil,av,campusFromEmail,DOMAINS,esc,fail};
})();

/* SemillApp — perfil (correo institucional, nombre, foto) y ajustes (día/noche, clima, animaciones) */
(function(){
const $=s=>document.querySelector(s);
const SA=()=>window.SemillApp, AMB=window.SAmbient;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const getMail=()=>{ try{ return localStorage.getItem("sa-correo")||""; }catch(e){ return ""; } };
const setMail=m=>{ try{ localStorage.setItem("sa-correo",m); }catch(e){} };

function resize(file){
  return new Promise((res,rej)=>{
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{ const S=192, c=document.createElement("canvas"); c.width=S; c.height=S; const x=c.getContext("2d");
      const m=Math.min(img.width,img.height); x.drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,S,S);
      URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg",.82)); };
    img.onerror=()=>{ URL.revokeObjectURL(url); rej(new Error("No se pudo leer la imagen.")); };
    img.src=url;
  });
}

/* Formulario de perfil. onboard=true: no se puede cerrar sin completarlo. */
function edit(o){
  o=o||{}; const st=SA().state, cur=SA().perfil(st.me)||{}, CAMPUS=SA().CAMPUS;
  let foto=cur.foto||"", mail=o.email||getMail();
  return new Promise(resolve=>{
    SA().sheet(`
      ${o.onboard?`<div class="welcome"><div class="eyebrow">Bienvenida/o a</div><h3 class="big">SemillApp</h3><p class="note">La red de trueque de semillas entre UPCH, U Lima, PUCP y U Pacífico. Antes de entrar, cuéntanos quién eres.</p></div>`:`<h3>Tu perfil</h3>`}
      <form id="pf" class="pf">
        <div class="photo-row">
          <label class="photo" for="pf-foto" aria-label="Elegir foto de perfil"><span id="pf-prev">${foto?`<img src="${esc(foto)}" alt="">`:`<span class="ph">＋<small>Foto</small></span>`}</span></label>
          <input id="pf-foto" type="file" accept="image/*" hidden>
          <div class="note">Tu foto y tu nombre aparecen en tus señales, para que los demás sepan con quién intercambian.</div>
        </div>
        ${o.needEmail!==false?`<label>Correo institucional<input id="pf-mail" type="email" autocomplete="email" required placeholder="nombre@upch.pe" value="${esc(mail)}"><small>Solo correos de UPCH, U Lima, PUCP o U Pacífico.</small></label>`
          :`<div class="verified"><b>✓ Correo verificado</b><span>${esc(mail)}</span></div>`}
        <div class="row2">
          <label>Nombre y apellido<input id="pf-name" required maxlength="40" autocomplete="name" placeholder="Rosa Dilas" value="${esc(cur.nombre||"")}"></label>
          <label>Tu universidad<select id="pf-camp">${Object.entries(CAMPUS).map(([k,v])=>`<option value="${k}" ${k===(cur.campus||"")?"selected":""}>${v.full}</option>`).join("")}</select></label>
        </div>
        <div class="err" id="pf-err" hidden></div>
        <div class="actions">${o.onboard?"":`<button type="button" class="btn ghost" id="pf-x">Cancelar</button>`}<button class="btn gold" id="pf-ok">${o.onboard?"Entrar a SemillApp":"Guardar"}</button></div>
      </form>`,{lock:!!o.onboard,cls:o.onboard?"onboard":""});
    const err=t=>{ const e=$("#pf-err"); e.textContent=t; e.hidden=!t; };
    const mailIn=$("#pf-mail");
    if(mailIn){ const sync=()=>{ const c=SA().campusFromEmail(mailIn.value); if(c) $("#pf-camp").value=c; }; mailIn.addEventListener("input",sync); sync(); }
    else { const c=SA().campusFromEmail(mail); if(c&&!cur.campus) $("#pf-camp").value=c; }
    $("#pf-foto").addEventListener("change",async e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return;
      try{ foto=await resize(f); $("#pf-prev").innerHTML=`<img src="${foto}" alt="">`; err(""); }catch(x){ err(x.message); } });
    const x=$("#pf-x"); if(x) x.onclick=()=>{ SA().closeSheet(); resolve(null); };
    $("#pf").addEventListener("submit",e=>{ e.preventDefault();
      const nombre=$("#pf-name").value.trim().replace(/\s+/g," ");
      if(mailIn){ const m=mailIn.value.trim().toLowerCase(); if(!SA().campusFromEmail(m)){ err("Ese correo no es de UPCH, U Lima, PUCP o U Pacífico."); return; } setMail(m); }
      if(nombre.length<2){ err("Escribe tu nombre."); return; }
      const campus=$("#pf-camp").value; SA().closeSheet(); resolve({nombre,campus,foto});
    });
  });
}

function seg(name,val,opts){ return `<div class="seg3" role="group" aria-label="${name}">${opts.map(([v,l])=>`<button type="button" data-${name}="${v}" aria-pressed="${val===v}">${l}</button>`).join("")}</div>`; }
function settings(){
  const st=SA().state, A=st.A, me=SA().perfil(st.me), cfg=AMB.settings(), CAMPUS=SA().CAMPUS;
  const mail=A&&A.verifiedEmail?A.verifiedEmail():getMail();
  SA().sheet(`
    <h3>Ajustes</h3>
    <div class="set-card">
      ${me?SA().av(st.me,58,"big"):`<span class="av ini big" style="width:58px;height:58px;font-size:22px">?</span>`}
      <div class="set-who"><b>${esc(me?me.nombre:"Sin perfil")}</b><span>${esc(me?CAMPUS[me.campus]?.full||"":"Completa tu perfil para publicar")}</span>${mail?`<span class="mono">${esc(mail)}${A&&A.verifiedEmail?" ✓":""}</span>`:""}</div>
      <button class="btn ghost small" id="set-edit">${me?"Editar":"Crear"}</button>
    </div>
    <div class="set-group"><div class="set-lbl">Apariencia</div>${seg("tema",cfg.tema,[["auto","Automático"],["dia","☀︎ Día"],["noche","☾ Noche"]])}<p class="note">Automático cambia según la hora: amanece, atardece y anochece contigo.</p></div>
    <div class="set-group"><div class="set-lbl">Clima del paisaje</div>${seg("clima",cfg.clima,[["despejado","Despejado"],["garua","Garúa"],["lluvia","Lluvia"]])}</div>
    <div class="set-group set-row"><div><div class="set-lbl">Animaciones</div><p class="note">Hojas, nubes, luciérnagas y plantas que se mecen.</p></div>
      <button type="button" class="switch" id="set-anim" role="switch" aria-checked="${cfg.anim}" aria-label="Animaciones"><i></i></button></div>
    ${A&&A.signOut?`<button class="btn ghost" id="set-out">Cerrar sesión</button>`:""}
    <p class="note center">SemillApp 2.0 · proyecto estudiantil de trueque de semillas</p>
    <div class="actions"><button class="btn gold" id="set-ok">Listo</button></div>`);
  const L=$("#layer");
  L.querySelectorAll("[data-tema]").forEach(b=>b.onclick=()=>{ AMB.set({tema:b.dataset.tema}); L.querySelectorAll("[data-tema]").forEach(x=>x.setAttribute("aria-pressed",x===b)); });
  L.querySelectorAll("[data-clima]").forEach(b=>b.onclick=()=>{ AMB.set({clima:b.dataset.clima}); L.querySelectorAll("[data-clima]").forEach(x=>x.setAttribute("aria-pressed",x===b)); });
  $("#set-anim").onclick=e=>{ const v=!AMB.settings().anim; AMB.set({anim:v}); e.currentTarget.setAttribute("aria-checked",v); };
  $("#set-ok").onclick=()=>SA().closeSheet();
  $("#set-edit").onclick=async()=>{
    if(!st.me){ SA().closeSheet(); SA().toast("Entra primero para crear tu perfil."); return; }
    const p=await edit({onboard:false,needEmail:!(A&&A.verifiedEmail),email:mail});
    if(p){ try{ await A.saveProfile(p); st.perfiles=[...st.perfiles.filter(x=>x.id!==st.me),{id:st.me,...p}]; SA().render(); SA().toast("Perfil actualizado"); }catch(e){ SA().fail(e); } }
  };
  const out=$("#set-out"); if(out) out.onclick=async()=>{ SA().closeSheet(); await A.signOut(); SA().toast("Sesión cerrada"); location.reload(); };
}
window.SAProfile={edit,settings};
})();

/* Adaptador de demostración: datos de ejemplo en memoria (no se comparten con nadie) */
window.SemillAppLocal=function(opts){
  const H=3600e3, D=24*H, now=Date.now(); let n=0; const id=p=>p+(++n);
  const T=(a,ea,b,eb,days)=>({id:id("t"),campus_a:a,especie_a:ea,campus_b:b,especie_b:eb,fecha:now-days*D,autor:"demo"});
  const data={
    senales:[
      {id:"d1",tipo:"tengo",especie:"Girasol",cantidad:"20 semillas",cambio:"Albahaca o tomate",campus:"pucp",creado:now-3*H,expira:now+21*H,autor:"demo"},
      {id:"d2",tipo:"busco",especie:"Lavanda",cantidad:"",cambio:"Ají amarillo",campus:"upch",creado:now-6*H,expira:now+42*H,autor:"demo"},
      {id:"d3",tipo:"tengo",especie:"Maíz morado",cantidad:"1 mazorca",cambio:"Quinua o kiwicha",campus:"ulima",creado:now-1*H,expira:now+23*H,autor:"demo"},
      {id:"d4",tipo:"tengo",especie:"Tomate cherry",cantidad:"1 sobre",cambio:"Lo que tengas",campus:"up",creado:now-22*H,expira:now+2*H,autor:"demo"},
      {id:"d5",tipo:"tengo",especie:"Culantro",cantidad:"2 sobres",cambio:"Girasol",campus:"upch",creado:now-2*H,expira:now+46*H,autor:"demo"},
      {id:"d6",tipo:"busco",especie:"Palta",cantidad:"1 pepa",cambio:"Hierbabuena",campus:"ulima",creado:now-5*H,expira:now+67*H,autor:"demo"}
    ],
    ofertas:[
      {id:"o1",senal_id:"d1",ofrece:"Albahaca (1 sobre)",campus:"up",autor:"demo",creado:now-2*H,estado:"pendiente"},
      {id:"o2",senal_id:"d3",ofrece:"Kiwicha",campus:"pucp",autor:"demo",creado:now-.5*H,estado:"aceptada"}
    ],
    trueques:[
      T("upch","Girasol","pucp","Albahaca",12),T("upch","Tomate","ulima","Maíz",10),T("upch","Palta","up","Culantro",9),
      T("upch","Girasol","upch","Lavanda",7),T("upch","Quinua","pucp","Ají amarillo",5),T("upch","Hierbabuena","up","Girasol",3),
      T("upch","Rocoto","ulima","Kiwicha",2),T("upch","Lechuga","pucp","Tomate",1),T("upch","Limón","ulima","Zapallo",0.2),
      T("pucp","Girasol","ulima","Albahaca",8),T("pucp","Maíz","up","Fresa",6),T("pucp","Lavanda","ulima","Palta",4),
      T("pucp","Culantro","up","Quinua",1.5),T("ulima","Girasol","up","Mango",11),T("ulima","Tomate","pucp","Huacatay",3),
      T("up","Zanahoria","pucp","Kiwicha",2.5),T("up","Ají","ulima","Rosa",0.6)
    ],
    perfiles:[]
  };
  try{ const p=JSON.parse(localStorage.getItem("sa-perfil")||"null"); if(p) data.perfiles.push({...p,id:"local"}); }catch(e){}
  const subs={senales:[],ofertas:[],trueques:[],perfiles:[]};
  const emit=c=>subs[c].forEach(cb=>cb(data[c].slice()));
  return {
    phoneNote:"Modo demostración: nada de lo que escribas se envía ni se guarda.",
    async init(){ return {me:"local",canWrite:true,label:opts&&opts.label||"Demo",live:false}; },
    subscribe(c,cb){ subs[c].push(cb); cb(data[c].slice()); return ()=>{ subs[c]=subs[c].filter(x=>x!==cb); }; },
    async add(c,doc){ const d={...doc,id:id("l"),autor:"local"}; data[c].push(d); emit(c); return d; },
    async update(c,i,patch){ data[c]=data[c].map(r=>r.id===i?{...r,...patch}:r); emit(c); },
    async remove(c,i){ data[c]=data[c].filter(r=>r.id!==i); emit(c); },
    nameOf(){ return ""; },
    phoneFor(o){ return o.telefono||"987654321"; },
    async ensureAuth(){ return true; },
    async saveProfile(p){ try{ localStorage.setItem("sa-perfil",JSON.stringify(p)); }catch(e){} data.perfiles=[...data.perfiles.filter(r=>r.id!=="local"),{...p,id:"local"}]; emit("perfiles"); },
    saveFile:opts&&opts.saveFile
  };
};

/* Adaptador para la app instalable: Supabase (base de datos + inicio de sesión con correo universitario) */
window.SemillAppSupabase=function(cfg){
  const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  const DOM=new RegExp("@([a-z0-9-]+\\.)*("+cfg.DOMINIOS.map(d=>d.replace(/\./g,"\\.")).join("|")+")$","i");
  let session=null, U=null; const phones={};
  const meta=()=>(session&&session.user.user_metadata)||{};
  const err=e=>{ const x={code:e.code==="42501"?"forbidden":"unavailable",userMessage:e.message}; throw x; };
  const $=s=>document.querySelector(s);
  function acct(){
    const el=$("#acct"); if(!el) return;
    el.innerHTML=session?"":`<button class="btn gold small" id="acctBtn">Entrar</button>`;
    const b=$("#acctBtn"); if(b) b.onclick=()=>window.SemillApp.ready();
  }
  function loginSheet(gate){
    return new Promise(resolve=>{
      let email="";
      const step1=()=>U.sheet(`${gate?`<div class="welcome"><div class="eyebrow">Bienvenida/o a</div><h3 class="big">SemillApp</h3></div>`:`<h3>Entra con tu correo universitario</h3>`}
        <p class="note">Solo para estudiantes de UPCH, U Lima, PUCP y U Pacífico. Te enviaremos un código para comprobar que el correo es tuyo.</p>
        <form id="lf" style="display:flex;flex-direction:column;gap:12px"><label>Correo institucional<input id="l-mail" type="email" autocomplete="email" required placeholder="nombre@upch.pe"></label>
        <div class="err" id="l-err" hidden></div>
        <div class="actions">${gate?"":`<button type="button" class="btn ghost" id="l-x">Cancelar</button>`}<button class="btn gold" id="l-ok">Enviar código</button></div></form>`,{lock:gate,cls:gate?"onboard":""});
      const step2=()=>U.sheet(`<h3>Revisa tu correo</h3><p class="note">Escribe el código que llegó a <b>${email.replace(/</g,"")}</b>. Puede tardar un minuto; revisa también spam.</p>
        <form id="lf" style="display:flex;flex-direction:column;gap:12px"><label>Código<input id="l-code" inputmode="numeric" autocomplete="one-time-code" required maxlength="10" placeholder="123456"></label>
        <div class="err" id="l-err" hidden></div>
        <div class="actions"><button type="button" class="btn ghost" id="l-back">Cambiar correo</button><button class="btn gold" id="l-ok">Entrar</button></div></form>`,{lock:gate,cls:gate?"onboard":""});
      const bind=(fn)=>{ const x=$("#l-x"); if(x) x.onclick=()=>{ U.closeSheet(); resolve(false); };
        const b=$("#l-back"); if(b) b.onclick=()=>{ step1(); bind(s1); };
        $("#lf").addEventListener("submit",async e=>{ e.preventDefault(); const ok=$("#l-ok"); ok.disabled=true; const er=$("#l-err"); er.hidden=true;
          try{ await fn(); }catch(m){ er.textContent=m.message||String(m); er.hidden=false; ok.disabled=false; } }); };
      const s1=async()=>{ email=$("#l-mail").value.trim().toLowerCase();
        if(!DOM.test(email)) throw new Error("Usa tu correo de UPCH, U Lima, PUCP o U Pacífico.");
        const r=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:true}}); if(r.error) throw new Error(r.error.status===429?"Se enviaron muchos códigos. Espera unos minutos e intenta de nuevo.":r.error.message);
        step2(); bind(async()=>{ const r2=await sb.auth.verifyOtp({email,token:$("#l-code").value.trim(),type:"email"});
          if(r2.error) throw new Error("El código no es válido o ya venció. Pide uno nuevo.");
          session=r2.data.session; U.S.me=session.user.id; U.closeSheet(); acct(); refetchAll(); resolve(true); }); };
      step1(); bind(s1);
    });
  }
  const api={
    phoneNote:"Tu número solo lo puede ver quien lanzó la señal, y solo si acepta tu oferta.",
    async init(u){ U=u; session=(await sb.auth.getSession()).data.session;
      sb.auth.onAuthStateChange((_e,s)=>{ session=s; U.S.me=s?s.user.id:null; acct(); refetchAll(); });
      acct(); return {me:session?session.user.id:null,canWrite:true,label:"En vivo",live:true}; },
    feedGate(){ return session?null:`<div class="empty"><div style="font-size:2rem" aria-hidden="true">🔒</div><div><b style="color:var(--fg)">Las señales son solo para estudiantes.</b><br>Entra con tu correo de UPCH, U Lima, PUCP o U Pacífico para verlas y lanzar las tuyas.</div><button class="btn gold" id="gateBtn" onclick="SemillApp.ready()">Entrar</button></div>`; },
    subscribe(c,cb){
      let t=0; const fetch=async()=>{ let q=sb.from(c).select("*").limit(1000);
        if(c==="senales") q=q.gt("expira",Date.now()-6*3600e3);
        if(c==="perfiles"&&!session){ cb([]); return; }
        const r=await q; if(!r.error) cb((r.data||[]).map(x=>({...x,creado:+x.creado,expira:+x.expira,fecha:+x.fecha}))); };
      const deb=()=>{ clearTimeout(t); t=setTimeout(fetch,250); };
      fetchers.push(deb); fetch();
      const ch=sb.channel("rt-"+c).on("postgres_changes",{event:"*",schema:"public",table:c},deb).subscribe();
      return ()=>sb.removeChannel(ch);
    },
    async add(c,doc){
      const row={...doc}; let tel=null; if(c==="ofertas"){ tel=row.telefono; delete row.telefono; }
      if(c!=="trueques"){ const me=(U.S.perfiles||[]).find(x=>x.id===session.user.id); row.autor_nombre=(me&&me.nombre)||meta().nombre||""; }
      const r=await sb.from(c).insert(row).select().single(); if(r.error) err(r.error);
      if(tel){ const r2=await sb.from("contactos").insert({oferta_id:r.data.id,telefono:tel}); if(r2.error) err(r2.error); }
      fetchers.forEach(f=>f()); return r.data;
    },
    async update(c,id,p){ const r=await sb.from(c).update(p).eq("id",id); if(r.error) err(r.error); fetchers.forEach(f=>f()); },
    async remove(c,id){ const r=await sb.from(c).delete().eq("id",id); if(r.error) err(r.error); fetchers.forEach(f=>f()); },
    nameOf(r){ return r.autor_nombre||""; },
    async afterChange(S){
      if(!session) return false;
      const mine=new Set(S.senales.filter(s=>s.autor===session.user.id).map(s=>s.id));
      const need=S.ofertas.filter(o=>mine.has(o.senal_id)&&o.estado==="aceptada"&&!phones[o.id]).map(o=>o.id);
      if(!need.length) return false;
      const r=await sb.from("contactos").select("oferta_id,telefono").in("oferta_id",need); if(r.error) return false;
      r.data.forEach(x=>phones[x.oferta_id]=x.telefono); return r.data.length>0;
    },
    phoneFor(o){ return phones[o.id]||null; },
    defaultCampus(){ return meta().campus; },
    hasSession(){ return !!session; },
    myId(){ return session?session.user.id:null; },
    verifiedEmail(){ return session?session.user.email:""; },
    signIn(gate){ return loginSheet(gate); },
    async signOut(){ await sb.auth.signOut(); },
    async ensureAuth(){ return !!session; },
    async saveProfile(p){ const r=await sb.from("perfiles").upsert({id:session.user.id,nombre:p.nombre,campus:p.campus,foto:p.foto||"",actualizado:Date.now()}); if(r.error) err(r.error); await sb.auth.updateUser({data:{nombre:p.nombre,campus:p.campus}}); session=(await sb.auth.getSession()).data.session; refetchAll(); },
    async saveFile(blob,filename){
      const file=new File([blob],filename,{type:"image/png"});
      if(navigator.canShare&&navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:"Mi bosque SemillApp"}); return; }catch(e){ if(e.name==="AbortError") return; } }
      const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    }
  };
  const fetchers=[]; const refetchAll=()=>fetchers.forEach(f=>f());
  return api;
};

/* Arranque de la app instalable */
(function(){
  const cfg=window.SEMILLAPP_CONFIG||{};
  const configured=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&window.supabase);
  const saveLocal=async(blob,filename)=>{ const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); };
  SemillApp.connect(configured?SemillAppSupabase(cfg):SemillAppLocal({saveFile:saveLocal,label:"Demo"}));

  if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));

  // Banner "Instalar app"
  const box=document.getElementById("install");
  const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
  let dismissed=false; try{ dismissed=localStorage.getItem("sa-install-off")==="1"; }catch(e){}
  if(standalone||dismissed) return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  let deferred=null;
  const show=(btnText,onClick)=>{
    box.className="install"; box.hidden=false;
    box.innerHTML=`<img src="icon-192.png" alt=""><div><b>Instala SemillApp</b>Tenla en tu pantalla de inicio, como una app.</div><button class="btn gold small" id="instBtn">${btnText}</button><button class="btn ghost small" id="instOff" aria-label="Ocultar">✕</button>`;
    document.getElementById("instBtn").onclick=onClick;
    document.getElementById("instOff").onclick=()=>{ box.hidden=true; try{ localStorage.setItem("sa-install-off","1"); }catch(e){} };
  };
  window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferred=e;
    show("Instalar",async()=>{ deferred.prompt(); const r=await deferred.userChoice; if(r.outcome==="accepted") box.hidden=true; deferred=null; }); });
  window.addEventListener("appinstalled",()=>{ box.hidden=true; SemillApp.toast("¡SemillApp instalada!"); });
  if(ios) show("Cómo",()=>SemillApp.sheet(`<h3>Instalar en iPhone</h3>
    <ol class="steps"><li>Abre esta página en <b>Safari</b>.</li><li>Toca el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).</li><li>Elige <b>Agregar a pantalla de inicio</b>.</li><li>Toca <b>Agregar</b>. Listo: el girasol aparece con tus apps.</li></ol>
    <div class="actions"><button class="btn gold" onclick="SemillApp.closeSheet()">Entendido</button></div>`));
})();
