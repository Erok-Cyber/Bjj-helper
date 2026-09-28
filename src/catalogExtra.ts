import type { GiMode, Technique } from './types'
import type { CatalogTechnique } from './catalog'
import { youtubeReferences } from './youtubeRefs'

type Level='Beginner'|'Intermediate'
type Row=[string,string,Technique['category'],string,GiMode,Level,string[]]

const description=(name:string,category:Technique['category'],position:string)=>{
  const lead:Record<string,string>={
    Submission:'A submission option built around isolating a limb or neck and controlling the opponent before applying the finish.',
    Sweep:'A guard reversal that removes or redirects the opponent’s base so you can come on top.',
    Guard:'A bottom-position structure for controlling distance, creating off-balances and connecting to attacks.',
    Pass:'A guard-passing option designed to beat the opponent’s legs and establish a stable top position.',
    Control:'A positional control used to limit movement, maintain pressure and set up advancement or submissions.',
    Escape:'A defensive movement sequence for creating space, rebuilding frames and returning to a safer position.',
    Defense:'A defensive framework for recognizing the threat early, protecting the vulnerable line and recovering position.',
    Takedown:'A standing attack that breaks posture or base and brings the opponent to the mat with control.',
    Transition:'A positional transition that links two useful positions while preserving control through the movement.',
    Other:'A useful Brazilian Jiu-Jitsu technique.'
  }
  return name+' is '+(lead[category]||lead.Other).slice(2)+' Commonly trained from '+position+'.'
}

const points=(category:Technique['category'])=>{
  const map:Record<string,string[]>={
    Submission:['Establish control before chasing the finish.','Keep alignment tight so the opponent cannot easily rotate free.','Apply finishing pressure gradually in training.'],
    Sweep:['Create an off-balance before committing.','Control at least one important post or base point.','Follow the sweep immediately into a stable top position.'],
    Guard:['Protect inside space and keep useful frames or grips.','Off-balance before attacking.','Connect attacks so the opponent must react rather than reset.'],
    Pass:['Control the legs or hips before circling past them.','Beat the knee line before relaxing pressure.','Settle a pin after the pass instead of rushing the next attack.'],
    Control:['Control the shoulders and hips in a way that limits rotation.','Adjust pressure as the opponent frames or turns.','Advance only when the next position is secure.'],
    Escape:['Address the immediate control or submission threat first.','Build frames and move your hips instead of pushing with straight arms.','Recover guard, come to your knees or reverse only after space is created.'],
    Defense:['Recognize the danger before the finishing position is fully locked.','Protect the threatened limb or neck while improving alignment.','Escape in stages rather than exploding blindly.'],
    Takedown:['Create a reaction or posture break before entering.','Keep your head, hips and grips connected during the finish.','Land in a position that lets you establish top control.'],
    Transition:['Keep at least one strong control point while moving.','Move around the opponent rather than releasing everything at once.','Finish the transition with stable shoulder and hip control.']
  }
  return map[category]||['Stay connected.','Control position first.','Move with purpose.']
}

const Q=(r:Row):CatalogTechnique=>{
  const [slug,name,category,position,giMode,level,tags]=r
  return {slug,name,category,position,giMode,level,description:description(name,category,position),keyPoints:points(category),tags,references:youtubeReferences(slug,name)}
}

const rows:Row[]=[
  // +28 Submissions => 40 total
  ['anaconda-choke','Anaconda Choke','Submission','Front Headlock','Both','Intermediate',['choke','front-headlock']],
  ['darce-choke',"D'Arce Choke",'Submission','Front Headlock / Half Guard','Both','Intermediate',['choke','front-headlock']],
  ['north-south-choke','North South Choke','Submission','North South','No-Gi','Intermediate',['choke','north-south']],
  ['loop-choke','Loop Choke','Submission','Guard / Front Headlock','Gi','Intermediate',['choke','gi']],
  ['baseball-bat-choke','Baseball Bat Choke','Submission','Side Control / Knee on Belly','Gi','Intermediate',['choke','gi']],
  ['cross-collar-choke','Cross Collar Choke','Submission','Closed Guard / Mount','Gi','Beginner',['choke','gi','fundamental']],
  ['clock-choke','Clock Choke','Submission','Turtle','Gi','Intermediate',['choke','turtle','gi']],
  ['peruvian-necktie','Peruvian Necktie','Submission','Front Headlock','Both','Intermediate',['choke','front-headlock']],
  ['japanese-necktie','Japanese Necktie','Submission','Front Headlock / Half Guard','No-Gi','Intermediate',['choke','front-headlock']],
  ['gogoplata','Gogoplata','Submission','Guard','Both','Intermediate',['choke','guard']],
  ['wrist-lock','Wrist Lock','Submission','Multiple Positions','Both','Intermediate',['joint-lock','wrist']],
  ['bicep-slicer','Bicep Slicer','Submission','Arm Entanglement','Both','Intermediate',['compression-lock','arm']],
  ['calf-slicer','Calf Slicer','Submission','Leg Entanglement','Both','Intermediate',['compression-lock','leg']],
  ['kneebar','Kneebar','Submission','Leg Entanglement','Both','Intermediate',['leg-lock','knee']],
  ['heel-hook','Heel Hook','Submission','Ashi Garami','No-Gi','Intermediate',['leg-lock','heel-hook']],
  ['toe-hold','Toe Hold','Submission','Leg Entanglement','Both','Intermediate',['leg-lock','foot-lock']],
  ['estima-lock','Estima Lock','Submission','Open Guard / Leg Entanglement','Both','Intermediate',['leg-lock','foot-lock']],
  ['aoki-lock','Aoki Lock','Submission','Ashi Garami','No-Gi','Intermediate',['leg-lock','ankle']],
  ['tarikoplata','Tarikoplata','Submission','Side Control / Guard','Both','Intermediate',['shoulder-lock','kimura']],
  ['baratoplata','Baratoplata','Submission','Guard / Mount','Both','Intermediate',['shoulder-lock']],
  ['s-mount-armbar','S-Mount Armbar','Submission','S-Mount','Both','Beginner',['armbar','mount']],
  ['mounted-triangle','Mounted Triangle','Submission','Mount','Both','Intermediate',['triangle','mount']],
  ['buggy-choke','Buggy Choke','Submission','Bottom Side Control','Both','Intermediate',['choke','side-control']],
  ['von-flue-choke','Von Flue Choke','Submission','Top Side Control','No-Gi','Intermediate',['choke','guillotine-counter']],
  ['lapel-choke-mount','Lapel Choke from Mount','Submission','Mount','Gi','Intermediate',['choke','gi','mount']],
  ['short-choke','Short Choke','Submission','Back Control','No-Gi','Beginner',['choke','back']],
  ['crucifix-choke','Crucifix Choke','Submission','Crucifix','Both','Intermediate',['choke','crucifix']],
  ['one-arm-rnc','One-Arm Rear Naked Choke','Submission','Back Control','No-Gi','Intermediate',['choke','back']],

  // +8 Sweeps => 18 total
  ['lumberjack-sweep','Lumberjack Sweep','Sweep','Closed Guard','Gi','Beginner',['closed-guard','standing-opponent']],
  ['waiter-sweep','Waiter Sweep','Sweep','Deep Half Guard','Both','Intermediate',['deep-half','sweep']],
  ['x-guard-technical-standup','X Guard Technical Stand-up Sweep','Sweep','X Guard','Both','Intermediate',['x-guard','stand-up']],
  ['slx-outside-sweep','Single Leg X Outside Sweep','Sweep','Single Leg X','Both','Intermediate',['single-leg-x','ashi']],
  ['double-underhook-butterfly-sweep','Double Underhook Butterfly Sweep','Sweep','Butterfly Guard','Both','Beginner',['butterfly','underhook']],
  ['john-wayne-sweep','John Wayne Sweep','Sweep','Half Guard','Both','Beginner',['half-guard','knee-lever']],
  ['electric-chair-sweep','Electric Chair Sweep','Sweep','Lockdown Half Guard','Both','Intermediate',['half-guard','lockdown']],
  ['shaolin-sweep','Shaolin Sweep','Sweep','Half Guard','Gi','Intermediate',['half-guard','gi']],

  // +5 Guards => 14 total
  ['spider-guard','Spider Guard','Guard','Open Guard','Gi','Intermediate',['gi','sleeve-control']],
  ['lasso-guard','Lasso Guard','Guard','Open Guard','Gi','Intermediate',['gi','lasso']],
  ['reverse-de-la-riva','Reverse De La Riva Guard','Guard','Open Guard','Both','Intermediate',['rdlr','open-guard']],
  ['z-guard','Z Guard','Guard','Half Guard','Both','Beginner',['half-guard','knee-shield']],
  ['deep-half-guard','Deep Half Guard','Guard','Half Guard','Both','Intermediate',['half-guard','deep-half']],

  // +3 Passes => 13 total
  ['headquarters-pass','Headquarters Passing Position','Pass','Open Guard','Both','Intermediate',['passing','headquarters']],
  ['stack-pass','Stack Pass','Pass','Open Guard','Both','Intermediate',['passing','stack']],
  ['float-pass','Float Pass','Pass','Open Guard','No-Gi','Intermediate',['passing','floating']],

  // +5 Controls => 10 total
  ['kesa-gatame','Kesa Gatame','Control','Side Control','Both','Beginner',['control','scarf-hold']],
  ['knee-on-belly','Knee on Belly','Control','Top Control','Both','Beginner',['control','knee-on-belly']],
  ['s-mount','S-Mount','Control','Mount','Both','Intermediate',['control','mount']],
  ['crucifix-control','Crucifix Control','Control','Turtle / Back','Both','Intermediate',['control','crucifix']],
  ['turtle-ride','Turtle Ride','Control','Top Turtle','Both','Intermediate',['control','turtle','ride']],

  // +7 Escapes => 13 total
  ['knee-on-belly-escape','Knee on Belly Escape','Escape','Bottom Knee on Belly','Both','Beginner',['escape','knee-on-belly']],
  ['north-south-escape','North South Escape','Escape','Bottom North South','Both','Intermediate',['escape','north-south']],
  ['turtle-guard-recovery','Turtle to Guard Recovery','Escape','Turtle','Both','Beginner',['escape','turtle','guard-recovery']],
  ['single-leg-x-escape','Single Leg X Escape','Escape','Standing vs Single Leg X','Both','Intermediate',['escape','ashi']],
  ['closed-guard-opening','Closed Guard Opening','Escape','Inside Closed Guard','Both','Beginner',['escape','closed-guard','posture']],
  ['body-triangle-escape','Body Triangle Escape','Escape','Back Defense','No-Gi','Intermediate',['escape','back','body-triangle']],
  ['kesa-gatame-escape','Kesa Gatame Escape','Escape','Bottom Scarf Hold','Both','Beginner',['escape','scarf-hold']],

  // +1 Defense => 6 total
  ['heel-hook-defense','Heel Hook Defense','Defense','Leg Entanglement','No-Gi','Intermediate',['defense','heel-hook','leg-lock']],

  // +20 Takedowns => 26 total
  ['kouchi-gari','Kouchi Gari','Takedown','Standing','Gi','Beginner',['judo','inside-trip']],
  ['uchi-mata','Uchi Mata','Takedown','Standing','Gi','Intermediate',['judo','throw']],
  ['harai-goshi','Harai Goshi','Takedown','Standing','Gi','Intermediate',['judo','throw']],
  ['tai-otoshi','Tai Otoshi','Takedown','Standing','Gi','Intermediate',['judo','throw']],
  ['seoi-nage','Seoi Nage','Takedown','Standing','Gi','Intermediate',['judo','throw']],
  ['tomoe-nage','Tomoe Nage','Takedown','Standing','Gi','Intermediate',['judo','sacrifice-throw']],
  ['sumi-gaeshi','Sumi Gaeshi','Takedown','Standing','Both','Intermediate',['judo','sacrifice-throw']],
  ['de-ashi-barai','De Ashi Barai','Takedown','Standing','Gi','Beginner',['judo','foot-sweep']],
  ['ankle-pick','Ankle Pick','Takedown','Standing','Both','Beginner',['wrestling','ankle-pick']],
  ['low-single','Low Single','Takedown','Standing','No-Gi','Intermediate',['wrestling','single-leg']],
  ['high-crotch','High Crotch','Takedown','Standing','Both','Intermediate',['wrestling','single-leg']],
  ['body-lock-takedown','Body Lock Takedown','Takedown','Standing','Both','Beginner',['wrestling','body-lock']],
  ['inside-trip','Inside Trip','Takedown','Standing','Both','Beginner',['wrestling','trip']],
  ['outside-trip','Outside Trip','Takedown','Standing','Both','Beginner',['wrestling','trip']],
  ['duck-under','Duck Under','Takedown','Standing','Both','Beginner',['wrestling','back-take']],
  ['arm-drag-back','Arm Drag to Back','Takedown','Standing','Both','Beginner',['arm-drag','back-take']],
  ['russian-tie-takedown','Russian Tie Takedown','Takedown','Standing','Both','Intermediate',['wrestling','2-on-1']],
  ['firemans-carry',"Fireman's Carry",'Takedown','Standing','Both','Intermediate',['wrestling','carry']],
  ['lateral-drop','Lateral Drop','Takedown','Standing','Both','Intermediate',['wrestling','throw']],
  ['knee-tap','Knee Tap','Takedown','Standing / Clinch','Both','Beginner',['wrestling','clinch']],

  // 16 Transitions => 16 total
  ['side-control-to-mount','Side Control to Mount','Transition','Side Control → Mount','Both','Beginner',['transition','mount']],
  ['side-control-to-kob','Side Control to Knee on Belly','Transition','Side Control → Knee on Belly','Both','Beginner',['transition','knee-on-belly']],
  ['kob-to-mount','Knee on Belly to Mount','Transition','Knee on Belly → Mount','Both','Beginner',['transition','mount']],
  ['mount-to-s-mount','Mount to S-Mount','Transition','Mount → S-Mount','Both','Intermediate',['transition','mount']],
  ['mount-to-technical-mount','Mount to Technical Mount','Transition','Mount → Technical Mount','Both','Intermediate',['transition','mount']],
  ['technical-mount-to-back','Technical Mount to Back','Transition','Technical Mount → Back','Both','Intermediate',['transition','back']],
  ['side-control-to-north-south','Side Control to North South','Transition','Side Control → North South','Both','Beginner',['transition','north-south']],
  ['north-south-to-side','North South to Side Control','Transition','North South → Side Control','Both','Beginner',['transition','side-control']],
  ['turtle-to-back','Turtle Ride to Back Control','Transition','Top Turtle → Back Control','Both','Intermediate',['transition','back']],
  ['front-headlock-to-back','Front Headlock to Back Take','Transition','Front Headlock → Back','Both','Intermediate',['transition','front-headlock']],
  ['closed-guard-to-armbar','Closed Guard to Armbar','Transition','Closed Guard → Armbar','Both','Beginner',['transition','armbar']],
  ['closed-guard-to-triangle','Closed Guard to Triangle','Transition','Closed Guard → Triangle','Both','Beginner',['transition','triangle']],
  ['butterfly-to-slx','Butterfly Guard to Single Leg X','Transition','Butterfly → Single Leg X','Both','Intermediate',['transition','ashi']],
  ['dlr-to-back','De La Riva to Back Take','Transition','De La Riva → Back','Gi','Intermediate',['transition','dlr','back']],
  ['half-guard-to-dogfight','Half Guard to Dogfight','Transition','Half Guard → Dogfight','Both','Beginner',['transition','half-guard']],
  ['leg-drag-to-back','Leg Drag to Back Take','Transition','Leg Drag → Back','Both','Intermediate',['transition','leg-drag','back']]
]

export const extraCatalogTechniques:CatalogTechnique[]=rows.map(Q)
