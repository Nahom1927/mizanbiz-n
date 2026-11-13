/* MizanBiz voice add-on: Amharic reading, male/female voice, Amharic microphone.
   Load this BEFORE voice-boost.js and voice.js. */
(function(){
'use strict';
if(window.__mbAmVoice)return;window.__mbAmVoice=true;

var synth=window.speechSynthesis||null;
var ETH=/[\u1200-\u137F]/;
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}return null}
function appAm(){return ls('mb_lang')==='am'}
function gender(){return ls('mb_vgender')==='m'?'m':'f'}
function useWeb(){return ls('mb_vweb')!=='0'}
var noAmMic=false;
function micLang(){
  var m=ls('mb_vmic')||'auto';
  if(m==='en')return 'en-US';
  if(noAmMic)return m==='am'?'am-ET':null;
  if(m==='am')return 'am-ET';
  return appAm()?'am-ET':null;
}

var T={
  btn:['Voice','ድምፅ'],
  title:['Voice settings','የድምፅ ቅንብር'],
  gender:['Voice type','የድምፅ ዓይነት'],
  f:['Female','ሴት'],m:['Male','ወንድ'],
  mic:['Microphone language','የማይክሮፎን ቋንቋ'],
  auto:['Same as app','እንደ መተግበሪያው'],am:['Amharic','አማርኛ'],en:['English','እንግሊዝኛ'],
  web:['If this device has no Amharic voice, use the online one (needs internet)','መሣሪያው የአማርኛ ድምፅ ከሌለው በኢንተርኔት ያንብብ'],
  testAm:['Test Amharic voice','የአማርኛ ድምፅ ሞክር'],
  testEn:['Test English voice','የእንግሊዝኛ ድምፅ ሞክር'],
  testMic:['Test microphone','ማይክሮፎን ሞክር'],
  close:['Close','ዝጋ'],
  hasAm:['Amharic voice on this device: yes','በዚህ መሣሪያ የአማርኛ ድምፅ አለ'],
  noAm:['Amharic voice on this device: no (online voice will be used)','በዚህ መሣሪያ የአማርኛ ድምፅ የለም (የኢንተርኔት ድምፅ ይጠቀማል)'],
  noAmOff:['Amharic voice on this device: no','በዚህ መሣሪያ የአማርኛ ድምፅ የለም'],
  say:['Hello, welcome to MizanBiz.','ሰላም፣ ወደ ሚዛንቢዝ እንኳን ደህና መጡ።'],
  heard:['I heard','የሰማሁት'],
  nomic:['Voice input is not supported here. Use Chrome.','የድምፅ ግብዓት አይደገፍም። Chrome ይጠቀሙ።'],
  micAmBad:['Amharic microphone is not available here. Using English.','የአማርኛ ማይክሮፎን የለም። እንግሊዝኛ ይጠቀማል።'],
  webFail:['Online Amharic voice failed. Check your internet.','የኢንተርኔት የአማርኛ ድምፅ አልሰራም። ኢንተርኔትዎን ያረጋግጡ።']
};
function t(k){return T[k][appAm()?1:0]}

/* ---------- voice picking ---------- */
var FEM=/female|woman|girl|samantha|karen|moira|tessa|victoria|fiona|zira|susan|hazel|allison|ava\b|serena|kate|veena|amelie|google us english|aster|selam|mekdes/i;
var MAL=/\bmale\b|daniel|alex\b|fred|david|mark\b|george|james|oliver|rishi|tewodros|abebe|kebede/i;
function nameGender(n){
  if(FEM.test(n))return 'f';
  if(MAL.test(String(n).replace(/female/ig,'')))return 'm';
  return null;
}
function voices(){try{return synth?synth.getVoices()||[]:[]}catch(e){return[]}}
function find(lang,g){
  var pre=lang.slice(0,2).toLowerCase();
  var list=voices().filter(function(v){return (v.lang||'').toLowerCase().indexOf(pre)===0});
  if(!list.length)return {v:null,matched:false};
  var exact=list.filter(function(v){return nameGender(v.name)===g});
  if(exact.length)return {v:exact[0],matched:true};
  var other=list.filter(function(v){return nameGender(v.name)===null});
  return {v:(other[0]||list[0]),matched:false};
}
function hasAmVoice(){return voices().some(function(v){return (v.lang||'').toLowerCase().indexOf('am')===0})}

/* ---------- online Amharic fallback ---------- */
var webAudio=null,webToken=0;
function chunks(text){
  var out=[],parts=String(text).replace(/\s+/g,' ').split(/(?<=[።፣፤፥?!.,;:])\s*/);
  var cur='';
  parts.forEach(function(p){
    if(!p)return;
    if((cur+' '+p).trim().length>170){if(cur)out.push(cur);cur=p}else cur=(cur+' '+p).trim();
  });
  if(cur)out.push(cur);
  var fin=[];
  out.forEach(function(c){while(c.length>170){fin.push(c.slice(0,170));c=c.slice(170)}fin.push(c)});
  return fin;
}
function stopWeb(){
  webToken++;
  if(webAudio){try{webAudio.pause()}catch(e){}webAudio=null}
}
function webSpeak(u,fallback){
  var list=chunks(u.text),my=++webToken,i=0,g=gender();
  function fire(n,ev){try{if(typeof u[n]==='function')u[n](ev||{})}catch(e){}}
  fire('onstart');
  function next(){
    if(my!==webToken)return;
    if(i>=list.length){webAudio=null;fire('onend');return}
    var a=new Audio('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=am&q='+encodeURIComponent(list[i++]));
    var rate=Math.min(2,Math.max(0.5,u.rate||1));
    try{a.preservesPitch=(g==='f');a.mozPreservesPitch=(g==='f')}catch(e){}
    a.playbackRate=g==='m'?rate*0.88:rate;
    a.onended=next;
    a.onerror=function(){
      if(my!==webToken)return;
      webAudio=null;toast(t('webFail'));
      fire('onerror',{error:'network'});
      if(fallback){u.lang='am-ET';fallback(u)}
    };
    webAudio=a;
    var p=a.play();if(p&&p.catch)p.catch(function(){a.onerror()});
  }
  next();
}

/* ---------- patch speechSynthesis ---------- */
if(synth){
  var origSpeak=synth.speak.bind(synth),origCancel=synth.cancel.bind(synth);
  synth.speak=function(u){
    try{
      var txt=u&&u.text||'',am=ETH.test(txt),g=gender();
      var lang=am?'am-ET':(u.lang||'en-US');
      var pk=find(lang,g);
      if(am){
        if(pk.v){u.voice=pk.v;u.lang=pk.v.lang}
        else if(useWeb()&&navigator.onLine!==false){return webSpeak(u,origSpeak)}
        else u.lang='am-ET';
      }else if(pk.v){u.voice=pk.v;u.lang=pk.v.lang}
      if(!pk.matched&&pk.v!==null||(am&&!pk.v)){
        u.pitch=g==='f'?1.2:0.75;
      }
    }catch(e){}
    return origSpeak(u);
  };
  synth.cancel=function(){stopWeb();return origCancel()};
  if(synth.getVoices)synth.getVoices();
}

/* ---------- patch speech recognition (Amharic microphone) ---------- */
['SpeechRecognition','webkitSpeechRecognition'].forEach(function(n){
  var C=window[n];if(!C||!window.Proxy)return;
  var d=Object.getOwnPropertyDescriptor(C.prototype,'lang');
  if(!d||!d.set||!d.get)return;
  window[n]=new Proxy(C,{
    construct:function(target,args,nt){
      var inst=Reflect.construct(target,args,nt);
      try{
        Object.defineProperty(inst,'lang',{
          configurable:true,
          get:function(){return d.get.call(inst)},
          set:function(v){var f=micLang();d.set.call(inst,f||v)}
        });
        inst.addEventListener('error',function(e){
          if(e.error==='language-not-supported'&&!noAmMic){
            noAmMic=true;toast(t('micAmBad'));
          }
        });
      }catch(e){}
      return inst;
    }
  });
});

/* ---------- UI ---------- */
var toastEl=null,toastTmr=null;
function toast(msg){
  try{
    if(!toastEl){
      toastEl=document.createElement('div');
      toastEl.setAttribute('role','status');toastEl.setAttribute('aria-live','polite');
      toastEl.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:150px;background:#0F2420;color:#fff;padding:10px 16px;border-radius:12px;z-index:2147483600;font:500 14px system-ui,sans-serif;max-width:88vw;text-align:center';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent=msg;toastEl.style.display='block';
    clearTimeout(toastTmr);toastTmr=setTimeout(function(){toastEl.style.display='none'},3500);
  }catch(e){}
}
function mk(tag,css,txt){var e=document.createElement(tag);if(css)e.style.cssText=css;if(txt!=null)e.textContent=txt;return e}

function build(){
  if(document.getElementById('mbAmBtn'))return;
  var btn=mk('button','position:fixed;left:12px;bottom:96px;z-index:2147483000;padding:10px 14px;border-radius:999px;border:0;background:#0A8575;color:#fff;font:600 14px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer','🔊 '+t('btn'));
  btn.id='mbAmBtn';btn.setAttribute('aria-label',t('title'));
  var panel=mk('div','position:fixed;left:12px;bottom:146px;z-index:2147483001;width:min(330px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:#fff;color:#0F2420;border:1px solid #D3E2DF;border-radius:16px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.3);font:14px system-ui,sans-serif;display:none');
  panel.id='mbAmPanel';panel.setAttribute('role','dialog');

  function radios(name,opts,cur,onset){
    var row=mk('div','display:flex;gap:6px;margin:6px 0 12px;flex-wrap:wrap');
    opts.forEach(function(o){
      var b=mk('button','flex:1;min-width:80px;padding:9px;border-radius:12px;border:1px solid #D3E2DF;font-weight:600;cursor:pointer;background:'+(cur===o[0]?'#0A8575':'#fff')+';color:'+(cur===o[0]?'#fff':'#0F2420'),o[1]);
      b.setAttribute('aria-pressed',cur===o[0]?'true':'false');
      b.onclick=function(){onset(o[0]);render()};
      row.appendChild(b);
    });
    return row;
  }
  function sbtn(label,fn,bg){
    var b=mk('button','width:100%;padding:10px;margin-top:8px;border-radius:12px;border:0;font-weight:600;cursor:pointer;background:'+(bg||'#E7F0EE')+';color:'+(bg?'#fff':'#0F2420'),label);
    b.onclick=fn;return b;
  }
  function speakTest(text,lang){
    if(!synth)return;
    synth.cancel();
    var u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=1;
    synth.speak(u);
  }
  function testMic(out){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){out.textContent=t('nomic');return}
    try{if(synth)synth.cancel()}catch(e){}
    var r=new SR();r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;
    r.onresult=function(e){out.textContent=t('heard')+': '+e.results[0][0].transcript};
    r.onerror=function(e){out.textContent='Error: '+e.error};
    r.onstart=function(){out.textContent='…'};
    try{r.start()}catch(e){out.textContent='Error'}
  }
  function render(){
    panel.innerHTML='';
    btn.textContent='🔊 '+t('btn');
    panel.appendChild(mk('b','display:block;font-size:16px;margin-bottom:8px',t('title')));
    panel.appendChild(mk('div','font-weight:600',t('gender')));
    panel.appendChild(radios('g',[['f',t('f')],['m',t('m')]],gender(),function(v){ls('mb_vgender',v)}));
    panel.appendChild(mk('div','font-weight:600',t('mic')));
    panel.appendChild(radios('mic',[['auto',t('auto')],['am',t('am')],['en',t('en')]],ls('mb_vmic')||'auto',function(v){ls('mb_vmic',v);noAmMic=false}));
    var lab=mk('label','display:flex;gap:8px;align-items:flex-start;margin-bottom:8px');
    var cb=mk('input','margin-top:3px');cb.type='checkbox';cb.checked=useWeb();
    cb.onchange=function(){ls('mb_vweb',cb.checked?'1':'0');render()};
    lab.appendChild(cb);lab.appendChild(mk('span','',t('web')));panel.appendChild(lab);
    var has=hasAmVoice();
    panel.appendChild(mk('small','display:block;color:#5A716D;margin-bottom:4px',has?t('hasAm'):(useWeb()?t('noAm'):t('noAmOff'))));
    panel.appendChild(sbtn(t('testAm'),function(){speakTest(t('say').length&&T.say[1],'am-ET')}));
    panel.appendChild(sbtn(t('testEn'),function(){speakTest(T.say[0],'en-US')}));
    var out=mk('div','margin-top:8px;color:#075F54;min-height:18px');
    panel.appendChild(sbtn(t('testMic'),function(){testMic(out)}));
    panel.appendChild(out);
    panel.appendChild(sbtn(t('close'),function(){panel.style.display='none'},'#0A8575'));
  }
  btn.onclick=function(){
    if(panel.style.display==='none'){render();panel.style.display='block'}else panel.style.display='none';
  };
  document.body.appendChild(panel);document.body.appendChild(btn);
  if(synth&&synth.addEventListener)synth.addEventListener('voiceschanged',function(){if(panel.style.display!=='none')render()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
