(function(){
'use strict';
var DEFAULT_API='';   // paste your worker URL here (see step 4), or leave empty for offline mode
var API='';try{API=localStorage.getItem('mb_chat_api')||''}catch(e){}
API=API||DEFAULT_API;
var UI={
 en:{title:'MizanBiz Assistant',ph:'Type a message…',hi:'Hi! Ask me about sales, stock, customers, payments or your profile.',err:'Sorry, I could not answer that.'},
 am:{title:'የሚዛንቢዝ ረዳት',ph:'መልእክት ይጻፉ…',hi:'ሰላም! ስለ ሽያጭ፣ ክምችት፣ ደንበኞች፣ ክፍያ ወይም መገለጫ ይጠይቁኝ።',err:'ይቅርታ፣ መመለስ አልቻልኩም።'}
};
function uiLang(){try{return localStorage.getItem('mb_lang')==='am'?'am':'en'}catch(e){return 'en'}}
function S(){try{return JSON.parse(localStorage.getItem('mizanbiz_v2'))}catch(e){return null}}
function pad(n){return String(n).padStart(2,'0')}
function today(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function etb(n){return 'ETB '+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2})}
function owing(s){var o=[];(s.customers||[]).forEach(function(c){var cr=0,pd=0;
 (s.sales||[]).forEach(function(x){if(x.pay==='credit'&&x.custId===c.id)cr+=x.total});
 (s.payments||[]).forEach(function(p){if(p.custId===c.id)pd+=p.amt});
 var b=Math.max(0,cr-pd);if(b>0)o.push({n:c.name,b:b})});
 o.sort(function(a,b){return b.b-a.b});return o}
function ctx(){var s=S();if(!s)return {};var d=today(),ss=(s.sales||[]).filter(function(x){return x.date===d});
 return {today_sales_total:ss.reduce(function(a,x){return a+x.total},0),today_sales_count:ss.length,
 low_stock:(s.products||[]).filter(function(p){return p.qty<=p.low}).map(function(p){return p.name+' ('+p.qty+')'}),
 customers_owing:owing(s).slice(0,5),currency:'ETB'}}
var NODATA={en:'Open the Shop dashboard first so I can see your shop data.',am:'መጀመሪያ የሱቅ ዳሽቦርዱን ይክፈቱ፤ ከዚያ ዳታዎን ማየት እችላለሁ።'};
var INTENTS=[
 {re:/sale|sold|revenue|ሽያጭ|ገቢ/i,f:function(L,s){var d=today(),ss=s.sales.filter(function(x){return x.date===d});
  var t=ss.reduce(function(a,x){return a+x.total},0),c=ss.filter(function(x){return x.pay==='credit'}).reduce(function(a,x){return a+x.total},0);
  return L==='am'?'ዛሬ '+ss.length+' ሽያጭ፣ ጠቅላላ '+etb(t)+' (በዱቤ '+etb(c)+')።':'Today: '+ss.length+' sales, total '+etb(t)+' ('+etb(c)+' on credit).'}},
 {re:/stock|inventory|low|ክምችት|ዕቃ/i,f:function(L,s){var l=s.products.filter(function(p){return p.qty<=p.low});
  if(!l.length)return L==='am'?'ምንም ዕቃ አልቀነሰም።':'Nothing is running low.';
  var t=l.slice(0,5).map(function(p){return p.name+' ('+p.qty+')'}).join(', ');
  return L==='am'?'የቀነሱ ዕቃዎች፦ '+t:'Low stock: '+t}},
 {re:/owe|debt|credit|ዱቤ|ዕዳ|ተበዳሪ/i,f:function(L,s){var o=owing(s);
  if(!o.length)return L==='am'?'ማንም ዕዳ የለበትም።':'No customer owes anything.';
  var tot=o.reduce(function(a,x){return a+x.b},0),t=o.slice(0,3).map(function(x){return x.n+' '+etb(x.b)}).join(', ');
  return L==='am'?'ጠቅላላ '+etb(tot)+'። ከፍተኛ፦ '+t:'Total owed '+etb(tot)+'. Top: '+t}},
 {re:/profile|photo|picture|መገለጫ|ፎቶ|ምስል/i,a:{en:'Open the Profile tab (or tap the round profile icon at the top) to see your account and add a photo.',am:'መለያዎን ለማየትና ፎቶ ለመጨመር የመገለጫ ታብን ወይም ከላይ ያለውን ክብ አዶ ይንኩ።'}},
 {re:/pay|subscri|trial|telebirr|cbe|ክፍያ|ደንበኝነት|ሙከራ/i,a:{en:'Subscription is 199 ETB/month after the 3-month free trial. Pay by Telebirr or CBE, then submit the transaction reference on the Payment page.',am:'ከ3 ወር ነፃ ሙከራ በኋላ ወርሃዊ ክፍያው 199 ብር ነው። በቴሌብር ወይም በንግድ ባንክ ከፍለው የግብይት ቁጥሩን በክፍያ ገጽ ያስገቡ።'}},
 {re:/password|login|log in|logout|log out|ይለፍ|መግቢያ|ውጣ/i,a:{en:'Use "Forgot password?" on the login page to reset it. The ↪ / Logout button signs you out.',am:'የይለፍ ቃል ለመቀየር በመግቢያ ገጽ "የይለፍ ቃል ረሱ?" ይጠቀሙ። ለመውጣት "ውጣ" ይንኩ።'}},
 {re:/language|amharic|english|ቋንቋ|አማርኛ/i,a:{en:'Tap the አማ / EN button at the top to switch between Amharic and English.',am:'ከላይ ያለውን አማ / EN ቁልፍ በመንካት አማርኛና እንግሊዝኛ ይቀያይሩ።'}},
 {re:/backup|restore|ቅጂ|ምትኬ/i,a:{en:'Settings (⋯) has Cloud backup and Copy backup text. Use them regularly.',am:'በቅንብሮች (⋯) የደመና ቅጂና የቅጂ ጽሑፍ አለ። በየጊዜው ይጠቀሙ።'}},
 {re:/attend|employee|staff|መገኘት|ሠራተኛ/i,a:{en:'Go to People › Attendance to mark Present, Late, Absent or Leave and check in/out.',am:'ሰዎች › መገኘት ውስጥ ተገኝቷል፣ አርፍዷል፣ ቀርቷል ወይም ፈቃድ ይመዝግቡ።'}},
 {re:/^\s*(hi|hello|hey)\b|ሰላም|ታዲያስ|ጤና/i,a:{en:'Hello! How can I help you today?',am:'ሰላም! ዛሬ እንዴት ልርዳዎት?'}}
];
var HELP={en:'I can help with: sales today, low stock, who owes money, payment/subscription, profile, language and backup.',am:'ስለ ዛሬ ሽያጭ፣ ዝቅተኛ ክምችት፣ ዕዳ፣ ክፍያ፣ መገለጫ፣ ቋንቋና ቅጂ ልረዳዎት እችላለሁ።'};
function local(q){var L=/[\u1200-\u137F]/.test(q)?'am':'en',s=S();
 for(var i=0;i<INTENTS.length;i++){var it=INTENTS[i];if(it.re.test(q)){
  if(it.a)return it.a[L];if(!s||!s.sales)return NODATA[L];return it.f(L,s)}}
 return HELP[L]}
var hist=[],box,msgs,inp,btn,opened=false;
function css(){var st=document.createElement('style');st.textContent=
 '#mbc-btn{position:fixed;right:14px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:55;width:54px;height:54px;border-radius:50%;border:0;font-size:24px;cursor:pointer;color:#fff;background:var(--accent,var(--p1,#0A8575));box-shadow:0 6px 20px rgba(0,0,0,.25)}'+
 '#mbc{position:fixed;right:12px;bottom:calc(148px + env(safe-area-inset-bottom,0px));z-index:56;width:min(360px,calc(100vw - 24px));height:min(70vh,480px);display:none;flex-direction:column;background:var(--surface,var(--card,#fff));color:var(--ink,var(--text,#0F2420));border:1px solid var(--line,#D3E2DF);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.28);overflow:hidden;font:14px/1.45 system-ui,sans-serif}'+
 '#mbc.on{display:flex}#mbc header{padding:12px 14px;font-weight:700;color:#fff;background:var(--accent,var(--p1,#0A8575));display:flex;justify-content:space-between;align-items:center}'+
 '#mbc header button{background:none;border:0;color:#fff;font-size:18px;cursor:pointer}'+
 '#mbc-m{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}'+
 '.mbc-b{max-width:85%;padding:8px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}'+
 '.mbc-u{align-self:flex-end;background:var(--accent,var(--p1,#0A8575));color:#fff}.mbc-a{align-self:flex-start;background:var(--surface2,var(--bg,#E7F0EE))}'+
 '#mbc-f{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line,#D3E2DF)}'+
 '#mbc-i{flex:1;min-width:0;padding:10px 12px;border-radius:12px;border:1px solid var(--line,#D3E2DF);background:var(--surface,var(--card,#fff));color:inherit;font-size:16px;margin:0}'+
 '#mbc-s{border:0;border-radius:12px;padding:0 14px;color:#fff;background:var(--accent,var(--p1,#0A8575));font-weight:700;cursor:pointer}';
 document.head.appendChild(st)}
function add(role,text){var d=document.createElement('div');d.className='mbc-b '+(role==='user'?'mbc-u':'mbc-a');d.textContent=text;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;return d}
function build(){css();
 btn=document.createElement('button');btn.id='mbc-btn';btn.setAttribute('aria-label','Chat');btn.textContent='💬';
 box=document.createElement('div');box.id='mbc';
 box.innerHTML='<header><span id="mbc-t"></span><button id="mbc-x" aria-label="Close">✕</button></header><div id="mbc-m"></div><div id="mbc-f"><input id="mbc-i" autocomplete="off"><button id="mbc-s">➤</button></div>';
 document.body.appendChild(box);document.body.appendChild(btn);
 msgs=box.querySelector('#mbc-m');inp=box.querySelector('#mbc-i');
 btn.onclick=toggle;box.querySelector('#mbc-x').onclick=toggle;box.querySelector('#mbc-s').onclick=send;
 inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();send()}})}
function toggle(){var on=box.classList.toggle('on');if(!on)return;var u=UI[uiLang()];
 box.querySelector('#mbc-t').textContent=u.title;inp.placeholder=u.ph;
 if(!opened){opened=true;add('bot',u.hi)}inp.focus()}
function send(){var q=inp.value.trim();if(!q)return;inp.value='';add('user',q);hist.push({role:'user',content:q});
 var wait=add('bot','…');
 function done(t){wait.textContent=t;hist.push({role:'assistant',content:t});msgs.scrollTop=msgs.scrollHeight}
 if(!API){setTimeout(function(){done(local(q))},250);return}
 var m=hist.slice(-10);while(m.length&&m[0].role!=='user')m.shift();
 fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:m,context:ctx()})})
  .then(function(r){if(!r.ok)throw 0;return r.json()})
  .then(function(j){done(j.reply||local(q))})
  .catch(function(){done(local(q))})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
