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
  upch:{name:"UPCH", ab:"UPCH", full:"Cayetano Heredia", x:208, y:68, col:"#C62828", ink:"#FFFFFF", edge:"#8E1A1A"},
  pucp:{name:"PUCP", ab:"PUCP", full:"PUCP", x:162, y:158, col:"#002060", ink:"#FFFFFF", edge:"#5B7BC4"},
  up:{name:"U Pacífico", ab:"UP", full:"U del Pacífico", x:226, y:186, col:"#FFFFFF", ink:"#001A47", edge:"#001A47"},
  ulima:{name:"U Lima", ab:"UL", full:"U de Lima", x:380, y:190, col:"#FF7300", ink:"#FFFFFF", edge:"#B34F00"}
};
/* [palabra clave, tipo de planta, nombre, emoji, color de flor/fruto] */
const SPECIES_TABLE = [
  ["girasol","girasol","Girasol","","#F2A413"],["rosa","rosa","Rosa","","#C62828"],["rosal","rosa","Rosa","","#C62828"],
  ["orquí","orquidea","Orquídea","","#D9739F"],["orqui","orquidea","Orquídea","","#D9739F"],["phalaen","orquidea","Orquídea","","#D9739F"],
  ["tulip","tulipan","Tulipán","","#E0484F"],["magnolia","magnolia","Magnolia","","#F7E6EC"],
  ["mastuerzo","mastuerzo","Mastuerzo","","#F28C13"],["capuchina","mastuerzo","Mastuerzo","","#F28C13"],["cosmos","cosmos","Cosmos","","#E88BB4"],["pino lim","pino","Pino limón","","#D7E36B"],["ciprés lim","pino","Pino limón","","#D7E36B"],["cipres lim","pino","Pino limón","","#D7E36B"],["lavanda","flor","Lavanda","","#8E6CC0"],["manzanilla","flor","Manzanilla","🌼","#FFFFFF"],["cempas","flor","Cempasúchil","🌼","#F28C13"],
  ["tomate","fruto","Tomate","🍅","#C62828"],["ají amarillo","fruto","Ají amarillo","🌶️","#F2A413"],["aji amarillo","fruto","Ají amarillo","🌶️","#F2A413"],
  ["ají","fruto","Ají","🌶️","#C62828"],["aji","fruto","Ají","🌶️","#C62828"],["rocoto","fruto","Rocoto","🌶️","#C62828"],["pimiento","fruto","Pimiento","🫑","#C62828"],["fresa","fruto","Fresa","🍓","#C62828"],
  ["albahaca","hierba","Albahaca","🌿",null],["culantro","hierba","Culantro","🌿",null],["cilantro","hierba","Culantro","🌿",null],["hierbabuena","hierba","Hierbabuena","🌿",null],
  ["menta","hierba","Menta","🌿",null],["perejil","hierba","Perejil","🌿",null],["orégano","hierba","Orégano","🌿",null],["oregano","hierba","Orégano","🌿",null],["romero","hierba","Romero","🌿",null],["huacatay","hierba","Huacatay","🌿",null],
  ["maíz","maiz","Maíz","🌽","#F2A413"],["maiz","maiz","Maíz","🌽","#F2A413"],["quinua","grano","Quinua","🌾","#C62828"],["kiwicha","grano","Kiwicha","🌾","#B0306A"],
  ["palta","arbol","Palta","🥑","#3E5A1E"],["limón","arbol","Limón","🍋","#F2D513"],["limon","arbol","Limón","🍋","#F2D513"],["mango","arbol","Mango","🥭","#F28C13"],["naranj","arbol","Naranjo","🍊","#F28C13"],["papaya","arbol","Papaya","🍈","#F28C13"],["lúcuma","arbol","Lúcuma","🌳","#F2A413"],["lucuma","arbol","Lúcuma","🌳","#F2A413"],
  ["frijol","hierba","Frijol","🫘",null],["pallar","hierba","Pallar","🫘",null],["arveja","hierba","Arveja","🫛",null],["haba","hierba","Haba","🫛",null],
  ["lechuga","hortaliza","Lechuga","🥬",null],["zanahoria","hortaliza","Zanahoria","🥕","#F28C13"],["cebolla","hortaliza","Cebolla","🧅","#B0306A"],["zapallo","hortaliza","Zapallo","🎃","#F28C13"],["calabaza","hortaliza","Zapallo","🎃","#F28C13"]
];
const ESPECIES = ["Girasol","Rosa","Mastuerzo","Cosmos","Pino limón"];
/* Crecimiento desde semilla con los tiempos MÍNIMOS documentados (día en que empieza cada etapa 0..4).
   Girasol enano: 50–60 días a flor. Rosa miniatura: 4–6 sem de germinación, florece desde el 1.er año.
   Orquídea: 4–7 años desde semilla.
   Tulipán: desde ~4 años. Pino limón: ~23 cm por año. */
const CRECE = {
  "Girasol":  {dias:[0,7,20,35,50],      etapas:["Brote","Plántula","Planta","Botón floral","Florecido"], esplendor:"Florece desde los 50 días (variedades enanas)"},
  "Rosa":     {dias:[0,70,110,170,240],  etapas:["Semilla en frío","Brote","Plántula","Rosal joven","Primeras flores"], esplendor:"Rosa miniatura: primeras flores desde el primer año", frio:true},
  "Orquídea": {dias:[0,120,400,900,1460], etapas:["Protocormo","Brote","Plántula","Planta joven","Florecida"], esplendor:"Desde semilla: primera flor desde los 4 años (una orquídea adulta de vivero florece 1–2 veces al año)"},
  "Mastuerzo":{dias:[0,7,15,30,45],      etapas:["Brote","Plántula","Planta","Botón floral","Florecido"], esplendor:"Florece desde los 45 días"},
  "Cosmos":   {dias:[0,7,18,32,45],      etapas:["Brote","Plántula","Planta","Botón floral","Florecido"], esplendor:"Florece desde los 45 días (45–75 según la variedad)"},
  "Tulipán":  {dias:[0,90,300,900,1460], etapas:["Semilla en frío","Brote","Bulbito","Bulbo joven","Florecido"], esplendor:"Desde semilla: primera flor desde los 4 años; necesita frío para florecer", frio:true},
  "Pino limón":{dias:[0,30,120,365,620], etapas:["Brote","Plántula","Arbolito","Árbol joven","Arbolito de maceta (~40 cm)"], esplendor:"Listo como arbolito de maceta en ~1,5–2 años"}
};
const DEF_CRECE={dias:[0,10,30,60,90],etapas:["Brote","Plántula","Planta","Florecida","Madura"],esplendor:""};
const crece=sp=>CRECE[sp.name]||DEF_CRECE;
function growthOf(sp,fecha){ const T=crece(sp).dias, d=Math.max(0,(Date.now()-fecha)/DAY); let st=0; for(let k=0;k<5;k++) if(d>=T[k]) st=k;
  const fr=st>=4?0:(d-T[st])/(T[st+1]-T[st]); return {d,st,fr,g:Math.min(4,st+fr),total:Math.min(1,d/T[4]),T}; }
function durDias(d){ if(d<1) return `${Math.max(1,Math.round(d*24))} h`; if(d<45) return `${Math.round(d)} ${Math.round(d)===1?"día":"días"}`; if(d<365) return `${Math.round(d/30)} meses`; const y=d/365; return `${(Math.round(y*2)/2).toString().replace(".",",")} ${y<1.25?"año":"años"}`; }
const SUGGEST = ESPECIES;
/* Fichas de cultivo de las especies más frecuentes para intercambio */
const FICHAS = {
  "Rosa":{nivel:"Fácil de conseguir",plantar:"Esquejes o plantones; también semillas.",clima:"Depende de la variedad; muchas se adaptan a Lima.",consejo:"Un rosal en maceta es una buena opción para comenzar."},
  "Girasol":{nivel:"Fácil desde semilla",plantar:"Semillas.",clima:"Cálido y soleado.",consejo:"Elige una variedad enana si lo cultivarás en maceta."},
  "Orquídea":{nivel:"Mejor como planta joven",plantar:"Planta joven o ejemplar de vivero.",clima:"Depende de la especie; las Phalaenopsis suelen cultivarse en interiores luminosos.",consejo:"No conviene empezar con semillas en casa: su germinación requiere condiciones especializadas."},
  "Tulipán":{nivel:"Necesita frío",plantar:"Bulbos, no semillas, si buscas una floración relativamente rápida.",clima:"Necesita un período de frío adecuado.",consejo:"En Lima cuesta lograr una buena floración: consigue bulbos preparados para cultivo."},
  "Magnolia":{nivel:"Árbol o arbusto grande",plantar:"Plantón de vivero o semillas.",clima:"Varía según la especie; algunas prefieren suelos húmedos y ligeramente ácidos.",consejo:"Necesita espacio para desarrollarse como árbol o arbusto grande."},
  "Mastuerzo":{nivel:"Muy fácil desde semilla",plantar:"Semillas, directo en tierra o maceta.",clima:"Sol o media sombra; ideal para Lima. Es nativo del Perú.",consejo:"No le pongas mucho abono: en suelo pobre da más flores. Sus flores y hojas se comen en ensaladas."},
  "Cosmos":{nivel:"Fácil desde semilla",plantar:"Semillas, directo en tierra o maceta.",clima:"Pleno sol; aguanta el calor y los suelos pobres.",consejo:"Corta las flores secas y seguirá floreciendo por más tiempo."},
  "Pino limón":{nivel:"Paciencia: crece lento desde semilla",plantar:"Semillas o plantón.",clima:"Sol o media sombra; se adapta bien al clima templado de Lima.",consejo:"Ideal en maceta: riego moderado sin encharcar. Sus hojas verde-doradas huelen a limón al tocarlas."}
};
function species(text){
  const t=(text||"").toLowerCase();
  const m=SPECIES_TABLE.find(r=>t.includes(r[0]));
  if(m) return {kind:m[1],name:m[2],emoji:m[3],color:m[4]};
  const clean=(text||"Planta").split(/[(,;/]| o | y /)[0].trim()||"Planta";
  return {kind:"hierba",name:clean.charAt(0).toUpperCase()+clean.slice(1),emoji:"🌱",color:null};
}
const H=3600e3, DAY=24*H;
const ICONS={};
function plantIcon(name,px){
  const sp=species(name), key=sp.name+"|"+px; if(ICONS[key]) return ICONS[key];
  const W=240, big=document.createElement("canvas"); big.width=big.height=W; const g=big.getContext("2d");
  g.translate(W/2,W*.92); g.scale(3,3);
  try{ drawPlant(g,{id:"icon-"+sp.name,stage:sp.kind==="magnolia"||sp.kind==="arbol"?3:4,sp,phase:0},0,true); }catch(e){}
  const d=g.getImageData(0,0,W,W).data; let x0=W,y0=W,x1=0,y1=0;
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){ if(d[(y*W+x)*4+3]>8){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } }
  const dpr=Math.min(2,window.devicePixelRatio||1), S=Math.round(px*dpr), c=document.createElement("canvas"); c.width=c.height=S; const x=c.getContext("2d");
  if(x1>x0){ const bw=x1-x0+1, bh=y1-y0+1, f=S*.94/Math.max(bw,bh); x.drawImage(big,x0,y0,bw,bh,(S-bw*f)/2,(S-bh*f)/2,bw*f,bh*f); }
  return ICONS[key]=c.toDataURL();
}
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const S={filter:"all",forest:"upch",senales:[],ofertas:[],trueques:[],perfiles:[],perfLoaded:false,me:null,canWrite:true,A:null,sel:null};
const AMB=window.SAmbient;
const DOMAINS={"upch.pe":"upch","pucp.edu.pe":"pucp","pucp.pe":"pucp","ulima.edu.pe":"ulima","up.edu.pe":"up"};
function campusFromEmail(m){ m=(m||"").trim().toLowerCase(); const at=m.lastIndexOf("@"); if(at<1) return null; const d=m.slice(at+1);
  for(const k in DOMAINS){ if(d===k||d.endsWith("."+k)) return DOMAINS[k]; } return null; }
const perfil=id=>S.perfiles.find(p=>p.id===id)||null;
function initials(n){ return (n||"?").replace(/\(.*?\)/g,"").trim().split(/\s+/).filter(w=>/^\p{L}/u.test(w)).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?"; }
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
    if(t.campus_a===campus) list.push({id:t.id+"a",especie:t.especie_a,fecha:t.fecha,partner:t.campus_b,demo:String(t.autor).startsWith("demo")});
    if(t.campus_b===campus) list.push({id:t.id+"b",especie:t.especie_b,fecha:t.fecha,partner:t.campus_a,demo:String(t.autor).startsWith("demo")});
  });
  list.sort((a,b)=>a.fecha-b.fecha);
  const seen={};
  list.forEach(p=>{ p.sp=species(p.especie); const k=p.sp.name; const before=seen[k]||0; seen[k]=before+1;
    const gr=growthOf(p.sp,p.fecha); p.g=gr.g; p.stage=gr.st; });
  return list;
}

/* ---------- render: chips, mapa, feed ---------- */
function renderChips(){
  const c={}; active().forEach(s=>c[s.campus]=(c[s.campus]||0)+1);
  const opts=[["all","Todas",active().length],...Object.entries(CAMPUS).map(([k,v])=>[k,v.name,c[k]||0])];
  $("#chips").innerHTML=opts.map(([k,n,cnt])=>`<button class="chip" aria-pressed="${S.filter===k}" data-f="${k}" ${CAMPUS[k]?`style="--cc:${CAMPUS[k].col};--ci:${CAMPUS[k].ink};--ce:${CAMPUS[k].edge}"`:""}>${CAMPUS[k]?`<i class="cdot"></i>`:""}${n} · ${cnt}</button>`).join("");
}
function renderMap(){
  const c={}; active().forEach(s=>c[s.campus]=(c[s.campus]||0)+1);
  const pins=Object.entries(CAMPUS).map(([k,v])=>{
    const n=c[k]||0, sel=S.filter===k, dim=S.filter!=="all"&&!sel, right=k==="ulima", below=k==="up";
    return `<g class="pin" data-f="${k}" role="button" tabindex="0" aria-label="${v.name}: ${n} señales" opacity="${dim?.35:1}">
      ${n?`<circle class="pulse" cx="${v.x}" cy="${v.y}" r="11" fill="${k==="up"?"#7FA2D9":v.col}"/>`:""}
      ${sel?`<circle cx="${v.x}" cy="${v.y}" r="19" fill="none" stroke="${v.edge}" stroke-width="1.5" stroke-dasharray="3 3"/>`:""}
      <circle cx="${v.x}" cy="${v.y}" r="${sel?15:13}" fill="${v.col}" stroke="${v.edge}" stroke-width="${sel?3:2}"/>
      <text x="${v.x}" y="${v.y+4}" text-anchor="middle" font-family="Jost, sans-serif" font-size="11" font-weight="700" fill="${v.ink}">${n}</text>
      <text x="${below?v.x:right?v.x-19:v.x+19}" y="${below?v.y+31:v.y+4}" text-anchor="${below?"middle":right?"end":"start"}" font-family="Jost, sans-serif" font-size="12.5" font-weight="800" fill="var(--fg)" paint-order="stroke" stroke="var(--land)" stroke-width="3.5">${v.name}</text>
    </g>`;}).join("");
  $("#map").innerHTML=`<svg viewBox="0 0 440 262" role="img" aria-label="Mapa esquemático de Lima con los cuatro campus">
    <rect width="440" height="262" fill="var(--land)"/>
    <path d="M0,0 L44,0 L52,60 L58,112 L38,136 L70,150 L120,180 L180,212 L226,262 L0,262 Z" fill="var(--sea)"/>
    <path d="M440,66 C370,78 310,92 255,100 S130,104 56,110" fill="none" stroke="var(--river)" stroke-width="4" stroke-linecap="round"/>
    <path d="M150,198 L250,198 L330,193 L440,188" fill="none" stroke="var(--river)" stroke-width="2.5" stroke-dasharray="1 6" stroke-linecap="round"/>
    <text x="16" y="232" font-family="Jost, sans-serif" font-size="10.5" font-style="italic" fill="var(--muted)">Océano Pacífico</text>
    <text x="330" y="80" font-family="Jost, sans-serif" font-size="10" font-style="italic" fill="var(--muted)">Río Rímac</text>
    <text x="292" y="210" font-family="Jost, sans-serif" font-size="9.5" fill="var(--muted)">Av. Javier Prado</text>
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
      <div class="ring" aria-hidden="true"><svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="21" fill="none" stroke="var(--line)" stroke-width="2.5"/><circle cx="23" cy="23" r="21" fill="none" stroke="${soon?"#C62828":"#F2A413"}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-frac)}" transform="rotate(-90 23 23)"/></svg><img class="pi" src="${plantIcon(s.especie,40)}" alt=""></div>
      <div class="body">
        <div class="top"><span class="tag ${s.tipo}">${s.tipo==="tengo"?"Tengo":"Busco"}</span><span class="camp"><i class="cdot" style="--cc:${v.col};--ce:${v.edge}"></i>${esc(v.name)}</span>${s.autor==="demo"?`<span class="tag ej">Ejemplo</span>`:""}</div>
        <div class="title">${esc(s.especie)}${s.cantidad?` <span class="qty">· ${esc(s.cantidad)}</span>`:""}</div>
        <div class="cambio">${s.tipo==="tengo"?"Cambio por":"Ofrezco"}: <b>${esc(s.cambio||"lo que tengas")}</b></div>
        ${FICHAS[sp.name]?`<details class="ficha"><summary>Cómo plantar ${esc(sp.name.toLowerCase())}</summary><dl><dt>Dificultad</dt><dd>${esc(FICHAS[sp.name].nivel)}</dd><dt>Clima</dt><dd>${esc(FICHAS[sp.name].clima)}</dd><dt>Consejo</dt><dd>${esc(FICHAS[sp.name].consejo)}</dd></dl></details>`:""}
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
const N=7, TW=44, TH=22, LW=360, LH=235, OX=180, OY=64, PS=1.22;
const iso=(x,y)=>[OX+(x-y)*TW/2, OY+(x+y)*TH/2];
function hash(str){ let h=2166136261; for(const ch of String(str)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619);} return (h>>>0)/4294967295; }
const SIGN=[0,N-1];
function cellsFor(campus){ // primero una cuadrícula espaciada (una planta sí, una no) para que no se tapen
  const cells=[]; for(let x=0;x<N;x++)for(let y=0;y<N;y++){ if(x===SIGN[0]&&y===SIGN[1]) continue;
    const tier=(x%2===0&&y%2===0)?0:((x+y)%2===0?1:2); cells.push({x,y,d:tier*10+Math.hypot(x-(N-1)/2,y-(N-1)/2)+hash(campus+x+"_"+y)*.8}); }
  return cells.sort((a,b)=>a.d-b.d);
}
const ALTURA={pino:4,girasol:3,cosmos:2.4,orquidea:1.5,tulipan:1.5,rosa:1,mastuerzo:.8};
function layout(campus){
  const ps=plants(campus), cells=cellsFor(campus), shownPs=ps.slice(-cells.length);
  const use=cells.slice(0,shownPs.length).sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x); // fondo primero
  const byH=shownPs.slice().sort((a,b)=>(ALTURA[b.sp.kind]||1)*(b.stage+1)-(ALTURA[a.sp.kind]||1)*(a.stage+1));
  byH.forEach((p,i)=>{ const c=use[i]; p.x=c.x; p.y=c.y; [p.sx,p.sy]=iso(c.x,c.y); p.sy+=TH/2; p.phase=hash(p.id)*6.28; });
  return {all:ps, placed:shownPs.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y))};
}
const G={leaf:"#6E8B2F",dark:"#4F6B22",light:"#9DB04A",stem:"#5E7A26",trunk:"#7A5230",trunkD:"#5C3D22",outline:"#231F1F"};
function ell(c,x,y,rx,ry,rot,fill){ c.beginPath(); c.ellipse(x,y,rx,ry,rot||0,0,6.283); c.fillStyle=fill; c.fill(); }
function circ(c,x,y,r,fill,stroke){ c.beginPath(); c.arc(x,y,r,0,6.283); c.fillStyle=fill; c.fill(); if(stroke){c.lineWidth=.6;c.strokeStyle=stroke;c.stroke();} }
function stem(c,h,w,col){ c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(1.2,-h/2,0,-h); c.lineWidth=w; c.strokeStyle=col||G.stem; c.lineCap="round"; c.stroke(); }
function drawPlant(c,p,t,noShadow){
  const st=p.stage, k=p.sp.kind, col=p.sp.color, r=hash(p.id);
  // sombra
  if(!noShadow) ell(c,0,0,6+st*1.6,3+st*.8,0,"rgba(35,31,31,.18)");
  c.save(); c.rotate(Math.sin(t/900+p.phase)*.035*(st+1)/5);
  if(st===0){ if(crece(p.sp).frio){ ell(c,0,-.6,1.6,1,0,"#6B4423"); circ(c,-2,-3,.5,"#CFE8F5"); circ(c,2.2,-4.2,.4,"#CFE8F5"); circ(c,.4,-5,.35,"#CFE8F5"); } else if(k==="orquidea"){ circ(c,0,-1.2,1.3,"#B8D27A"); ell(c,.9,-2.4,.7,1.1,.4,G.light); } else { stem(c,6,1.2); ell(c,-2.6,-6,2.6,1.4,-.5,G.light); ell(c,2.6,-6.8,2.6,1.4,.5,G.leaf); } c.restore(); return; }
  if(k==="girasol"){
    const h=7+st*4.2; stem(c,h,1.2+st*.25);
    if(st>=1){ ell(c,-3.2,-h*.42,3.6,1.6,-.55,G.leaf); ell(c,3.2,-h*.58,3.4,1.5,.55,G.dark); }
    const R=1.6+st*1.05;
    if(st===1){ circ(c,0,-h,1.9,G.light); ell(c,0,-h-1.2,1,1.4,0,G.leaf); }
    else if(st===2){ for(let i=0;i<8;i++){ const a=i/8*6.283; ell(c,Math.cos(a)*1.6,-h+Math.sin(a)*1.6,1.2,.55,a,"#C9D35A"); } circ(c,0,-h,1.6,"#7E9A3A"); }
    else if(st===3){ ell(c,0,-h+.4,R*.95,R*.8,0,"#7E9A3A"); for(let i=0;i<10;i++){ const a=i/10*6.283; ell(c,Math.cos(a)*R*.75,-h+Math.sin(a)*R*.6,R*.45,R*.22,a,i%2?"#9DB04A":"#6E8B2F"); } for(let i=0;i<7;i++){ const a=-2.6+i*.35; ell(c,Math.cos(a)*R*.55,-h+Math.sin(a)*R*.55,R*.3,R*.13,a,"#F2A413"); } circ(c,0,-h-R*.15,R*.38,"#5A3418"); }
    else {
      for(let i=0;i<16;i++){ const a=i/16*6.283+.2; ell(c,Math.cos(a)*R*1.45,-h+Math.sin(a)*R*1.32,R*.78,R*.3,a,"#E08E0B"); }
      for(let i=0;i<16;i++){ const a=i/16*6.283; const gx=Math.cos(a)*R*1.3, gy=-h+Math.sin(a)*R*1.2;
        c.save(); c.translate(gx,gy); c.rotate(a); const g=c.createLinearGradient(-R*.7,0,R*.7,0); g.addColorStop(0,"#F2A413"); g.addColorStop(1,"#FFD34D");
        c.beginPath(); c.ellipse(0,0,R*.72,R*.27,0,0,6.283); c.fillStyle=g; c.fill(); c.restore(); }
      circ(c,0,-h,R*1.02,"#3E2412"); circ(c,0,-h,R*.92,"#5A3418");
      const n=Math.round(30+st*12); for(let i=0;i<n;i++){ const rr=R*.86*Math.sqrt(i/n), a=i*2.39996; circ(c,Math.cos(a)*rr,-h+Math.sin(a)*rr,.22+R*.045*(1-i/n*.5),i%3?"#8A5A1E":"#C08A2E"); }
      circ(c,-R*.25,-h-R*.25,R*.25,"rgba(255,220,150,.18)");
    }
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
  } else if(k==="rosa"){
    const fl=p.sp.name==="Rosa"?(crece(p.sp).frio&&st===0):false;
    if(st===0){ ell(c,0,-.6,1.6,1,0,"#6B4423"); if(fl){ circ(c,-2,-3,.5,"#CFE8F5"); circ(c,2,-4,.4,"#CFE8F5"); } c.restore(); return; }
    const H=4+st*2.2;
    stem(c,H,1.1,"#4F6B22"); if(st>=3){ c.save(); c.rotate(-.45); stem(c,H*.75,1,"#4F6B22"); c.restore(); c.save(); c.rotate(.5); stem(c,H*.7,1,"#4F6B22"); c.restore(); }
    for(let i=0;i<3+st;i++){ const y=-H*(.25+.12*i), sd=i%2?1:-1; ell(c,sd*2.2,y,2,1,sd*.6,i%2?G.dark:G.leaf); }
    const heads=st<4?[]:[[0,-H],[-H*.34,-H*.7],[H*.34,-H*.66]];
    if(st===3){ ell(c,0,-H,1.1,1.8,0,"#7E9A3A"); ell(c,0,-H-1.2,.75,1.1,0,col||"#C62828"); ell(c,-H*.32,-H*.72,.9,1.4,-.3,"#7E9A3A"); }
    heads.forEach(([x,y],j)=>{ const r=2.4+st*.45-(j?0.4:0);
      ell(c,x-r*.55,y+r*.35,r*.65,r*.35,-.5,"#5F7D2A"); ell(c,x+r*.55,y+r*.35,r*.65,r*.35,.5,"#4F6B22");
      for(let i=0;i<6;i++){ const a=i/6*6.283; ell(c,x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.45,r*.62,r*.48,a,"#9E1B1B"); }
      circ(c,x,y,r*.82,col||"#C62828");
      for(let i=0;i<4;i++){ c.beginPath(); c.arc(x+(i%2?.2:-.2)*r,y-.1*r,r*(.7-i*.15),3.6+i*.9,6.2+i*.9); c.strokeStyle=i%2?"#7A1010":"#E04B3F"; c.lineWidth=.55; c.stroke(); }
      circ(c,x,y-r*.05,r*.18,"#7A1010"); ell(c,x-r*.35,y-r*.4,r*.28,r*.14,-.5,"rgba(255,200,200,.45)"); });
  } else if(k==="orquidea"){
    ell(c,-4,-1.5,5.5,1.8,-.25,G.dark); ell(c,4,-1.8,5.5,1.8,.25,G.leaf); ell(c,0,-2.6,4,1.6,0,G.light);
    const h=8+st*4; c.beginPath(); c.moveTo(0,-2); c.bezierCurveTo(-1,-h,6+st,-h-4,9+st*1.5,-h*.6); c.lineWidth=1; c.strokeStyle="#6B7A3A"; c.stroke();
    if(st===3){ for(let i=0;i<3;i++){ const u=.55+i*.15, x=-1+(10+st*1.5)*u*u, y=-2-(h+2)*Math.sin(Math.PI*u*.85)+(u>.7?(u-.7)*h:0); ell(c,x,y,.9,1.2,.3,"#C9D79A"); } }
    else if(st>=4){ const n=st; for(let i=0;i<n;i++){ const u=.45+i/(n+1)*.6, x=-1+(10+st*1.5)*u*u, y=-2-(h+2)*Math.sin(Math.PI*u*.85)+ (u>.7?(u-.7)*h:0);
      for(let j=0;j<5;j++){ const a=j/5*6.283-1.57; ell(c,x+Math.cos(a)*1.9,y+Math.sin(a)*1.9,1.7,1.1,a,"#FBEFF5"); }
      circ(c,x,y+.6,1.1,col||"#D9739F"); circ(c,x,y-.3,.5,"#F2A413"); } }
    else ell(c,4,-h*.7,1,1.6,0,G.light);
  } else if(k==="tulipan"){
    const n=st>=4?3:1; ell(c,-3,-4,1.6,5,-.35,G.leaf); ell(c,3,-4,1.6,5,.35,G.dark);
    for(let i=0;i<n;i++){ const dx=(i-(n-1)/2)*3.6, h=9+st*3.2+(i%2)*2.5; c.save(); c.translate(dx,0); stem(c,h,1.2);
      if(st>=4){ const cc=i%3===1?"#F2A413":(col||"#E0484F"); c.beginPath(); c.moveTo(-2.4,-h); c.quadraticCurveTo(-2.6,-h+3.2,0,-h+3.4); c.quadraticCurveTo(2.6,-h+3.2,2.4,-h); c.lineTo(1.2,-h-1.6); c.lineTo(0,-h-.4); c.lineTo(-1.2,-h-1.6); c.closePath(); c.fillStyle=cc; c.fill(); c.lineWidth=.5; c.strokeStyle="rgba(35,31,31,.5)"; c.stroke(); }
      else if(st===3){ ell(c,0,-h,1.3,2.2,0,"#8FA84A"); ell(c,0,-h-.6,.8,1.2,0,"rgba(224,72,79,.55)"); } c.restore(); }
  } else if(k==="pino"){
    const h=8+st*6.5, w=2.2+st*1.7; c.fillStyle=G.trunk; c.fillRect(-1,-3,2,3);
    const tiers=2+Math.min(st,3);
    for(let i=0;i<tiers;i++){ const y0=-2-i*(h/tiers)*.82, y1=y0-h/tiers*1.35, ww=w*(1-i/(tiers+.6));
      c.beginPath(); c.moveTo(-ww,y0); c.quadraticCurveTo(0,y0+1.2,ww,y0); c.lineTo(0,y1); c.closePath(); c.fillStyle=i%2?"#C9DA5A":"#B4C94A"; c.fill();
      c.beginPath(); c.moveTo(0,y1); c.lineTo(ww*.95,y0); c.quadraticCurveTo(ww*.4,y0+.6,0,y0+.7); c.closePath(); c.fillStyle="rgba(120,140,30,.35)"; c.fill(); }
    if(st>=3){ for(let i=0;i<st*2;i++){ const yy=-3-hash(p.id+"p"+i)*h, xx=(hash(p.id+"x"+i)-.5)*w*(1+yy/h)*1.4; circ(c,xx,yy,.6,"#F4F7B0"); } }
  } else if(k==="mastuerzo"){
    const n=3+st*2, R=3+st*1.6;
    for(let i=0;i<n;i++){ const a=-2.6+i/(n-1)*2.2+(hash(p.id+"m"+i)-.5)*.4, d=R*(.45+hash(p.id+"d"+i)*.55), x=Math.cos(a)*d, y=-1.5+Math.sin(a)*d*.55-hash(p.id+"h"+i)*st*.9;
      c.beginPath(); c.moveTo(0,-.5); c.quadraticCurveTo(x*.5,y+1,x,y); c.lineWidth=.5; c.strokeStyle="#6E8B2F"; c.stroke();
      const r=1.3+st*.28; circ(c,x,y,r,i%2?"#8FB04A":"#A7C25A"); c.beginPath(); for(let j=0;j<5;j++){ const b=j/5*6.283; c.moveTo(x,y); c.lineTo(x+Math.cos(b)*r*.85,y+Math.sin(b)*r*.85);} c.lineWidth=.25; c.strokeStyle="rgba(255,255,255,.55)"; c.stroke(); circ(c,x,y,.25,"#E8F0C8"); }
    if(st===3){ for(let i=0;i<3;i++){ const a=-2.2+i*.7, x=Math.cos(a)*R*.7, y=-2.5+Math.sin(a)*R*.5-st; ell(c,x,y,.6,1,a,"#C9A24A"); } }
    if(st>=4){ const cols=["#F28C13","#E0484F","#F2C313","#F28C13","#D93A2B"];
      for(let i=0;i<5;i++){ const a=-2.7+i*.55, x=Math.cos(a)*R*.75, y=-3-Math.sin(-a)*R*.4-hash(p.id+"f"+i)*3, r=1.5;
        for(let j=0;j<5;j++){ const b=j/5*6.283; ell(c,x+Math.cos(b)*r*.6,y+Math.sin(b)*r*.6,r*.62,r*.5,b,cols[i]); }
        circ(c,x,y,.5,"#F7D35A"); c.beginPath(); for(let j=0;j<5;j++){ const b=j/5*6.283; c.moveTo(x+Math.cos(b)*.5,y+Math.sin(b)*.5); c.lineTo(x+Math.cos(b)*r*.9,y+Math.sin(b)*r*.9);} c.lineWidth=.2; c.strokeStyle="rgba(120,20,10,.55)"; c.stroke(); } }
  } else if(k==="cosmos"){
    const stems=st>=4?4:st>=2?2:1;
    for(let i=0;i<stems;i++){ const dx=(i-(stems-1)/2)*3.4, h=7+st*4.2+(i%2)*2.5, lean=(i-(stems-1)/2)*.08;
      c.save(); c.translate(dx*.3,0); c.rotate(lean); c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(1,-h*.5,0,-h); c.lineWidth=.6; c.strokeStyle="#6E8B2F"; c.stroke();
      for(let j=1;j<=2+st;j++){ const y=-h*j/(st+4), sd=j%2?1:-1; c.beginPath(); for(let q=0;q<3;q++){ c.moveTo(0,y); c.lineTo(sd*(2+q*.8),y-1.4+q*.9);} c.lineWidth=.35; c.strokeStyle=j%2?"#7E9A3A":"#9DB04A"; c.stroke(); }
      if(st===3){ circ(c,0,-h,.9,"#9DB04A"); ell(c,0,-h-.5,.6,.5,0,"#E88BB4"); }
      if(st>=4){ const cc=["#E88BB4","#FFFFFF","#C2407A","#F4B6CF"][i%4], r=2.3;
        for(let q=0;q<8;q++){ const b=q/8*6.283; c.save(); c.translate(0,-h); c.rotate(b); c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(r*.55,-r*.35,r,-r*.12); c.lineTo(r,r*.12); c.quadraticCurveTo(r*.55,r*.35,0,0); c.fillStyle=cc; c.fill(); c.lineWidth=.15; c.strokeStyle="rgba(140,40,80,.4)"; c.stroke(); c.restore(); }
        circ(c,0,-h,.75,"#F2C313"); circ(c,0,-h,.35,"#C98A0B"); }
      c.restore(); }
  } else if(k==="magnolia"){
    const h=7+st*5, w=1.5+st*.6; c.beginPath(); c.moveTo(-w,0); c.lineTo(-w*.5,-h); c.lineTo(w*.5,-h); c.lineTo(w,0); c.closePath(); c.fillStyle=G.trunk; c.fill();
    const R=4+st*2.5; circ(c,-R*.55,-h-R*.3,R*.72,"#5F7D2A"); circ(c,R*.55,-h-R*.3,R*.72,"#5F7D2A"); circ(c,0,-h-R*.9,R*.82,"#7E9A3A");
    const n=st>=2?(st-1)*3:0;
    for(let i=0;i<n;i++){ const a=hash(p.id+"m"+i)*6.283, d=hash(p.id+"n"+i)*R*.8, x=Math.cos(a)*d, y=-h-R*.6+Math.sin(a)*d*.6, r=1.5+st*.3;
      ell(c,x-r*.45,y,r*.55,r,-.35,"#FFFFFF"); ell(c,x+r*.45,y,r*.55,r,.35,"#FFFFFF"); ell(c,x,y-r*.15,r*.5,r*1.05,0,col||"#F7E6EC"); ell(c,x,y+r*.55,r*.55,r*.3,0,"#C9709A"); }
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
  c.fillStyle=CAMPUS[campus].col; c.strokeStyle=CAMPUS[campus].edge; c.lineWidth=1; c.beginPath(); c.rect(sx-14,sy-24,28,11); c.fill(); c.stroke();
  c.fillStyle=CAMPUS[campus].ink; c.font="700 7px Jost, sans-serif"; c.textAlign="center"; c.fillText(CAMPUS[campus].ab,sx,sy-16.5);
}
function drawForest(c,campus,t,surface,sel){
  const L=layout(campus); drawIsland(c,campus,t,surface);
  const t0=FA.campus===campus?FA.start:-1e9;
  L.placed.forEach((p,i)=>{ const pr=Math.max(0,Math.min(1,(t-t0-i*120)/1500)), e3=1-Math.pow(1-pr,3), ga=Math.max(.001,(p.g??p.stage)*e3);
    if(pr<=0) return; const st=Math.min(4,Math.floor(ga)), fr=ga-st, sc=PS*(st>=4?1:.8+.2*fr)*(pr<1?Math.min(1,.4+pr):1);
    c.save(); c.translate(p.sx,p.sy); if(sel===p.id){ ell(c,0,0,15,7.5,0,"rgba(242,164,19,.6)"); } c.scale(sc,sc); drawPlant(c,{...p,stage:st},t);
    if(pr<1&&fr<.18&&st>0) sparkle(c,t,p.id,8+st*7); c.restore(); });
  const e=AMB.env();
  if(e.night){ c.fillStyle="rgba(12,18,48,.38)"; c.fillRect(0,0,LW,LH); } else if(e.phase==="atardecer"){ c.fillStyle="rgba(233,119,58,.10)"; c.fillRect(0,0,LW,LH); }
  if(e.clima!=="despejado"){ c.fillStyle=e.clima==="lluvia"?"rgba(40,50,60,.16)":"rgba(200,205,210,.12)"; c.fillRect(0,0,LW,LH); }
  AMB.fireflies(c,LW,LH,t,e,12,.8,OY+20); AMB.leaves(c,LW,LH,t,e,7,.9); AMB.rain(c,LW,LH,t,e,.8);
  return L;
}
let FL=null, raf=0, lastDraw=0; const FA={campus:null,start:0};
function sparkle(c,t,id,h){ for(let i=0;i<6;i++){ const a=i/6*6.283+t/400, r=5+Math.sin(t/120+i)*2; c.fillStyle=`rgba(242,164,19,${.5+.5*Math.sin(t/90+i)})`; c.beginPath(); c.arc(Math.cos(a)*r,-h+Math.sin(a)*r*.6,.9,0,6.283); c.fill(); } }
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
function loop(t){ const anim=AMB.env().anim; const growing=GA.some(g=>t-g.start<GDUR+1500)||t-FA.start<3500; if(t-lastDraw>(anim||growing?40:60000)){ paintForest(t); paintHero(t); paintGarden(t); lastDraw=t; } raf=requestAnimationFrame(loop); }
function startLoop(){ cancelAnimationFrame(raf); lastDraw=0; raf=requestAnimationFrame(loop); }
document.addEventListener("visibilitychange",()=>{ if(document.hidden) cancelAnimationFrame(raf); else startLoop(); });
AMB.onChange(()=>{ renderHero(); renderMap(); lastDraw=0; });
/* ---------- mi jardín: el progreso de tus propias plantas ---------- */
let GA=[];
function myPlants(){
  if(!S.me) return [];
  const out=[];
  S.trueques.forEach(t=>{
    if(t.autor===S.me) out.push({id:t.id+"a",especie:t.especie_a,campus:t.campus_a,partner:t.campus_b,fecha:t.fecha});
    if(t.receptor_b&&t.receptor_b===S.me) out.push({id:t.id+"b",especie:t.especie_b,campus:t.campus_b,partner:t.campus_a,fecha:t.fecha});
  });
  out.forEach(p=>{ p.sp=species(p.especie); p.gr=growthOf(p.sp,p.fecha); p.g=p.gr.g; p.stage=p.gr.st; p.phase=hash(p.id)*6.28; });
  return out.sort((a,b)=>b.fecha-a.fecha);
}
function dur(ms){ const h=Math.max(0,ms)/H; if(h<1) return `${Math.max(1,Math.round(h*60))} min`; if(h<24) return `${Math.round(h)} h`; const d=Math.floor(h/24), r=Math.round(h-d*24); return r?`${d} d ${r} h`:`${d} d`; }
function renderGarden(){
  const el=$("#garden"); if(!el) return; const ps=myPlants(), prev={}; GA.forEach(g=>prev[g.p.id]=g.start);
  if(!ps.length){ GA=[]; el.innerHTML=`<div class="empty"><img class="pi-lg" src="${plantIcon("Girasol",56)}" alt=""><div><b style="color:var(--fg)">Aún no tienes plantas.</b><br>Cuando cierres tu primer trueque, aquí verás crecer tu semilla día a día: de brote a planta madura.</div></div>`; return; }
  const now=performance.now();
  GA=ps.map(p=>({p,start:prev[p.id]??now}));
  el.innerHTML=ps.map((p,i)=>{ const names=stageNames(p.sp), st=p.stage, gr=p.gr, cr=crece(p.sp);
    return `<article class="gcard">
      <canvas class="gcv" data-i="${i}" width="280" height="280" aria-label="${esc(p.sp.name)} en etapa ${names[st]}"></canvas>
      <div class="gbody">
        <div class="gname">${esc(p.sp.name)}</div>
        <div class="gstage">${names[st]} · día ${Math.floor(gr.d)+1}</div>
        <div class="gbar" title="Camino a su esplendor"><i style="width:${Math.max(2,Math.round(gr.total*100))}%"></i></div>
        <div class="gnext">${st<4?(st===3?`${names[4]} en ~${durDias(gr.T[4]-gr.d)}`:`${names[st+1]} en ~${durDias(gr.T[st+1]-gr.d)} · esplendor en ~${durDias(gr.T[4]-gr.d)}`):"¡Llegó a su esplendor!"}</div>
        <div class="gsplendor">${esc(cr.esplendor)}${cr.frio&&st===0?" · primero necesita semanas de frío para germinar":""}</div>
        <ol class="gsteps">${names.map((n,k)=>`<li class="${k<st?"done":k===st?"now":""}" title="${n}"></li>`).join("")}</ol>
        <div class="gmeta"><i class="cdot" style="--cc:${CAMPUS[p.campus]?.col};--ce:${CAMPUS[p.campus]?.edge}"></i>Trueque con ${esc(CAMPUS[p.partner]?.name||"")} · ${fecha(p.fecha)}</div>
        <button class="btn ghost small" data-replay="${i}">Ver crecer</button>
      </div></article>`; }).join("");
}
const GDUR=5200, GSEED=750;
const easeOutBounce=x=>{ const n=7.5625,d=2.75; if(x<1/d) return n*x*x; if(x<2/d) return n*(x-=1.5/d)*x+.75; if(x<2.5/d) return n*(x-=2.25/d)*x+.9375; return n*(x-=2.625/d)*x+.984375; };
const easeInOut=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
function paintGarden(t){
  document.querySelectorAll(".gcv").forEach(cv=>{
    const g=GA[+cv.dataset.i]; if(!g) return; const c=cv.getContext("2d"), W=cv.width, el=t-g.start, night=AMB.env().night;
    if(g.lastSt==null||el<30){ g.lastSt=-1; g.bursts=[]; g.label=null; }
    c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,W,W);
    // halo cálido que respira
    const br=1+.04*Math.sin(t/900), gr=c.createRadialGradient(W/2,W*.55,W*.04,W/2,W*.55,W*.5*br);
    gr.addColorStop(0,night?"rgba(242,164,19,.26)":"rgba(242,164,19,.32)"); gr.addColorStop(1,"rgba(242,164,19,0)"); c.fillStyle=gr; c.fillRect(0,0,W,W);
    // progreso de la animación
    const u=Math.max(0,Math.min(1,(el-GSEED)/(GDUR-GSEED))), ga=el<GSEED?0:Math.max(.001,g.p.g*easeInOut(u)), st=Math.min(4,Math.floor(ga)), fr=ga-st;
    if(el>=GSEED&&st>g.lastSt){ if(g.lastSt>=0||st===0){ g.bursts.push({t,st}); g.label={t,txt:stageNames(g.p.sp)[st]}; } g.lastSt=st; }
    const done=el>GDUR, mature=g.p.stage>=4;
    // rayos de luz cuando llega a su esplendor
    if(mature&&ga>=3.95){ const a=Math.min(1,(el-GDUR+800)/900); c.save(); c.translate(W/2,W*.5); c.rotate(t/7000); c.globalAlpha=.22*Math.max(0,a);
      for(let i=0;i<12;i++){ c.rotate(Math.PI/6); c.beginPath(); c.moveTo(0,0); c.lineTo(W*.48,-W*.035); c.lineTo(W*.48,W*.035); c.closePath(); c.fillStyle="#F2A413"; c.fill(); } c.restore(); }
    c.save(); c.translate(W/2,W*.86);
    // maceta de tierra
    ell(c,0,4,W*.3,W*.075,0,night?"#3A2B22":"#8B5E3C"); ell(c,0,1,W*.27,W*.06,0,night?"#4A372B":"#A87346");
    // semilla que cae y rebota
    if(el<GSEED+250){ const q=Math.min(1,el/GSEED), y=-W*.62*(1-easeOutBounce(q)); c.save(); c.translate(0,y-2); c.rotate(q*6);
      ell(c,0,0,W*.022,W*.034,0,"#6B4423"); ell(c,-W*.006,-W*.01,W*.008,W*.014,0,"rgba(255,230,190,.5)"); c.restore(); }
    // tierra que salpica al caer
    if(el>GSEED*.55&&el<GSEED+600){ const q=(el-GSEED*.55)/(GSEED*.45+600);
      for(let i=0;i<10;i++){ const a=Math.PI+(i/9)*Math.PI, d=W*.18*q, x=Math.cos(a)*d, y=Math.sin(a)*d*.9+W*.25*q*q-6;
        c.globalAlpha=1-q; ell(c,x,y,W*.012,W*.009,0,"#8B5E3C"); } c.globalAlpha=1; }
    // planta con "pop" elástico en cada cambio de etapa
    if(el>=GSEED){ const lb=g.bursts.length?g.bursts[g.bursts.length-1].t:0, pt=t-lb, pop=pt<650?1+.22*Math.sin(Math.PI*pt/650)*Math.exp(-pt/400):1;
      const sway=Math.sin(t/1100+g.p.phase)*.025;
      const k=W/(g.p.sp.kind==="pino"?54:58)*(st>=4?1:.82+.18*fr)*pop; c.save(); c.rotate(sway); c.scale(k,k); drawPlant(c,{...g.p,stage:st},t,true); c.restore(); }
    // explosión de destellos en cada etapa
    g.bursts=g.bursts.filter(b=>t-b.t<900);
    g.bursts.forEach(b=>{ const q=(t-b.t)/900, hTop=-W*(.12+b.st*.1);
      c.globalAlpha=1-q; c.beginPath(); c.arc(0,hTop,W*(.05+.22*q),0,6.283); c.lineWidth=2.5*(1-q); c.strokeStyle="#F2A413"; c.stroke();
      for(let i=0;i<14;i++){ const a=i/14*6.283+b.st, d=W*(.04+.26*q), cc=i%3===0?"#C62828":i%3===1?"#F2A413":"#9DB04A";
        c.save(); c.translate(Math.cos(a)*d,hTop+Math.sin(a)*d*.8); c.rotate(a+q*4); c.fillStyle=cc;
        if(i%2){ c.beginPath(); c.ellipse(0,0,W*.016,W*.007,0,0,6.283); c.fill(); } else { c.fillRect(-W*.006,-W*.006,W*.012,W*.012); } c.restore(); }
      c.globalAlpha=1; });
    // brillitos flotando alrededor de una planta madura
    if(mature&&done){ for(let i=0;i<6;i++){ const ph=(t/2600+i/6)%1, x=Math.sin(i*2.1+t/1500)*W*.22, y=-W*(.05+.6*ph); c.globalAlpha=Math.sin(Math.PI*ph)*.8;
      c.fillStyle="#F2C313"; c.beginPath(); c.arc(x,y,W*.008,0,6.283); c.fill(); } c.globalAlpha=1; }
    c.restore();
    // nombre de la etapa que aparece y sube
    if(g.label&&t-g.label.t<1300){ const q=(t-g.label.t)/1300, y=W*(.2-.06*q);
      c.globalAlpha=q<.15?q/.15:1-Math.max(0,(q-.6)/.4); c.font=`700 ${Math.round(W*.085)}px 'Cormorant Garamond', Georgia, serif`; c.textAlign="center";
      c.lineWidth=W*.02; c.strokeStyle=night?"rgba(32,27,26,.85)":"rgba(255,255,255,.9)"; c.strokeText("¡"+g.label.txt+"!",W/2,y);
      c.fillStyle=night?"#F7C766":"#C62828"; c.fillText("¡"+g.label.txt+"!",W/2,y); c.globalAlpha=1; }
  });
}
function renderForest(){
  if(FA.campus!==S.forest){ FA.campus=S.forest; FA.start=performance.now(); lastDraw=0; }
  const counts={}; Object.keys(CAMPUS).forEach(k=>counts[k]=plants(k).length);
  const order=Object.keys(CAMPUS).sort((a,b)=>counts[b]-counts[a]);
  $("#rank").innerHTML=Object.keys(CAMPUS).map(k=>`<button aria-pressed="${S.forest===k}" data-forest="${k}" style="--cc:${CAMPUS[k].col};--ce:${CAMPUS[k].edge}"><i class="cdot"></i><span class="medal">${order.indexOf(k)+1}.º</span><b>${counts[k]}</b>${CAMPUS[k].name}</button>`).join("");
  const ps=plants(S.forest), sp=new Set(ps.map(p=>p.sp.name)).size;
  $("#fCount").textContent=ps.length; $("#fLbl").textContent=ps.length===1?"planta":"plantas";
  $("#fName").innerHTML=`Bosque de <b>${esc(CAMPUS[S.forest].full)}</b><br>${sp} ${sp===1?"especie":"especies"}`;
  if(S.sel && !ps.find(p=>p.id===S.sel.id)) S.sel=null;
  showInfo(); paintForest(performance.now());
}
const STAGE_NAMES=["Brote","Plántula","Planta","Florecida","Madura"], TREE_STAGES=["Brote","Plántula","Arbolito","Árbol joven","Árbol"];
const stageNames=sp=>crece(sp).etapas;
function showInfo(){
  const p=S.sel, el=$("#pInfo");
  if(!p){ el.textContent=plants(S.forest).length?"Toca una planta para ver de qué trueque nació.":"Este bosque aún está vacío: el primer trueque cerrado de esta universidad planta su primera semilla."; return; }
  const names=stageNames(p.sp);
  el.innerHTML=`<img class="pi-sm" src="${plantIcon(p.sp.name,28)}" alt=""><b>${esc(p.sp.name)}</b> · ${names[p.stage]}<br>Trueque ${esc(CAMPUS[S.forest].name)} ↔ ${esc(CAMPUS[p.partner]?.name||"")} · ${fecha(p.fecha)}${p.demo?" · ejemplo":""}`;
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
  c.fillStyle="#C62828"; c.fillRect(0,0,W,22); c.fillStyle="#F2A413"; c.fillRect(W*.78,0,W*.22,22);
  const logo=document.querySelector(".brand img"); try{ c.drawImage(logo,72,92,120,120); }catch(e){}
  const ps=plants(S.forest), sp=new Set(ps.map(p=>p.sp.name)).size;
  c.fillStyle="#231F1F"; c.textAlign="left"; c.font="400 104px 'Great Vibes', cursive"; c.fillText("Bosque "+CAMPUS[S.forest].name,214,160);
  c.fillStyle="#6E6766"; c.font="500 32px Jost, sans-serif"; c.fillText(`${ps.length} plantas · ${sp} especies · SemillApp`,216,206);
  c.save(); c.translate(0,300); const k=W/LW; c.scale(k,k); drawForest(c,S.forest,performance.now(),"#FFFFFF",null); c.restore();
  c.fillStyle="#231F1F"; c.fillRect(0,Hh-170,W,170);
  c.fillStyle="#F2A413"; c.font="italic 600 50px 'Cormorant Garamond', Georgia, serif"; c.fillText("Cada trueque de semillas planta algo.",72,Hh-96);
  c.fillStyle="#FFFFFF"; c.font="500 28px Jost, sans-serif"; c.fillText("UPCH · U Lima · PUCP · U Pacífico — Puntos Verdes",72,Hh-50);
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
      <label for="f-esp">Semillas de<select id="f-esp" required>${ESPECIES.map(s=>`<option>${s}</option>`).join("")}</select></label>
      <div class="row2"><label>Cantidad <small>opcional</small><input id="f-cant" maxlength="30" placeholder="20 semillas"></label>
      <label>Campus<select id="f-camp">${Object.entries(CAMPUS).map(([k,v])=>`<option value="${k}" ${k===defCampus?"selected":""}>${v.name}</option>`).join("")}</select></label></div>
      <label><span id="f-cl">Cambio por</span><select id="f-cambio"><option value="">Cualquiera de la lista</option>${ESPECIES.map(s=>`<option>${s}</option>`).join("")}</select></label>
      <div class="ficha-hint" id="f-hint" hidden></div>
      <label>Duración<select id="f-dur"><option value="24">24 horas</option><option value="48">48 horas</option><option value="72">72 horas</option></select></label>
      <div class="actions"><button type="button" class="btn ghost" id="f-x">Cancelar</button><button class="btn gold" id="f-ok">Lanzar señal</button></div>
    </form>`);
  $("#seg").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return; tipo=b.dataset.t;
    $("#seg").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); $("#f-cl").textContent=tipo==="tengo"?"Cambio por":"Ofrezco a cambio"; });
  const hint=()=>{ const sp=species($("#f-esp").value), f=FICHAS[sp.name], el=$("#f-hint"); if(!f||!$("#f-esp").value.trim()){ el.hidden=true; return; }
    el.hidden=false; el.innerHTML=`<img class="pi-sm" src="${plantIcon(sp.name,28)}" alt=""><div><b>${esc(sp.name)} · ${esc(f.nivel)}</b><br>${esc(f.consejo)}</div>`; };
  $("#f-esp").addEventListener("change",hint);
  $("#f").addEventListener("focusin",e=>{ if(e.target.id!=="f-esp") $("#f-hint").hidden=true; });
  $("#f").addEventListener("change",e=>{ if(e.target.id!=="f-esp") $("#f-hint").hidden=true; });
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
      <div class="row2"><label>${s.tipo==="tengo"?"Ofreces semillas de":"Le darías semillas de"}<select id="o-of">${(s.tipo==="busco"?[s.especie]:ESPECIES).map(x=>`<option ${s.cambio===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label>Cantidad <small>opcional</small><input id="o-cant" maxlength="20" placeholder="10 semillas"></label></div>
      <div class="row2"><label>Tu campus<select id="o-camp">${Object.entries(CAMPUS).map(([k,v])=>`<option value="${k}" ${k===(((perfil(S.me)||{}).campus||S.A.defaultCampus?.())||s.campus)?"selected":""}>${v.name}</option>`).join("")}</select></label>
      <label>Tu WhatsApp <small>solo para coordinar</small><input id="o-tel" inputmode="tel" required maxlength="15" placeholder="987 654 321"></label></div>
      <p class="note">${esc(S.A.phoneNote)}</p>
      <div class="actions"><button type="button" class="btn ghost" id="f-x">Cancelar</button><button class="btn" id="f-ok">Enviar oferta</button></div>
    </form>`);
  $("#f-x").onclick=closeSheet;
  $("#f").addEventListener("submit",async e=>{ e.preventDefault();
    const tel=$("#o-tel").value.replace(/\D/g,""); if(tel.length<9){ toast("Revisa tu número: deben ser 9 dígitos."); return; }
    const doc={senal_id:s.id,ofrece:$("#o-of").value+($("#o-cant").value.trim()?` (${$("#o-cant").value.trim()})`:""),campus:$("#o-camp").value,creado:Date.now(),estado:"pendiente",telefono:tel};
    $("#f-ok").disabled=true;
    try{ await S.A.add("ofertas",doc); closeSheet(); toast("Oferta enviada"); }catch(err){ fail(err); $("#f-ok").disabled=false; } });
}
async function accept(oid){ try{ await S.A.update("ofertas",oid,{estado:"aceptada"}); toast("Oferta aceptada: coordina la entrega por WhatsApp"); }catch(e){ fail(e); } }
async function complete(oid){
  const o=S.ofertas.find(x=>x.id===oid), s=o&&S.senales.find(x=>x.id===o.senal_id); if(!s) return;
  const a = s.tipo==="tengo" ? o.ofrece : s.especie;      // lo que recibe el campus de la señal
  const b = s.tipo==="tengo" ? s.especie : (s.cambio||o.ofrece); // lo que recibe el campus de quien ofertó
  try{
    await S.A.add("trueques",{oferta_id:o.id,campus_a:s.campus,especie_a:species(a).name,campus_b:o.campus,especie_b:species(b).name,fecha:Date.now(),receptor_b:o.autor||null});
    await S.A.update("ofertas",oid,{estado:"completada"});
    S.forest=s.campus; S.sel=null; render();
    toast(`¡Se plantó tu ${species(a).name.toLowerCase()}! Mira cómo crece en Mi jardín`);
    goTab("jardin");
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
/* ---------- premios: Corona de Tulipanes (año) y Orquídea del mes ---------- */
function renderPremios(){
  const el=$("#premios"); if(!el) return;
  const now=new Date(), y0=new Date(now.getFullYear(),0,1).getTime(), m0=new Date(now.getFullYear(),now.getMonth(),1).getTime(), y1=new Date(now.getFullYear()+1,0,1).getTime();
  const uni={}; Object.keys(CAMPUS).forEach(k=>uni[k]=0); const est={}, estM={};
  const add=(o,id)=>{ if(id&&id!=="anon") o[id]=(o[id]||0)+1; };
  S.trueques.forEach(t=>{ if(t.fecha>=y0){ if(uni[t.campus_a]!=null) uni[t.campus_a]++; if(uni[t.campus_b]!=null) uni[t.campus_b]++; add(est,t.autor); add(est,t.receptor_b); }
    if(t.fecha>=m0){ add(estM,t.autor); add(estM,t.receptor_b); } });
  const U=Object.entries(uni).sort((a,b)=>b[1]-a[1]), max=Math.max(1,U[0][1]);
  const topY=Object.entries(est).sort((a,b)=>b[1]-a[1])[0];
  const nm=id=>id==="local"||id===S.me?"Tú":((perfil(id)||{}).nombre||(S.A&&S.A.nameOf({autor:id}))||"Estudiante");
  const dias=Math.ceil((y1-Date.now())/DAY);
  el.innerHTML=`
    <article class="prize gold-prize">
      <div class="prize-art"><img src="${bouquet()}" alt="Arreglo de tulipanes"></div>
      <div class="prize-body">
        <div class="eyebrow">Gran premio ${now.getFullYear()}</div>
        <div class="prize-title">La Corona de <em>Tulipanes</em></div>
        <p class="note">La universidad con más trueques del año gana un arreglo de tulipanes para su Punto Verde, y el estudiante con más trueques recibe uno para él. Faltan <b>${dias} días</b>.</p>
        <ol class="podium">${U.map(([k,n],i)=>`<li><span class="pos">${i+1}</span><i class="cdot" style="--cc:${CAMPUS[k].col};--ce:${CAMPUS[k].edge}"></i><span class="pn">${CAMPUS[k].name}</span><span class="pbar"><i style="width:${n/max*100}%;background:${k==="up"?"#7FA2D9":CAMPUS[k].col}"></i></span><b>${n}</b></li>`).join("")}</ol>
        ${topY?`<div class="leader">Va ganando como estudiante: ${av(topY[0],22)} <b>${esc(nm(topY[0]))}</b> · ${topY[1]} trueques</div>`:""}
      </div>
    </article>
    <p class="note small-print">Los premios se entregan según las bases del concurso de cada universidad participante.</p>`;
}
let BQ=null;
function bouquet(){ if(BQ) return BQ; const W=360,c=document.createElement("canvas"); c.width=c.height=W; const x=c.getContext("2d");
  x.translate(W/2,W*.62); x.scale(5.2,5.2);
  const cols=["#E0484F","#F2A413","#F4B6CF","#C62828","#FFFFFF","#E0484F","#F2A413"];
  for(let i=0;i<7;i++){ const a=-.55+i/6*1.1, len=26+(i%2?3:0)+(i===3?4:0);
    x.save(); x.rotate(a*.6); x.beginPath(); x.moveTo(0,8); x.lineTo(0,-len); x.lineWidth=1.1; x.strokeStyle="#5E7A26"; x.stroke();
    x.beginPath(); x.ellipse(-1.6,-len*.45,1.3,5,-.25,0,6.283); x.fillStyle="#7E9A3A"; x.fill();
    const h=-len; x.beginPath(); x.moveTo(-3,h); x.quadraticCurveTo(-3.3,h+4.2,0,h+4.4); x.quadraticCurveTo(3.3,h+4.2,3,h); x.lineTo(1.5,h-2); x.lineTo(0,h-.5); x.lineTo(-1.5,h-2); x.closePath(); x.fillStyle=cols[i]; x.fill(); x.lineWidth=.35; x.strokeStyle="rgba(35,31,31,.45)"; x.stroke();
    x.beginPath(); x.moveTo(0,h-.5); x.lineTo(0,h+4); x.lineWidth=.25; x.strokeStyle="rgba(0,0,0,.18)"; x.stroke(); x.restore(); }
  x.beginPath(); x.moveTo(-11,2); x.lineTo(11,2); x.lineTo(5,22); x.lineTo(-5,22); x.closePath(); const g=x.createLinearGradient(-11,0,11,0); g.addColorStop(0,"#C62828"); g.addColorStop(.5,"#E5484D"); g.addColorStop(1,"#9E1B1B"); x.fillStyle=g; x.fill();
  x.beginPath(); x.moveTo(-4,9); x.lineTo(4,9); x.lineWidth=1.6; x.strokeStyle="#F2A413"; x.stroke(); x.beginPath(); x.arc(0,9,1.6,0,6.283); x.fillStyle="#F2A413"; x.fill();
  return BQ=c.toDataURL(); }
/* ---------- pestañas ---------- */
const TABS=["inicio","jardin","bosques"]; let curTab="inicio";
function goTab(t){
  if(!TABS.includes(t)) return; const prev=curTab; curTab=t;
  document.querySelectorAll(".tab").forEach(m=>{ const on=m.dataset.tab===t; m.hidden=!on; if(on){ m.classList.remove("in-l","in-r"); void m.offsetWidth; m.classList.add(TABS.indexOf(t)>TABS.indexOf(prev)?"in-r":"in-l"); } });
  document.querySelectorAll("#tabbar [data-go]").forEach(b=>{ if(b.dataset.go===t) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  $("#fab").hidden=t!=="inicio";
  window.scrollTo({top:0,behavior:"auto"});
  const now=performance.now();
  if(t==="bosques"){ FA.campus=null; renderForest(); renderPremios(); }
  if(t==="jardin"){ GA.forEach(g=>g.start=now); }
  if(t==="inicio") paintHero(now);
  lastDraw=0;
}
document.addEventListener("click",e=>{ const g=e.target.closest("[data-go]"); if(g) goTab(g.dataset.go); });
(function(){ let x0=null,y0=null,t0=0;
  document.addEventListener("touchstart",e=>{ if(sheetOpen()||e.touches.length!==1) return; x0=e.touches[0].clientX; y0=e.touches[0].clientY; t0=Date.now(); },{passive:true});
  document.addEventListener("touchend",e=>{ if(x0==null) return; const dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0; x0=null;
    if(Date.now()-t0>600||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.6) return; if(e.target.closest(".chips")) return;
    const i=TABS.indexOf(curTab)+(dx<0?1:-1); if(i>=0&&i<TABS.length) goTab(TABS[i]); },{passive:true});
})();
function render(){ renderHero(); renderChips(); renderMap(); renderFeed(); renderGarden(); renderForest(); renderPremios(); }
let pend=0; function soft(){ clearTimeout(pend); pend=setTimeout(()=>{ if(sheetOpen()) renderForest(); else render(); },40); }
document.addEventListener("click",e=>{
  const f=e.target.closest("[data-f]"); if(f){ S.filter=(S.filter===f.dataset.f&&f.dataset.f!=="all")?"all":f.dataset.f; render(); return; }
  const rp=e.target.closest("[data-replay]"); if(rp){ const g=GA[+rp.dataset.replay]; if(g){ g.start=performance.now(); lastDraw=0; } return; }
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
window.SemillApp={goTab,start:connect,connect,species,CAMPUS,toast,sheet,closeSheet,state:S,render,ready:()=>ensureReady(false),perfil,av,campusFromEmail,DOMAINS,esc,fail};
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
    <p class="note center">SemillApp · versión 2.0</p>
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
  const T=(a,ea,b,eb,days,who)=>({id:id("t"),campus_a:a,especie_a:ea,campus_b:b,especie_b:eb,fecha:now-days*D,autor:who||"demo"});
  const data={
    senales:[
      {id:"d1",tipo:"tengo",especie:"Girasol",cantidad:"20 semillas",cambio:"Rosa o mastuerzo",campus:"pucp",creado:now-3*H,expira:now+21*H,autor:"demo"},
      {id:"d2",tipo:"busco",especie:"Cosmos",cantidad:"",cambio:"Semillas de rosa",campus:"upch",creado:now-6*H,expira:now+42*H,autor:"demo"},
      {id:"d3",tipo:"tengo",especie:"Rosa",cantidad:"15 semillas",cambio:"Girasol enano (semillas)",campus:"ulima",creado:now-1*H,expira:now+23*H,autor:"demo"},
      {id:"d4",tipo:"tengo",especie:"Mastuerzo",cantidad:"10 semillas",cambio:"Lo que tengas",campus:"up",creado:now-22*H,expira:now+2*H,autor:"demo"},
      {id:"d5",tipo:"busco",especie:"Pino limón",cantidad:"",cambio:"Semillas de girasol",campus:"upch",creado:now-2*H,expira:now+46*H,autor:"demo"},
      {id:"d6",tipo:"tengo",especie:"Cosmos",cantidad:"1 sobre",cambio:"Pino limón o rosa",campus:"pucp",creado:now-5*H,expira:now+67*H,autor:"demo"}
    ],
    ofertas:[
      {id:"o1",senal_id:"d1",ofrece:"Rosa (10 semillas)",campus:"up",autor:"demo",creado:now-2*H,estado:"pendiente"},
      {id:"o2",senal_id:"d3",ofrece:"Girasol enano (semillas)",campus:"pucp",autor:"demo",creado:now-.5*H,estado:"aceptada"}
    ],
    trueques:[
      T("upch","Girasol","pucp","Mastuerzo",60,"demo-lucia"),T("upch","Rosa","ulima","Cosmos",250,"demo-diego"),T("upch","Pino limón","up","Girasol",280,"demo-lucia"),
      T("upch","Cosmos","upch","Mastuerzo",48,"demo-ana"),T("upch","Mastuerzo","pucp","Girasol",52,"demo-lucia"),T("upch","Girasol","up","Rosa",30,"demo-ana"),
      T("upch","Rosa","ulima","Cosmos",180,"demo-diego"),T("upch","Girasol","pucp","Pino limón",12,"demo-lucia"),T("upch","Pino limón","ulima","Mastuerzo",200,"demo-mateo"),
      T("pucp","Rosa","ulima","Girasol",220,"demo-mateo"),T("pucp","Pino limón","up","Cosmos",150,"demo-sofia"),T("pucp","Cosmos","ulima","Mastuerzo",40,"demo-sofia"),
      T("pucp","Girasol","up","Rosa",55,"demo-mateo"),T("ulima","Rosa","up","Girasol",45,"demo-diego"),T("ulima","Mastuerzo","pucp","Cosmos",8,"demo-sofia"),
      T("up","Girasol","pucp","Mastuerzo",25,"demo-ana"),T("up","Cosmos","ulima","Pino limón",15,"demo-diego"),
      {...T("upch","Girasol","pucp","Rosa",38),autor:"local"},{...T("upch","Cosmos","ulima","Mastuerzo",20),autor:"local"},{...T("upch","Rosa","up","Girasol",130),autor:"local"}
    ],
    perfiles:[{id:"demo-lucia",nombre:"Lucía (ejemplo)",campus:"upch",foto:""},{id:"demo-diego",nombre:"Diego (ejemplo)",campus:"ulima",foto:""},{id:"demo-ana",nombre:"Ana (ejemplo)",campus:"up",foto:""},{id:"demo-mateo",nombre:"Mateo (ejemplo)",campus:"pucp",foto:""},{id:"demo-sofia",nombre:"Sofía (ejemplo)",campus:"pucp",foto:""}]
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
