/* MizanBiz voice-boost: better hearing + blind mode reads what the cursor / finger is on */
(function(){
'use strict';
if(window.__mbBoost)return;window.__mbBoost=true;

/* ---------- 1) HEARING: ask the recognizer for more guesses ---------- */
var SRo=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SRo){
  var Boost=function(){
    var r=new SRo();
    try{r.maxAlternatives=5}catch(e){}
    return r;
  };
  Boost.prototype=SRo.prototype;
  window.SpeechRecognition=Boost;
  window.webkitSpeechRecognition=Boost;
}

/* ---------- 2) BLIND MODE: follow cursor (desktop) and finger (phone) ---------- */
var synth=window.speechSynthesis||null;
function ls(k){try{return localStorage.getItem(k)}catch(e){return null}}
function blind(){return ls('mb_blind')==='1'}
function lang(){return ls('mb_lang')==='am'?'am-ET':'en-US'}

var SEL='button,a,input,select,textarea,label,h1,h2,h3,th,td,li,p,b,small,span,[data-act],[role],img';
function textOf(el){
  if(!el)return '';
  var t=el.getAttribute&&(el.getAttribute('aria-label')||el.getAttribute('title')||el.getAttribute('alt'));
  if(!t&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA')){
    var lab=el.id&&document.querySelector('label[for="'+el.id+'"]');
    t=(lab?lab.innerText+'. ':'')+(el.value?el.value:(el.placeholder||''));
  }
  if(!t&&el.tagName==='SELECT'){
    var o=el.options[el.selectedIndex];t=o?o.text:'';
  }
  if(!t)t=el.innerText||el.textContent||'';
  t=String(t).replace(/\s+/g,' ').trim();
  return t.length>300?t.slice(0,300):t;
}
function pick(node){
  if(!node||node.nodeType!==1)node=node&&node.parentElement;
  if(!node)return null;
  if(node.closest&&node.closest('#mbvToast'))return null;
  var el=node.closest?node.closest('button,a,input,select,textarea,[data-act]'):null;
  return el||(node.closest?node.closest(SEL):node)||node;
}
var last=null,lastAt=0;
function say(el){
  if(!blind()||!synth||!el)return;
  var t=textOf(el);
  if(!t)return;
  var now=Date.now();
  if(el===last&&now-lastAt<1500)return;
  last=el;lastAt=now;
  try{
    synth.cancel();
    var u=new SpeechSynthesisUtterance(t);
    u.lang=lang();u.rate=1;
    synth.speak(u);
  }catch(e){}
}

/* desktop: mouse */
var mt=null;
document.addEventListener('mouseover',function(e){
  if(!blind())return;
  var el=pick(e.target);
  clearTimeout(mt);
  mt=setTimeout(function(){say(el)},120);
},true);

/* phone: finger touches and slides */
var tt=0;
function touchRead(e){
  if(!blind())return;
  var t=e.touches&&e.touches[0];if(!t)return;
  var now=Date.now();
  if(e.type==='touchmove'&&now-tt<250)return;
  tt=now;
  say(pick(document.elementFromPoint(t.clientX,t.clientY)));
}
document.addEventListener('touchstart',touchRead,{capture:true,passive:true});
document.addEventListener('touchmove',touchRead,{capture:true,passive:true});

/* keyboard focus (Tab) */
document.addEventListener('focusin',function(e){say(pick(e.target))},true);
})();
