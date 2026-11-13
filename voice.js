/* MizanBiz voice: dictation on every field + blind mode (read aloud, voice commands) */
(function(){
'use strict';
if(window.__mbVoice)return;window.__mbVoice=true;

var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
var synth=window.speechSynthesis||null;

function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}return null}
function isAm(){return ls('mb_lang')==='am'}
function locale(){return isAm()?'am-ET':'en-US'}

var TXT={
 nosr:['Voice input is not supported in this browser. Use Chrome.','ይህ አሳሽ የድምፅ ግብዓትን አይደግፍም። Chrome ይጠቀሙ።'],
 listening:['Listening…','እየሰማሁ ነው…'],
 blocked:['Microphone is blocked. Please allow microphone access.','ማይክሮፎን ታግዷል። እባክዎ ፈቃድ ይስጡ።'],
 nothing:['I did not hear anything.','ምንም አልሰማሁም።'],
 net:['Voice input needs an internet connection.','የድምፅ ግብዓት ኢንተርኔት ይፈልጋል።'],
 nonum:['I did not hear a number.','ቁጥር አልሰማሁም።'],
 blindOn:['Blind mode is on. Tap to turn off.','የዓይነ ስውራን ሁነታ በርቷል። ለማጥፋት ይንኩ።'],
 blindOff:['Blind mode is off. Tap to turn on.','የዓይነ ስውራን ሁነታ ጠፍቷል። ለማብራት ይንኩ።'],
 intro:['Blind mode is on. Touch and hold any item to hear it. Use the speaker button to read the page, the microphone button for voice commands, and the stop button to be quiet.','የዓይነ ስውራን ሁነታ በርቷል። ማንኛውንም ነገር ነክተው ይያዙ ለማዳመጥ። ገጹን ለማንበብ የድምፅ ማጉያውን ቁልፍ፣ ለትዕዛዝ የማይክሮፎን ቁልፍ ይጠቀሙ።'],
 cmdHeard:['Command not understood. Try: home, sales, stock, people, reports, back, read, stop.','ትዕዛዙ አልገባኝም። ይሞክሩ፦ ዋና፣ ሽያጭ፣ ክምችት፣ ሰዎች፣ ሪፖርቶች፣ ተመለስ፣ አንብብ፣ አቁም።'],
 askCmd:['Say a command.','ትዕዛዝ ይናገሩ።'],
 mic:['Dictate','በድምፅ ጻፍ'],
 blindBtn:['Blind mode','የዓይነ ስውራን ሁነታ'],
 readBtn:['Read page aloud','ገጹን አንብብ'],
 cmdBtn:['Voice command','የድምፅ ትዕዛዝ'],
 stopBtn:['Stop speaking','ንግግር አቁም']
};
function T(k){var e=TXT[k];return e?(isAm()?e[1]:e[0]):k}

/* spoken commands -> words to look for in the navigation buttons */
var CMD=[
 {w:['home','dashboard','ዋና'],t:'home'},
 {w:['sales','sale','ሽያጭ'],t:'sales'},
 {w:['stock','inventory','ክምችት'],t:'stock'},
 {w:['people','customers','ሰዎች'],t:'people'},
 {w:['reports','report','ሪፖርት'],t:'reports'},
 {w:['profile','account','መገለጫ'],t:'profile'}
];

/* ---------- speech out ---------- */
function blind(){return ls('mb_blind')==='1'}
function speak(text,interrupt){
 if(!synth||!text)return;
 try{
  if(interrupt)synth.cancel();
  var u=new SpeechSynthesisUtterance(String(text));
  u.lang=locale();
  var vs=synth.getVoices?synth.getVoices():[];
  var pre=u.lang.slice(0,2);
  for(var i=0;i<vs.length;i++){if(vs[i].lang&&vs[i].lang.slice(0,2)===pre){u.voice=vs[i];break}}
  synth.speak(u);
 }catch(e){}
}
function stopSpeak(){try{if(synth)synth.cancel()}catch(e){}}

function txt(n){
 if(!n)return '';
 var a=n.getAttribute&&(n.getAttribute('aria-label')||n.getAttribute('title'));
 var t=(a||n.innerText||n.textContent||'').replace(/\s+/g,' ').trim();
 return t;
}

/* ---------- toast ---------- */
var toastEl=null,toastT=null;
function say(msg,quiet){
 if(!toastEl){toastEl=document.createElement('div');toastEl.id='mbvToast';document.body.appendChild(toastEl)}
 toastEl.textContent=msg;toastEl.className='show';
 clearTimeout(toastT);toastT=setTimeout(function(){toastEl.className=''},2600);
 if(blind()&&!quiet)speak(msg,true);
}

/* ---------- speech in ---------- */
var active=null,forceLang=null;
function listen(opts){
 if(!SR){say(T('nosr'));return}
 if(active){try{active.stop()}catch(e){}active=null}
 stopSpeak();var r=new SR(),got=false;
 r.lang=forceLang||locale();r.interimResults=false;r.maxAlternatives=1;r.continuous=false;
 active=r;
 r.onstart=function(){if(opts.onstart)opts.onstart();say(T('listening'),true)};
 r.onresult=function(e){
  got=true;
  var t=e.results[0]&&e.results[0][0]?e.results[0][0].transcript:'';
  opts.onresult(String(t).trim());
 };
 r.onerror=function(e){
  var c=e&&e.error;
  if(c==='not-allowed'||c==='service-not-allowed')say(T('blocked'),true);
  else if(c==='network')say(T('net'),true);
  else if(c==='no-speech')say(T('nothing'),true);
  else if(c==='language-not-supported'&&!forceLang){forceLang='en-US';say('Amharic voice input is not available here. Using English.',true);setTimeout(function(){listen(opts)},400);}
  else if(c&&c!=='aborted')say('Voice error: '+c,true);
 };
 r.onend=function(){active=null;if(opts.onend)opts.onend();if(!got&&opts.onsilent)opts.onsilent()};
 try{r.start()}catch(e){active=null}
}

/* ---------- dictation on fields ---------- */
var TYPES=/^(text|search|tel|email|number|url|)$/i;
function setVal(el,v){
 var proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
 var d=Object.getOwnPropertyDescriptor(proto,'value');
 try{if(d&&d.set)d.set.call(el,v);else el.value=v}catch(e){el.value=v}
 el.dispatchEvent(new Event('input',{bubbles:true}));
 el.dispatchEvent(new Event('change',{bubbles:true}));
}
function toNumber(s){
 var t=String(s).replace(/[,\s]/g,'');
 var m=t.match(/-?\d+(\.\d+)?/);
 return m?m[0]:null;
}
function dictate(el,btn){
 listen({
  onstart:function(){btn.classList.add('on')},
  onend:function(){btn.classList.remove('on')},
  onresult:function(t){
   if(el.type==='number'){
    var n=toNumber(t);
    if(n===null){say(T('nonum'));return}
    setVal(el,n);
   }else{
    var cur=el.value||'';
    setVal(el,cur?cur+' '+t:t);
   }
   if(blind())speak(t,true);
  }
 });
}
function scan(){
 var els=document.querySelectorAll('input,textarea');
 for(var i=0;i<els.length;i++){
  var el=els[i];
  if(el.dataset.mbv||inOwn(el))continue;
  var tag=el.tagName;
  if(tag==='INPUT'&&!TYPES.test(el.getAttribute('type')||''))continue;
  if(el.disabled||el.readOnly)continue;
  el.dataset.mbv='1';
  var wrap=document.createElement('span');
  wrap.className='mbv-wrap';
  el.parentNode.insertBefore(wrap,el);
  wrap.appendChild(el);
  var b=document.createElement('button');
  b.type='button';b.className='mbv-mic';b.textContent='🎙';
  b.setAttribute('aria-label',T('mic'));b.title=T('mic');
  (function(inp,btn){btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();dictate(inp,btn)})})(el,b);
  wrap.appendChild(b);
 }
}
function labelBtns(){
 var bs=document.querySelectorAll('.mbv-mic');
 for(var i=0;i<bs.length;i++){bs[i].setAttribute('aria-label',T('mic'));bs[i].title=T('mic')}
 if(dock){
  var m={mbvBlind:'blindBtn',mbvRead:'readBtn',mbvCmd:'cmdBtn',mbvStop:'stopBtn'};
  Object.keys(m).forEach(function(id){var e=document.getElementById(id);if(e){e.setAttribute('aria-label',T(m[id]));e.title=T(m[id])}});
 }
}

/* ---------- reading the page ---------- */
function heading(){
 var h=document.querySelector('#main h2,#root h2,main h2,h1');
 return h?txt(h):'';
}
function readPage(){
 var root=document.getElementById('main')||document.getElementById('root')||document.body;
 var parts=[],h=heading();
 if(h)parts.push(h);
 var items=root.querySelectorAll('h2,h3,b,small,p,label,button,.row,.sum-line,tr');
 var seen={};
 for(var i=0;i<items.length&&parts.length<60;i++){
  if(inOwn(items[i]))continue;
  var t=txt(items[i]);
  if(!t||t.length>240||seen[t])continue;
  seen[t]=1;parts.push(t);
 }
 speak(parts.join('. '),true);
}

/* ---------- navigation by voice ---------- */
function clickNav(target){
 var btns=document.querySelectorAll('#nav .tab,.side .nav,#nav button');
 for(var i=0;i<btns.length;i++){
  var b=btns[i];
  var k=(b.getAttribute('data-k')||'').toLowerCase();
  var t=txt(b).toLowerCase();
  if(k===target||t.indexOf(target)>-1){b.click();return true}
 }
 return false;
}
function runCommand(t){
 var s=t.toLowerCase();
 function has(list){for(var i=0;i<list.length;i++)if(s.indexOf(list[i])>-1)return true;return false}
 if(has(['stop','quiet','አቁም'])){stopSpeak();return}
 if(has(['read','አንብብ'])){readPage();return}
 if(has(['back','ተመለስ'])){var bk=document.querySelector('[data-act="pageBack"]');if(bk){bk.click();return}history.back();return}
 if(has(['log out','logout','sign out','ውጣ'])){var lo=document.querySelector('[data-act="logout"]');if(lo){lo.click();return}}
 for(var i=0;i<CMD.length;i++){
  if(has(CMD[i].w)){
   if(clickNav(CMD[i].t)){setTimeout(function(){var h=heading();if(h)speak(h,true)},400);return}
  }
 }
 say(T('cmdHeard'));
}
function voiceCommand(){
 stopSpeak();
 listen({onresult:function(t){runCommand(t)},onsilent:function(){}});
}

/* ---------- blind mode ---------- */
var dock=null,pendingIntro=false,lastHead='';
function setBlind(on,silent){
 ls('mb_blind',on?'1':'0');
 document.documentElement.classList.toggle('mbv-blind',on);
 var b=document.getElementById('mbvBlind');
 if(b){b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')}
 if(!silent)say(on?T('blindOn'):T('blindOff'));
}

/* long press anywhere reads that item while blind mode is on */
var pressT=null,pressEl=null;
function pressStart(e){
 if(!blind())return;
 var el=e.target&&e.target.closest?e.target.closest('button,a,input,select,textarea,label,h1,h2,h3,.row,.card,p,small,b,td,th'):null;
 if(!el||inOwn(el))return;
 pressEl=el;
 clearTimeout(pressT);
 pressT=setTimeout(function(){
  var t=txt(pressEl);
  if(pressEl&&/^(INPUT|TEXTAREA|SELECT)$/.test(pressEl.tagName)){
   var l=pressEl.id&&document.querySelector('label[for="'+pressEl.id+'"]');
   t=(l?txt(l)+'. ':'')+(pressEl.value||pressEl.getAttribute('placeholder')||'');
  }
  if(t)speak(t.slice(0,400),true);
 },500);
}
function pressEnd(){clearTimeout(pressT)}

/* ---------- dock + css ---------- */
function injectCSS(){
 var st=document.createElement('style');
 st.textContent=
 '.mbv-wrap{position:relative;display:block;width:100%}'+
 '.mbv-wrap>input,.mbv-wrap>textarea{padding-right:46px}'+
 '.mbv-mic{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:1px solid var(--line,#ccc);background:var(--surface,var(--card,#fff));cursor:pointer;font-size:16px;line-height:1;padding:0;display:grid;place-items:center}'+
 '.mbv-wrap>textarea~.mbv-mic{top:22px;transform:none}'+
 '.mbv-mic.on{background:#BB3A34;color:#fff;animation:mbvp 1s infinite}'+
 '@keyframes mbvp{50%{opacity:.55}}'+
 '#mbvDock{position:fixed;left:10px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:35;display:flex;flex-direction:column;gap:8px}'+
 '#mbvDock button{width:46px;height:46px;border-radius:50%;border:1px solid var(--line,#ccc);background:var(--surface,var(--card,#fff));color:var(--ink,var(--text,#000));font-size:20px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15);padding:0;display:grid;place-items:center}'+
 '#mbvDock button.on{background:var(--accent,var(--p1,#0A8575));color:#fff;border-color:transparent}'+
 '#mbvDock .mbv-extra{display:none}'+
 '.mbv-blind #mbvDock .mbv-extra{display:grid}'+
 '.mbv-blind *:focus-visible{outline:3px solid #F0B45A!important;outline-offset:3px}'+
 '#mbvToast{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translateX(-50%);max-width:88vw;background:#0F2420;color:#fff;padding:10px 16px;border-radius:12px;font-size:14px;z-index:70;text-align:center;opacity:0;pointer-events:none;transition:opacity .2s}'+
 '#mbvToast.show{opacity:1}';
 document.head.appendChild(st);
}
function mk(id,label,cls,fn){
 var b=document.createElement('button');
 b.type='button';b.id=id;b.className=cls||'';b.textContent=label;
 b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();fn()});
 return b;
}
function buildDock(){
 dock=document.createElement('div');dock.id='mbvDock';
 dock.appendChild(mk('mbvBlind','👁','',function(){setBlind(!blind())}));
 dock.appendChild(mk('mbvRead','🔊','mbv-extra',readPage));
 dock.appendChild(mk('mbvCmd','🎙','mbv-extra',voiceCommand));
 dock.appendChild(mk('mbvStop','⏹','mbv-extra',stopSpeak));
 document.body.appendChild(dock);
}

/* ---------- observer ---------- */
var tmr=null;
function inOwn(n){return !n||(n.closest&&n.closest('#mbvDock,#mbvToast,.mbv-wrap'))&&!(n.tagName==='INPUT'||n.tagName==='TEXTAREA')}
function chatRead(node){
 if(node.nodeType!==1||(node.closest&&node.closest('#mbvDock,#mbvToast')))return;
 if(!node.closest('[id*="chat" i],[class*="chat" i]'))return;
 if(/^(INPUT|TEXTAREA|BUTTON|SCRIPT|STYLE)$/.test(node.tagName))return;
 var t=txt(node);
 if(!t||t.length>1500||/^[.\s…·•]+$/.test(t))return;
 speak(t,true);
}
function onMut(muts){
 var b=blind();
 muts.forEach(function(m){
  var tg=m.target;
  if(b&&tg&&tg.id==='toast'){var tt=txt(tg);if(tt)speak(tt,true)}
  else if(b&&tg&&tg.id==='msg'){var mt=txt(tg);if(mt)speak(mt,true)}
  if(b)[].forEach.call(m.addedNodes,chatRead);
 });
 clearTimeout(tmr);
 tmr=setTimeout(function(){
  scan();labelBtns();
  if(blind()){var h=heading();if(h&&h!==lastHead){lastHead=h;speak(h)}}
 },300);
}
function init(){
 injectCSS();buildDock();scan();labelBtns();
 if(ls('mb_blind')==='1'){setBlind(true,true);pendingIntro=true}
 function first(){if(pendingIntro){pendingIntro=false;speak(T('intro'),true)}}
 document.addEventListener('pointerdown',first,{once:true,capture:true});
 document.addEventListener('keydown',first,{once:true,capture:true});
 document.addEventListener('pointerdown',pressStart,true);
 document.addEventListener('pointerup',pressEnd,true);
 document.addEventListener('pointercancel',pressEnd,true);
 document.addEventListener('pointermove',function(e){if(Math.abs(e.movementX)+Math.abs(e.movementY)>6)pressEnd()},true);
 if(synth&&synth.getVoices)synth.getVoices();
 new MutationObserver(onMut).observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
