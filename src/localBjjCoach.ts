import type { AppData, Flow, Session, Technique } from './types'

export type HybridPattern={theme:string;evidence:string;count:number}
export type HybridPriority={title:string;why:string;drills:string[];live_goal:string;techniques:string[];systems:string[]}
export type HybridWeeklyFocus={
  id:string
  week_start:string
  source_week_start:string
  source_week_end:string
  summary:string
  patterns:HybridPattern[]
  priorities:HybridPriority[]
  created_at:string
  updated_at:string
}

type Theme={
  id:string
  sv:string
  en:string
  terms:RegExp[]
  categories:Technique['category'][]
  drillSv:string[]
  drillEn:string[]
  liveSv:string
  liveEn:string
}

const themes:Theme[]=[
  {
    id:'guard-passing',sv:'Guard passing',en:'Guard passing',
    terms:[/passera.{0,12}guard/i,/guard.{0,12}pass/i,/fastn.{0,18}guard/i,/stuck.{0,18}guard/i,/kom.{0,10}inte.{0,15}(förbi|runt).{0,15}(ben|guard)/i,/couldn.?t.{0,15}(pass|get past).{0,15}(guard|legs)/i,/open guard.{0,18}(problem|svårt|hard|stuck)/i,/knee cut/i,/x[- ]?pass/i,/toreando/i,/body lock pass/i],
    categories:['Pass'],
    drillSv:['Starta i seated/open guard och vinn inside position innan du passar.','Kedja ditt första pass till ett andra när partnern stoppar det.'],
    drillEn:['Start in seated/open guard and win inside position before passing.','Chain your first pass into a second option when your partner stops it.'],
    liveSv:'Börja minst 3 positional rounds i open guard och mät om du kan etablera en stabil topposition efter pass.',
    liveEn:'Start at least 3 positional rounds in open guard and track whether you can establish a stable top position after the pass.'
  },
  {
    id:'bottom-half',sv:'Bottom half guard',en:'Bottom half guard',
    terms:[/half ?guard/i,/halv ?guard/i,/underhook/i,/dog ?fight/i,/blev.{0,12}platt/i,/flattened/i,/knee shield/i,/knäsköld/i],
    categories:['Guard','Sweep','Escape'],
    drillSv:['Reppa frames → underhook → kom upp på sidan.','Starta platt i half guard och återta knee shield eller dogfight.'],
    drillEn:['Rep frames → underhook → get onto your side.','Start flattened in half guard and recover knee shield or dogfight.'],
    liveSv:'Starta 3 rounds i bottom half och prioritera att inte bli platt innan du attackerar sweep.',
    liveEn:'Start 3 rounds in bottom half and prioritize staying off your back before attacking a sweep.'
  },
  {
    id:'guard-retention',sv:'Guard retention',en:'Guard retention',
    terms:[/guard retention/i,/behålla.{0,10}guard/i,/retain.{0,10}guard/i,/guard.{0,12}passerad/i,/got passed/i,/passerade min guard/i,/hips?.{0,12}square/i],
    categories:['Guard','Defense','Escape'],
    drillSv:['Reppa hip frames och återställ knälinjen när partnern går runt benen.','Kör retention-rundor där poängen bara är att hålla benen mellan dig och partnern.'],
    drillEn:['Rep hip frames and recover your knee line as the partner circles the legs.','Run retention rounds where the only goal is keeping your legs between you and your partner.'],
    liveSv:'Kör 3 korta retention-rundor och räkna hur många gånger du återställer guard innan du blir passerad.',
    liveEn:'Run 3 short retention rounds and count how many recoveries you make before getting passed.'
  },
  {
    id:'standing',sv:'Standing / takedowns',en:'Standing / takedowns',
    terms:[/takedown/i,/nedtag/i,/stående/i,/standing/i,/sasae/i,/ouchi/i,/o ?uchi/i,/kouchi/i,/single leg/i,/double leg/i,/judo/i,/snapdown/i],
    categories:['Takedown'],
    drillSv:['Välj ett huvudangrepp och en reaktion du alltid kan gå till.','Reppa entry → kuzushi → finish i lugnt tempo innan live rounds.'],
    drillEn:['Choose one primary attack and one reaction you can always chain to.','Rep entry → off-balance → finish at low resistance before live rounds.'],
    liveSv:'I varje stående start: försök skapa ditt grepp/entry inom 20 sekunder och attackera samma 1–2 kedja.',
    liveEn:'On every standing start, establish your preferred grip/entry within 20 seconds and attack the same 1–2 chain.'
  },
  {
    id:'back-defense',sv:'Back defense',en:'Back defense',
    terms:[/back control/i,/ryggkontroll/i,/ryggen/i,/rear naked/i,/rnc/i,/seatbelt/i,/body triangle/i,/hooks/i],
    categories:['Escape','Defense','Control'],
    drillSv:['Starta med seatbelt + hooks och jobba handfight före höftescape.','Reppa att få axlarna till mattan innan du försöker vända in.'],
    drillEn:['Start with seatbelt + hooks and win the hand fight before escaping the hips.','Rep getting your shoulders to the mat before trying to turn in.'],
    liveSv:'Kör 3 back-escape rounds där första målet alltid är att vinna handfighten.',
    liveEn:'Run 3 back-escape rounds where the first objective is always winning the hand fight.'
  },
  {
    id:'mount-escape',sv:'Mount escapes',en:'Mount escapes',
    terms:[/mount escape/i,/escape.{0,12}mount/i,/kom.{0,12}inte.{0,12}ur mount/i,/stuck.{0,12}mount/i,/upa/i,/elbow escape/i],
    categories:['Escape','Defense'],
    drillSv:['Reppa elbow escape med frames och få in första knät.','Växla mellan bridge och elbow escape när partnern reagerar.'],
    drillEn:['Rep the elbow escape with frames and recover the first knee.','Chain bridge pressure into the elbow escape as the partner reacts.'],
    liveSv:'Starta 3 rounds under mount och fokusera på att återta half/guard innan du jagar full escape.',
    liveEn:'Start 3 rounds under mount and focus on recovering half/guard before chasing a full escape.'
  },
  {
    id:'finishing',sv:'Finishing submissions',en:'Finishing submissions',
    terms:[/submission/i,/avslut/i,/finish/i,/kunde.{0,15}inte.{0,15}(avsluta|submitt)/i,/couldn.?t.{0,15}finish/i,/arm triangle/i,/armbar/i,/triangle choke/i,/kimura/i,/guillotine/i],
    categories:['Submission'],
    drillSv:['Välj en submission från din vanligaste topposition och reppa kontroll före finish.','Starta precis före avslutet och låt partnern ge gradvis ökande motstånd.'],
    drillEn:['Choose one submission from your most common top position and rep control before the finish.','Start just before the finish and let your partner add gradually increasing resistance.'],
    liveSv:'Jaga bara en vald submission i minst 3 rounds och notera exakt var kedjan bryts.',
    liveEn:'Hunt only one chosen submission for at least 3 rounds and note exactly where the sequence breaks.'
  },
  {
    id:'side-control-defense',sv:'Side control defense',en:'Side control defense',
    terms:[/frames?.{0,18}(side|side control)/i,/(side|side control).{0,18}frames?/i,/framea.{0,18}(side|sidokontroll)/i,/sidokontroll.{0,18}(frame|ram)/i,/stuck.{0,18}side control/i,/fastn.{0,18}sidokontroll/i,/escape.{0,18}side control/i,/kom.{0,12}inte.{0,12}ur.{0,12}sidokontroll/i],
    categories:['Escape','Defense'],
    drillSv:['Starta under side control och bygg en tydlig frame mot höft/axel innan du flyttar höfterna.','Reppa frame → hip escape → få in knälinjen och återta guard/half guard.'],
    drillEn:['Start underneath side control and establish a clear hip/shoulder frame before moving your hips.','Rep frame → hip escape → recover the knee line into guard or half guard.'],
    liveSv:'Starta minst 3 positional rounds under side control och mät om du kan skapa frames innan partnern stabiliserar fullt.',
    liveEn:'Start at least 3 positional rounds under side control and track whether you can establish frames before your partner fully settles.'
  },
  {
    id:'top-control',sv:'Top control',en:'Top control',
    terms:[/side control/i,/sidokontroll/i,/top control/i,/hålla.{0,12}(mount|side|top)/i,/lost.{0,12}(mount|side control|top)/i,/crossface/i,/kontrollera/i],
    categories:['Control','Transition'],
    drillSv:['Reppa crossface + underhook och håll positionen innan nästa transition.','Låt partnern framea och återetablera kontroll innan du går vidare.'],
    drillEn:['Rep crossface + underhook and stabilize before transitioning.','Let your partner frame and re-establish control before advancing.'],
    liveSv:'Efter varje pass: håll toppositionen stabil i 5 sekunder innan nästa attack.',
    liveEn:'After every pass, stabilize the top position for 5 seconds before attacking again.'
  }
]

const strip=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()

const addDays=(value:string,days:number)=>{
  const d=new Date(value+'T12:00:00')
  d.setDate(d.getDate()+days)
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

const mondayFor=(value:string)=>{
  const d=new Date(value+'T12:00:00')
  const day=d.getDay()
  const delta=day===1?0:(8-day)%7
  return addDays(value,delta)
}

const combined=(s:Session)=>[s.notes,s.whatWorked,s.whatFailed,s.nextFocus,s.focusPosition].filter(Boolean).join(' · ')

const language=(sessions:Session[],locale='sv-SE')=>{
  if(locale.toLowerCase().startsWith('sv'))return 'sv'
  const text=strip(sessions.map(combined).join(' '))
  const swedish=['svart','passera','blev','kunde','inte','nasta','tran','ryggen','halv','knä','fungerade','underlaget']
  return swedish.filter(x=>text.includes(x)).length>=2?'sv':'en'
}

const themeMatches=(theme:Theme,session:Session)=>{
  const text=combined(session)
  return theme.terms.some(r=>r.test(text))
}

const themeEvidence=(theme:Theme,sessions:Session[],lang:'sv'|'en')=>{
  const matched=sessions.filter(s=>themeMatches(theme,s))
  const snippets=matched.map(s=>combined(s)).filter(Boolean).slice(0,2)
  if(snippets.length)return snippets.join(' • ').slice(0,360)
  return lang==='sv'?'Identifierat från veckans träningslogg.':'Identified from this week’s training log.'
}

const relatedTechniques=(theme:Theme,data:AppData)=>{
  const direct=data.techniques.filter(t=>theme.categories.includes(t.category))
  const termText=theme.terms.map(r=>r.source.replace(/\\/g,' ')).join(' ')
  return [...direct]
    .sort((a,b)=>{
      const aq=(a.inDrillQueue?8:0)+(a.isFavorite?4:0)+(6-a.confidence)*2+(strip(termText).includes(strip(a.name))?5:0)
      const bq=(b.inDrillQueue?8:0)+(b.isFavorite?4:0)+(6-b.confidence)*2+(strip(termText).includes(strip(b.name))?5:0)
      return bq-aq
    })
    .slice(0,4)
    .map(t=>t.name)
}

const flowText=(f:Flow)=>strip([f.name,f.description,...(f.tags||[]),...f.nodes.map(n=>String(n.data.label||''))].join(' '))
const relatedSystems=(theme:Theme,data:AppData)=>{
  const keys=theme.id.split('-')
  return data.flows.filter(f=>{
    const h=flowText(f)
    if(theme.id==='guard-passing')return h.includes('pass')||h.includes('open guard')
    if(theme.id==='bottom-half')return h.includes('half guard')||h.includes('halfguard')
    if(theme.id==='standing')return h.includes('standing')||h.includes('takedown')||h.includes('sasae')||h.includes('ouchi')
    return keys.some(k=>h.includes(k))
  }).slice(0,3).map(f=>f.name)
}

export function buildLocalWeeklyFocus(data:AppData,today:string,locale='sv-SE'):HybridWeeklyFocus{
  const weekStart=mondayFor(today)
  const sourceStart=addDays(weekStart,-7)
  const sourceEnd=today<addDays(weekStart,-1)?today:addDays(weekStart,-1)
  let sessions=data.sessions.filter(s=>s.trainedAt>=sourceStart&&s.trainedAt<=sourceEnd)
  if(!sessions.length){
    const fallbackStart=addDays(today,-7)
    sessions=data.sessions.filter(s=>s.trainedAt>=fallbackStart&&s.trainedAt<=today)
  }

  const lang=language(sessions,locale)
  const signals=themes.map(theme=>{
    let count=0,weight=0
    for(const s of sessions){
      if(themeMatches(theme,s)){count++;weight+=1}
      const nf=strip(s.nextFocus||'')
      if(theme.terms.some(r=>r.test(nf))){weight+=1.25}
      const failed=strip(s.whatFailed||'')
      if(theme.terms.some(r=>r.test(failed))){weight+=1.5}
    }
    return {theme,count,weight}
  }).filter(x=>x.count>0).sort((a,b)=>b.weight-a.weight||b.count-a.count)

  if(!signals.length){
    const low=[...data.techniques].sort((a,b)=>a.confidence-b.confidence)
    const byCat=new Map<string,number>()
    low.slice(0,8).forEach(t=>byCat.set(t.category,(byCat.get(t.category)||0)+1))
    const topCat=[...byCat.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]
    const fallback=themes.find(t=>t.categories.includes(topCat as Technique['category']))||themes[0]
    signals.push({theme:fallback,count:1,weight:.5})
  }

  const top=signals.slice(0,3)
  const patterns:HybridPattern[]=top.map(x=>({
    theme:x.theme[lang],
    evidence:themeEvidence(x.theme,sessions,lang),
    count:x.count
  }))

  const priorities:HybridPriority[]=top.map(x=>{
    const techniques=relatedTechniques(x.theme,data)
    const systems=relatedSystems(x.theme,data)
    const repeated=x.count>=2
    return {
      title:x.theme[lang],
      why:lang==='sv'
        ?(repeated?`Det här dök upp i ${x.count} av veckans loggade pass och bör därför få företräde nästa vecka.`:'Det här är en tydlig signal i veckans notes. Testa det fokuserat innan du lägger till fler nya tekniker.')
        :(repeated?`This showed up in ${x.count} logged sessions this week, so it deserves priority next week.`:'This is a clear signal in this week’s notes. Test it deliberately before adding more new techniques.'),
      drills:lang==='sv'?x.theme.drillSv:x.theme.drillEn,
      live_goal:lang==='sv'?x.theme.liveSv:x.theme.liveEn,
      techniques,
      systems
    }
  })

  const summary=lang==='sv'
    ?(top[0]?.count>=2
      ?`Veckans tydligaste återkommande signal är ${top[0].theme.sv.toLowerCase()}. Fokusera främst där nästa vecka och använd övriga prioriteringar som sekundära teman. Planen bygger på dina egna notes, review-fält, confidence och Library-data.`
      :`Det finns ännu få återkommande signaler, så planen prioriterar det tydligaste problemet i loggen tillsammans med dina confidence-värden. Håll nästa vecka smal och samla mer data istället för att jaga många nya tekniker.`)
    :(top[0]?.count>=2
      ?`The clearest recurring signal this week is ${top[0].theme.en.toLowerCase()}. Make that the main focus next week and treat the other priorities as secondary themes. The plan uses your notes, review fields, confidence and Library data.`
      :`There are not many repeated signals yet, so the plan prioritizes the clearest issue in the log together with your confidence data. Keep next week narrow and collect more evidence instead of adding many new techniques.`)

  const stamp=new Date().toISOString()
  return {
    id:crypto.randomUUID(),
    week_start:weekStart,
    source_week_start:sessions.length?Math.min(...sessions.map(s=>new Date(s.trainedAt+'T12:00:00').getTime()))?sessions.map(s=>s.trainedAt).sort()[0]:sourceStart:sourceStart,
    source_week_end:sessions.length?sessions.map(s=>s.trainedAt).sort().slice(-1)[0]:sourceEnd,
    summary,patterns,priorities,created_at:stamp,updated_at:stamp
  }
}

export function localCoachAnswer(data:AppData,question:string,locale='sv-SE'){
  const y=new Date(),m=String(y.getMonth()+1).padStart(2,'0'),d=String(y.getDate()).padStart(2,'0')
  const plan=buildLocalWeeklyFocus(data,`${y.getFullYear()}-${m}-${d}`,locale)
  const sv=locale.toLowerCase().startsWith('sv')
  const q=strip(question)
  const focus=plan.priorities[0]

  if(q.includes('week')||q.includes('vecka')||q.includes('focus')||q.includes('fokus')||q.includes('plan')){
    return sv
      ?`${plan.summary}\n\nNästa fokus: ${plan.priorities.map((p,i)=>`${i+1}. ${p.title} — ${p.live_goal}`).join('\n')}`
      :`${plan.summary}\n\nNext focus: ${plan.priorities.map((p,i)=>`${i+1}. ${p.title} — ${p.live_goal}`).join('\n')}`
  }

  const low=[...data.techniques].sort((a,b)=>a.confidence-b.confidence).slice(0,3)
  return sv
    ?`Hybrid coach: utifrån dina senaste notes hade jag börjat med ${focus?.title||'ett tydligt positionsfokus'}. ${focus?.why||''} ${low.length?'Lägst confidence just nu: '+low.map(t=>t.name+' '+t.confidence+'/5').join(', ')+'.':''}`
    :`Hybrid coach: based on your recent notes I would start with ${focus?.title||'one clear positional focus'}. ${focus?.why||''} ${low.length?'Lowest confidence right now: '+low.map(t=>t.name+' '+t.confidence+'/5').join(', ')+'.':''}`
}
