window.GAME_TUTORIAL_STEPS=[{t:T('gs.stepping-switch.tut1t'),d:T('gs.stepping-switch.tut1')},{t:T('gs.stepping-switch.tut2t'),d:T('gs.stepping-switch.tut2')},{t:T('gs.stepping-switch.tut3t'),d:T('gs.stepping-switch.tut3')}];
(function(){var root=document.getElementById('game-root');var TOTAL=10;
function fmt(k,v){var s=T(k);for(var k2 in(v||{}))s=s.split('{'+k2+'}').join(v[k2]);return s}
function isVowel(ch){return 'AEIOU'.indexOf(ch)>=0}
function daySeed(){var d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
function mulberry(seed){var s=Math.abs(Math.floor(seed))%2147483647;if(s<=0)s+=2147483646;return function(){s=s*16807%2147483647;return(s-1)/2147483646}}
/* Purple 步进开关：两组各 25 步循环，用简化置换模拟 */
var V_PATH=[],C_PATH=[];
(function init(){var rnd=mulberry(daySeed());var alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
for(var i=0;i<25;i++){var j=Math.floor(rnd()*alphabet.length);V_PATH.push(alphabet.splice(j,1)[0])}
for(i=0;i<20;i++){var j2=Math.floor(rnd()*alphabet.length);C_PATH.push(alphabet.splice(j2,1)[0])}})();
var vPos=0,cPos=0;
var wrap=document.createElement('div');wrap.className='ss-wrap';
wrap.innerHTML='<div class="ss-prog" id="ss-prog"></div><div class="ss-step" id="ss-step"></div><div class="ss-paths"><div class="ss-path vowels"><h4 id="ss-lbl-v"></h4><div class="ss-cells" id="ss-vcells"></div></div><div class="ss-path cons"><h4 id="ss-lbl-c"></h4><div class="ss-cells" id="ss-ccells"></div></div></div><input class="ss-input" id="ss-in" maxlength="1" autocomplete="off" placeholder="A-Z"><div class="ss-btns"><button class="btn accent" id="ss-go"></button><button class="btn" id="ss-again" hidden></button></div><div class="ss-btns"><button class="btn" id="ss-daily">'+T('gs.stepping-switch.dailyBtn')+'</button></div><div class="ss-msg" id="ss-msg"></div><div class="ss-help">'+T('gs.stepping-switch.helpText')+'</div>';
root.appendChild(wrap);
var $=function(id){return wrap.querySelector('#'+id)};
var progEl=$('ss-prog'),step=$('ss-step'),inEl=$('ss-in'),goB=$('ss-go'),againB=$('ss-again'),msgEl=$('ss-msg'),dailyBtn=$('ss-daily');
$('ss-lbl-v').textContent=T('gs.stepping-switch.pathV');$('ss-lbl-c').textContent=T('gs.stepping-switch.pathC');
goB.textContent=T('gs.stepping-switch.inputLbl');againB.textContent=T('gs.stepping-switch.againBtn');
var idx=0,score=0,streak=0,answered=false,finished=false,dailyMode=false,startTs=0;
function upd(){progEl.textContent=fmt('gs.stepping-switch.round',{n:Math.min(idx+1,TOTAL),total:TOTAL,streak:streak})}
function setMsg(c,t){msgEl.className='ss-msg '+c;msgEl.textContent=t}
function renderPaths(activeChar){var vEl=$('ss-vcells'),cEl=$('ss-ccells');vEl.innerHTML='';cEl.innerHTML='';
var isV=isVowel(activeChar||'A');
for(var i=0;i<V_PATH.length;i++){var d=document.createElement('span');d.className='ss-bit'+(i===vPos?' active':'')+(isV?' tapped':'');d.textContent=V_PATH[i];vEl.appendChild(d)}
for(i=0;i<C_PATH.length;i++){var d2=document.createElement('span');d2.className='ss-bit'+(i===cPos?' active':'')+( !isV?' tapped':'');d2.textContent=C_PATH[i];cEl.appendChild(d2)}}
function nextRound(){if(idx>=TOTAL){finished=true;if(Arcade.shell)Arcade.shell.submitScore(score);if(dailyMode&&Arcade.daily){var sec=Math.max(1,Math.round((Date.now()-startTs)/1000));Arcade.daily.markSolved('stepping-switch',sec)}setMsg('ok',fmt('gs.stepping-switch.done',{score:score}));againB.hidden=false;inEl.hidden=true;goB.hidden=true;return}
answered=false;inEl.value='';inEl.hidden=false;goB.hidden=false;upd();step.textContent=T('gs.stepping-switch.inputLbl');setMsg('','')}
function submit(){if(answered||finished||inEl.hidden)return;var ch=inEl.value.trim().toUpperCase();if(!ch||!/^[A-Z]$/.test(ch))return;
var isV=isVowel(ch);var out;
if(isV){out=V_PATH[vPos];vPos=(vPos+1)%V_PATH.length}else{out=C_PATH[cPos];cPos=(cPos+1)%C_PATH.length}
answered=true;renderPaths(ch);
var ok=true;/* 步进演示模式：总是正确（教学工具而非竞猜） */
streak++;score+=20+(streak-1)*5;if(Arcade.juice)Arcade.juice.win();
setMsg('ok',fmt('gs.stepping-switch.ok',{pts:'+'+(20+(streak-1)*5)})+' → '+out);
idx++;setTimeout(function(){renderPaths(ch);nextRound()},900)}
goB.addEventListener('click',submit);
inEl.addEventListener('keydown',function(e){if(e.key==='Enter')submit()});
againB.addEventListener('click',function(){idx=0;score=0;streak=0;finished=false;vPos=0;cPos=0;againB.hidden=true;inEl.hidden=false;goB.hidden=false;setMsg('','');upd();step.textContent=T('gs.stepping-switch.inputLbl')});
dailyBtn.addEventListener('click',function(){idx=0;score=0;streak=0;finished=false;vPos=0;cPos=0;dailyMode=true;startTs=Date.now();dailyBtn.hidden=true;againB.hidden=true;inEl.hidden=false;goB.hidden=false;setMsg('','');upd();step.textContent=T('gs.stepping-switch.inputLbl')});
window.GAME_RESTART=function(){idx=0;score=0;streak=0;finished=false;vPos=0;cPos=0;againB.hidden=true;inEl.hidden=false;goB.hidden=false;setMsg('','');upd();step.textContent=T('gs.stepping-switch.inputLbl')};
renderPaths('A');upd();step.textContent=T('gs.stepping-switch.inputLbl');
})();
