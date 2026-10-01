import {fingerprint} from './engine.js';
export const STORAGE_KEY='counterphase.progress.v1';
export function emptyProgress(){return {version:1,lastLevel:'01',records:{},sound:false};}
export function readProgress(storage,levels){
  const clean=emptyProgress();
  try{
    const raw=JSON.parse(storage.getItem(STORAGE_KEY));
    if(raw?.version!==1)return clean;
    if(levels.some(l=>l.id===raw.lastLevel))clean.lastLevel=raw.lastLevel;
    clean.sound=raw.sound===true;
    for(const level of levels){const r=raw.records?.[level.id];if(r?.fingerprint===fingerprint(level)&&Number.isSafeInteger(r.best)&&r.best>0)clean.records[level.id]={best:r.best,fingerprint:r.fingerprint};}
  }catch{/* Storage is optional. Private mode, bad JSON, and old versions start clean. */}
  return clean;
}
export function writeProgress(storage,progress){try{storage.setItem(STORAGE_KEY,JSON.stringify(progress));return true;}catch{return false;}}
export function recordWin(progress,level,moves){
  if(!Number.isSafeInteger(moves)||moves<1)return;
  const old=progress.records[level.id];
  if(!old||old.fingerprint!==fingerprint(level)||moves<old.best)progress.records[level.id]={best:moves,fingerprint:fingerprint(level)};
}
