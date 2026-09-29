import type { Flow, GiMode, Technique } from './types'
import { youtubeReferences } from './youtubeRefs'
import { extraCatalogTechniques } from './catalogExtra'

export type CatalogCategory = Technique['category']

export interface CatalogTechnique {
  slug: string
  name: string
  category: CatalogCategory
  position: string
  giMode: GiMode
  level: 'Beginner'|'Intermediate'
  description: string
  keyPoints: string[]
  tags: string[]
  references: { label: string; url: string }[]
}

export interface CatalogSystem {
  slug: string
  name: string
  level: 'Beginner'|'Intermediate'
  giMode: GiMode
  description: string
  tags: string[]
  flow: Flow
}

const T=(slug:string,name:string,category:CatalogCategory,position:string,giMode:GiMode,level:'Beginner'|'Intermediate',description:string,keyPoints:string[],tags:string[],extra?:string):CatalogTechnique=>({
  slug,name,category,position,giMode,level,description,keyPoints,tags,references:youtubeReferences(slug,name,extra)
})

const baseCatalogTechniques:CatalogTechnique[]=[
  T('armbar','Armbar','Submission','Mount / Closed Guard','Both','Beginner','A straight-arm submission that isolates the elbow and uses the hips as the finishing lever.',['Control the shoulder line before extending.','Keep the knees tight around the arm.','Finish gradually with the thumb oriented upward.'],['arm','mount','closed-guard','fundamental']),
  T('triangle','Triangle Choke','Submission','Closed Guard / Open Guard','Both','Beginner','A choke that traps the opponent’s neck and one arm between your legs, using the thigh and their shoulder to close the space.',['Create an angle before squeezing.','Pull the trapped arm across the center line.','Lock behind the knee rather than over the foot.'],['choke','guard','fundamental']),
  T('rear-naked-choke','Rear Naked Choke','Submission','Back Control','No-Gi','Beginner','A strangle from back control that uses the choking arm around the neck and the second arm to reinforce the finish.',['Win hand fighting first.','Hide the choking hand behind the shoulder.','Keep chest-to-back connection while finishing.'],['choke','back','nogi','fundamental']),
  T('collar-choke-back','Bow and Arrow Choke','Submission','Back Control','Gi','Intermediate','A gi choke from the back that combines a deep collar grip with control of the opponent’s lower body to create strong rotational tension.',['Secure a deep collar grip before opening position.','Control the far leg or hip.','Rotate rather than simply pulling with the arms.'],['choke','back','gi']),
  T('kimura','Kimura','Submission','Side Control / Guard','Both','Beginner','A bent-arm shoulder lock that controls the wrist and elbow with a figure-four grip.',['Keep the wrist pinned before rotating.','Control the elbow close to the body.','Use body rotation instead of arm strength.'],['shoulder-lock','control','fundamental']),
  T('americana','Americana','Submission','Mount / Side Control','Both','Beginner','A bent-arm shoulder lock usually attacked from dominant top positions by pinning the wrist and bringing the elbow toward the hip.',['Pin the wrist before changing elbow position.','Keep the opponent’s elbow near the mat.','Use small controlled movement at the shoulder.'],['shoulder-lock','mount','side-control']),
  T('guillotine','Guillotine Choke','Submission','Front Headlock / Guard','Both','Beginner','A front-headlock choke that wraps the opponent’s neck and uses arm position plus hip angle to compress the neck.',['Control posture before falling back.','Keep the choking elbow tight.','Choose the finish that matches your arm configuration.'],['choke','front-headlock','guard']),
  T('arm-triangle','Arm Triangle','Submission','Mount / Side Control','Both','Beginner','A head-and-arm choke where the opponent’s trapped shoulder helps close one side of the neck while your arm closes the other.',['Drive the trapped arm across the neck.','Keep your head low beside theirs.','Settle your weight before squeezing.'],['choke','mount','side-control','pressure']),
  T('ezekiel','Ezekiel Choke','Submission','Mount / Top Control','Gi','Intermediate','A sleeve-assisted choke that can be applied from top control by threading one forearm across the neck and using the sleeve grip to reinforce it.',['Keep chest pressure while setting grips.','Hide the choking hand until the structure is ready.','Avoid giving away top position for the choke.'],['choke','gi','mount']),
  T('omoplata','Omoplata','Submission','Guard','Both','Intermediate','A shoulder lock using the legs to trap and rotate the opponent’s arm while you sit up and control their posture.',['Break posture before turning the corner.','Sit up quickly once the shoulder is trapped.','Control the waist or far hip to prevent the roll.'],['shoulder-lock','guard','rotation']),
  T('straight-ankle-lock','Straight Ankle Lock','Submission','Ashi Garami','Both','Beginner','A lower-leg submission that controls the opponent’s leg and applies pressure to the ankle with the forearm and hip extension.',['Control the knee line first.','Keep the elbow tight to your ribs.','Apply pressure gradually and respect local rulesets.'],['leg-lock','ashi','fundamental']),
  T('paper-cutter','Paper Cutter Choke','Submission','Side Control','Gi','Intermediate','A gi collar choke from side control that uses opposing collar grips and top pressure to create a tight strangle.',['Set grips without losing crossface pressure.','Keep the near elbow low.','Use shoulder and torso pressure, not only the arms.'],['choke','side-control','gi']),

  T('scissor-sweep','Scissor Sweep','Sweep','Closed Guard','Gi','Beginner','A classic guard sweep using a collar-and-sleeve connection, one shin across the torso and the other leg to remove the opponent’s base.',['Break posture first.','Angle the hips before loading weight.','Time the lower leg to remove the post.'],['closed-guard','sweep','gi','fundamental']),
  T('hip-bump','Hip Bump Sweep','Sweep','Closed Guard','Both','Beginner','A seated sweep from closed guard that attacks when the opponent postures tall, driving your hips into their upper body while controlling a posting arm.',['Sit up onto one hand quickly.','Control the far posting arm.','Drive through the opponent rather than falling sideways.'],['closed-guard','sweep','fundamental']),
  T('flower-sweep','Flower Sweep','Sweep','Closed Guard','Gi','Beginner','A closed-guard sweep that combines sleeve control with a leg scoop and strong hip rotation to tip the opponent over a weakened base.',['Pull the controlled arm across.','Scoop or block the far leg.','Use a large hip turn rather than arm strength.'],['closed-guard','sweep','gi']),
  T('pendulum-sweep','Pendulum Sweep','Sweep','Closed Guard','Both','Intermediate','A rotational closed-guard sweep that uses a swinging leg and upper-body control to load and rotate the opponent.',['Create an angle before swinging.','Keep the opponent connected to your torso.','Use the pendulum leg to generate rotation.'],['closed-guard','sweep']),
  T('butterfly-sweep','Butterfly Sweep','Sweep','Butterfly Guard','Both','Beginner','A seated guard sweep using an underhook and butterfly hook to elevate one side while directing the opponent into the empty space.',['Win upper-body connection first.','Fall toward the underhook side.','Lift with the hook while steering the shoulders.'],['butterfly','sweep','fundamental']),
  T('tripod-sweep','Tripod Sweep','Sweep','Open Guard','Both','Beginner','An open-guard sweep that controls the ankle while one foot posts on the hip and the other blocks behind the far leg.',['Keep the ankle controlled.','Push the hip while blocking the far base.','Come up immediately after the opponent falls.'],['open-guard','sweep']),
  T('sickle-sweep','Sickle Sweep','Sweep','Open Guard','Both','Beginner','A companion to the tripod sweep that uses a chopping leg behind the opponent’s knee while controlling the ankle and distance.',['Use when the opponent retracts from the tripod.','Keep ankle control throughout.','Follow the sweep into top position.'],['open-guard','sweep','combo']),
  T('old-school-sweep','Old School Sweep','Sweep','Bottom Half Guard','Both','Beginner','A half-guard sweep that uses an underhook, low body position and control of the far leg to drive toward the opponent’s back corner.',['Get onto your side before attacking.','Build an underhook and knee connection.','Come up to your elbow or hand instead of pulling from flat.'],['half-guard','sweep','wrestle-up']),
  T('dogfight-sweep','Dogfight Sweep','Sweep','Bottom Half Guard','Both','Intermediate','A sweep from the dogfight position where you come up on an underhook and attack the opponent’s base with pressure, knee position or a far-leg control.',['Keep your head higher than theirs.','Stay connected at the waist.','Attack whichever post becomes light.'],['half-guard','dogfight','wrestle-up']),
  T('sit-up-sweep','Sit-up Guard Sweep','Sweep','Seated Guard','Both','Beginner','A simple seated-guard wrestle-up that converts forward pressure or a reachable leg into a sweep and top position.',['Keep posture active instead of falling flat.','Connect to a leg or hip before driving.','Finish by coming up, not by trying to flip from distance.'],['seated-guard','wrestle-up','sweep']),

  T('closed-guard','Closed Guard','Guard','Bottom Guard','Both','Beginner','A guard where your legs lock around the opponent’s waist, giving strong posture control and access to sweeps and submissions.',['Control posture before attacking.','Use angles rather than staying square.','Open the guard on your terms when transitioning.'],['guard','closed-guard','fundamental']),
  T('half-guard','Half Guard','Guard','Bottom Guard','Both','Beginner','A guard where your legs control one of the opponent’s legs, creating pathways to underhooks, knee shield, sweeps and wrestle-ups.',['Stay on your side whenever possible.','Protect the crossface.','Build frames before chasing attacks.'],['guard','half-guard','fundamental']),
  T('knee-shield','Knee Shield Half Guard','Guard','Bottom Half Guard','Both','Beginner','A half-guard structure that places the top shin between you and the opponent to manage distance and protect inside space.',['Connect knee to elbow.','Keep the bottom knee engaged on the trapped leg.','Use the shield to create your underhook or reset distance.'],['guard','half-guard','frames']),
  T('butterfly-guard','Butterfly Guard','Guard','Seated Guard','Both','Beginner','A seated guard that uses inside hooks under the opponent’s thighs plus upper-body connections to elevate, sweep and enter legs.',['Fight for inside position with the knees.','Stay upright enough to move underneath.','Use hooks together with upper-body grips.'],['guard','butterfly','seated']),
  T('collar-sleeve','Collar Sleeve Guard','Guard','Open Guard','Gi','Beginner','A gi open guard built around a collar grip, sleeve control and strategic foot placement to manage distance and create attacks.',['Keep tension in both grips.','Use the feet to manage distance before pulling.','Create angles for triangles, omoplatas or sweeps.'],['guard','gi','open-guard']),
  T('de-la-riva','De La Riva Guard','Guard','Open Guard','Gi','Intermediate','An open guard using an outside hook around the opponent’s lead leg to off-balance, enter the back or transition to sweeps.',['Control distance before deepening the hook.','Keep the opponent’s lead leg connected.','Use off-balancing before chasing the back.'],['guard','dlr','gi']),
  T('single-leg-x','Single Leg X','Guard','Open Guard / Ashi','Both','Intermediate','A leg-entanglement guard that controls one leg between your hips and feet, offering strong off-balancing and technical stand-up options.',['Control the knee line.','Keep knees pinched around the leg.','Use the outside foot safely according to ruleset.'],['guard','ashi','off-balance']),
  T('x-guard','X Guard','Guard','Open Guard','Both','Intermediate','A deep open guard under the opponent’s base using crossed hooks to stretch their stance and expose sweeps or back entries.',['Get underneath their center of gravity.','Extend and retract the hooks to disrupt balance.','Control one leg while directing their upper body.'],['guard','x-guard','open-guard']),

  T('knee-cut','Knee Cut Pass','Pass','Open Guard / Half Guard','Both','Beginner','A pressure pass that drives the lead knee across the opponent’s thigh while winning upper-body control and clearing the hips.',['Win inside knee position.','Control the far shoulder or underhook.','Keep the knee line heavy while freeing the trailing foot.'],['pass','knee-cut','pressure','fundamental']),
  T('x-pass','X Pass','Pass','Open Guard','Both','Beginner','A standing open-guard pass that redirects the opponent’s legs to one side while you step around the hip line.',['Control the legs before circling.','Keep posture balanced and hips back enough to avoid entries.','Beat the knee line before settling side control.'],['pass','standing','open-guard']),
  T('toreando','Toreando Pass','Pass','Open Guard','Both','Beginner','A loose passing method that controls the lower legs and rapidly redirects them while circling outside the opponent’s frames.',['Move the legs and your feet together.','Keep distance from hooks until the angle is won.','Settle chest pressure after clearing the knees.'],['pass','standing','speed-pass']),
  T('body-lock-pass','Body Lock Pass','Pass','Butterfly / Seated Guard','Both','Intermediate','A pressure pass against seated or butterfly guard that locks around the torso and compresses the opponent’s knees while you clear the legs.',['Connect chest-to-chest before advancing.','Keep your hips low and knees active.','Clear one knee line at a time.'],['pass','body-lock','pressure']),
  T('over-under','Over Under Pass','Pass','Open Guard','Both','Intermediate','A pressure pass controlling one leg over the shoulder and the other under your arm, folding the hips while walking around the guard.',['Keep your head and shoulder position tight.','Pin the hips before walking around.','Avoid leaving arm space for triangles or resets.'],['pass','pressure','open-guard']),
  T('double-under','Double Under Pass','Pass','Open Guard','Both','Intermediate','A stack-style pass that scoops under both legs, compresses the hips and walks around once the opponent’s knees are controlled.',['Keep the elbows tight.','Elevate the hips before changing angle.','Move gradually to avoid giving back exposure.'],['pass','stack','pressure']),
  T('leg-drag','Leg Drag Pass','Pass','Open Guard','Both','Intermediate','A passing position that redirects one leg across your body, pins the opponent’s hips and exposes the side or back.',['Control the hip after dragging the leg.','Keep their knees pointing away from you.','Use the position to settle side control or back exposure.'],['pass','leg-drag','open-guard']),
  T('folding-pass','Folding Pass','Pass','Open Guard','Both','Intermediate','A pressure pass that folds both knees toward one side, pinning the hips and shoulders while you circle to side control.',['Connect knees toward the chest and side.','Use shoulder pressure to limit turning.','Walk around the blocked hip rather than forcing through frames.'],['pass','pressure','folding']),
  T('smash-half-pass','Half Guard Smash Pass','Pass','Top Half Guard','Both','Beginner','A pressure-based half-guard pass that flattens the opponent, wins crossface and underhook, then frees the trapped knee and foot.',['Flatten them before fighting the legs.','Crossface and underhook remove much of the guard’s power.','Free the knee line before the ankle.'],['pass','half-guard','pressure','fundamental']),
  T('circle-pass','Circle Pass','Pass','Open Guard','Both','Beginner','A loose open-guard pass that circles around the feet and knees after redirecting the opponent’s frames and hooks.',['Keep the legs pointed away from your path.','Circle only after the knee line is beaten.','Close distance once you are past the feet.'],['pass','standing','movement']),

  T('side-control','Side Control','Control','Top Side Control','Both','Beginner','A dominant pin across the opponent’s torso that controls their shoulders and hips while denying easy guard recovery.',['Control both the head/shoulder line and hips.','Adjust pressure instead of staying static.','Expect frames and hip movement before attacking submissions.'],['control','side-control','fundamental']),
  T('mount','Mount','Control','Top Mount','Both','Beginner','A dominant top position sitting over the opponent’s torso, offering strong control and high-percentage submissions.',['Keep knees connected to the body.','Use hands for balance before attacking.','Climb higher when the opponent’s elbows separate from their ribs.'],['control','mount','fundamental']),
  T('back-control','Back Control','Control','Back','Both','Beginner','A dominant position behind the opponent using seatbelt-style upper-body control and hooks or body positioning to limit rotation.',['Chest stays connected to the back.','Win hand fighting before attacking the neck.','Follow the shoulders when the opponent tries to turn.'],['control','back','fundamental']),
  T('north-south','North South','Control','Top Control','Both','Beginner','A top pin with your torso aligned over the opponent’s head and shoulders, useful for pinning, transitions and choke setups.',['Keep hips low enough to deny elbow recovery.','Control near-side arms during transitions.','Circle with pressure instead of hopping over frames.'],['control','north-south']),
  T('front-headlock','Front Headlock','Control','Turtle / Standing','Both','Intermediate','A control over the opponent’s head and arm from the front, linking snapdowns, go-behinds, guillotines and back takes.',['Keep your chest heavy over the upper back.','Control an arm when possible.','Use movement to create an angle instead of hanging on the neck.'],['control','front-headlock','wrestling']),

  T('upa-escape','Bridge and Roll Escape','Escape','Bottom Mount','Both','Beginner','A mount escape that traps one side of the opponent’s base and uses a bridge plus turn to reverse the position.',['Trap the arm and foot on the same side.','Bridge high before turning.','Follow through into top position rather than stopping halfway.'],['escape','mount','fundamental']),
  T('elbow-escape','Elbow Knee Escape','Escape','Bottom Mount','Both','Beginner','A mount escape that creates hip space, inserts a knee inside and rebuilds half guard or full guard.',['Frame before shrimping.','Move the hips, not only the arms.','Connect knee to elbow to close the gap.'],['escape','mount','guard-recovery']),
  T('side-control-frame-escape','Frame and Hip Escape','Escape','Bottom Side Control','Both','Beginner','A core side-control escape using frames at the neck/hip, hip movement and knee insertion to recover guard.',['Build frames before moving the hips.','Turn slightly onto your side.','Insert the knee before trying to pull full guard.'],['escape','side-control','guard-recovery']),
  T('underhook-escape-side','Underhook to Knees Escape','Escape','Bottom Side Control','Both','Intermediate','A side-control escape that wins an underhook and turns into a wrestle-up or turtle-style recovery rather than replacing guard directly.',['Protect the neck while entering the underhook.','Get onto your side before coming up.','Build height from elbow to hand.'],['escape','side-control','wrestle-up']),
  T('back-escape','Back Control Escape','Escape','Defending Back Control','Both','Beginner','A systematic escape that first protects the neck, then gets the shoulders to the mat and clears the opponent’s hooks.',['Two hands protect the choking hand first.','Move shoulders toward the mat before fighting everything at once.','Clear the lower-body control after the neck is safe.'],['escape','back','fundamental']),
  T('technical-standup','Technical Stand-up','Escape','Ground to Standing','Both','Beginner','A safe movement for returning to the feet while maintaining distance and protecting against forward pressure.',['Post one hand behind you.','Keep the opposite hand protecting distance.','Lift the hips and retract the lower leg before standing.'],['movement','stand-up','fundamental']),

  T('armbar-defense','Armbar Defense','Defense','Submission Defense','Both','Beginner','A set of defensive priorities for keeping the elbow from being isolated, connecting the hands and rebuilding safe shoulder alignment before escaping.',['Prevent full arm extension first.','Connect hands or the threatened arm to your body.','Escape the elbow line before trying to pull free.'],['defense','armbar','submission-defense']),
  T('triangle-defense','Triangle Defense','Defense','Submission Defense','Both','Beginner','Defensive positioning against the triangle focused on posture, elbow position and removing the angle before the choke is fully locked.',['Posture before the lock is deep.','Keep the trapped elbow from crossing too far.','Work to square the shoulders and open the leg configuration.'],['defense','triangle','submission-defense']),
  T('guillotine-defense','Guillotine Defense','Defense','Front Headlock Defense','Both','Beginner','A defensive framework for protecting the neck, improving head position and moving toward the safe side before trying to free the head.',['Hand fight the choking arm early.','Keep moving toward safer alignment.','Do not pull blindly against a tight finish.'],['defense','guillotine','front-headlock']),
  T('crossface-defense','Crossface Prevention','Defense','Bottom Half / Side Control','Both','Beginner','A positional defense that uses frames, head position and inside-arm control to stop the opponent from flattening you with a crossface.',['Keep inside frames active.','Protect the space beside your head.','Turn toward your structure rather than accepting flat shoulders.'],['defense','crossface','frames']),
  T('sprawl','Sprawl','Defense','Standing / Takedown Defense','Both','Beginner','A takedown defense that drives the hips back and down while controlling the attacker’s head and shoulders to remove their access to your legs.',['Heavy hips without overextending the chest.','Control head position.','Circle to an angle after stopping forward drive.'],['defense','wrestling','takedown']),

  T('single-leg','Single Leg','Takedown','Standing','Both','Beginner','A takedown that controls one leg and finishes by off-balancing, running the pipe or switching direction.',['Head stays tight to the torso.','Control above or below the knee securely.','Finish by moving the opponent’s balance, not lifting unnecessarily.'],['takedown','wrestling','fundamental']),
  T('double-leg','Double Leg','Takedown','Standing','Both','Intermediate','A wrestling takedown attacking both legs with level change, penetration step and forward/sideways drive.',['Change level before reaching.','Keep posture strong through the shot.','Turn the corner instead of driving straight into strong frames.'],['takedown','wrestling']),
  T('snapdown','Snapdown','Takedown','Standing','Both','Beginner','A standing attack that pulls the opponent’s head and upper body below your level, exposing front headlock or go-behind opportunities.',['Use posture and timing, not only arm pulling.','Move your feet as their posture breaks.','Immediately connect to front headlock or the back.'],['takedown','front-headlock','wrestling']),
  T('osoto-gari','Osoto Gari','Takedown','Standing','Gi','Intermediate','A major outer reap that breaks the opponent’s balance backward while your attacking leg reaps their supporting leg.',['Off-balance before reaping.','Keep chest and head driving through the line of balance.','Reap the leg rather than kicking it.'],['takedown','judo','gi']),
  T('ouchi-gari','Ouchi Gari','Takedown','Standing','Gi','Beginner','An inner reap that attacks the opponent’s stance when their weight is committed backward or their feet narrow.',['Close distance before the reap.','Control upper-body posture.','Reap and drive as one connected action.'],['takedown','judo','gi']),
  T('sasae','Sasae Tsurikomi Ashi','Takedown','Standing','Gi','Intermediate','A foot-block throw that combines upper-body steering with a precise block at the opponent’s advancing foot or ankle.',['Create forward movement first.','Block rather than sweep the foot.','Rotate the upper body around the blocked step.'],['takedown','judo','gi'])
]

export const catalogTechniques:CatalogTechnique[]=[...baseCatalogTechniques,...extraCatalogTechniques]

const mkFlow=(slug:string,name:string,nodes:Array<[string,string,'position'|'reaction'|'technique'|'submission',number,number]>,edges:Array<[string,string,string,string]>):Flow=>({
  id:'template-'+slug,name,description:'Curated BJJ Helper starter system.',tags:[],references:[],
  createdAt:'2026-09-29T00:00:00.000Z',updatedAt:'2026-09-29T00:00:00.000Z',
  nodes:nodes.map(([id,label,kind,x,y])=>({id,position:{x,y},data:{label,kind}})),
  edges:edges.map(([id,source,target,label])=>({id,source,target,label}))
})

export const catalogSystems:CatalogSystem[]=[
  {
    slug:'open-guard-passing',name:'Open Guard Passing System',level:'Beginner',giMode:'Both',
    description:'A simple standing passing tree: first control the legs, read how the guard reacts, then choose a loose or pressure route before settling a pin.',
    tags:['passing','open-guard','standing'],
    flow:mkFlow('open-guard-passing','Open Guard Passing System',[
      ['a','Standing vs Open Guard','position',0,120],['b','Legs stay extended / mobile','reaction',240,0],['c','Knees come tight / frames strong','reaction',240,150],['d','Toreando / X Pass','technique',500,0],['e','Knee Cut / Folding Pass','technique',500,150],['f','Side Control','position',760,70],['g','Mount / North South','position',980,70]
    ],[['e1','a','b','outside lane open'],['e2','a','c','inside lane available'],['e3','b','d','redirect legs'],['e4','c','e','connect pressure'],['e5','d','f','clear knee line'],['e6','e','f','settle pin'],['e7','f','g','advance']])
  },
  {
    slug:'top-half-pressure',name:'Top Half Guard Pressure System',level:'Beginner',giMode:'Both',
    description:'A pressure-oriented top-half system built around flattening the opponent before freeing the trapped leg.',
    tags:['half-guard','passing','pressure'],
    flow:mkFlow('top-half-pressure','Top Half Guard Pressure System',[
      ['a','Top Half Guard','position',0,100],['b','Win Crossface','technique',230,30],['c','Win Underhook','technique',230,170],['d','Opponent flattened','reaction',480,100],['e','Free knee line','technique',720,100],['f','Side Control','position',950,100]
    ],[['e1','a','b','head control'],['e2','a','c','inside arm control'],['e3','b','d','combine'],['e4','c','d','combine'],['e5','d','e','hips pinned'],['e6','e','f','clear foot']])
  },
  {
    slug:'closed-guard-fundamentals',name:'Closed Guard Fundamentals',level:'Beginner',giMode:'Both',
    description:'A compact closed-guard decision tree based on posture control, angle creation and reactions to the opponent standing or staying low.',
    tags:['closed-guard','sweeps','submissions'],
    flow:mkFlow('closed-guard-fundamentals','Closed Guard Fundamentals',[
      ['a','Closed Guard','position',0,120],['b','Opponent postures tall','reaction',240,20],['c','Opponent stays forward','reaction',240,210],['d','Hip Bump / Sit-up attack','technique',510,20],['e','Armbar / Triangle angle','technique',510,210],['f','Top position','position',780,20],['g','Submission chain','submission',780,210]
    ],[['e1','a','b','posture rises'],['e2','a','c','posture stays low'],['e3','b','d','attack base'],['e4','c','e','create angle'],['e5','d','f','sweep'],['e6','e','g','isolate arm/neck']])
  },
  {
    slug:'mount-finishing',name:'Mount Finishing System',level:'Beginner',giMode:'Both',
    description:'A high-percentage mount tree: stabilize first, climb high, isolate an elbow and choose between arm triangle, americana or armbar.',
    tags:['mount','submission','control'],
    flow:mkFlow('mount-finishing','Mount Finishing System',[
      ['a','Stable Mount','position',0,110],['b','Opponent elbows tight','reaction',240,20],['c','Opponent frames / extends arm','reaction',240,200],['d','Climb to High Mount','technique',500,20],['e','Isolate elbow','technique',500,200],['f','Arm Triangle','submission',770,20],['g','Americana / Armbar','submission',770,200]
    ],[['e1','a','b','defends compact'],['e2','a','c','frames'],['e3','b','d','walk elbows up'],['e4','c','e','pin arm'],['e5','d','f','arm crosses neck'],['e6','e','g','elbow separates']])
  },
  {
    slug:'bottom-half-wrestle-up',name:'Bottom Half Guard Wrestle-up',level:'Intermediate',giMode:'Both',
    description:'A bottom-half system for avoiding flat shoulders, building the underhook and converting dogfight into sweeps or top position.',
    tags:['half-guard','wrestle-up','sweeps'],
    flow:mkFlow('bottom-half-wrestle-up','Bottom Half Guard Wrestle-up',[
      ['a','Bottom Half Guard','position',0,100],['b','Knee Shield + Frames','technique',230,100],['c','Win Underhook','technique',470,100],['d','Dogfight','position',710,100],['e','Opponent posts wide','reaction',940,20],['f','Opponent drives in','reaction',940,180],['g','Far-leg / Old School Sweep','technique',1180,20],['h','Come up / Knee tap','technique',1180,180]
    ],[['e1','a','b','make space'],['e2','b','c','inside lane'],['e3','c','d','come to elbow/hand'],['e4','d','e','base widens'],['e5','d','f','pressure forward'],['e6','e','g','attack far base'],['e7','f','h','wrestle up']])
  },
  {
    slug:'back-control',name:'Back Control & Finish System',level:'Beginner',giMode:'Both',
    description:'A back-control tree that prioritizes staying attached and winning the hand fight before committing to a choke.',
    tags:['back','control','choke'],
    flow:mkFlow('back-control','Back Control & Finish System',[
      ['a','Back Control','position',0,100],['b','Seatbelt + lower-body control','technique',240,100],['c','Opponent hand-fights','reaction',500,20],['d','Opponent turns shoulders','reaction',500,180],['e','Trap / clear defending hand','technique',760,20],['f','Follow rotation / chair-sit reset','technique',760,180],['g','Rear Naked Choke / Collar Choke','submission',1030,100]
    ],[['e1','a','b','stabilize'],['e2','b','c','neck defended'],['e3','b','d','tries escape'],['e4','c','e','win hands'],['e5','d','f','stay attached'],['e6','e','g','neck opens'],['e7','f','g','re-secure and attack']])
  }
]

export const catalogCounts=()=>catalogTechniques.reduce<Record<string,number>>((acc,t)=>{acc[t.category]=(acc[t.category]||0)+1;return acc},{})

export function toPersonalTechnique(item:CatalogTechnique):Technique{
  const stamp=new Date().toISOString()
  return {
    id:crypto.randomUUID(),name:item.name,category:item.category,
    position:item.position,giMode:item.giMode,notes:item.description+'\n\nKey points:\n- '+item.keyPoints.join('\n- '),
    videoUrl:item.references[0]?.url||'',tags:[...item.tags,item.level.toLowerCase()],confidence:2,drillingCount:0,isFavorite:false,inDrillQueue:false,
    createdAt:stamp,updatedAt:stamp
  }
}

export function cloneSystem(item:CatalogSystem):Flow{
  const stamp=new Date().toISOString()
  const prefix=crypto.randomUUID().slice(0,8)
  const idMap=new Map(item.flow.nodes.map(n=>[n.id,prefix+'-'+n.id]))
  return {
    ...item.flow,id:crypto.randomUUID(),name:item.name,description:item.description,createdAt:stamp,updatedAt:stamp,
    nodes:item.flow.nodes.map(n=>({...n,id:idMap.get(n.id)!,data:{...n.data},position:{...n.position}})),
    edges:item.flow.edges.map(e=>({...e,id:crypto.randomUUID(),source:idMap.get(e.source)!,target:idMap.get(e.target)!}))
  }
}
