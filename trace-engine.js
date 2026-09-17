const VFTrace={
  clamp(v,a,b){return Math.max(a,Math.min(b,v))},
  dist(a,b){const dr=a.r-b.r,dg=a.g-b.g,db=a.b-b.b;return Math.sqrt(dr*dr+dg*dg+db*db)},
  nearest(r,g,b,palette){let bi=0,bd=Infinity;for(let i=0;i<palette.length;i++){const p=palette[i],dr=r-p.r,dg=g-p.g,db=b-p.b,d=dr*dr+dg*dg+db*db;if(d<bd){bd=d;bi=i}}return bi},
  grid(canvas,settings,palette){
    const ctx=canvas.getContext('2d',{willReadFrequently:true}),im=ctx.getImageData(0,0,canvas.width,canvas.height),d=im.data;
    const maxSide=settings.traceMode==='max'?900:620;
    const quality=settings.traceMode==='max'?Math.max(1,Math.round(5-(settings.detail/28))):Math.max(1,Math.round(9-(settings.detail/16)));
    const scale=Math.max(1,Math.ceil(Math.max(canvas.width,canvas.height)/maxSide)*quality);
    const w=Math.ceil(canvas.width/scale),h=Math.ceil(canvas.height/scale),labels=new Int16Array(w*h);
    for(let gy=0;gy<h;gy++)for(let gx=0;gx<w;gx++){
      const x=Math.min(canvas.width-1,Math.floor((gx+.5)*scale)),y=Math.min(canvas.height-1,Math.floor((gy+.5)*scale)),i=(y*canvas.width+x)*4;
      labels[gy*w+gx]=d[i+3]<20?-1:this.nearest(d[i],d[i+1],d[i+2],palette);
    }
    if(settings.traceMode==='max') this.cleanup(labels,w,h,palette,settings);
    return {labels,w,h,scale};
  },
  cleanup(a,w,h,palette,s){
    const min=Math.max(1,Math.round(s.area*(s.traceMode==='max'?0.7:1)));
    const seen=new Uint8Array(a.length),dirs=[[-1,0],[1,0],[0,-1],[0,1]];
    for(let sy=0;sy<h;sy++)for(let sx=0;sx<w;sx++){
      const start=sy*w+sx;if(seen[start]||a[start]<0)continue;const color=a[start],q=[start],comp=[];seen[start]=1;
      for(let qi=0;qi<q.length;qi++){const p=q[qi],x=p%w,y=(p/w)|0;comp.push(p);for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const n=ny*w+nx;if(!seen[n]&&a[n]===color){seen[n]=1;q.push(n)}}}
      if(comp.length<min){let best=-1,bestN=-1;for(const p of comp){const x=p%w,y=(p/w)|0;for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const n=ny*w+nx;if(a[n]>=0&&a[n]!==color){let score=0;for(const [ex,ey] of dirs){const xx=nx+ex,yy=ny+ey;if(xx>=0&&yy>=0&&xx<w&&yy<h&&a[yy*w+xx]===a[n])score++}if(score>bestN){bestN=score;best=a[n]}}}}if(best>=0)for(const p of comp)a[p]=best}
    }
  },
  traceLoop(edges,startKey){
    const out=[],first=startKey;let key=startKey,guard=0;
    while(edges.has(key)&&guard++<200000){const e=edges.get(key);edges.delete(key);if(!out.length)out.push(e[0]);out.push(e[1]);key=e[1][0]+','+e[1][1];if(key===first)break}
    return out;
  },
  contours(grid,palette,settings){
    const {labels,w,h,scale}=grid,groups=palette.map(c=>({c,loops:[]})),edges=new Map();
    const add=(a,b)=>{const k=a[0]+','+a[1];if(!edges.has(k))edges.set(k,[a,b])};
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=labels[y*w+x];if(c<0)continue;
      const same=(nx,ny)=>nx>=0&&ny>=0&&nx<w&&ny<h&&labels[ny*w+nx]===c;
      if(!same(x,y-1))add([x,y],[x+1,y]);
      if(!same(x+1,y))add([x+1,y],[x+1,y+1]);
      if(!same(x,y+1))add([x+1,y+1],[x,y+1]);
      if(!same(x-1,y))add([x,y+1],[x,y]);
    }
    const perColor=new Map();
    for(const [k,e] of edges){const loop=this.traceLoop(edges,k);if(loop.length<4)continue;const minX=Math.min(...loop.map(p=>p[0])),maxX=Math.max(...loop.map(p=>p[0]),minX),minY=Math.min(...loop.map(p=>p[1])),maxY=Math.max(...loop.map(p=>p[1]),minY);const cx=Math.min(w-1,Math.max(0,Math.floor((minX+maxX)/2))),cy=Math.min(h-1,Math.max(0,Math.floor((minY+maxY)/2)));const c=labels[cy*w+cx];if(c<0)continue;const pts=this.simplify(loop,settings.traceMode==='max'?Math.max(.25,settings.smooth*.18):Math.max(.5,settings.smooth*.35));(perColor.get(c)||perColor.set(c,[]).get(c)).push(pts.map(([x,y])=>[x*scale,y*scale]));}
    for(const [c,loops] of perColor)groups[c].loops=loops;return groups;
  },
  simplify(points,tol){if(points.length<4)return points;const out=[points[0]];for(let i=1;i<points.length-1;i++){const a=out[out.length-1],b=points[i],c=points[i+1],cross=Math.abs((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]));const len=Math.hypot(c[0]-a[0],c[1]-a[1]);if(len&&cross/len<tol)continue;out.push(b)}out.push(points[points.length-1]);return out},
  svg(canvas,settings,palette){
    const g=this.grid(canvas,settings,palette),groups=this.contours(g,palette,settings),maxW=settings.outWidth||canvas.width,scale=maxW/canvas.width,outH=settings.outHeightMode==='square'?maxW:canvas.height*scale;
    let body=`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(maxW)}" height="${Math.round(outH)}" viewBox="0 0 ${Math.round(maxW)} ${Math.round(outH)}" shape-rendering="geometricPrecision"><metadata>Created locally by VectorForge advanced tracer.</metadata>`;
    for(const group of groups){if(!group.loops.length)continue;const color=VF.hex(group.c.r,group.c.g,group.c.b);body+=`<g id="color-${color.slice(1).toLowerCase()}" fill="${color}" fill-rule="evenodd" stroke="none">`;for(const loop of group.loops){if(loop.length<3)continue;body+=`<path d="M ${loop.map(([x,y],i)=>`${(x*scale).toFixed(2)} ${(y*scale).toFixed(2)}${i?'':' '}`).join(' L ')} Z"/>`}body+='</g>'}
    return body+'</svg>';
  }
};
