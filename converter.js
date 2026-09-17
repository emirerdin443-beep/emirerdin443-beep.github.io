async function convertImage(source,settings,onProgress){
  onProgress?.(15);await new Promise(requestAnimationFrame);
  const processed=VF.process(source,settings);onProgress?.(45);await new Promise(requestAnimationFrame);
  const palette=VF.quantize(processed.imageData,settings.colors);onProgress?.(65);await new Promise(requestAnimationFrame);
  const svg=generateSVG(processed.canvas,settings,palette);onProgress?.(100);
  return {svg,palette,canvas:processed.canvas};
}
