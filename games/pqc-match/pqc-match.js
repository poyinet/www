window.GAME_TUTORIAL_STEPS=[{t:T('gs.pqc-match.tut1t'),d:T('gs.pqc-match.tut1')},{t:T('gs.pqc-match.tut2t'),d:T('gs.pqc-match.tut2')},{t:T('gs.pqc-match.tut3t'),d:T('gs.pqc-match.tut3')}];
(function(){var root=document.getElementById('game-root');var TOTAL=5;
function fmt(k,v){var s=T(k);for(var k2 in(v||{}))s=s.split('{' +k2+'}').join(v[k2]);return s}
/* 配对数据：经典算法 → 后量子继任者 */
var PAIRS=[
 {c:'RSA',pq:'ML-KEM (FIPS 203)',type:'加密',expl:{zh:'RSA 基于大数分解，Shor 算法可破。ML-KEM（原 Kyber）基于格上 Module-LWE 难题，是 NIST 2024 年发布的首个后量子密钥封装标准（FIPS 203）。',en:'RSA relies on factoring, broken by Shor. ML-KEM (formerly Kyber) is based on Module-LWE over lattices — NIST\'s first PQ key-encapsulation standard (FIPS 203, 2024).'}},
 {c:'ECDSA',pq:'ML-DSA (FIPS 204)',type:'签名',expl:{zh:'ECDSA 基于椭圆曲线离散对数，Shor 算法可破。ML-DSA（原 Dilithium）基于格上 Module-LWE，是 NIST 首个后量子数字签名标准（FIPS 204）。',en:'ECDSA relies on elliptic-curve discrete log, broken by Shor. ML-DSA (formerly Dilithium) is based on Module-LWE — NIST\'s first PQ digital signature standard (FIPS 204, 2024).'}},
 {c:'DH',pq:'ML-KEM (FIPS 203)',type:'密钥交换',expl:{zh:'Diffie-Hellman 基于离散对数，Shor 算法可破。ML-KEM 提供后量子密钥封装，替代 DH 的密钥交换功能。',en:'Diffie-Hellman relies on discrete log, broken by Shor. ML-KEM provides PQ key encapsulation, replacing DH\'s key exchange role.'}},
 {c:'DSA',pq:'SLH-DSA (FIPS 205)',type:'签名',expl:{zh:'DSA 基于离散对数。SLH-DSA（原 SPHINCS+）基于哈希函数安全性——不依赖数论难题，天然抗量子，但签名体积大。',en:'DSA relies on discrete log. SLH-DSA (formerly SPHINCS+) relies only on hash security — no number-theoretic assumptions, naturally quantum-resistant, but with large signatures.'}},
 {c:'ECDH',pq:'ML-KEM (FIPS 203)',type:'密钥交换',expl:{zh:'ECDH 基于椭圆曲线离散对数，Shor 算法可破。ML-KEM 是其后量子继任者，已入选 TLS 1.3 混合密钥交换。',en:'ECDH relies on elliptic-curve discrete log, broken by Shor. ML-KEM is its PQ successor, already in TLS 1.3 hybrid key exchange.'}},
];
var w=document.createElement('div');w.className='pq-wrap';
w.innerHTML='<div class="pq-prog" id="pq-prog"></div><div class="pq-q" id="pq-q"></div><div class="pq-btns" id="pq-opts"></div><div class="pq-msg" id="pq-msg"></div><div class="pq-explain" id="pq-explain"></div><div class="pq-btns"><button class="btn green" id="pq-next" hidden></button></div><div class="pq-btns"><button class="btn" id="pq-daily">'+T('gs.pqc-match.dailyBtn')+'</button></div><div class="pq-help">'+T('gs.pqc-match.helpText')+'</div>';
root.appendChild(w);
var $=function(id){return w.querySelector('#'+id)};
var progEl=$('pq-prog'),qEl=$('pq-q'),optsEl=$('pq-opts'),msgEl=$('pq-msg'),explEl=$('pq-explain'),nextB=$('pq-next'),dailyBtn=$('pq-daily');
function daySeed(){var d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
function mulberry(seed){var s=Math.abs(Math.floor(seed))%2147483647;if(s<=0)s+=2147483646;return function(){s=s*16807%2147483647;return(s-1)/2147483646}}
var idx=0,score=0,streak=0,answered=false,finished=false,cur=null,order=[],dailyMode=false,startTs=0,rnd=Math.random;
function isEn(){return window.Arcade&&Arcade.i18n&&Arcade.i18n.getLang()==='en'}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function startGame(daily){idx=0;score=0;streak=0;finished=false;dailyMode=!!daily;if(dailyMode){startTs=Date.now();rnd=mulberry(daySeed()*31+13)}else rnd=Math.random;dailyBtn.hidden=dailyMode;order=shuffle([0,1,2,3,4]);nextQ()}
function nextQ(){if(idx>=TOTAL){finished=true;if(Arcade.shell)Arcade.shell.submitScore(score);if(dailyMode&&Arcade.daily){var sec=Math.max(1,Math.round((Date.now()-startTs)/1000));Arcade.daily.markSolved('pqc-match',sec)}setMsg('ok',fmt('gs.pqc-match.done',{score:score}));nextB.textContent=T('gs.pqc-match.againBtn');nextB.hidden=false;nextB.onclick=function(){startGame(false)};upd();return}
answered=false;cur=PAIRS[order[idx]];upd();
qEl.innerHTML=fmt('gs.pqc-match.qText',{algo:'<b>'+cur.c+'</b>'})+' <small style="color:var(--text-dim)">('+cur.type+')</small>';
/* 生成选项：正确+3 随机干扰 */
var allPQ=PAIRS.map(function(p){return p.pq});
var opts=[{t:cur.pq,ok:true}];
var pool=allPQ.filter(function(x){return x!==cur.pq});
while(opts.length<4&&pool.length){var c=pool.splice(Math.floor(rnd()*pool.length),1)[0];if(!opts.some(function(o){return o.t===c}))opts.push({t:c,ok:false});}
shuffle(opts);
optsEl.innerHTML='';
opts.forEach(function(o){var b=document.createElement('button');b.className='btn accent';b.style.fontFamily='var(--font-mono)';b.textContent=o.t;b.addEventListener('click',function(){judge(o.ok,o.t)});optsEl.appendChild(b)});
setMsg('','')}
function judge(ok,chosen){if(answered||finished)return;answered=true;
if(ok){streak++;score+=20+(streak-1)*5;if(Arcade.juice)Arcade.juice.win();setMsg('ok',fmt('gs.pqc-match.ok',{pts:'+'+(20+(streak-1)*5)}))}
else{streak=0;if(Arcade.juice)Arcade.juice.lose();setMsg('no',T('gs.pqc-match.retry'))}
explEl.innerHTML='<b>'+T('gs.pqc-match.explainTitle')+'</b>'+cur.expl[isEn()?'en':'zh'];explEl.classList.add('on');
idx++;setTimeout(function(){explEl.classList.remove('on');nextQ()},1800)}
function setMsg(c,t){msgEl.className='pq-msg '+c;msgEl.textContent=t}
function upd(){progEl.textContent=fmt('gs.pqc-match.round',{n:Math.min(idx+1,TOTAL),total:TOTAL,streak:streak})}
function fmt(k,v){var s=T(k);for(var k2 in(v||{}))s=s.split('{'+k2+'}').join(v[k2]);return s}
window.GAME_RESTART=function(){startGame(false)};dailyBtn.addEventListener('click',function(){startGame(true)});startGame(false);
})();
