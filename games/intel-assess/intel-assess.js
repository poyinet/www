window.GAME_TUTORIAL_STEPS=[{t:T('gs.ia.tut1t'),d:T('gs.ia.tut1')},{t:T('gs.ia.tut2t'),d:T('gs.ia.tut2')},{t:T('gs.ia.tut3t'),d:T('gs.ia.tut3')}];
(function(){var root=document.getElementById('game-root');var TOTAL=8;
function fmt(k,v){var s=T(k);for(var k2 in(v||{}))s=s.split('{'+k2+'}').join(v[k2]);return s}
function isEn(){return window.Arcade&&Arcade.i18n&&Arcade.i18n.getLang()==='en'}
/* 案例库（教学虚构）：real=true 为可信情报 */
var CASES=[
 {real:true,src:'HYPO Station · Pearl Harbor',subj:{zh:'日军舰队集结：多个代号指向目标',en:'IJN fleet massing: multiple codenames point to target'},body:{zh:'过去 72 小时截获的电报显示，日军航母编队在北太平洋集结。多个来源交叉确认——建议加强警戒。',en:'Intercepts from the past 72 hours show IJN carrier forces massing in the North Pacific. Multiple sources cross-confirm — recommend heightened alert.'},clues:{zh:['多来源交叉验证','与已知日军动向一致','来源可靠（HYPO 站）'],en:['Multiple source cross-verification','Consistent with known IJN movements','Reliable source (HYPO station)']}},
 {real:false,src:'anon@unverified-channel',subj:{zh:'【独家】敌军司令部位置完全暴露',en:'[EXCLUSIVE] Enemy HQ location fully exposed'},body:{zh:'匿名来源声称掌握了敌军司令部的精确坐标，但拒绝提供任何验证方式。催促立即行动，否则"来不及了"。',en:'Anonymous source claims precise enemy HQ coordinates but refuses any verification. Urges immediate action or "it will be too late".'},clues:{zh:['匿名来源无验证','催促立即行动（制造紧迫感）','拒绝提供任何佐证'],en:['Anonymous, no verification','Urgency pressure tactic','Refuses to provide evidence']}},
 {real:true,src:'CAST Station · Corregidor',subj:{zh:'JN-25 加表变更：预计影响 72 小时',en:'JN-25 additive change: ~72hr impact expected'},body:{zh:'截获的日军通信显示加表即将更换。预计 72 小时内破译能力暂时下降，建议在此期间优先依赖其他情报来源。',en:'Intercepted IJN comms indicate an additive table change. Expect temporary decryption degradation for ~72hrs; recommend relying on other sources meanwhile.'},clues:{zh:['来源可靠（CAST 站）','信息与已知程序一致','提供了合理的时间框架'],en:['Reliable source (CAST station)','Consistent with known procedures','Provides reasonable timeframe']}},
 {real:false,src:'double-agent-codename-GARBO',subj:{zh:'德军确信盟军将在加莱登陆',en:'Germans convinced Allies will land at Calais'},body:{zh:'我方在德军内部的线人报告称，德军最高统帅部确信盟军将在加莱而非诺曼底登陆。请利用此信息制定欺骗计划。',en:'Our asset inside German HQ reports they are convinced the Allies will land at Calais, not Normandy. Use this for deception planning.'},clues:{zh:['这是我们的双重间谍（GARBO）','信息来源可控且已验证','这是盟军坚忍行动的一部分'],en:['This is OUR double agent (GARBO)','Source is controlled and verified','Part of Operation Fortitude deception']}},
 {real:false,src:'intercept-fragment-partial',subj:{zh:'截获电报片段：提及"珍珠港"',en:'Intercept fragment: mentions "Pearl Harbor"'},body:{zh:'截获的日军外交电报片段中出现"珍珠港"字样，但上下文不完整——可能指外交会谈地点而非军事目标。',en:'A fragment of Japanese diplomatic traffic mentions "Pearl Harbor" but context is incomplete — may refer to a diplomatic venue, not a military target.'},clues:{zh:['电报片段不完整','缺乏军事语境','可能指外交会谈而非攻击目标'],en:['Fragment is incomplete','No military context','May refer to diplomatic talks, not attack']}},
 {real:true,src:'FRUMEL · Melbourne',subj:{zh:'日军油轮航线确认：前往荷属东印度',en:'IJN tanker route confirmed: heading to Dutch East Indies'},body:{zh:'密码破译与交通分析确认日军油轮航线。油料补给线是日军的战略弱点——建议潜艇部队在标记位置设伏。',en:'Crypto and traffic analysis confirm IJN tanker routes. The fuel supply line is a strategic weakness — recommend submarine ambush at marked positions.'},clues:{zh:['多日连续追踪一致','来源可靠（FRUMEL）','建议有明确的战术价值'],en:['Consistent multi-day tracking','Reliable source (FRUMEL)','Recommendation has clear tactical value']}},
 {real:false,src:'broadcast-intercept-tokyo',subj:{zh:'东京广播：帝国海军"无敌"，敌军恐慌',en:'Tokyo broadcast: IJN "invincible", enemy panicking'},body:{zh:'东京电台广播称帝国海军"不可战胜"，盟军"士气崩溃"。分析：这是宣传广播，非军事情报——不应纳入作战评估。',en:'Tokyo radio claims the IJN is "invincible" and Allied morale is "collapsing". Analysis: this is propaganda, not military intelligence — exclude from operational assessment.'},clues:{zh:['公开广播而非加密通信','内容为宣传鼓动','无具体可操作信息'],en:['Public broadcast, not encrypted comms','Content is propaganda/morale','No actionable intelligence']}},
 {real:true,src:'OP-20-G · Washington',subj:{zh:'外交密电：东京指示使馆销毁密码本',en:'Diplomatic cable: Tokyo orders embassy to burn codebooks'},body:{zh:'截获东京致各使馆的电报：指示销毁密码本与机密文件——这通常意味着战争即将爆发。建议全球美军进入最高警戒。',en:'Cable from Tokyo to all embassies: destroy codebooks and confidential documents — this usually means war is imminent. Recommend maximum alert worldwide.'},clues:{zh:['销毁密码本=战争前兆','来源可靠（OP-20-G）','历史验证：此信号高度准确'],en:['Burning codebooks = war imminent','Reliable source (OP-20-G)','Historically verified: this signal is highly accurate']}},
];
var wrap=document.createElement('div');wrap.className='ia-wrap';
wrap.innerHTML='<div class="ia-prog" id="ia-prog"></div><div class="ia-card" id="ia-card"></div><div class="ia-btns"><button class="btn accent" id="ia-trust"></button><button class="btn pink" id="ia-doubt"></button></div><div class="ia-msg" id="ia-msg"></div><div class="ia-clues" id="ia-clues"></div><div class="ia-btnrow"><button class="btn green" id="ia-next" hidden></button></div><div class="ia-help">'+T('gs.ia.helpText')+'</div>';
root.appendChild(wrap);
var $=function(id){return wrap.querySelector('#'+id)};
var progEl=$('ia-prog'),cardEl=$('ia-card'),msgEl=$('ia-msg'),clueBox=$('ia-clues'),nextB=$('ia-next');
$('ia-trust').textContent=T('gs.ia.trustBtn');$('ia-doubt').textContent=T('gs.ia.doubtBtn');
var idx=0,score=0,streak=0,answered=false,finished=false,order=[];
function upd(){progEl.textContent=fmt('gs.ia.round',{n:Math.min(idx+1,TOTAL),total:TOTAL,streak:streak})}
function setMsg(c,t){msgEl.className='ia-msg '+c;msgEl.textContent=t}
function render(c){if(!c||!c.subj||!c.body)return;var lang=isEn()?'en':'zh';cardEl.innerHTML='<div class="ia-src">📡 '+c.src+'</div><div class="ia-subj">'+c.subj[lang]+'</div><div class="ia-body">'+c.body[lang]+'</div>'}
function showClues(c){if(!c||!c.clues)return;var list=c.clues[isEn()?'en':'zh'];var h='<b>'+T('gs.ia.clues')+'</b><br>';for(var i=0;i<list.length;i++)h+='· '+list[i]+'<br>';clueBox.innerHTML=h;clueBox.classList.add('on')}
function judge(trust){if(answered||finished)return;answered=true;var c=order[idx];var ok=trust===c.real;
if(ok){streak++;score+=20+(streak-1)*5;if(Arcade.juice)Arcade.juice.win();setMsg('ok',fmt('gs.ia.ok',{pts:'+'+(20+(streak-1)*5)}))}
else{streak=0;if(Arcade.juice)Arcade.juice.lose();setMsg('no',T('gs.ia.no'))}
showClues(c);setTimeout(nextQ,1800)}
function nextQ(){idx++;answered=false;clueBox.classList.remove('on');
if(idx>=TOTAL||idx>=order.length){finished=true;if(Arcade.shell)Arcade.shell.submitScore(score);setMsg('ok',fmt('gs.ia.done',{score:score}));nextB.textContent=T('gs.ia.againBtn');nextB.hidden=false;return}
upd();render(order[idx])}
function startGame(daily){idx=0;score=0;streak=0;finished=false;nextB.hidden=true;
var arr=[];for(var i=0;i<CASES.length;i++)arr.push(i);
for(i=arr.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t}
order=arr.slice(0,TOTAL);nextQ()}
$('ia-trust').addEventListener('click',function(){judge(true)});
$('ia-doubt').addEventListener('click',function(){judge(false)});
nextB.addEventListener('click',function(){startGame(false)});
window.GAME_RESTART=function(){startGame(false)};startGame();
})();
