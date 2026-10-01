import {copy,isWon,move,same,validateLevel} from './engine.js';
import {emptyProgress,readProgress,recordWin,writeProgress} from './storage.js';

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const feedbackTimers=new Map();
const arrows={U:'↑',D:'↓',L:'←',R:'→'};
const keyDirections={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',w:'U',s:'D',a:'L',d:'R'};
let levels=[],progress,levelIndex=0,state,history=[],hintStep=0,won=false,audioContext,storage;
try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Storage unavailable');}};}
const board=$('#board');
const blueToken=document.createElement('div');blueToken.className='token blue';blueToken.innerHTML='<span class="shape"></span>';blueToken.setAttribute('aria-hidden','true');
const orangeToken=document.createElement('div');orangeToken.className='token orange';orangeToken.innerHTML='<span class="shape"></span>';orangeToken.setAttribute('aria-hidden','true');
const level=()=>levels[levelIndex];
function announce(text){$('#live-status').textContent=text;}
function save(){if(!writeProgress(storage,progress))$('#progress-label').title='이 브라우저에서는 기록 저장을 사용할 수 없어요';}
function setSoundButton(){const button=$('#sound-button');button.setAttribute('aria-pressed',String(progress.sound));button.setAttribute('aria-label',progress.sound?'소리 끄기':'소리 켜기');button.title=progress.sound?'소리 끄기':'소리 켜기';}
function playSound(kind='move'){
  if(!progress.sound)return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    audioContext??=new AC();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
    const notes=kind==='win'?[392,523.25,659.25]:kind==='undo'?[250]:kind==='blocked'?[130]:[330,440];
    const start=audioContext.currentTime;
    notes.forEach((frequency,i)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;const at=start+i*(kind==='win'?.1:.035);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.065,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+.12);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(at);oscillator.stop(at+.14);});
  }catch{/* Audio is a progressive enhancement. */}
}
function drawBoard(){
  const l=level();board.replaceChildren();board.style.setProperty('--cols',l.grid[0].length);board.style.setProperty('--rows',l.grid.length);board.style.aspectRatio=`${l.grid[0].length} / ${l.grid.length}`;
  l.grid.forEach((row,y)=>[...row].forEach((type,x)=>{
    const cell=document.createElement('div');cell.className=`cell${type==='#'?' wall':''}`;cell.setAttribute('aria-hidden','true');
    for(const signal of ['blue','orange'])if(same([x,y],l.goals[signal])){const goal=document.createElement('span');goal.className=`goal ${signal}`;goal.dataset.goal=signal;cell.append(goal);}
    board.append(cell);
  }));
  board.append(blueToken,orangeToken);
}
function drawTrack(){
  const track=$('#level-track');track.replaceChildren();
  levels.forEach((l,i)=>{const button=document.createElement('button');button.className='track-button'+(i===levelIndex?' current':'')+(progress.records[l.id]?' completed':'');button.setAttribute('aria-label',`${i+1}단계 ${l.title}${progress.records[l.id]?', 완료':''}`);if(i===levelIndex)button.setAttribute('aria-current','step');button.addEventListener('click',()=>loadLevel(i));track.append(button);});
}
function render(){
  const l=level();won=isWon(l,state);const overlap=same(state.blue,state.orange);
  for(const [signal,token]of[['blue',blueToken],['orange',orangeToken]]){token.style.setProperty('--x',state[signal][0]);token.style.setProperty('--y',state[signal][1]);token.classList.toggle('overlap',overlap);$(`[data-goal="${signal}"]`).classList.toggle('arrived',same(state[signal],l.goals[signal]));}
  $('#move-display').replaceChildren(document.createTextNode(String(history.length).padStart(2,'0')+' '));const small=document.createElement('small');small.textContent='MOVES';$('#move-display').append(small);
  $('#undo-button').disabled=!history.length;
  $('#board-status').textContent=won?'두 신호가 연결됐어요':'두 신호를 연결하세요';$('.board-frame').classList.toggle('won',won);
  $('#best-display').textContent=progress.records[l.id]?`${progress.records[l.id].best}수`:'—';
  $('#result').hidden=!won;
  if(won){
    const final=levelIndex===levels.length-1,completed=levels.filter(x=>progress.records[x.id]).length,all=completed===levels.length;
    $('#result-eyebrow').textContent=all?'ALL SIGNALS ALIGNED':'SIGNALS ALIGNED';
    $('#result-title').textContent=all?'모든 신호가 연결됐어요':'두 신호가 연결됐어요';
    $('#result-detail').textContent=`${history.length}수로 완료 · ${completed} / ${levels.length} 연결`;
    $('#next-button').innerHTML=final?'단계 돌아보기 <span aria-hidden="true">↗</span>':'다음 신호 <span aria-hidden="true">→</span>';
  }
  board.setAttribute('aria-label',`${levelIndex+1}단계 ${l.title}. ${l.grid[0].length}칸 가로, ${l.grid.length}칸 세로. 파랑 ${state.blue[0]+1}열 ${state.blue[1]+1}행, 목표 ${l.goals.blue[0]+1}열 ${l.goals.blue[1]+1}행. 주황 ${state.orange[0]+1}열 ${state.orange[1]+1}행, 목표 ${l.goals.orange[0]+1}열 ${l.goals.orange[1]+1}행. ${history.length}수.`);
}
function loadLevel(index){
  if(!Number.isInteger(index)||index<0||index>=levels.length)return;
  levelIndex=index;state=copy(level().start);history=[];hintStep=0;won=false;
  progress.lastLevel=level().id;save();
  $('#level-number').textContent=String(index+1).padStart(2,'0');$('#level-title').textContent=level().title;
  $('#hint-text').hidden=true;$('#hint-text').textContent='';$('#hint-button').innerHTML='힌트 보기 <span aria-hidden="true">+</span>';$('#hint-button').disabled=false;
  drawBoard();render();drawTrack();announce(`${index+1}단계 ${level().title}. 파랑은 입력 방향, 주황은 반대로 움직여요.`);
}
function direction(d){
  if(!state||won||$$('dialog[open]').length)return;
  const result=move(level(),state,d);
  const button=$(`[data-direction="${d}"]`);button.classList.remove('pressed');void button.offsetWidth;button.classList.add('pressed');clearTimeout(feedbackTimers.get(button));feedbackTimers.set(button,setTimeout(()=>{button.classList.remove('pressed');feedbackTimers.delete(button);},120));
  if(!result.changed){board.classList.remove('blocked');void board.offsetWidth;board.classList.add('blocked');announce('두 신호가 벽에 막혀 있어요. 이동 횟수는 그대로예요.');playSound('blocked');return;}
  history.push(copy(state));state=result.state;
  const win=isWon(level(),state);
  if(win){recordWin(progress,level(),history.length);save();drawTrack();}
  render();playSound(win?'win':'move');
  announce(win?`${level().title} 완료. ${history.length}수. 다음 신호 버튼으로 계속할 수 있어요.`:`${arrows[d]} ${history.length}수. 파랑 ${state.blue[0]+1}열 ${state.blue[1]+1}행, 주황 ${state.orange[0]+1}열 ${state.orange[1]+1}행.`);
}
function undo(){if(!history.length||$$('dialog[open]').length)return;state=history.pop();render();playSound('undo');announce(`한 수 되돌렸어요. ${history.length}수.`);}
function openLevels(){
  const list=$('#level-list');list.replaceChildren();
  levels.forEach((l,i)=>{const button=document.createElement('button');button.className='level-choice'+(i===levelIndex?' current':'');const number=document.createElement('span');number.className='choice-number';number.textContent=String(i+1).padStart(2,'0');const title=document.createElement('span');title.className='choice-title';title.textContent=l.title;const record=document.createElement('span');record.className='choice-record'+(progress.records[l.id]?'':' empty');record.textContent=progress.records[l.id]?`✓ ${progress.records[l.id].best}수`:'미완료';button.append(number,title,record);button.addEventListener('click',()=>{$('#level-dialog').close();loadLevel(i);$('#level-menu').focus();});list.append(button);});
  $('#progress-label').textContent=`${levels.filter(l=>progress.records[l.id]).length} / ${levels.length} 완료`;
  $('#reset-confirm').hidden=true;$('#level-dialog').showModal();
}
function init(){
  progress=readProgress(storage,levels);setSoundButton();
  $$('[data-direction]').forEach(button=>button.addEventListener('click',()=>direction(button.dataset.direction)));
  $('#undo-button').addEventListener('click',undo);
  $('#restart-button').addEventListener('click',()=>loadLevel(levelIndex));
  $('#level-menu').addEventListener('click',openLevels);
  $('#next-button').addEventListener('click',()=>{if(levelIndex===levels.length-1)openLevels();else loadLevel(levelIndex+1);});
  $('#sound-button').addEventListener('click',()=>{progress.sound=!progress.sound;setSoundButton();save();playSound();});
  $('#hint-button').addEventListener('click',()=>{if(hintStep>=2)return;$('#hint-text').textContent=level().hints[hintStep];$('#hint-text').hidden=false;hintStep++;$('#hint-button').innerHTML=hintStep===1?'더 자세히 <span aria-hidden="true">+</span>':'힌트 2 / 2';$('#hint-button').disabled=hintStep===2;announce($('#hint-text').textContent);});
  $('#about-button').addEventListener('click',()=>$('#about-dialog').showModal());
  $$('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  $$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}}));
  $('#reset-button').addEventListener('click',()=>{$('#reset-confirm').hidden=false;$('#cancel-reset').focus();});
  $('#cancel-reset').addEventListener('click',()=>{$('#reset-confirm').hidden=true;$('#reset-button').focus();});
  $('#confirm-reset').addEventListener('click',()=>{const sound=progress.sound;progress=emptyProgress();progress.sound=sound;save();$('#level-dialog').close();loadLevel(0);openLevels();announce('이 브라우저의 완료 기록과 최고 기록을 초기화했어요.');});
  window.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing||$$('dialog[open]').length)return;
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(keyDirections[key]){event.preventDefault();if(!event.repeat)direction(keyDirections[key]);}
    else if(key==='z'||key==='r'){event.preventDefault();if(!event.repeat){if(key==='z')undo();else loadLevel(levelIndex);}}
  });
  // There is no held-key loop: releasing focus cannot leave movement running.
  window.addEventListener('blur',()=>$$('.dpad .pressed').forEach(b=>b.classList.remove('pressed')));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)$$('.dpad .pressed').forEach(b=>b.classList.remove('pressed'));});
  loadLevel(Math.max(0,levels.findIndex(l=>l.id===progress.lastLevel)));
}
try{
  const response=await fetch('./levels.json');if(!response.ok)throw Error('Level loading failed');
  levels=await response.json();if(!Array.isArray(levels)||levels.length!==5||new Set(levels.map(l=>l.id)).size!==levels.length)throw Error('Five unique levels required');levels.forEach(validateLevel);init();
}catch(error){
  console.error('Counterphase could not start:',error);
  const message=document.createElement('p');message.className='load-error';message.setAttribute('role','alert');message.textContent='퍼즐을 불러오지 못했어요. 페이지를 새로고침해 주세요. 로컬 실행 중이라면 npm run dev로 서버를 열어 주세요.';document.body.append(message);
}
