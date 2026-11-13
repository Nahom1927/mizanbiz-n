(function(){
var D={
'Login':'ግባ','Create Account':'መለያ ክፈት','Full name':'ሙሉ ስም','Email address or phone number (international)':'ኢሜይል ወይም ስልክ ቁጥር',
'Password':'የይለፍ ቃል','New password':'አዲስ የይለፍ ቃል','Register — start free trial':'ተመዝገብ — ነፃ ሙከራ ጀምር','Forgot password?':'የይለፍ ቃል ረሱ?',
'Reset password':'የይለፍ ቃል ቀይር','Back to login':'ወደ መግቢያ ተመለስ','Run your business with clarity.':'ንግድዎን በግልጽነት ይምሩ።',
'3 Months Free':'3 ወር ነፃ','Dashboard':'ዳሽቦርድ','Transactions':'ግብይቶች','Payment':'ክፍያ','Profile':'መገለጫ','Shop':'ሱቅ',
'Logout':'ውጣ','My Profile':'የእኔ መገለጫ','Profile picture':'የመገለጫ ምስል','Registered:':'የተመዘገቡት፦','Plan:':'ዕቅድ፦','Role:':'ሚና፦',
'Continue to Dashboard':'ወደ ዳሽቦርድ ቀጥል','Open Shop Dashboard':'የሱቅ ዳሽቦርድ ክፈት','Open Shop':'ሱቅ ክፈት','Ready to run your shop?':'ሱቅዎን ለማስኬድ ዝግጁ ነዎት?',
'Total income':'ጠቅላላ ገቢ','Total expenses':'ጠቅላላ ወጪ','Balance':'ቀሪ ሂሳብ','Days remaining':'የቀሩ ቀናት','Welcome,':'እንኳን ደህና መጡ፣',
'Here’s your business overview':'የንግድዎ ማጠቃለያ','Description':'መግለጫ','Amount':'መጠን','Type':'ዓይነት','Income':'ገቢ','Expense':'ወጪ','Add':'ጨምር','Date':'ቀን',
'Subscribe now':'አሁን ይመዝገቡ','Free trial':'ነፃ ሙከራ','Premium active':'ፕሪሚየም ንቁ','Expired':'ጊዜው አልፏል','Submit for verification':'ለማረጋገጫ ላክ',
'My payments':'የእኔ ክፍያዎች','Transaction reference':'የግብይት ማጣቀሻ','Method':'ዘዴ','Status':'ሁኔታ','Submit payment reference':'የክፍያ ማጣቀሻ ያስገቡ',
'Subscription: 199 ETB / month':'ክፍያ፦ 199 ብር / ወር','Subscription & Payment':'ደንበኝነትና ክፍያ','Entry currency':'የመግቢያ ገንዘብ','Back':'ተመለስ','Next':'ቀጣይ'
};
var keys=Object.keys(D).filter(function(k){return k.length>=8}).sort(function(a,b){return b.length-a.length});
function cur(){try{return localStorage.getItem('mb_lang')==='am'?'am':'en'}catch(e){return 'en'}}
var btn=document.createElement('button');btn.id='mbLang';btn.className='btn sec sm';
btn.style.cssText='position:fixed;top:calc(.6rem + env(safe-area-inset-top,0px));right:6.4rem;z-index:30';
document.body.appendChild(btn);
btn.onclick=function(){try{localStorage.setItem('mb_lang',cur()==='am'?'en':'am')}catch(e){}window.render()};
function has(k){return Object.prototype.hasOwnProperty.call(D,k)}
function apply(){var am=cur()==='am';document.documentElement.lang=am?'am':'en';btn.textContent=am?'EN':'አማ';
 if(!am)return;var root=document.getElementById('root');if(!root)return;
 var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n,list=[];while((n=w.nextNode()))list.push(n);
 list.forEach(function(n){var v=n.nodeValue,t=v.trim();if(!t)return;
  if(has(t)){n.nodeValue=v.replace(t,D[t]);return}
  var o=v;keys.forEach(function(k){if(o.indexOf(k)>-1)o=o.split(k).join(D[k])});if(o!==v)n.nodeValue=o});
 root.querySelectorAll('[placeholder]').forEach(function(e){var p=e.getAttribute('placeholder');if(has(p))e.setAttribute('placeholder',D[p])})}
var r0=window.render;window.render=function(){r0.apply(this,arguments);apply()};
apply();
})();
