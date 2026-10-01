// Lightweight DOM harness for event/state integration. Real visual/browser QA is separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const levels=JSON.parse(await readFile(new URL('../dist/levels.json',import.meta.url),'utf8'));
class Node {
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.listeners={};this.hidden=false;this.disabled=false;this._text='';this._class='';this.style={setProperty:(k,v)=>this.style[k]=String(v)};this.classList={add:(...v)=>this._classes(v,[]),remove:(...v)=>this._classes([],v),toggle:(v,on)=>this._classes(on?[v]:[],on?[]:[v])};}
  _classes(add,remove){const classes=new Set(this._class.split(' ').filter(Boolean));remove.forEach(v=>classes.delete(v));add.forEach(v=>classes.add(v));this._class=[...classes].join(' ');}
  get className(){return this._class;} set className(v){this._class=v;}
  get textContent(){return this._text+this.children.map(n=>n.textContent).join('');} set textContent(v){this._text=String(v);this.children=[];}
  set innerHTML(v){this._text=v;this.children=[];} get innerHTML(){return this._text;}
  append(...nodes){for(const node of nodes){this.children.push(node);node.parent=this;}}
  replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
  setAttribute(k,v){this.attributes[k]=String(v);} getAttribute(k){return this.attributes[k]??null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  click(){if(!this.disabled)this.emit('click',{target:this});}
  emit(type,event={}){for(const fn of this.listeners[type]||[])fn(event);}
  focus(){document.activeElement=this;}
  showModal(){this.open=true;} close(){this.open=false;}
  closest(selector){let node=this;while(node){if(selector==='dialog'&&node.tagName==='DIALOG')return node;node=node.parent;}return null;}
}
function harness(){
  const ids=new Map(),body=new Node('body');
  const names=['board','sound-button','progress-label','live-status','move-display','undo-button','board-status','best-display','result','result-eyebrow','result-title','result-detail','next-button','level-track','level-number','level-title','hint-text','hint-button','level-list','reset-confirm','level-menu','restart-button','about-button','reset-button','cancel-reset','confirm-reset'];
  names.forEach(id=>{const el=new Node(id.includes('button')||id==='level-menu'?'button':'div');el.id=id;ids.set(id,el);body.append(el);});
  for(const id of ['level-dialog','about-dialog']){const dialog=new Node('dialog');dialog.id=id;ids.set(id,dialog);body.append(dialog);const close=new Node('button');close.dataset.close='';dialog.append(close);}
  const frame=new Node();frame.className='board-frame';body.append(frame);
  for(const d of ['U','D','L','R']){const b=new Node('button');b.dataset.direction=d;body.append(b);}
  const all=()=>{const flat=[];function walk(n){flat.push(n);n.children.forEach(walk);}walk(body);return flat;};
  const query=selector=>{
    if(selector.startsWith('#'))return ids.has(selector.slice(1))?[ids.get(selector.slice(1))]:[];
    return all().filter(n=>selector==='dialog'?n.tagName==='DIALOG':selector==='dialog[open]'?n.tagName==='DIALOG'&&n.open:selector==='[data-close]'?'close'in n.dataset:selector==='[data-direction]'?'direction'in n.dataset:selector.startsWith('[data-direction=')?n.dataset.direction===selector.match(/"(.*?)"/)[1]:selector.startsWith('[data-goal=')?n.dataset.goal===selector.match(/"(.*?)"/)[1]:selector==='.board-frame'?n.className.split(' ').includes('board-frame'):selector==='.dpad .pressed'?n.className.split(' ').includes('pressed'):false);
  };
  const doc={body,activeElement:body,hidden:false,querySelector:s=>query(s)[0]||null,querySelectorAll:query,createElement:tag=>new Node(tag),createTextNode:text=>{const n=new Node('#text');n.textContent=text;return n;},addEventListener:()=>{}};
  const mem=new Map(),win=new Node('window');win.localStorage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)};
  return {doc,win,ids,query,press:key=>win.emit('keydown',{key,preventDefault:()=>{}}),repeat:key=>win.emit('keydown',{key,repeat:true,preventDefault:()=>{}}),clickDirection:d=>query(`[data-direction="${d}"]`)[0].click(),moves:()=>Number(ids.get('move-display').textContent.split(' ')[0]),pos:signal=>{const token=all().find(n=>n.className.split(' ').includes('token')&&n.className.split(' ').includes(signal));return [Number(token.style['--x']),Number(token.style['--y'])];}};
}
test('app event flow: no-op, repeats, overlap, win, undo, restart, all levels, hints, dialogs and persistence',async()=>{
  const h=harness();globalThis.document=h.doc;globalThis.window=h.win;globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(levels)});
  await import('../dist/app.js?ui-integration');
  assert.equal(h.moves(),0);assert.equal(h.ids.get('sound-button').getAttribute('aria-pressed'),'false');
  h.press('ArrowLeft');assert.equal(h.moves(),0,'blocked input does not count');
  h.repeat('ArrowRight');assert.equal(h.moves(),0,'held-key repeats are ignored');
  h.press('ArrowRight');assert.equal(h.moves(),1);assert.deepEqual(h.pos('blue'),[2,2]);assert.deepEqual(h.pos('orange'),[2,2]);
  h.press('ArrowUp');assert.equal(h.moves(),2);assert.equal(h.ids.get('result').hidden,false);assert.equal(h.ids.get('best-display').textContent,'2수');
  h.press('ArrowDown');assert.equal(h.moves(),2,'movement after win is ignored');
  h.press('z');assert.equal(h.moves(),1);assert.equal(h.ids.get('result').hidden,true,'undo after win reopens play');
  h.press('r');assert.equal(h.moves(),0);assert.deepEqual(h.pos('blue'),levels[0].start.blue);
  h.ids.get('level-menu').click();h.press('ArrowRight');assert.equal(h.moves(),0,'modal blocks keyboard movement');
  h.ids.get('level-dialog').close();
  h.ids.get('hint-button').click();assert.equal(h.ids.get('hint-text').textContent,levels[0].hints[0]);h.ids.get('hint-button').click();assert.equal(h.ids.get('hint-text').textContent,levels[0].hints[1]);assert.equal(h.ids.get('hint-button').disabled,true);
  for(let i=0;i<levels.length;i++){
    h.ids.get('level-menu').click();h.ids.get('level-list').children[i].click();
    assert.equal(h.ids.get('hint-button').disabled,false,'hint resets on level change');
    for(const d of levels[i].solution)h.clickDirection(d);
    assert.equal(h.moves(),levels[i].solution.length);assert.equal(h.ids.get('result').hidden,false,`level ${i+1} wins via touch controls`);
    h.win.emit('blur');assert.equal(h.moves(),levels[i].solution.length,'focus loss does not advance play');
  }
  assert.equal(h.ids.get('result-title').textContent,'모든 신호가 연결됐어요');
  const saved=JSON.parse(h.win.localStorage.getItem('counterphase.progress.v1'));assert.equal(Object.keys(saved.records).length,5);assert.equal(saved.lastLevel,'05');
  h.ids.get('level-menu').click();h.ids.get('reset-button').click();h.ids.get('cancel-reset').click();assert.equal(h.ids.get('reset-confirm').hidden,true);assert.equal(Object.keys(JSON.parse(h.win.localStorage.getItem('counterphase.progress.v1')).records).length,5,'cancel preserves records');
});
