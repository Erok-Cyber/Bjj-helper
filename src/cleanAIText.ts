export function cleanAIText(value:string){
  return String(value||'')
    .replace(/\*\*(.*?)\*\*/g,'$1')
    .replace(/__(.*?)__/g,'$1')
    .replace(/(?<!\*)\*(?!\*)/g,'')
    .replace(/(?<!_)_(?!_)/g,'')
    .replace(/`{1,3}/g,'')
    .replace(/^#{1,6}\s*/gm,'')
    .replace(/^\s*[-*]\s+/gm,'• ')
    .replace(/\n{3,}/g,'\n\n')
    .trim()
}
