function generateSVG(canvas,settings,palette){
  const {width,height}=canvas; const ctx=canvas.getContext('2d',{willReadFrequently:true}); const im=ctx.getImageData(0,0,width,height),d=im.data;
  const maxW=settings.outWidth||width, scale=maxW/width, outH=settings.outHeightMode==='square'?maxW:height*scale;
  const groups=palette.map(c=>({c,points:[]}));
  const nearest=(r,g,b)=>{let best=0,bd=1e9;for(let i=0;i<palette.length;i++){const p=palette[i],dd=(r-p.r)**2+(g-p.g)**2+(b-p.b)**2;if(dd<bd){bd=dd;best=i}}return best};
  const step=Math.max(1,Math.round(101-settings.detail));
  for(let y=0;y<height;y+=step){for(let x=0;x<width;x+=step){const i=(y*width+x)*4;if(d[i+3]<20)continue;groups[nearest(d[i],d[i+1],d[i+2])].points.push([x*scale,y*scale])}}
  let body=`<svg xmlns="http://www.w3.org/2000/svg" width="${outH===maxW?maxW:Math.round(maxW)}" height="${Math.round(outH)}" viewBox="0 0 ${Math.round(maxW)} ${Math.round(outH)}">`;
  body+=`<metadata>Created locally by VectorForge. Image data was not uploaded.</metadata>`;
  for(const g of groups){if(!g.points.length)continue;const color=VF.hex(g.c.r,g.c.g,g.c.b);if(settings.printer){body+=`<g id="color-${color.slice(1).toLowerCase()}" data-color="${color}" fill="${color}" stroke="none">`;for(const [x,y] of g.points)body+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1,step*scale).toFixed(1)}" height="${Math.max(1,step*scale).toFixed(1)}"/>`;body+='</g>'}else{body+=`<g fill="${color}" shape-rendering="geometricPrecision">`;for(const [x,y] of g.points)body+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1,step*scale).toFixed(1)}" height="${Math.max(1,step*scale).toFixed(1)}"/>`;body+='</g>'}}
  return body+'</svg>';
}
