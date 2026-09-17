const VF={
  clamp(v,a,b){return Math.max(a,Math.min(b,v))},
  hex(r,g,b){return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()},
  process(src,s){
    const c=document.createElement('canvas'),ctx=c.getContext('2d',{willReadFrequently:true}); c.width=src.width;c.height=src.height;ctx.drawImage(src,0,0);let im=ctx.getImageData(0,0,c.width,c.height),d=im.data;
    const br=s.brightness*2.55, con=(259*(s.contrast+255))/(255*(259-s.contrast)), sat=(s.saturation+100)/100;
    for(let i=0;i<d.length;i+=4){let r=d[i]+br,g=d[i+1]+br,b=d[i+2]+br;
      r=128+con*(r-128);g=128+con*(g-128);b=128+con*(b-128);
      const avg=(r+g+b)/3;r=avg+(r-avg)*sat;g=avg+(g-avg)*sat;b=avg+(b-avg)*sat;
      d[i]=VF.clamp(r,0,255);d[i+1]=VF.clamp(g,0,255);d[i+2]=VF.clamp(b,0,255);
    }
    if(s.hue||s.blur){ctx.putImageData(im,0,0);if(s.blur){const t=document.createElement('canvas'),tc=t.getContext('2d');t.width=c.width;t.height=c.height;tc.filter=`blur(${s.blur}px)`;tc.drawImage(c,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(t,0,0);im=ctx.getImageData(0,0,c.width,c.height);d=im.data}if(s.hue){for(let i=0;i<d.length;i+=4){const [h,ss,l]=VF.rgbHsl(d[i],d[i+1],d[i+2]);const rgb=VF.hslRgb((h+s.hue+360)%360,ss,l);d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2]}}}
    ctx.putImageData(im,0,0);return {canvas:c,imageData:im};
  },
  rgbHsl(r,g,b){r/=255;g/=255;b/=255;let mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,s,l=(mx+mn)/2;if(mx!==mn){let q=l<.5?(mx-mn)/(mx+mn):(mx-mn)/(2-mx-mn);s=q;switch(mx){case r:h=(g-b)/(mx-mn)+(g<b?6:0);break;case g:h=(b-r)/(mx-mn)+2;break;default:h=(r-g)/(mx-mn)+4}h*=60}return[h,s,l]},
  hslRgb(h,s,l){const f=(n)=>{const k=(n+h/30)%12;return l-s*Math.min(l,1-l)*Math.max(-1,Math.min(k-3,9-k,1))};return [f(0)*255,f(8)*255,f(4)*255].map(Math.round)},
  quantize(im,count){const d=im.data,bins=new Map();for(let i=0;i<d.length;i+=4){if(d[i+3]<20)continue;const r=Math.round(d[i]/16)*16,g=Math.round(d[i+1]/16)*16,b=Math.round(d[i+2]/16)*16,k=(r<<16)|(g<<8)|b;let x=bins.get(k);if(x)x.n++;else bins.set(k,{r,g,b,n:1})}return [...bins.values()].sort((a,b)=>b.n-a.n).slice(0,count)}
};
