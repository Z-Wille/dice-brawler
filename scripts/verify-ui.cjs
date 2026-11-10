const {spawn}=require('child_process'),fs=require('fs');
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--user-data-dir=/tmp/dice-redesign-profile','--remote-debugging-pipe'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
let seq=0,buffer='',pending=new Map();chrome.stdio[4].on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\0'))>=0){const msg=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);if(msg.id){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(msg.error):p.resolve(msg.result)}}});
function send(method,params={},sessionId){const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});chrome.stdio[3].write(JSON.stringify({id,method,params,sessionId})+'\0')})}
(async()=>{try{
const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});const c=(m,p)=>send(m,p,sessionId);await c('Page.enable');
const ev=async expression=>{const r=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const dir=process.cwd()+'/screenshots/';
async function snap(name){await wait(100);const {data}=await c('Page.captureScreenshot',{format:'png'});fs.writeFileSync(dir+name+'.png',Buffer.from(data,'base64'));console.log(name,await ev(`JSON.stringify({square:[game.offsetWidth,game.offsetHeight],overflows:[...document.querySelectorAll('.stat,.player-zone,.player-hud,.title,.btns,.lbl,#intent,#ePas,#commit-preview,.attack-numbers,#forecast,.upgrade-label,.recovery-label')].filter(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2).map(e=>e.className||e.id)})`))}
for(const size of [900,640]){
await c('Emulation.setDeviceMetricsOverride',{width:size+32,height:size+32,deviceScaleFactor:1,mobile:false});await c('Page.navigate',{url:'file://'+process.cwd()+'/index.html'});await wait(1000);await ev('document.fonts.ready');await snap(size+'-initial');
await ev(`S.dice=[6,3,2];S.assign=[null,null,null];S.sel=0;log('You throw 6 - 3 - 2.');render()`);await snap(size+'-selected');
await ev(`document.querySelector('[data-k="str"]').click()`);await snap(size+'-assigned');
await ev(`document.querySelector('[data-k="agi"]').click();document.querySelector('[data-k="luk"]').click()`);await snap(size+'-ready');
await ev(`document.querySelector('#history summary').focus();document.querySelector('#history summary').click();if(!document.querySelector('#history').open||!document.querySelector('#log').textContent.includes('blocks the gate'))throw Error('History expansion');if(!document.querySelector('#latest').textContent.includes('You throw'))throw Error('Latest event');true`);await snap(size+'-history');
await ev(`document.querySelector('#history summary').click();if(document.querySelector('#history').open)throw Error('History collapse');true`);
console.log('preview',await ev(`JSON.stringify({str:S.str,pending:pending('str'),base:document.querySelector('.str .e').textContent,hit:document.querySelector('#kDmg').textContent,expected:hitDamage(S.str+6)})`));
await ev(`document.querySelector('#attack').click();true`);await snap(size+'-resolving');await wait(1800);
await ev(`S.fight=2;S.eHp=1;S.str=1000;S.dice=[1];S.assign=['str'];S.sel=null;S.busy=false;render();document.querySelector('#attack').click();true`);await wait(1200);await snap(size+'-victory');
await ev(`newRun();S.pHp=1;S.intent={type:'strike',dmg:100};S.dice=[1];S.assign=['luk'];S.sel=null;render();document.querySelector('#attack').click();true`);await wait(2000);await snap(size+'-defeat');
}
await ev(`newRun();S.pHp=35;S.dice=[6,6,6];S.assign=['heal','agi','luk'];S.agi=V.maxDodge/V.dodgePerAgi;S.luk=V.maxCrit/V.critPerLuk;render();if(!document.querySelector('.heal .v').textContent.includes('5 HP'))throw Error('Heal cap');if(wastedAllocations().length!==3)throw Error('Waste warnings');S.intent={type:'guard'};if(hitDamage(6)!==2)throw Error('Guard rounding');S.intent={type:'strike',dmg:6};if(hitDamage(6)!==3||hitDamage(6,true)!==11)throw Error('Armor / crit ordering');S.dice=[6,3,2];S.assign=['str','agi','luk'];S.sel=null;render();document.querySelector('[data-die="0"]').click();if(S.assign[0]!==null||S.sel!==0||!document.querySelector('#attack').disabled)throw Error('Reassignment');true`);
console.log('PASS: healing cap, waste warnings, armor, critical and guard order, reassignment and commit gating');
await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await c('Page.navigate',{url:'file://'+process.cwd()+'/index.html'});await wait(1000);await ev('window.scrollTo(0,0)');await snap('390-minimum-size-notice');
}finally{await send('Browser.close').catch(()=>{});chrome.kill()}})().catch(e=>{console.error(e);process.exitCode=1});
