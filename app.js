const SECTIONS=[
 {id:"featured",label:"Featured",title:"Featured",icon:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'},
 {id:"about",label:"About Me",title:"About Me",icon:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'},
 {id:"skills",label:"My Skill",title:"My Skill",icon:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'},
 {id:"projects",label:"My Projects",title:"My Projects",icon:'<path d="M3 6a2 2 0 012-2h4l2 3h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>'},
 {id:"art",label:"My Art",title:"My Art",icon:'<path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.6-2-.5-1.2.2-2.5 1.6-2.5H18a3 3 0 003-3c0-5-4-10.5-9-10.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>'}
];
const $=s=>document.querySelector(s);
const KEY="portfolio-v1";
const ADMIN_PASSWORD = "admin123";

let S={};
let isAdmin = sessionStorage.getItem("adminAuth") === "true";

try{S=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){S={}}
S.items=S.items||{};

function save(){
  try{localStorage.setItem(KEY,JSON.stringify(S))}
  catch(e){alert("Browser storage is full. Remove some files or use smaller images.")}
}

function readFile(file,cb){
  const r=new FileReader();
  r.onload=()=>{
    if(!file.type.startsWith("image/")||file.type==="image/gif"||file.type==="image/svg+xml")return cb(r.result);
    const img=new Image();
    img.onload=()=>{
      const m=1000,k=Math.min(1,m/Math.max(img.width,img.height));
      const c=document.createElement("canvas");c.width=img.width*k;c.height=img.height*k;
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      cb(c.toDataURL("image/jpeg",.82));
    };
    img.src=r.result;
  };
  r.readAsDataURL(file);
}

/* ---------- Admin Panel & Auth System ---------- */
function renderAdminState() {
  document.body.classList.toggle("admin-mode", isAdmin);
  $("#loginBtn").textContent = isAdmin ? "Logout Admin" : "Admin Login";
  
  if (isAdmin) {
    $("#spForm").classList.add("admin-only-flex");
    $("#spForm").classList.remove("admin-only");
  } else {
    $("#spForm").classList.remove("admin-only-flex");
    $("#spForm").classList.add("admin-only");
    $("#panel").classList.remove("open");
  }

  // Toggle Editability
  ["name","title","welcome"].forEach(id=>{
    const el=$("#"+id);
    el.setAttribute("contenteditable", isAdmin ? "true" : "false");
  });

  // Re-render grids to show/hide plus buttons
  SECTIONS.forEach(s => paintGrid(s.id));
}

$("#loginBtn").onclick = () => {
  if (isAdmin) {
    isAdmin = false;
    sessionStorage.removeItem("adminAuth");
    renderAdminState();
  } else {
    const p = prompt("Enter specific admin password:");
    if (p === ADMIN_PASSWORD) {
      isAdmin = true;
      sessionStorage.setItem("adminAuth", "true");
      renderAdminState();
    } else if (p !== null) {
      alert("Incorrect admin password.");
    }
  }
};

/* ---------- JSON Database Export / Import (CRUD) ---------- */
$("#exportDb").onclick = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(S));
  const dl = document.createElement('a');
  dl.setAttribute("href", dataStr);
  dl.setAttribute("download", "portfolio_db.json");
  dl.click();
};

$("#importDbBtn").onclick = () => $("#importDb").click();
$("#importDb").onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = event => {
    try {
      S = JSON.parse(event.target.result);
      save();
      location.reload(); // Refresh to apply imported DB
    } catch (err) {
      alert("Invalid JSON Database file.");
    }
  };
  reader.readAsText(f);
  e.target.value = "";
};

/* ---------- editable text ---------- */
["name","title","welcome"].forEach(id=>{
  const el=$("#"+id);
  if(S[id])el.textContent=S[id];
  el.addEventListener("input",()=>{
    if(isAdmin){ S[id]=el.textContent; save(); }
  });
});

/* ---------- profile picture ---------- */
function paintAvatar(){
  const a=$("#avatar");
  if(S.avatar){a.style.backgroundImage=`url(${S.avatar})`;a.textContent=""}
  else{a.style.backgroundImage="";a.textContent=isAdmin?"+":""}
}
$("#avatar").onclick=()=> { if(isAdmin) $("#avIn").click(); }
$("#avIn").onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  readFile(f,d=>{S.avatar=d;paintAvatar();save()});e.target.value="";
};
paintAvatar();

/* ---------- Spotify ---------- */
function spotifyEmbed(url){
  const m=url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
  return m?{src:`https://open.spotify.com/embed/${m[1]}/${m[2]}`,h:m[1]==="track"?80:152}:null;
}
function paintPlayer(){
  const p=$("#player");p.innerHTML="";
  const e=S.spotify&&spotifyEmbed(S.spotify);
  if(!e)return;
  const f=document.createElement("iframe");
  f.src=e.src;f.height=e.h;f.allow="encrypted-media";f.loading="lazy";
  p.appendChild(f);
}
$("#spForm").onsubmit=e=>{
  e.preventDefault();
  if(!isAdmin) return;
  const v=$("#spInput").value.trim();
  if(!spotifyEmbed(v)){alert("That doesn't look like a Spotify link.");return}
  S.spotify=v;save();paintPlayer();$("#spInput").value="";
};
paintPlayer();

/* ---------- sections with uploads ---------- */
const wrap=$("#sections"),nav=$("#nav");
let target=null;
SECTIONS.forEach(s=>{
  const sec=document.createElement("section");sec.id=s.id;
  sec.innerHTML=`<h2>${s.title}</h2><div class="grid"></div>`;
  wrap.appendChild(sec);
  const a=document.createElement("a");
  a.href="#"+s.id;a.title=s.label;a.setAttribute("aria-label",s.label);
  a.innerHTML=`<svg viewBox="0 0 24 24">${s.icon}</svg><b>${s.label}</b>`;
  nav.appendChild(a);
});

function paintGrid(id){
  const g=document.querySelector(`#${id} .grid`);
  if(!g) return;
  g.innerHTML="";
  const list=S.items[id]||[];
  
  list.forEach((it,i)=>{
    const t=document.createElement("div");t.className="tile";
    if(it.data.startsWith("data:image/"))t.innerHTML=`<img alt="${it.name}" src="${it.data}">`;
    else t.innerHTML=`<a href="${it.data}" download="${it.name}">📄 ${it.name}</a>`;
    
    // Only render Delete (x) if Admin
    if(isAdmin) {
      const x=document.createElement("button");x.className="x";x.textContent="×";x.setAttribute("aria-label","Remove");
      x.onclick=()=>{list.splice(i,1);save();paintGrid(id)};
      t.appendChild(x);
    }
    g.appendChild(t);
  });

  // Only render Add (+) slots if Admin
  if (isAdmin) {
    for(let n=list.length;n<Math.max(3,list.length+1);n++){
      const b=document.createElement("button");b.className="tile add";b.textContent="+";b.setAttribute("aria-label","Upload file");
      b.onclick=()=>{target=id;$("#fileIn").click()};g.appendChild(b);
    }
  }
}
$("#fileIn").onchange=e=>{
  if(!isAdmin) return;
  const files=[...e.target.files];e.target.value="";
  files.forEach(f=>{
    if(!f.type.startsWith("image/")&&f.size>1.5e6){alert(f.name+" is over 1.5 MB.");return}
    readFile(f,d=>{(S.items[target]=S.items[target]||[]).push({name:f.name,data:d});save();paintGrid(target)});
  });
};
$("#fileIn").multiple=true;

/* ---------- highlight current section in nav ---------- */
const links=[...nav.querySelectorAll("a")];
const io=new IntersectionObserver(es=>{
  es.forEach(en=>{if(en.isIntersecting)links.forEach(l=>l.classList.toggle("on",l.getAttribute("href")==="#"+en.target.id))});
},{rootMargin:"-30% 0px -60% 0px"});
document.querySelectorAll("section").forEach(s=>io.observe(s));
$("#top").onclick=()=>scrollTo({top:0});

/* ---------- settings: colors, background, effects ---------- */
const EMO={hearts:["💗","💖","🩷"],petals:["🌸","🌺"],sparkles:["✨","⭐"],bubbles:["🫧","○"]};
function applyLook(){
  const r=document.documentElement.style;
  r.setProperty("--bg",S.bg||"#f9d9d9");
  r.setProperty("--accent",S.accent||"#c45c6a");
  r.setProperty("--card",S.card||"#dd9096");
  document.body.style.backgroundImage=S.bgImg?`url(${S.bgImg})`:"none";
  $("#bgColor").value=S.bg||"#f9d9d9";$("#accentColor").value=S.accent||"#c45c6a";
  $("#effect").value=S.effect||"none";
  const fx=$("#fx");fx.innerHTML="";
  (EMO[S.effect]||[]).length&&Array.from({length:18},(_,i)=>{
    const sp=document.createElement("span"),e=EMO[S.effect];
    sp.textContent=e[i%e.length];
    sp.style.cssText=`left:${Math.random()*100}%;font-size:${14+Math.random()*20}px;animation-duration:${8+Math.random()*10}s;animation-delay:-${Math.random()*14}s`;
    fx.appendChild(sp);
  });
}
$("#gearBtn").onclick=()=>$("#panel").classList.toggle("open");
$("#bgColor").oninput=e=>{S.bg=e.target.value;S.bgImg=null;applyLook();save()};
$("#accentColor").oninput=e=>{
  S.accent=e.target.value;
  const c=parseInt(S.accent.slice(1),16),mix=v=>Math.round(v+(255-v)*.3);
  S.card="#"+[c>>16&255,c>>8&255,c&255].map(mix).map(v=>v.toString(16).padStart(2,"0")).join("");
  applyLook();save();
};
$("#effect").onchange=e=>{S.effect=e.target.value;applyLook();save()};
$("#bgImgBtn").onclick=()=>$("#bgFile").click();
$("#bgFile").onchange=e=>{const f=e.target.files[0];if(!f)return;readFile(f,d=>{S.bgImg=d;applyLook();save()});e.target.value=""};
$("#bgClear").onclick=()=>{S.bgImg=null;applyLook();save()};
$("#resetAll").onclick=()=>{if(confirm("Erase all your edits and uploads?")){localStorage.removeItem(KEY);location.reload()}};

// Initial Boot
applyLook();
renderAdminState();