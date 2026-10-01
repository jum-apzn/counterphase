export const DIRECTIONS=Object.freeze({U:[0,-1],D:[0,1],L:[-1,0],R:[1,0]});
export const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
export const key=s=>`${s.blue.join(',')}|${s.orange.join(',')}`;
export const copy=s=>({blue:[...s.blue],orange:[...s.orange]});
export function isOpen(level,[x,y]){return level.grid[y]?.[x]==='.';}
export function move(level,state,direction){
  const delta=DIRECTIONS[direction];
  if(!delta) throw new Error('Unknown direction');
  const destination=(p,sign)=>{const q=[p[0]+delta[0]*sign,p[1]+delta[1]*sign];return isOpen(level,q)?q:[...p];};
  const next={blue:destination(state.blue,1),orange:destination(state.orange,-1)};
  return {state:next,changed:key(next)!==key(state)};
}
export const isWon=(level,state)=>same(state.blue,level.goals.blue)&&same(state.orange,level.goals.orange);
export function solve(level,from=level.start){
  const queue=[{state:copy(from),path:[]}],seen=new Set([key(from)]);
  for(let i=0;i<queue.length;i++){
    const {state,path}=queue[i];if(isWon(level,state))return path;
    for(const direction of Object.keys(DIRECTIONS)){
      const result=move(level,state,direction),k=key(result.state);
      if(result.changed&&!seen.has(k)){seen.add(k);queue.push({state:result.state,path:[...path,direction]});}
    }
  }
  return null;
}
export function validateLevel(level){
  if(!level||typeof level.id!=='string'||!level.id||typeof level.title!=='string')throw new Error('Invalid level identity');
  if(!Array.isArray(level.grid)||level.grid.length<3||level.grid.length>7)throw new Error('Invalid grid height');
  const width=level.grid[0]?.length;
  if(width<3||width>7||level.grid.some(row=>typeof row!=='string'||row.length!==width||!/^[#.]+$/.test(row)))throw new Error('Invalid grid');
  for(const group of ['start','goals'])for(const signal of ['blue','orange']){
    const p=level[group]?.[signal];
    if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||!isOpen(level,p))throw new Error('Invalid signal position');
  }
  if(isWon(level,level.start))throw new Error('Level is already solved');
  if(!Array.isArray(level.hints)||level.hints.length!==2||level.hints.some(h=>typeof h!=='string'||!h.trim()))throw new Error('Two hints required');
  if(!Array.isArray(level.solution)||!level.solution.length)throw new Error('Solution required');
  let state=copy(level.start);
  for(const d of level.solution){const result=move(level,state,d);if(!result.changed)throw new Error('Solution has a no-op');state=result.state;}
  if(!isWon(level,state))throw new Error('Solution does not win');
  return true;
}
export function fingerprint(level){return JSON.stringify({grid:level.grid,start:level.start,goals:level.goals});}
