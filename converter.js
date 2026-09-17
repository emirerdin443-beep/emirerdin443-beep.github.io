async function convertImage(source,settings,onProgress){
  onProgress?.(10);await new Promise(requestAnimationFrame);
  const processed=VF.process(source,settings);onProgress?.(35);await new Promise(requestAnimationFrame);
  const palette=VF.quantize(processed.imageData,settings.colors);onProgress?.(55);await new Promise(requestAnimationFrame);
  const svg=VFTrace.svg(processed.canvas,settings,palette);onProgress?.(100);
  return {svg,palette,canvas:processed.canvas};
}
