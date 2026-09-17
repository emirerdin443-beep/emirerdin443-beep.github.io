function printerSettings(){return {printer:true,feature:Number(document.querySelector('#feature')?.value||0.8),mergeTiny:document.querySelector('#mergeTiny')?.checked!==false}}
function printerCompatible(format){return format==='svg'}
