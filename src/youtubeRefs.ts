export type YoutubeReference={label:string;url:string}

const search=(query:string)=>'https://www.youtube.com/results?search_query='+encodeURIComponent(query)

const curated:Record<string,YoutubeReference>={
  armbar:{label:'John Danaher — Arm Bar From Guard (BJJ Fanatics)',url:'https://www.youtube.com/watch?v=pQ43Oy5k9yQ'},
  triangle:{label:'John Danaher — Perfect Triangle Choke',url:'https://www.youtube.com/watch?v=LDE0fkzZT6I'},
  'body-lock-pass':{label:'Gordon Ryan — Body Lock Guard Pass (BJJ Fanatics)',url:'https://www.youtube.com/watch?v=aAd6OIq94X0'},
  'upa-escape':{label:'Jordan Teaches Jiujitsu — Mount Escape Advice',url:'https://www.youtube.com/watch?v=r27NPwVVzso'},
  'old-school-sweep':{label:'Lachlan Giles — Half Guard Sweep & Counter Concepts',url:'https://www.youtube.com/watch?v=hJr_ehU1I4Q'}
}

export function youtubeReferences(slug:string,name:string,extra='BJJ tutorial'):YoutubeReference[]{
  const direct=curated[slug]
  const preferred=search(name+' '+extra+' BJJ Fanatics Gordon Ryan Craig Jones John Danaher Lachlan Giles Jordan Teaches Jiujitsu')
  const more=search(name+' BJJ technique tutorial')
  return direct?[direct,{label:'More '+name+' videos on YouTube',url:preferred}]:[
    {label:'Find a high-quality '+name+' instructional on YouTube',url:preferred},
    {label:'More '+name+' tutorials on YouTube',url:more}
  ]
}
