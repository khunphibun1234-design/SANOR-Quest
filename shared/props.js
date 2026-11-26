/* SANOR QUEST · shared scenery kit for 3D worlds (written in the layout API of shared/sq-three.js).
 *   const K = SQProps(engine)            K.finish() closes a static batch; K.render(t) draws all static batches
 *   K.ground(), K.fence({gate}), K.tree(x,z,s), K.building({...}), K.stall({...}), K.bench(x,z,ry), K.lamp(x,z),
 *   K.water(x,z,w,d), K.rock(x,z,s), K.planter(x,z), K.sign(x,z,color), K.crowdMesh(shirt) …
 * Every solid prop adds itself to K.colliders, so shared navigation (home/nav.js) walks around it.
 * The walkable area is x −9.25…9.25, z −8.5…8.5 (the same as Maps 01–02). */
(function(root){'use strict';
root.SQProps=function(e){
 const {box:B,cylinder:C,ellipsoid:S,mesh:M,draw:D,model,tri}=e,objects=[],water=[],colliders=[];
 const solid=(x,z,w,d)=>colliders.push({x,z,w,d}),finish=()=>objects.push(M()),finishWater=()=>water.push(M());
 const K={B,C,S,M,D,model,tri,colliders,solid,finish,finishWater,
  ground(grass='#a9bf8b',soil='#c9bd98'){B(0,-.5,0,21,.8,19,soil);B(0,-.06,0,21,.15,19,grass);},
  paving(x,z,w,d,col='#e9dfc5'){B(x,.04,z,w,.06,d,col);},
  fence({gateFront=true,color='#f5e9ce'}={}){for(let x=-9.6;x<=9.6;x+=.8)if(!gateFront||Math.abs(x)>1.5)B(x,.58,8.9,.12,1.2,.13,color);
   for(const x of [-5.6,5.6])B(x,.7,8.9,8,.1,.13,color);
   for(const x of [-9.7,9.7]){for(let z=-8.6;z<9;z+=.85)B(x,.58,z,.12,1.2,.12,color);B(x,.72,0,.12,.1,17.6,color);}
   for(let x=-9.6;x<=9.6;x+=.85)B(x,.58,-9,.12,1.2,.12,color);B(0,.72,-9,19.4,.1,.12,color);},
  tree(x,z,s=1,leaf='#83a77b'){C(x,1.35*s,z,.17*s,.13*s,2.7*s,'#a48661',7);S(x,3*s,z,1.1*s,1.4*s,1.1*s,leaf,8,5);S(x-.6*s,2.6*s,z+.3*s,.8*s,1*s,.8*s,'#99b789',7,4);solid(x,z,.6,.6);},
  palm(x,z,s=1){C(x,1.6*s,z,.12*s,.16*s,3.2*s,'#9c7858',7);for(let i=0;i<6;i++){const a=i*1.047;S(x+Math.cos(a)*.8*s,3.2*s,z+Math.sin(a)*.8*s,.9*s,.12*s,.3*s,'#6f9e5e',6,3);}solid(x,z,.5,.5);},
  // face: +1 = doors/windows on the +x side, −1 on the −x side; or faceZ: +1/−1 for the ±z side
  building({x,z,w,d,h,wall='#f4e3bd',roof='#6f8f86',face=0,faceZ=0,windows=3,door='#6b8c7f',pitched=false}){B(x,h/2,z,w,h,d,wall);
   if(pitched){const r=h+.05;tri([x-w/2-.2,r,z-d/2-.2],[x+w/2+.2,r,z-d/2-.2],[x,r+1.1,z-d/2-.2],roof);tri([x-w/2-.2,r,z+d/2+.2],[x,r+1.1,z+d/2+.2],[x+w/2+.2,r,z+d/2+.2],roof);
    tri([x-w/2-.2,r,z-d/2-.2],[x,r+1.1,z-d/2-.2],[x,r+1.1,z+d/2+.2],roof);tri([x-w/2-.2,r,z-d/2-.2],[x,r+1.1,z+d/2+.2],[x-w/2-.2,r,z+d/2+.2],roof);
    tri([x+w/2+.2,r,z-d/2-.2],[x+w/2+.2,r,z+d/2+.2],[x,r+1.1,z+d/2+.2],roof);tri([x+w/2+.2,r,z-d/2-.2],[x,r+1.1,z+d/2+.2],[x,r+1.1,z-d/2-.2],roof);}
   else B(x,h+.12,z,w+.3,.24,d+.3,roof);
   if(face){const fx=x+face*(w/2+.02);for(let i=0;i<windows;i++){const wz=z-d/2+.7+i*(d-1.4)/Math.max(1,windows-1);if(Math.abs(wz-z)<.45)continue;B(fx,h*.62,wz,.05,.7,.55,'#a9d3d6');}B(fx,.75,z,.06,1.5,.8,door);}
   if(faceZ){const fz=z+faceZ*(d/2+.02);for(let i=0;i<windows;i++){const wx=x-w/2+.7+i*(w-1.4)/Math.max(1,windows-1);if(Math.abs(wx-x)<.45)continue;B(wx,h*.62,fz,.55,.7,.05,'#a9d3d6');}B(x,.75,fz,.8,1.5,.06,door);}
   solid(x,z,w,d);},
  stall({x,z,w=1.8,d=1.2,awning=['#e9806e','#f6f3ea'],goods=['#f2c14e','#e9806e','#7aa66e'],ry=0}){B(x,.5,z,w,1,d,'#c19a70');B(x,1.02,z,w+.1,.06,d+.1,'#e5cda5');
   for(const sx of [-1,1])for(const sz of [-1,1])B(x+sx*(w/2-.06),1.4,z+sz*(d/2-.06),.08,2.8,.08,'#8e7052');
   const n=6;for(let i=0;i<n;i++)B(x-w/2+(i+.5)*w/n,2.82,z,w/n,.08,d+.4,awning[i%awning.length]);
   goods.forEach((g,i)=>S(x-w/3+i*w/3,1.17,z,.16,.12,.16,g,8,5));solid(x,z,w,d);},
  table(x,z,col='#c19a70'){B(x,.72,z,1.0,.08,1.0,col);B(x,.36,z,.12,.72,.12,'#8e7052');for(const dx of [-.75,.75])B(x+dx,.42,z,.3,.08,.9,'#a78462');solid(x,z,1.8,1.1);},
  bench(x,z,ry=0){B(x,.42,z,1.4,.08,.45,'#c19a70',ry);B(x,.2,z,.12,.4,.4,'#8e7052',ry);solid(x,z,1.4,.5);},
  lamp(x,z,col='#fff1b8'){C(x,1.4,z,.05,.05,2.8,'#5b6168',6);S(x,2.9,z,.18,.18,.18,col,8,5);solid(x,z,.3,.3);},
  planter(x,z,leaf='#7aa66e'){B(x,.25,z,.9,.5,.9,'#b99571');S(x,.75,z,.42,.35,.42,leaf,7,4);solid(x,z,.9,.9);},
  rock(x,z,s=1,col='#8f8a7d'){S(x,.25*s,z,.7*s,.45*s,.6*s,col,7,4);S(x+.35*s,.2*s,z+.2*s,.4*s,.3*s,.35*s,'#a19b8d',6,3);},
  sign(x,z,col='#356f53',ry=0){C(x,.9,z,.05,.05,1.8,'#6d6a60',6);B(x,1.85,z,1.1,.5,.06,col,ry);B(x,1.85,z,.95,.35,.07,'#f4e7c2',ry);solid(x,z,.3,.3);},
  flag(x,z){C(x,2.2,z,.05,.05,4.4,'#d8d2c2',8);['#c8434b','#f6f3ea','#2d3f7c','#f6f3ea','#c8434b'].forEach((c,i)=>B(x+.45,4.1-i*.13,z,.8,[.13,.13,.26,.13,.13][i],.03,c));solid(x,z,.4,.4);},
  water(x,z,w,d,col='#6fb3c7'){B(x,-.02,z,w,.1,d,'#5d9fb2');finish();for(let i=-w/2;i<w/2;i+=1)for(let j=-d/2;j<d/2;j+=1){tri([x+i,.06,z+j],[x+i,.06,z+j+1],[x+i+1,.06,z+j],col);tri([x+i+1,.06,z+j],[x+i,.06,z+j+1],[x+i+1,.06,z+j+1],col);}finishWater();},
  // a seated or standing crowd figure (drawn many times with model())
  crowdMesh(shirt='#5e9a85'){B(0,.42,0,.36,.5,.26,shirt);S(0,.85,0,.17,.18,.15,'#edc39b',8,5);S(0,.95,-.02,.18,.1,.16,'#3f3a35',8,4);return M();},
  bunting(x1,x2,y,z,cols=['#e9806e','#f2c14e','#6fb0a8','#b98bd1']){B((x1+x2)/2,y,z,x2-x1,.03,.03,'#9b8a6c');for(let i=0,x=x1+.2;x<x2;x+=.4,i++)tri([x-.14,y-.02,z+.01],[x+.14,y-.02,z+.01],[x,y-.3,z+.01],cols[i%cols.length]);return M();},
  calm:()=>!!(root.SanorProfile&&root.SanorProfile.reducedMotion()),
  render(t){for(const m of objects)D(m);for(const m of water)D(m,undefined,1);}};
 return K;};
})(typeof window!=='undefined'?window:globalThis);
