const KEY='lifeos_v1';
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function loadDB(){try{return JSON.parse(localStorage.getItem(KEY))||defaultDB()}catch{return defaultDB()}}
function saveDB(d){
  try{
    localStorage.setItem(KEY,JSON.stringify(d));
    return true;
  }catch(e){
    toast('Storage full — try removing a photo or two');
    return false;
  }
}
function defaultDB(){return{
  projects:{
    volund:{name:'Völund Watches',notes:'',emoji:'⚙'},
    forex:{name:'Forex Trading',notes:'',emoji:'↗'},
    photobooth:{name:'Photobooth',notes:'',emoji:'◎'},
    repairs:{name:'Repairs',notes:'',emoji:'⚒'},
    family:{name:'Family & Personal',notes:'',emoji:'⌂'},
  },
  repairCategories:['Car','House','Other'],
  tasks:[],reminders:[],
  tools:[
    {id:uid(),name:'Hammer',link:''},{id:uid(),name:'Screwdriver Set',link:''},
    {id:uid(),name:'Drill / Driver',link:''},{id:uid(),name:'Impact Wrench (DeWalt DCF921B)',link:''},
    {id:uid(),name:'Circular Saw',link:''},{id:uid(),name:'Tape Measure',link:''},
    {id:uid(),name:'Level',link:''},{id:uid(),name:'Pry Bar',link:''},
    {id:uid(),name:'Utility Knife',link:''},{id:uid(),name:'Kärcher Pressure Washer',link:''},
    {id:uid(),name:'Watch Case Back Opener',link:''},{id:uid(),name:'Watch Dial Removal Tool',link:''},
    {id:uid(),name:'Creality K1 Max 3D Printer',link:''},
  ],
  settings:{morningDigest:false,morningDigestTime:'08:00',notificationsEnabled:false}
}}

let db=loadDB();
// Migration: clean up repairCat on non-repair tasks
db.tasks.forEach(t=>{if(t.project!=='repairs'&&t.repairCat)t.repairCat=null});
saveDB(db);
let curView='dashboard',curProject=null,curRepairCat=null,activeTab='tasks';
const PROJ_GRADS=['pc-g1','pc-g2','pc-g3','pc-g4','pc-g5'];


// ── Stoic daily quotes ───────────────────────────────────────
const STOICS=[
  {q:"You have power over your mind, not outside events. Realize this, and you will find strength.",a:"Marcus Aurelius",r:"Most of what stresses us today is outside our control — the traffic, the weather, what someone thinks of us. Your energy is finite. Spend it only where your actions can actually change the outcome."},
  {q:"The impediment to action advances action. What stands in the way becomes the way.",a:"Marcus Aurelius",r:"That problem you're avoiding is not blocking your path — it is your path. Every obstacle is information. Work with it, not around it."},
  {q:"Waste no more time arguing about what a good man should be. Be one.",a:"Marcus Aurelius",r:"It's easy to discuss virtue endlessly. It's harder to simply act with honesty, patience, and care in the next five minutes. Start there."},
  {q:"Never esteem anything as of advantage to you that will make you break your word or lose your self-respect.",a:"Marcus Aurelius",r:"No deal, no shortcut, no convenience is worth the cost of your integrity. Once lost, trust — in yourself and from others — is slow to rebuild."},
  {q:"The best revenge is to be unlike him who performed the injury.",a:"Marcus Aurelius",r:"When someone acts poorly toward you, the temptation to retaliate is strong. The stoic answer: become better, not bitter. Your character is your response."},
  {q:"Accept the things to which fate binds you, and love the people with whom fate brings you together.",a:"Marcus Aurelius",r:"Resistance to what is creates suffering. When you can't change your circumstances, the one thing left is your attitude toward them. That choice is always yours."},
  {q:"If it is not right, do not do it. If it is not true, do not say it.",a:"Marcus Aurelius",r:"Two simple filters for almost every decision you'll face today. Before acting, ask: is this right? Before speaking, ask: is this true? Most regret comes from ignoring one of these."},
  {q:"Confine yourself to the present.",a:"Marcus Aurelius",r:"The past is fixed and the future is uncertain. Right now, this moment, is the only place where you can actually do anything. Be here."},
  {q:"How much more grievous are the consequences of anger than the causes of it.",a:"Marcus Aurelius",r:"That sharp reply, that slammed door — the damage they cause almost always outlasts the frustration that caused them. Pause before reacting. The cost of anger is rarely worth it."},
  {q:"Very little is needed to make a happy life; it is all within yourself, in your way of thinking.",a:"Marcus Aurelius",r:"Happiness is not a destination requiring specific conditions. It is a practice, available now, in how you interpret what's in front of you."},
  {q:"Make the best use of what is in your power, and take the rest as it happens.",a:"Epictetus",r:"You are not powerless, but your power is limited. Focus your effort on your choices, your words, your habits. The rest you receive, not control."},
  {q:"Man is not worried by real problems so much as by his imagined anxieties about real problems.",a:"Epictetus",r:"Before you spend energy on a worry, ask: is this actually happening right now, or am I rehearsing a catastrophe that may never arrive? Most fear lives in the future, not the present."},
  {q:"It's not what happens to you, but how you react to it that matters.",a:"Epictetus",r:"Between every event and your response, there is a gap. That gap is where your freedom lives. Training yourself to widen that gap is the whole of stoic practice."},
  {q:"First say to yourself what you would be; and then do what you have to do.",a:"Epictetus",r:"Clarity about who you want to become is the foundation of every good action. Before the day begins, ask: what kind of person do I want to be today?"},
  {q:"Seek not the good in external things; seek it in yourself.",a:"Epictetus",r:"The thing you think will finally make you feel complete — the achievement, the approval, the possession — won't. The source of contentment is internal. Always has been."},
  {q:"He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.",a:"Epictetus",r:"Inventory what's already working. Your health, your relationships, your skills — things you overlook because they're familiar. Gratitude is a habit, not a feeling that arrives on its own."},
  {q:"Don't explain your philosophy. Embody it.",a:"Epictetus",r:"Less talking about your values, more living them. The people in your life don't need to hear your principles — they need to see them in how you treat them."},
  {q:"Wealth consists not in having great possessions, but in having few wants.",a:"Epictetus",r:"The gap between what you have and what you want determines your sense of lack. You can close that gap by acquiring more, or by wanting less. One of those is far more sustainable."},
  {q:"If you want to improve, be content to be thought foolish and stupid.",a:"Epictetus",r:"Every expert was once a beginner who looked clumsy. The fear of looking incompetent keeps more people from growing than actual inability does. Let go of the image."},
  {q:"No man is free who is not master of himself.",a:"Epictetus",r:"Freedom is not about what others allow you to do. It's about whether your impulses or your reason are in charge. Self-discipline is the only true liberation."},
  {q:"Luck is what happens when preparation meets opportunity.",a:"Seneca",r:"The people who seem to 'get lucky' are usually the ones who put in the quiet work long before the opportunity appeared. Fortune favors the prepared."},
  {q:"We suffer more in imagination than in reality.",a:"Seneca",r:"The dread of a difficult conversation, a hard task, an uncertain outcome — almost always worse than the thing itself. Do it. The fear shrinks on contact with reality."},
  {q:"Begin at once to live, and count each separate day as a separate life.",a:"Seneca",r:"You don't have to fix everything or become someone different by the end of the year. You only have to show up well today. One day, done with intention, is enough."},
  {q:"It is not that I am brave, it is that I am patient.",a:"Seneca",r:"Courage is often less about fearlessness and more about endurance — choosing to continue despite discomfort. Patience is a form of quiet bravery most people overlook."},
  {q:"The mind that is anxious about future events is miserable.",a:"Seneca",r:"Anticipatory suffering is real suffering — and it's optional. You can acknowledge uncertainty without being consumed by it. Note the worry, then return to what's in front of you."},
  {q:"Associate with those who will make a better man of you.",a:"Seneca",r:"Your environment shapes you more than your intentions do. The people you spend the most time with raise or lower your standards without you even noticing."},
  {q:"Retire into yourself as much as possible.",a:"Seneca",r:"Noise — social, digital, environmental — pulls your attention outward constantly. Reclaiming even a few minutes of stillness daily reconnects you to what you actually think and want."},
  {q:"A gem cannot be polished without friction, nor a man perfected without trials.",a:"Seneca",r:"The difficulty you're in right now is doing something to you. It's developing patience, resilience, or clarity you couldn't have gained any other way. Let it work."},
  {q:"If a man knows not which port he sails, no wind is favorable.",a:"Seneca",r:"Busyness without direction is just motion. Before you fill your day with activity, ask what you're actually building toward. The right goals make every small action meaningful."},
  {q:"True happiness is to enjoy the present, without anxious dependence on the future.",a:"Seneca",r:"You can plan wisely and still be fully present. The Stoics weren't against planning — they were against letting the future rob you of the only moment you actually inhabit."},
  {q:"Difficulties strengthen the mind, as labor does the body.",a:"Seneca",r:"You wouldn't expect to get stronger by avoiding the gym. The same logic applies to your character. The challenges you'd rather skip are often exactly what you need."},
  {q:"He who fears death will never do anything worth of a man who is alive.",a:"Seneca",r:"Awareness of mortality is not morbid — it's clarifying. If your time is finite, what deserves it? Let that question guide your choices today."},
  {q:"Every new beginning comes from some other beginning's end.",a:"Seneca",r:"What you're leaving behind is making room for something else. The ending, even when painful, is also the first condition of whatever comes next."},
  {q:"You act like mortals in all that you fear and like immortals in all that you desire.",a:"Seneca",r:"We treat time as unlimited when pursuing pleasures, and scarce when facing fears. Reversing this — treating time as precious and fear as temporary — changes how you live."},
  {q:"Putting things off is the biggest waste of life.",a:"Seneca",r:"The task you've been avoiding for weeks takes the same time today as it did then. But today you also carry the weight of all the days you didn't do it. Start now."},
  {q:"Nothing is more honorable than a grateful heart.",a:"Seneca",r:"Gratitude is not weakness or naivety. It is a form of clear seeing — noticing what's working alongside what isn't. It's also one of the fastest ways to shift your state."},
  {q:"Life is long if you know how to use it.",a:"Seneca",r:"We don't run out of time — we waste it. The Stoics believed most of us have more than enough life; we just give too much of it to distraction, resentment, and waiting."},
  {q:"To be everywhere is to be nowhere.",a:"Seneca",r:"Divided attention is no attention. When you try to be fully present in every conversation, every platform, every demand simultaneously, you show up fully in none of them."},
  {q:"He who is brave is free.",a:"Seneca",r:"Fear of judgment, failure, loss — these are the chains most people never question. The moment you act despite fear, you discover how much of your life was unnecessarily constrained."},
  {q:"Treat your inferiors as you would be treated by your superiors.",a:"Seneca",r:"Character is revealed not in how you act toward those with power over you, but toward those who have none. This is the truest test of who you are."},
  {q:"Cling tooth and nail to the following rule: not to give in to adversity, never to trust prosperity.",a:"Seneca",r:"Hard times demand your best. Good times demand your vigilance. The Stoic stays steady in both, because neither lasts forever."},
  {q:"The whole future lies in uncertainty: live immediately.",a:"Seneca",r:"There is no risk-free moment ahead where life will finally feel settled enough to begin. This is that moment. Live it."},
  {q:"Omnia aliena sunt, tempus tantum nostrum est. All things are foreign; time alone is ours.",a:"Seneca",r:"Possessions, reputation, comfort — all of it can be taken. Your time is the one resource that is truly yours. Spend it with this in mind."},
  {q:"It does not matter how slowly you go as long as you do not stop.",a:"Attributed — Stoic tradition",r:"Progress is not always visible. Some of the most important growth happens imperceptibly, through thousands of small consistent choices. Keep going."},
  {q:"The universe is change; our life is what our thoughts make it.",a:"Marcus Aurelius",r:"Everything around you is in flux — businesses, relationships, seasons, plans. The one constant you can shape is your inner response. Tend to it daily."},
  {q:"Do not indulge in dreams of having what you have not, but reckon up the chief of the blessings you do have.",a:"Marcus Aurelius",r:"Your mind will always find what's missing if you let it. Train it instead to also find what's present. Both are real. You choose where to rest your attention."},
  {q:"A man's worth is no greater than the worth of his ambitions.",a:"Marcus Aurelius",r:"Small ambitions produce small lives — not because of fate, but because we calibrate our effort to our expectations. Aim at something worthy of your full attention."},
  {q:"Loss is nothing else but change, and change is Nature's delight.",a:"Marcus Aurelius",r:"What you grieve as loss, nature experiences as transformation. The job that ended, the relationship that changed, the version of yourself that had to go — all of it is transition, not destruction."},
  {q:"You have power over your mind — not outside events. Realize this, and you will find strength.",a:"Marcus Aurelius",r:"Read this again slowly. It contains the core of Stoicism in a single sentence. Your mind is yours. Events are not. Everything follows from that."},
  {q:"When you arise in the morning, think of what a precious privilege it is to be alive — to breathe, to think, to enjoy, to love.",a:"Marcus Aurelius",r:"Before the day fills with demands and distractions, take one moment to acknowledge that you're here. Fully alive, with the capacity to act, to connect, to build. That's not nothing."},
  {q:"The object of life is not to be on the side of the majority, but to escape finding oneself in the ranks of the insane.",a:"Marcus Aurelius",r:"Conformity is easy. Thinking clearly and acting accordingly is hard, especially when the crowd is moving in another direction. Trust your reason over the consensus."},
  {q:"Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present.",a:"Marcus Aurelius",r:"Whatever is coming, you will face it with the same mind you have now — which has gotten you through every hard thing so far. You don't need more weapons. You need to trust the ones you have."},
  {q:"The happiness of your life depends upon the quality of your thoughts.",a:"Marcus Aurelius",r:"Not your income, your status, your circumstances. Your thoughts. This is either the most empowering truth you've heard or the most inconvenient. Either way, it's worth sitting with."},
  {q:"Choose not to be harmed — and you won't feel harmed. Don't feel harmed — and you haven't been.",a:"Marcus Aurelius",r:"This is not denial. It's the recognition that harm requires your participation. Many things happen to us. Relatively few of them actually wound us without our own cooperation."},
  {q:"If someone is able to show me that what I think or do is not right, I will happily change.",a:"Marcus Aurelius",r:"The willingness to be wrong is not weakness — it's one of the sharpest tools available to a rational mind. Defend your position until you shouldn't, then update without shame."},
  {q:"Our life is what our thoughts make it.",a:"Marcus Aurelius",r:"Two people in identical circumstances can experience entirely different lives depending on how they interpret what's happening. You are not your situation. You are your relationship to it."},
  {q:"The soul becomes dyed with the color of its thoughts.",a:"Marcus Aurelius",r:"What you think about repeatedly becomes part of you — your character, your mood, your instincts. Choose your mental diet with the same care you'd choose any other."},
  {q:"Receive without pride, relinquish without struggle.",a:"Marcus Aurelius",r:"Hold good things lightly. Enjoy them while they're here. When they go — and most things go — release them without fighting what cannot be changed."},
  {q:"To live a good life: we have the potential for it. If we can learn to be indifferent to what makes no difference.",a:"Marcus Aurelius",r:"Most of what we agonize over makes no real difference. Distinguishing what truly matters from what merely feels urgent is a skill. Practice it today."},
  {q:"Perfection of character is this: to live each day as if it were your last, without frenzy, without apathy, without pretense.",a:"Marcus Aurelius",r:"Not recklessly — but fully. With intention. Saying what matters, doing what counts, treating people as if this were your last chance to do so. Because eventually, it will be."},
  {q:"He suffers more than necessary, who suffers before it is necessary.",a:"Seneca",r:"Pre-suffering — imagining difficulty before it arrives — doubles your pain. You endure the anticipation and then the event itself. When something hard comes, face it then."},
  {q:"We are more often frightened than hurt; and we suffer more from imagination than from reality.",a:"Seneca",r:"Take an honest look at your current fears. How many of them are vivid imaginings of things that haven't happened? Fear is a poor navigator. Reason is better."},
  {q:"What need is there to weep over parts of life? The whole of it calls for tears.",a:"Seneca",r:"Life contains real difficulty and real loss. The Stoics didn't pretend otherwise. But the question is always: will you let difficulty define you, or will you define your response to it?"},
  {q:"No great thing is created suddenly.",a:"Epictetus",r:"Everything you admire — a skill, a relationship, a body of work — was built slowly, invisibly, through repeated small efforts. Be patient with your own becoming."},
  {q:"Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are, and you will have a tranquil flow of life.",a:"Epictetus",r:"This is radical acceptance — not passivity. You still act. But you stop fighting reality as though it should have been otherwise. It wasn't. Work from here."},
  {q:"Practice yourself in little things, and thence proceed to greater.",a:"Epictetus",r:"Discipline doesn't arrive with a big decision. It's built through small choices: getting up when you said you would, doing the task you scheduled, keeping the small promise. These accumulate into character."},
  {q:"There is only one way to happiness and that is to cease worrying about things which are beyond the power of our will.",a:"Epictetus",r:"Make a list of your current concerns. Next to each one, ask: is this in my control? What isn't, release. What is, act on. The list usually gets very short."},
  {q:"People are not disturbed by the things that happen, but by their opinions about those things.",a:"Epictetus",r:"The event is one thing. Your interpretation of it is another. Between them is a gap where your freedom lives. What story are you telling about what's happening to you?"},
  {q:"Only the educated are free.",a:"Epictetus",r:"Not credentialed — educated in the sense of knowing how to think clearly, manage your reactions, and act in accordance with reason. That education never stops."},
  {q:"He is a wise man who does not grieve for the things which he has not.",a:"Epictetus",r:"Absence is only felt when you compare what is to what you believe should be. The Stoic doesn't stop noticing absence — they stop being ruled by it."},
  {q:"First learn the meaning of what you say, and then speak.",a:"Epictetus",r:"Most arguments, most misunderstandings, most regretted words come from speaking before thinking. The pause between thought and word is worth cultivating."},
  {q:"Men are disturbed not by the things that happen, but by their opinions about the things.",a:"Epictetus",r:"Your emotions are largely downstream of your beliefs. Change how you interpret an event, and your emotional response to it changes too. This is practical, not theoretical."},
  {q:"Gratitude is the sign of noble souls.",a:"Aesop — Stoic tradition",r:"It takes nothing from you to acknowledge what's working. And it changes everything about how you experience the day. Start with one thing you're genuinely glad exists."},
  {q:"When you are offended at any man's fault, turn to yourself and study your own failings.",a:"Epictetus",r:"The irritation you feel toward others is often a mirror. The qualities that bother you most in people are sometimes the ones you're least comfortable acknowledging in yourself."},
  {q:"Freedom is the only worthy goal in life. It is won by disregarding things that lie beyond our control.",a:"Epictetus",r:"You can spend your life trying to control what cannot be controlled, or you can be free within what remains. The Stoic path is the second one."},
  {q:"Do not seek for things to happen the way you want them to; but wish that what happens happens the way it is, and you will find tranquility.",a:"Epictetus",r:"There is a kind of peace available on the other side of acceptance that fighting circumstances never provides. This doesn't mean giving up. It means working with reality, not against it."},
  {q:"The key is to keep company only with people who uplift you, whose presence calls forth your best.",a:"Epictetus",r:"Environment is underrated as a factor in who we become. Deliberately choose the people, the spaces, and the inputs that bring out the version of yourself you're trying to build."},
  {q:"To make the best of what is in our power, and take the rest as it naturally happens.",a:"Epictetus",r:"A clean division: maximum effort on what you control, equanimity about what you don't. Most suffering comes from mixing these up — agonizing over what you can't change, neglecting what you can."},
];

function stoicOfDay(){
  const day=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/(1000*60*60*24));
  return STOICS[day%STOICS.length];
}

function renderStoic(){
  const s=stoicOfDay();
  return`<div class="stoic-card">
    <div class="stoic-label">Daily Stoic</div>
    <div class="stoic-quote">${s.q}</div>
    <div class="stoic-author">— ${s.a}</div>
    <div class="stoic-reflection">${s.r}</div>
  </div>`;
}


// ── Daily Intention ──────────────────────────────────────────
function getIntention(){
  const today=toDay();
  const stored=JSON.parse(localStorage.getItem('lifeos_intention')||'{}');
  return stored.date===today?stored.text:'';
}
function saveIntention(text){
  localStorage.setItem('lifeos_intention',JSON.stringify({date:toDay(),text}));
}
function openIntentionModal(){
  const current=getIntention();
  openModal(`
    <div class="mh"><div class="mt">Today's Intention</div><button class="ib" onclick="closeModal()">&#10005;</button></div>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.6">What is the one thing you want to bring to today? A quality, a mindset, a commitment.</p>
    <div class="fg">
      <textarea class="fta" id="intention-input" placeholder="e.g. Be fully present with the people around me..." style="min-height:100px">${current}</textarea>
    </div>
    <div class="mf">
      <button class="btn btn-g" onclick="closeModal()">Cancel</button>
      <button class="btn btn-p" onclick="submitIntention()">Set Intention</button>
    </div>`);
  setTimeout(()=>{const el=document.getElementById('intention-input');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}},100);
}
function submitIntention(){
  const text=document.getElementById('intention-input').value.trim();
  if(!text){toast('Write something first');return}
  saveIntention(text);closeModal();render();toast('Intention set');
}
function renderIntention(){
  const text=getIntention();
  return`<div class="intention-card" onclick="openIntentionModal()">
    <div class="intention-label">Today's Intention</div>
    ${text
      ?`<div class="intention-text">${esc(text)}</div><div class="intention-edit-hint">Tap to edit</div>`
      :`<div class="intention-empty">What do you want to bring to today?</div><div class="intention-edit-hint">Tap to set your intention</div>`
    }
  </div>`;
}

// ── Grounding ────────────────────────────────────────────────
const GROUND_KEY='lifeos_last_ground';
function lastGroundedMins(){
  const t=localStorage.getItem(GROUND_KEY);
  if(!t)return 999;
  return Math.floor((Date.now()-parseInt(t))/60000);
}
function markGrounded(){localStorage.setItem(GROUND_KEY,Date.now().toString())}

function renderGroundBtn(){
  const mins=lastGroundedMins();
  const nudge=mins>=240;
  const label=mins>=999?'Not used today':mins<60?`Used ${mins}m ago`:`Used ${Math.floor(mins/60)}h ago`;
  return`<div class="ground-wrap">
    <button class="ground-btn" onclick="openGrounding()">
      <div class="ground-icon">&#9774;</div>
      <div class="ground-body">
        <div class="ground-title">Ground Yourself</div>
        <div class="ground-nudge ${nudge?'':'quiet'}">${nudge?'&#9679; Take a moment — it\'s been a while':label}</div>
      </div>
      <div style="color:var(--muted);font-size:18px">&#8250;</div>
    </button>
  </div>`;
}

let breathPhase=0,breathTimer=null;
function openGrounding(){
  markGrounded();
  openModal(`
    <div class="mh"><div class="mt">Ground Yourself</div><button class="ib" onclick="stopBreath();closeModal()">&#10005;</button></div>
    <div style="text-align:center;margin-bottom:4px">
      <p style="font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.6">Step away from your thoughts for 60 seconds. Follow the breath, then the senses.</p>
      <div class="breath-circle" id="breath-circle">Breathe</div>
      <div class="breath-label" id="breath-label">Press start when ready</div>
      <button class="btn btn-p" id="breath-start-btn" onclick="startBreath()" style="margin-bottom:24px">Start Breathing</button>
    </div>
    <div class="ground-step">
      <div class="ground-step-num">After breathing — notice</div>
      <div class="ground-step-text"><b>3 things</b> you can see right now.<br><b>2 things</b> you can physically feel.<br><b>1 thing</b> you can hear.</div>
    </div>
    <div class="ground-step" style="background:var(--surface2)">
      <div class="ground-step-num">Then ask yourself</div>
      <div class="ground-step-text">What is actually happening right now — not what I fear might happen, not what already happened — but right now, in this moment?</div>
    </div>`);
  render();
}

const BREATH_PHASES=[
  {label:'Breathe in...',dur:4000,cls:'expand'},
  {label:'Hold...',dur:7000,cls:'hold'},
  {label:'Breathe out...',dur:8000,cls:'shrink'},
];
let breathCycle=0,breathCount=0;
function startBreath(){
  const btn=document.getElementById('breath-start-btn');
  if(btn)btn.style.display='none';
  breathCycle=0;breathCount=0;
  runBreathPhase();
}
function runBreathPhase(){
  const circle=document.getElementById('breath-circle');
  const label=document.getElementById('breath-label');
  if(!circle||!label){stopBreath();return}
  const phase=BREATH_PHASES[breathCycle%3];
  circle.className='breath-circle '+phase.cls;
  label.textContent=phase.label;
  breathTimer=setTimeout(()=>{
    breathCycle++;
    if(breathCycle%3===0)breathCount++;
    if(breathCount>=3){
      if(circle)circle.className='breath-circle';
      if(label)label.textContent='Done. Notice how you feel.';
      return;
    }
    runBreathPhase();
  },phase.dur);
}
function stopBreath(){if(breathTimer)clearTimeout(breathTimer);breathTimer=null}

// ── Weekly Review ────────────────────────────────────────────
const REVIEW_KEY='lifeos_reviews';
function getReviews(){try{return JSON.parse(localStorage.getItem(REVIEW_KEY)||'[]')}catch{return[]}}
function saveReviews(arr){localStorage.setItem(REVIEW_KEY,JSON.stringify(arr))}
function isSunday(){return new Date().getDay()===0}
function thisWeekStr(){
  const d=new Date();
  d.setDate(d.getDate()-d.getDay());
  return d.toISOString().slice(0,10);
}
function getThisWeekReview(){return getReviews().find(r=>r.week===thisWeekStr())||null}

function renderWeeklyReview(){
  if(!isSunday())return'';
  const done=getThisWeekReview();
  return`<div class="review-card" onclick="openWeeklyReview()">
    <div class="review-label">Weekly Review — Sunday</div>
    <div class="review-title">${done?'This week\'s reflection':'How did this week go?'}</div>
    <div class="review-sub">${done?'Tap to view or edit your reflection':'Takes 2 minutes. Worth it.'}</div>
  </div>`;
}

const REVIEW_QS=[
  {id:'well',label:'What went well this week?',ph:'Wins, moments of growth, things you\'re proud of...'},
  {id:'better',label:'Where could you have shown up better?',ph:'Be honest, not harsh. What would you do differently?'},
  {id:'grateful',label:'What are you grateful for?',ph:'People, experiences, small things you noticed...'},
  {id:'intention',label:'What do you want to carry into next week?',ph:'One word, one intention, one commitment...'},
];
function openWeeklyReview(){
  const existing=getThisWeekReview()||{};
  openModal(`
    <div class="mh"><div class="mt">Weekly Review</div><button class="ib" onclick="closeModal()">&#10005;</button></div>
    <p style="font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.6">A moment to step back, be honest with yourself, and set your compass for the week ahead.</p>
    ${REVIEW_QS.map(q=>`
      <div class="review-q">
        <div class="review-q-label">${q.label}</div>
        <textarea id="rq-${q.id}" placeholder="${q.ph}">${esc(existing[q.id]||'')}</textarea>
      </div>`).join('')}
    <div class="mf">
      <button class="btn btn-g" onclick="closeModal()">Cancel</button>
      <button class="btn btn-p" onclick="submitWeeklyReview()">Save Reflection</button>
    </div>`);
}
function submitWeeklyReview(){
  const reviews=getReviews().filter(r=>r.week!==thisWeekStr());
  const entry={week:thisWeekStr(),date:toDay()};
  REVIEW_QS.forEach(q=>{entry[q.id]=document.getElementById(`rq-${q.id}`)?.value?.trim()||''});
  reviews.unshift(entry);
  saveReviews(reviews.slice(0,52));// keep one year
  saveDB(db);closeModal();render();toast('Reflection saved');
}
function openReviewHistory(){
  const reviews=getReviews();
  if(!reviews.length){toast('No reflections yet');return}
  openModal(`
    <div class="mh"><div class="mt">Past Reflections</div><button class="ib" onclick="closeModal()">&#10005;</button></div>
    <div style="max-height:60vh;overflow-y:auto">
      ${reviews.map(r=>`
        <div class="review-history-item">
          <div class="review-history-date">Week of ${fmtDateLong(r.week)}</div>
          ${REVIEW_QS.filter(q=>r[q.id]).map(q=>`
            <div class="review-history-q">${q.label}</div>
            <div class="review-history-a">${esc(r[q.id])}</div>
          `).join('')}
        </div>`).join('')}
    </div>`);
}



function openMindModal(){
  const s=stoicOfDay();
  const existing=getThisWeekReview()||{};
  const mins=lastGroundedMins();
  const groundLabel=mins>=999?'Not used today':mins<60?`Used ${mins}m ago`:`Used ${Math.floor(mins/60)}h ago`;
  const nudgeGround=mins>=240;

  openModal(`
    <div class="mh" style="padding:20px 24px 16px;border-bottom:1px solid var(--border);margin-bottom:0">
      <div class="mt">Mind</div>
      <button class="ib" onclick="closeModal()">&#10005;</button>
    </div>

    <div class="mind-section">
      <div class="mind-section-label">Today's Intention</div>
      ${getIntention()
        ?`<div style="font-family:var(--fd);font-size:17px;color:var(--text);line-height:1.4;margin-bottom:8px">${esc(getIntention())}</div>`
        :`<div style="font-size:13px;color:var(--muted);font-style:italic;margin-bottom:8px">What do you want to bring to today?</div>`
      }
      <button class="btn btn-s" style="font-size:12px;padding:6px 14px" onclick="closeModal();openIntentionModal()">${getIntention()?'Edit intention':'Set intention'}</button>
    </div>

    <div class="mind-section">
      <div class="mind-section-label">Ground Yourself ${nudgeGround?'&#9679;':''}</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px">${nudgeGround?'<span style="color:var(--accent);font-weight:600">It\'s been a while — take a moment</span>':groundLabel}</div>
      <button class="btn btn-s" style="font-size:12px;padding:6px 14px" onclick="closeModal();openGrounding()">Start breathing exercise</button>
    </div>

    <div class="mind-section">
      <div class="mind-section-label">Daily Stoic</div>
      <div style="font-family:var(--fd);font-size:15px;color:var(--text);line-height:1.5;margin-bottom:4px">${s.q}</div>
      <div style="font-size:11px;color:var(--muted);font-style:italic;margin-bottom:10px">— ${s.a}</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.6">${s.r}</div>
    </div>

    ${isSunday()?`
    <div class="mind-section">
      <div class="mind-section-label">Weekly Review ${!getThisWeekReview()?'&#9679;':''}</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px">${getThisWeekReview()?'You\'ve completed this week\'s reflection.':'Take 2 minutes to reflect on your week.'}</div>
      <button class="btn btn-s" style="font-size:12px;padding:6px 14px;margin-right:8px" onclick="closeModal();openWeeklyReview()">${getThisWeekReview()?'Edit reflection':'Start review'}</button>
      ${getReviews().length>0?`<button class="btn btn-g" style="font-size:12px;padding:6px 14px" onclick="closeModal();openReviewHistory()">Past reflections</button>`:''}
    </div>`:''}

    ${getReviews().length>0&&!isSunday()?`
    <div class="mind-section">
      <div class="mind-section-label">Past Reflections</div>
      <button class="btn btn-g" style="font-size:12px;padding:6px 14px" onclick="closeModal();openReviewHistory()">View past reflections (${getReviews().length})</button>
    </div>`:''}
  `);
}


// ── Mind collapsible bar ─────────────────────────────────────
let mindOpen=false;
function toggleMind(){
  mindOpen=!mindOpen;
  const body=document.getElementById('mind-body');
  const chev=document.getElementById('mind-chev');
  if(body)body.classList.toggle('open',mindOpen);
  if(chev)chev.classList.toggle('open',mindOpen);
}

function renderMindBar(){
  const s=stoicOfDay();
  const intention=getIntention();
  const mins=lastGroundedMins();
  const nudgeGround=mins>=240;
  const groundLabel=mins>=999?'Not used today':mins<60?`${mins}m ago`:`${Math.floor(mins/60)}h ago`;
  const showDot=!intention||nudgeGround||(isSunday()&&!getThisWeekReview());
  const reviews=getReviews();

  return`<div class="mind-bar">
    <div class="mind-bar-header" onclick="toggleMind()">
      <div class="mind-bar-left">
        <div class="mind-bar-dot ${showDot?'show':''}"></div>
        <div class="mind-bar-title">Mind</div>
      </div>
      <div class="mind-bar-chevron ${mindOpen?'open':''}" id="mind-chev">&#9660;</div>
    </div>
    <div class="mind-bar-body ${mindOpen?'open':''}" id="mind-body">

      <div class="mind-sec">
        <div class="mind-sec-label">Today's Intention</div>
        ${intention
          ?`<div class="intention-display">${esc(intention)}</div>`
          :`<div class="intention-placeholder">What do you want to bring to today?</div>`
        }
        <button class="mind-btn accent" onclick="openIntentionModal()">${intention?'Edit':'Set intention'}</button>
      </div>

      <div class="mind-sec">
        <div class="mind-sec-label">Daily Stoic</div>
        <div class="mind-sec-quote">${s.q}</div>
        <div class="mind-sec-author">— ${s.a}</div>
        <div class="mind-sec-reflection">${s.r}</div>
      </div>

      <div class="mind-sec">
        <div class="mind-sec-label">Ground Yourself${nudgeGround?' &#9679;':''}</div>
        <div class="mind-sec-content">${nudgeGround?'<span style="color:var(--accent);font-weight:600">It\'s been a while</span>':groundLabel}</div>
        <button class="mind-btn" onclick="closeModal&&null;openGrounding()">Start breathing</button>
      </div>

      ${isSunday()?`
      <div class="mind-sec">
        <div class="mind-sec-label">Weekly Review${!getThisWeekReview()?' &#9679;':''}</div>
        <div class="mind-sec-content">${getThisWeekReview()?'Reflection saved for this week.':'Take 2 minutes to reflect on your week.'}</div>
        <button class="mind-btn accent" onclick="openWeeklyReview()">${getThisWeekReview()?'Edit reflection':'Start review'}</button>
        ${reviews.length>0?`<button class="mind-btn" onclick="openReviewHistory()">Past</button>`:''}
      </div>`:''}

      ${reviews.length>0&&!isSunday()?`
      <div class="mind-sec">
        <div class="mind-sec-label">Past Reflections</div>
        <button class="mind-btn" onclick="openReviewHistory()">View ${reviews.length} reflection${reviews.length!==1?'s':''}</button>
      </div>`:''}

    </div>
  </div>`;
}


// ── Priority groups ──────────────────────────────────────────
const priGroupOpen={High:true,Medium:true,Low:true};
function togglePriGroup(pri){
  priGroupOpen[pri]=!priGroupOpen[pri];
  const body=document.getElementById(`pg-body-${pri}`);
  const chev=document.getElementById(`pg-chev-${pri}`);
  if(body){body.classList.toggle('open',priGroupOpen[pri]);body.classList.toggle('closed',!priGroupOpen[pri])}
  if(chev)chev.classList.toggle('open',priGroupOpen[pri]);
}

function renderPriGroups(tasks){
  if(tasks.length===0)return`<div class="empty"><p>Nothing here.</p></div>`;
  const groups={High:[],Medium:[],Low:[]};
  tasks.forEach(t=>{ const p=t.priority||'Low'; if(groups[p])groups[p].push(t); else groups.Low.push(t); });
  const colors={High:'bar-high',Medium:'bar-med',Low:'bar-low'};
  return Object.entries(groups).filter(([,arr])=>arr.length>0).map(([pri,arr])=>`
    <div class="pri-group">
      <div class="pri-group-header" onclick="togglePriGroup('${pri}')">
        <div class="pri-group-left">
          <div class="pri-group-bar ${colors[pri]}"></div>
          <div class="pri-group-label">${pri}</div>
          <div class="pri-group-count">${arr.length}</div>
        </div>
        <div class="pri-group-chev ${priGroupOpen[pri]?'open':''}" id="pg-chev-${pri}">&#9660;</div>
      </div>
      <div class="pri-group-body ${priGroupOpen[pri]?'open':'closed'}" id="pg-body-${pri}">
        <div class="task-list">${arr.map(t=>taskCard(t)).join('')}</div>
      </div>
    </div>
  `).join('');
}


// ── Project integration helpers ──────────────────────────────

// Forex — reads from trade journal localStorage
function getForexSummary(){
  try{
    // Try common keys the trade journal might use
    const raw=localStorage.getItem('forex_trades')||localStorage.getItem('tradeJournal')||localStorage.getItem('trades')||'[]';
    const trades=JSON.parse(raw);
    if(!Array.isArray(trades)||trades.length===0)return null;
    const closed=trades.filter(t=>t.result||t.pnl||t.outcome);
    const wins=closed.filter(t=>(parseFloat(t.pnl||t.result||0))>0);
    const totalPnl=closed.reduce((s,t)=>s+(parseFloat(t.pnl||t.result||0)),0);
    const winRate=closed.length>0?Math.round((wins.length/closed.length)*100):0;
    const lastTrade=closed[closed.length-1];
    return{total:trades.length,closed:closed.length,wins:wins.length,winRate,totalPnl,lastTrade};
  }catch{return null}
}

// Völund — reads from business tracker localStorage
function getVolundSummary(){
  try{
    const raw=localStorage.getItem('volund_pieces')||localStorage.getItem('volundTracker')||localStorage.getItem('pieces')||'[]';
    const pieces=JSON.parse(raw);
    if(!Array.isArray(pieces)||pieces.length===0)return null;
    const sold=pieces.filter(p=>p.status==='sold'||p.sold);
    const revenue=sold.reduce((s,p)=>s+(parseFloat(p.price||p.salePrice||0)),0);
    const costs=pieces.reduce((s,p)=>s+(parseFloat(p.cost||p.buildCost||0)),0);
    const profit=revenue-costs;
    return{total:pieces.length,sold:sold.length,revenue,costs,profit};
  }catch{return null}
}

// Budget — reads from budget tracker localStorage
function getBudgetSummary(){
  try{
    const raw=localStorage.getItem('budget_data')||localStorage.getItem('budgetTracker')||localStorage.getItem('budget')||'{}';
    const data=JSON.parse(raw);
    // Try to extract monthly spend vs budget
    const spent=data.spent||data.totalSpent||data.monthSpent||null;
    const budget=data.budget||data.monthBudget||data.limit||null;
    if(!spent&&!budget)return null;
    return{spent:parseFloat(spent||0),budget:parseFloat(budget||0)};
  }catch{return null}
}

function renderForexIntegration(){
  const summary=getForexSummary();
  const base='https://spongecake07.github.io';
  return`
  <div class="summary-panel">
    <div class="summary-panel-title">Trade Journal Summary</div>
    ${summary?`
      <div class="summary-stats">
        <div class="summary-stat">
          <div class="summary-stat-val acc">${summary.total}</div>
          <div class="summary-stat-lbl">Total Trades</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-val ${summary.winRate>=50?'pos':'neg'}">${summary.winRate}%</div>
          <div class="summary-stat-lbl">Win Rate</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-val ${summary.totalPnl>=0?'pos':'neg'}">${summary.totalPnl>=0?'+':''}${summary.totalPnl.toFixed(1)}</div>
          <div class="summary-stat-lbl">Total P&L</div>
        </div>
      </div>
      <div class="equity-bar-wrap">
        <div class="equity-bar-label"><span>Progress to 30 trades</span><span>${summary.total}/30</span></div>
        <div class="equity-bar-track"><div class="equity-bar-fill ${summary.totalPnl<0?'neg':''}" style="width:${Math.min(100,(summary.total/30)*100)}%"></div></div>
      </div>
      <div class="summary-note" style="margin-top:10px">Win: ${summary.wins} · Loss: ${summary.closed-summary.wins} · Open: ${summary.total-summary.closed}</div>
    `:`<div style="font-size:13px;color:var(--muted)">No trade data found. Make sure your trade journal is on the same domain.</div>`}
  </div>
  <div class="integration-bar">
    <a class="int-shortcut" href="${base}/forex-journal" target="_blank"><span class="int-shortcut-icon">📈</span>Trade Journal</a>
    <a class="int-shortcut" href="${base}/forex-checklist" target="_blank"><span class="int-shortcut-icon">✓</span>Pre-Trade Checklist</a>
  </div>`;
}

function renderVolundIntegration(){
  const summary=getVolundSummary();
  const base='https://spongecake07.github.io';
  return`
  <div class="summary-panel">
    <div class="summary-panel-title">Business Snapshot</div>
    ${summary?`
      <div class="summary-stats">
        <div class="summary-stat">
          <div class="summary-stat-val acc">${summary.total}</div>
          <div class="summary-stat-lbl">Pieces</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-val pos">$${summary.revenue.toFixed(0)}</div>
          <div class="summary-stat-lbl">Revenue</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-val ${summary.profit>=0?'pos':'neg'}">${summary.profit>=0?'+':''}$${Math.abs(summary.profit).toFixed(0)}</div>
          <div class="summary-stat-lbl">Profit</div>
        </div>
      </div>
      <div class="summary-note">Sold: ${summary.sold} · Unsold: ${summary.total-summary.sold} · Costs: $${summary.costs.toFixed(0)}</div>
    `:`<div style="font-size:13px;color:var(--muted)">No business data found. Make sure your Völund tracker is on the same domain.</div>`}
  </div>
  <div class="integration-bar">
    <a class="int-shortcut" href="${base}/volund-tracker" target="_blank"><span class="int-shortcut-icon">⚙</span>Business Tracker</a>
    <a class="int-shortcut" href="https://volund.watch" target="_blank"><span class="int-shortcut-icon">↗</span>volund.watch</a>
    <a class="int-shortcut" href="https://instagram.com/volundwatches" target="_blank"><span class="int-shortcut-icon">◎</span>Instagram</a>
  </div>`;
}

function renderFamilyIntegration(){
  const summary=getBudgetSummary();
  const base='https://spongecake07.github.io';
  return`
  ${summary?`
  <div class="summary-panel">
    <div class="summary-panel-title">Budget This Month</div>
    <div class="budget-row">
      <span class="budget-row-label">Spent</span>
      <span class="budget-row-val">$${summary.spent.toFixed(2)}</span>
    </div>
    ${summary.budget>0?`
    <div class="budget-row">
      <span class="budget-row-label">Budget</span>
      <span class="budget-row-val">$${summary.budget.toFixed(2)}</span>
    </div>
    <div class="budget-row">
      <span class="budget-row-label">Remaining</span>
      <span class="budget-row-val ${summary.budget-summary.spent<0?'over':'ok'}">$${(summary.budget-summary.spent).toFixed(2)}</span>
    </div>`:''}
  </div>`:''}
  <div class="integration-bar">
    <a class="int-shortcut" href="${base}/budget-tracker" target="_blank"><span class="int-shortcut-icon">💰</span>Budget Tracker</a>
    <a class="int-shortcut" href="${base}/forge" target="_blank"><span class="int-shortcut-icon">🔥</span>FORGE Habits</a>
    <a class="int-shortcut" href="${base}/gym-journal" target="_blank"><span class="int-shortcut-icon">💪</span>Gym Journal</a>
  </div>`;
}

let filterType=null,filterProject=null;
function nav(view,project=null){curView=view;curProject=project;activeTab='tasks';render();updateNav()}
function navFiltered(type){curView='filtered';filterType=type;filterProject=null;render();updateNav()}
function navFilteredProject(projectKey,type){curView='filtered';filterType=type;filterProject=projectKey;render();updateNav()}
function updateNav(){
  document.querySelectorAll('.ni').forEach(b=>{b.classList.remove('active');if(b.dataset.view===curView&&(!b.dataset.project||b.dataset.project===curProject))b.classList.add('active')});
  document.querySelectorAll('.bn-item').forEach(b=>{b.classList.remove('active');if(b.dataset.view===curView)b.classList.add('active')});
}

function render(){
  const vc=document.getElementById('vc');
  switch(curView){
    case'dashboard': vc.innerHTML=vDashboard();break;
    case'projects':  vc.innerHTML=vProjects();break;
    case'project':   vc.innerHTML=vProject(curProject);break;
    case'filtered':  vc.innerHTML=vFiltered();break;
    case'tools':     vc.innerHTML=vTools();break;
    case'reminders': vc.innerHTML=vReminders();break;
    case'archive':   vc.innerHTML=vArchive();break;
    case'export':    vc.innerHTML=vExport();break;
    default:         vc.innerHTML=vDashboard();
  }
}

// ── Filtered task list (drill-down from stat numbers) ────────
function vFiltered(){
  const today=toDay();
  let tasks=[];
  let title='Tasks';
  let grad='var(--g1)';

  if(filterProject){
    const proj=db.projects[filterProject];
    const base=db.tasks.filter(t=>t.project===filterProject);
    if(filterType==='open'){tasks=base.filter(t=>!t.completed);title=`${proj.name} — Open`;}
    else if(filterType==='done'){tasks=base.filter(t=>t.completed).sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||''));title=`${proj.name} — Done`;}
    const idx=Object.keys(db.projects).indexOf(filterProject);
    grad=`var(--g${(idx%5)+1})`;
  }else{
    const open=db.tasks.filter(t=>!t.completed);
    if(filterType==='overdue'){tasks=open.filter(t=>t.dueDate&&t.dueDate<today);title='Overdue';grad='var(--g2)';}
    else if(filterType==='today'){tasks=open.filter(t=>t.dueDate===today);title='Due Today';grad='var(--g1)';}
    else if(filterType==='upcoming'){tasks=open.filter(t=>t.dueDate&&t.dueDate>today).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));title='Upcoming';grad='var(--g3)';}
    else if(filterType==='open'){tasks=open;title='Total Open';grad='var(--g4)';}
  }

  const isDoneView=filterType==='done';

  return`
  <div class="hero" style="background:${grad}">
    <div class="hero-top">
      <div>
        <div class="hero-title">${title}</div>
        <div class="hero-date">${tasks.length} task${tasks.length!==1?'s':''}</div>
      </div>
      <button class="hero-btn" onclick="nav(${filterProject?`'project','${filterProject}'`:`'dashboard'`})">&#8592; Back</button>
    </div>
  </div>
  <div class="body">
    ${tasks.length>0
      ?(isDoneView?`<div class="task-list">${tasks.map(t=>taskCard(t)).join('')}</div>`:renderPriGroups(tasks))
      :`<div class="empty"><p>Nothing here.</p></div>`}
  </div>`;
}

// ── Dashboard — daily briefing ───────────────────────────────
function vDashboard(){
  const today=toDay();
  const open=db.tasks.filter(t=>!t.completed);
  const todayT=open.filter(t=>t.dueDate===today);
  const over=open.filter(t=>t.dueDate&&t.dueDate<today);
  const upcoming=open.filter(t=>t.dueDate&&t.dueDate>today).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,6);
  const noDate=open.filter(t=>!t.dueDate);
  // Completed tasks that were finished today
  const doneToday=db.tasks.filter(t=>t.completed&&t.completedAt&&t.completedAt.slice(0,10)===today);
  const allClear=over.length===0&&todayT.length===0&&upcoming.length===0;

  return`
  <div class="hero">
    <div class="hero-top">
      <div><div class="hero-title">Today</div><div class="hero-date">${fmtDate(today)}</div></div>
      <div class="hero-actions"><button class="hero-btn primary" onclick="openAddTask(null)">+ Task</button></div>
    </div>
    <div class="hero-stats">
      <div class="hstat clickable" onclick="navFiltered('overdue')"><div class="hstat-n" style="color:${over.length>0?'#FFBFB0':'white'}">${over.length}</div><div class="hstat-l">Overdue</div></div>
      <div class="hstat clickable" onclick="navFiltered('today')"><div class="hstat-n" style="color:${todayT.length>0?'#FFE8A0':'white'}">${todayT.length}</div><div class="hstat-l">Due Today</div></div>
      <div class="hstat clickable" onclick="navFiltered('upcoming')"><div class="hstat-n">${upcoming.length}</div><div class="hstat-l">Upcoming</div></div>
      <div class="hstat clickable" onclick="navFiltered('open')"><div class="hstat-n">${open.length}</div><div class="hstat-l">Total Open</div></div>
    </div>
  </div>
  <div class="body">
    ${renderMindBar()}
        ${over.length>0?`<div class="section-label" style="color:var(--danger);margin-bottom:12px">Overdue</div>${renderPriGroups(over)}`:''}
    ${todayT.length>0?`<div class="section-label" style="margin-bottom:12px">Due Today</div>${renderPriGroups(todayT)}`:''}
    ${upcoming.length>0?`<div class="section-label" style="margin-bottom:12px">Upcoming</div>${renderPriGroups(upcoming)}`:''}
    ${noDate.length>0?`<div class="section-label" style="margin-bottom:12px">No Due Date</div>${renderPriGroups(noDate)}`:''}
    ${doneToday.length>0?`
      <div class="done-divider">Completed Today</div>
      <div class="task-list">${doneToday.map(t=>taskCard(t)).join('')}</div>
    `:''}
    ${allClear&&doneToday.length===0?`
      <div class="empty" style="padding:60px 20px">
        <div style="font-size:32px;margin-bottom:12px">&#10003;</div>
        <p style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:6px">All clear</p>
        <p style="margin-bottom:20px">Nothing due today.</p>
        <button class="btn btn-p" onclick="nav('projects')">View Projects</button>
      </div>
    `:''}
  </div>`;
}

// ── Projects ─────────────────────────────────────────────────
function vProjects(){
  const totalOpen=db.tasks.filter(t=>!t.completed).length;
  const totalDone=db.tasks.filter(t=>t.completed).length;
  return`
  <div class="hero">
    <div class="hero-top">
      <div><div class="hero-title">Projects</div><div class="hero-date">All your areas</div></div>
      <button class="hero-btn primary" onclick="openAddTask(null)">+ Task</button>
    </div>
    <div class="hero-stats">
      <div class="hstat"><div class="hstat-n">${Object.keys(db.projects).length}</div><div class="hstat-l">Areas</div></div>
      <div class="hstat"><div class="hstat-n">${totalOpen}</div><div class="hstat-l">Open</div></div>
      <div class="hstat"><div class="hstat-n">${totalDone}</div><div class="hstat-l">Done</div></div>
    </div>
  </div>
  <div class="body">
    <div class="proj-cards">
      ${Object.entries(db.projects).map(([k,p],i)=>{
        const ot=db.tasks.filter(t=>t.project===k&&!t.completed).length;
        const cost=projCost(k);const done=db.tasks.filter(t=>t.project===k&&t.completed).length;
        return`<div class="proj-card ${PROJ_GRADS[i%5]}" onclick="nav('project','${k}')">
          <div class="pc-dots">•••</div>
          <div class="pc-icon">${p.emoji||'◈'}</div>
          <div class="pc-body">
            <div class="pc-name">${p.name}</div>
            <div class="pc-sub">${ot} open task${ot!==1?'s':''}</div>
            <div class="pc-stats">
              <div class="pc-stat clickable" onclick="event.stopPropagation();navFilteredProject('${k}','open')"><div class="v">${ot}</div><div class="l">tasks</div></div>
              <div class="pc-stat"><div class="v">${cost>0?'$'+cost.toFixed(0):'—'}</div><div class="l">cost</div></div>
              <div class="pc-stat clickable" onclick="event.stopPropagation();navFilteredProject('${k}','done')"><div class="v">${done}</div><div class="l">done</div></div>
            </div>
          </div>
          <div class="pc-rank"><div class="pc-rank-n">${i+1}</div><div class="pc-rank-l">Area</div></div>
        </div>`
      }).join('')}
    </div>
  </div>`;
}

// ── Single project ────────────────────────────────────────────
function vProject(key){
  const proj=db.projects[key];if(!proj)return'<p style="padding:24px">Not found</p>';
  const isR=key==='repairs';
  if(isR&&!curRepairCat)curRepairCat=db.repairCategories[0];
  const cat=isR?curRepairCat:null;
  const ft=arr=>isR?arr.filter(t=>t.project===key&&t.repairCat===cat):arr.filter(t=>t.project===key);
  const open=ft(db.tasks.filter(t=>!t.completed));
  const done=ft(db.tasks.filter(t=>t.completed));
  const allCost=ft(db.tasks).reduce((s,t)=>s+(parseFloat(t.cost)||0),0);
  const idx=Object.keys(db.projects).indexOf(key);
  return`
  <div class="hero" style="background:var(--g${(idx%5)+1})">
    <div class="hero-top">
      <div>
        <div class="hero-title">${proj.emoji||'◈'} ${proj.name}</div>
        ${isR?`<div class="hero-date">Category: ${cat}</div>`:''}
      </div>
      <div class="hero-actions">
        <button class="hero-btn" onclick="shareProject('${key}')">Share</button>
        <button class="hero-btn primary" onclick="openAddTask('${key}')">+ Task</button>
      </div>
    </div>
    <div class="hero-stats">
      <div class="hstat clickable" onclick="navFilteredProject('${key}','open')"><div class="hstat-n">${open.length}</div><div class="hstat-l">Open</div></div>
      <div class="hstat clickable" onclick="navFilteredProject('${key}','done')"><div class="hstat-n">${done.length}</div><div class="hstat-l">Done</div></div>
      <div class="hstat"><div class="hstat-n">${allCost>0?'$'+allCost.toFixed(0):'—'}</div><div class="hstat-l">Cost</div></div>
    </div>
  </div>
  <div class="body">
    ${isR?`<div class="sub-nav">${db.repairCategories.map(c=>`<button class="snb ${c===cat?'active':''}" onclick="setRC('${c}')">${c}</button>`).join('')}<button class="snb" onclick="addRC()">+ Add</button></div>`:''}
    <div class="tab-bar">
      <button class="tb ${activeTab==='tasks'?'active':''}" onclick="setTab('tasks')">Tasks</button>
      <button class="tb ${activeTab==='notes'?'active':''}" onclick="setTab('notes')">Notes</button>
    </div>
    ${activeTab==='tasks'?`
      ${key==='forex'?renderForexIntegration():''}
      ${key==='volund'?renderVolundIntegration():''}
      ${key==='family'?renderFamilyIntegration():''}
      <div class="task-list">
        ${open.length>0?open.map(t=>taskCard(t)).join(''):`<div class="empty"><p>No open tasks yet.</p><button class="btn btn-p" onclick="openAddTask('${key}')">+ Add First Task</button></div>`}
      </div>
      ${done.length>0?`
        <div class="done-divider">Completed</div>
        <div class="task-list">${done.map(t=>taskCard(t)).join('')}</div>
      `:''}
    `:`
      <div class="fg"><label class="fl">Project Notes</label><textarea class="notes-area" id="pnotes" placeholder="Contacts, links, reference info, parts...">${esc(proj.notes||'')}</textarea></div>
      <button class="btn btn-p" onclick="saveNotes('${key}')">Save Notes</button>
    `}
  </div>`;
}

function setRC(c){curRepairCat=c;render()}
function setTab(t){activeTab=t;render()}
function saveNotes(k){db.projects[k].notes=document.getElementById('pnotes').value;saveDB(db);toast('Notes saved')}
function projCost(k){return db.tasks.filter(t=>t.project===k).reduce((s,t)=>s+(parseFloat(t.cost)||0),0)}

// ── Task card ─────────────────────────────────────────────────
function taskCard(task){
  const proj=db.projects[task.project];
  const pri=task.priority||'Low';
  return`<div class="task-card pri-${pri} ${task.completed?'done':''}" id="tc-${task.id}">
    <div class="tc-check ${task.completed?'on':''}" onclick="toggleTask('${task.id}')">${task.completed?'✓':''}</div>
    <div class="tc-body">
      <div class="tc-title">${esc(task.title)}</div>
      <div class="tc-tags">
        ${proj?`<span class="tc-tag">${proj.emoji||''} ${proj.name}${task.repairCat?' · '+task.repairCat:''}</span>`:''}
        ${task.dueDate?`<span class="tc-tag">&#128197; ${fmtDate(task.dueDate)}</span>`:''}
        ${task.cost?`<span class="tc-tag">$${parseFloat(task.cost).toFixed(2)}</span>`:''}
        ${(task.tools||[]).length>0?`<span class="tc-tag">&#128295; ${task.tools.join(', ')}</span>`:''}
      </div>
      ${task.notes?`<div class="tc-note">${esc(task.notes)}</div>`:''}
      ${(task.photos||[]).length>0?`<div class="photo-grid">${task.photos.map(p=>`<img class="photo-thumb" src="${p}" onclick="viewPhoto('${p}')" />`).join('')}</div>`:''}
    </div>
    <div class="tc-actions">
      ${task.completed
        ?`<button class="tca reopen" onclick="toggleTask('${task.id}')">Reopen</button>`
        :`<button class="tca" onclick="openEditTask('${task.id}')">&#9998;</button>`
      }
      <button class="tca del" onclick="deleteTask('${task.id}')">&#10005;</button>
    </div>
  </div>`
}

// ── Tools ─────────────────────────────────────────────────────
function vTools(){
  return`
  <div class="hero" style="background:var(--g2)">
    <div class="hero-top">
      <div><div class="hero-title">&#9874; Tool Inventory</div><div class="hero-date">${db.tools.length} tools</div></div>
      <button class="hero-btn primary" onclick="openAddTool()">+ Add</button>
    </div>
  </div>
  <div class="body">
    ${db.tools.map(t=>`
      <div class="tool-item">
        <div><div class="ti-name">${esc(t.name)}</div>${t.link?`<a class="ti-link" href="${esc(t.link)}" target="_blank">View / Buy &#8599;</a>`:''}</div>
        <div style="display:flex;gap:6px"><button class="tca" onclick="openEditTool('${t.id}')">&#9998;</button><button class="tca del" onclick="deleteTool('${t.id}')">&#10005;</button></div>
      </div>`).join('')||`<div class="empty"><p>No tools yet.</p></div>`}
  </div>`
}

// ── Reminders ─────────────────────────────────────────────────
function vReminders(){
  const s=db.settings;
  const np=typeof Notification!=='undefined'?Notification.permission:'denied';
  return`
  <div class="hero" style="background:var(--g3)">
    <div class="hero-top">
      <div><div class="hero-title">&#9719; Reminders</div><div class="hero-date">${db.reminders.length} active</div></div>
      <button class="hero-btn primary" onclick="openAddReminder()">+ Add</button>
    </div>
  </div>
  <div class="body">
    <div class="tool-item" style="margin-bottom:16px;border-radius:var(--rl);flex-direction:column;align-items:flex-start;gap:10px">
      <div style="font-weight:600;font-size:14px">Morning Digest</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
        <input type="checkbox" id="digt" ${s.morningDigest?'checked':''} onchange="toggleDigest()"/>
        Daily summary of tasks due today
      </label>
      <input type="time" class="fi" style="width:130px" id="digt-time" value="${s.morningDigestTime||'08:00'}" onchange="saveDigestTime()"/>
    </div>
    <div class="tool-item" style="margin-bottom:20px;border-radius:var(--rl)">
      <div>
        <div style="font-weight:600;font-size:14px">Notifications</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">${np==='granted'?'Enabled ✓':np==='denied'?'Blocked — enable in browser settings':'Not yet enabled'}</div>
      </div>
      ${np!=='granted'?`<button class="btn btn-s" onclick="reqNotif()">Enable</button>`:''}
    </div>
    <div class="section-label">Your Reminders</div>
    ${db.reminders.map(r=>`
      <div class="rem-item">
        <div class="ri-body"><div class="ri-title">${esc(r.title)}</div><div class="ri-meta">${fmtRem(r)}</div></div>
        <div style="display:flex;gap:6px"><button class="tca" onclick="openEditReminder('${r.id}')">&#9998;</button><button class="tca del" onclick="deleteReminder('${r.id}')">&#10005;</button></div>
      </div>`).join('')||`<div class="empty"><p>No reminders set yet.</p></div>`}
  </div>`
}
function fmtRem(r){const p=[];if(r.type==='once')p.push(`Once — ${fmtDate(r.date)} at ${r.time}`);if(r.type==='daily')p.push(`Every day at ${r.time}`);if(r.type==='weekly')p.push(`Every ${r.weekday} at ${r.time}`);if(r.type==='monthly')p.push(`Monthly day ${r.monthDay} at ${r.time}`);if(r.type==='custom')p.push(`Every ${r.intervalDays} days at ${r.time}`);if(r.project)p.push(db.projects[r.project]?.name||'');return p.join(' · ')}

// ── Archive — completed tasks by date ─────────────────────────
function vArchive(){
  const done=db.tasks.filter(t=>t.completed).sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||''));

  // Group by project first, in project order; tasks with no project go last under "Other"
  const projectOrder=Object.keys(db.projects);
  const byProject={};
  done.forEach(t=>{
    const key=t.project&&db.projects[t.project]?t.project:'_other';
    if(!byProject[key])byProject[key]=[];
    byProject[key].push(t);
  });

  const orderedKeys=[...projectOrder.filter(k=>byProject[k]), ...(byProject['_other']?['_other']:[])];

  return`
  <div class="hero" style="background:var(--g4)">
    <div class="hero-top">
      <div><div class="hero-title">&#10003; Completed</div><div class="hero-date">${done.length} task${done.length!==1?'s':''} archived</div></div>
      ${done.length>0?`<button class="hero-btn" onclick="clearArchive()">Clear All</button>`:''}
    </div>
  </div>
  <div class="body">
    ${done.length>0?orderedKeys.map(key=>{
      const proj=key==='_other'?null:db.projects[key];
      const tasks=byProject[key];
      // Sub-group by completion date within this project, newest first
      const dateGroups={};
      tasks.forEach(t=>{
        const d=t.completedAt?t.completedAt.slice(0,10):'Unknown';
        if(!dateGroups[d])dateGroups[d]=[];
        dateGroups[d].push(t);
      });
      return`
        <div class="project-archive-group">
          <div class="project-archive-header">
            <span class="project-archive-emoji">${proj?(proj.emoji||'◈'):'•'}</span>
            <span class="project-archive-name">${proj?proj.name:'No Project'}</span>
            <span class="project-archive-count">${tasks.length}</span>
          </div>
          ${Object.entries(dateGroups).map(([date,dtasks])=>`
            <div class="date-group">
              <div class="date-group-label">${date==='Unknown'?'Unknown date':fmtDateLong(date)}</div>
              <div class="task-list">${dtasks.map(t=>taskCard(t)).join('')}</div>
            </div>
          `).join('')}
        </div>`;
    }).join(''):`<div class="empty"><p>No completed tasks yet.</p></div>`}
  </div>`
}

// ── Export ────────────────────────────────────────────────────
function vExport(){
  return`
  <div class="hero" style="background:var(--g5)">
    <div class="hero-top">
      <div><div class="hero-title">&#8595; Export & Backup</div><div class="hero-date">Save or restore your data</div></div>
    </div>
  </div>
  <div class="body">
    <div class="exp-grid">
      <div class="exp-card"><div class="exp-title">JSON Backup</div><div class="exp-desc">Full backup of all tasks, notes, reminders and settings.</div><button class="btn btn-p" onclick="exportJSON()">Download JSON</button></div>
      <div class="exp-card"><div class="exp-title">CSV Export</div><div class="exp-desc">Export all tasks in spreadsheet format.</div><button class="btn btn-s" onclick="exportCSV()">Download CSV</button></div>
      <div class="exp-card"><div class="exp-title">Restore Backup</div><div class="exp-desc">Import a JSON backup. This will replace all current data.</div><input type="file" id="imp-file" accept=".json" style="display:none" onchange="importJSON(this)"/><button class="btn btn-g" onclick="document.getElementById('imp-file').click()">Choose File</button></div>
      <div class="exp-card"><div class="exp-title">Share Project</div><div class="exp-desc">Copy a project summary to send via message.</div><select class="fsel" id="sp-sel" style="margin-bottom:10px">${Object.entries(db.projects).map(([k,p])=>`<option value="${k}">${p.name}</option>`).join('')}</select><button class="btn btn-s" onclick="copyProjSummary()">Copy Summary</button></div>
    </div>
  </div>`
}

// ── Task modal ────────────────────────────────────────────────
function openAddTask(pk){openModal(`<div class="mh"><div class="mt">New Task</div><button class="ib" onclick="closeModal()">&#10005;</button></div>${taskForm(null,pk,pk==='repairs'?curRepairCat:null)}<div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitTask(null)">Add Task</button></div>`)}
function openEditTask(id){const t=db.tasks.find(t=>t.id===id);if(!t)return;openModal(`<div class="mh"><div class="mt">Edit Task</div><button class="ib" onclick="closeModal()">&#10005;</button></div>${taskForm(t,t.project,t.repairCat)}<div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitTask('${id}')">Save</button></div>`)}

function taskForm(task,pk,rc){
  const isR=pk==='repairs';
  return`
  <div class="fg"><label class="fl">Task Title</label><input type="text" class="fi" id="tf-title" value="${esc(task?.title||'')}" placeholder="What needs to be done?"/></div>
  <div class="fr">
    <div class="fg"><label class="fl">Project</label><select class="fsel" id="tf-proj" onchange="onProjCh(this)"><option value="">— None —</option>${Object.entries(db.projects).map(([k,p])=>`<option value="${k}" ${(pk===k||task?.project===k)?'selected':''}>${p.name}</option>`).join('')}</select></div>
    <div class="fg" id="tf-rc-g" style="${isR?'':'display:none'}"><label class="fl">Category</label><select class="fsel" id="tf-rc">${db.repairCategories.map(c=>`<option value="${c}" ${(rc===c||task?.repairCat===c)?'selected':''}>${c}</option>`).join('')}</select></div>
  </div>
  <div class="fr3">
    <div class="fg"><label class="fl">Priority</label><select class="fsel" id="tf-pri"><option value="High" ${task?.priority==='High'?'selected':''}>High</option><option value="Medium" ${task?.priority==='Medium'?'selected':''}>Medium</option><option value="Low" ${(!task||task?.priority==='Low')?'selected':''}>Low</option></select></div>
    <div class="fg"><label class="fl">Due Date</label><input type="date" class="fi" id="tf-due" value="${task?.dueDate||''}"/></div>
    <div class="fg"><label class="fl">Cost ($)</label><input type="number" class="fi" id="tf-cost" value="${task?.cost||''}" placeholder="0.00" step="0.01" min="0"/></div>
  </div>
  <div class="fg"><label class="fl">Tools Needed</label>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px" id="sel-tools">${(task?.tools||[]).map(t=>`<span class="tc-tag" style="cursor:pointer;background:var(--surface2)" data-tool="${esc(t)}">${esc(t)} <span onclick="this.parentElement.remove()">&#10005;</span></span>`).join('')}</div>
    <select class="fsel" onchange="addToolSel(this)"><option value="">Add from inventory...</option>${db.tools.map(t=>`<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('')}</select>
    <div style="display:flex;gap:8px;margin-top:6px"><input type="text" class="fi" id="tf-ctool" placeholder="Custom tool..."/><button type="button" class="btn btn-g" style="white-space:nowrap" onclick="addCustomTool()">Add</button></div>
  </div>
  <div class="fg"><label class="fl">Reminder</label>
    <div class="fr"><select class="fsel" id="tf-remtype" onchange="onRemCh('tf')"><option value="">None</option><option value="once" ${task?.reminder?.type==='once'?'selected':''}>Specific date & time</option><option value="daily" ${task?.reminder?.type==='daily'?'selected':''}>Every day</option><option value="weekly" ${task?.reminder?.type==='weekly'?'selected':''}>Every week</option><option value="monthly" ${task?.reminder?.type==='monthly'?'selected':''}>Every month</option><option value="custom" ${task?.reminder?.type==='custom'?'selected':''}>Custom interval</option></select>
    <input type="time" class="fi" id="tf-remtime" value="${task?.reminder?.time||'09:00'}"/></div>
    <div id="tf-remex" style="margin-top:8px"></div>
  </div>
  <div class="fg"><label class="fl">Notes</label><textarea class="fta" id="tf-notes" placeholder="Additional details...">${esc(task?.notes||'')}</textarea></div>
  <div class="fg"><label class="fl">Photos</label>
    <input type="file" id="tf-photo-camera" accept="image/*" capture="environment" style="display:none" onchange="handlePhotos(this)"/>
    <input type="file" id="tf-photos" accept="image/*" multiple style="display:none" onchange="handlePhotos(this)"/>
    <div style="display:flex;gap:8px">
      <button type="button" class="btn btn-g" onclick="document.getElementById('tf-photo-camera').click()">&#128247; Take Photo</button>
      <button type="button" class="btn btn-g" onclick="document.getElementById('tf-photos').click()">&#128194; From Gallery</button>
    </div>
    <div class="photo-grid" id="photo-prev">${(task?.photos||[]).map(p=>`<div class="photo-wrap"><img class="photo-thumb" src="${p}" data-src="${p}"/><button type="button" class="photo-remove" onclick="this.parentElement.remove()">&#10005;</button></div>`).join('')}</div>
    <div id="photo-upload-status" style="font-size:11px;color:var(--muted);margin-top:6px"></div>
  </div>`
}

function onProjCh(s){
  const isR=s.value==='repairs';
  document.getElementById('tf-rc-g').style.display=isR?'':'none';
  if(!isR){const rc=document.getElementById('tf-rc');if(rc)rc.value=''}
}
function onRemCh(p){
  const t=document.getElementById(`${p}-remtype`).value;const ex=document.getElementById(`${p}-remex`);if(!ex)return;
  if(t==='once')ex.innerHTML=`<input type="date" class="fi" id="${p}-remdate" value="${toDay()}"/>`;
  else if(t==='weekly')ex.innerHTML=`<select class="fsel" id="${p}-remday">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>`<option>${d}</option>`).join('')}</select>`;
  else if(t==='monthly')ex.innerHTML=`<input type="number" class="fi" id="${p}-remmday" min="1" max="28" value="1" placeholder="Day of month"/>`;
  else if(t==='custom')ex.innerHTML=`<input type="number" class="fi" id="${p}-remint" min="1" value="7" placeholder="Every X days"/>`;
  else ex.innerHTML='';
}
function handlePhotos(inp){
  const status=document.getElementById('photo-upload-status');
  Array.from(inp.files).forEach(f=>{
    if(status)status.textContent='Processing image...';
    const r=new FileReader();
    r.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        // Resize to max 800px on longest side to keep storage small
        const maxDim=800;
        let w=img.width,h=img.height;
        if(w>maxDim||h>maxDim){
          if(w>h){h=Math.round(h*(maxDim/w));w=maxDim}
          else{w=Math.round(w*(maxDim/h));h=maxDim}
        }
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        const resized=canvas.toDataURL('image/jpeg',0.7);

        const p=document.getElementById('photo-prev');
        const wrap=document.createElement('div');
        wrap.className='photo-wrap';
        wrap.innerHTML=`<img class="photo-thumb" src="${resized}" data-src="${resized}"/><button type="button" class="photo-remove" onclick="this.parentElement.remove()">&#10005;</button>`;
        p.appendChild(wrap);
        if(status)status.textContent='';
      };
      img.src=e.target.result;
    };
    r.readAsDataURL(f);
  });
  inp.value='';
}
function addToolSel(s){if(!s.value)return;addToolTag(s.value);s.value=''}
function addCustomTool(){const i=document.getElementById('tf-ctool');if(!i.value.trim())return;addToolTag(i.value.trim());i.value=''}
function addToolTag(name){const c=document.getElementById('sel-tools');const s=document.createElement('span');s.className='tc-tag';s.style.cssText='cursor:pointer;background:var(--surface2)';s.dataset.tool=name;s.innerHTML=`${esc(name)} <span onclick="this.parentElement.remove()">&#10005;</span>`;c.appendChild(s)}
function getTools(){return Array.from(document.querySelectorAll('#sel-tools .tc-tag')).map(e=>e.dataset.tool||e.textContent.replace('✕','').trim())}

function submitTask(editId){
  const title=document.getElementById('tf-title').value.trim();if(!title){toast('Enter a task title');return}
  const rt=document.getElementById('tf-remtype').value;let reminder=null;
  if(rt){reminder={type:rt,time:document.getElementById('tf-remtime').value};
    if(rt==='once')reminder.date=document.getElementById('tf-remdate')?.value;
    if(rt==='weekly')reminder.weekday=document.getElementById('tf-remday')?.value;
    if(rt==='monthly')reminder.monthDay=document.getElementById('tf-remmday')?.value;
    if(rt==='custom')reminder.intervalDays=document.getElementById('tf-remint')?.value;
  }
  const ex=editId?db.tasks.find(t=>t.id===editId):null;
  const imgs=Array.from(document.querySelectorAll('#photo-prev .photo-wrap img')).map(i=>i.dataset.src||i.src);
  const task={id:editId||uid(),title,project:document.getElementById('tf-proj').value,repairCat:(document.getElementById('tf-proj').value==='repairs'?document.getElementById('tf-rc')?.value:null)||null,priority:document.getElementById('tf-pri').value,dueDate:document.getElementById('tf-due').value,cost:document.getElementById('tf-cost').value,tools:getTools(),notes:document.getElementById('tf-notes').value.trim(),photos:imgs,reminder,completed:ex?.completed||false,completedAt:ex?.completedAt||null,createdAt:ex?.createdAt||new Date().toISOString()};
  if(editId){const i=db.tasks.findIndex(t=>t.id===editId);db.tasks[i]=task}else db.tasks.push(task);
  const ok=saveDB(db);
  if(!ok){
    if(editId){const i=db.tasks.findIndex(t=>t.id===editId);if(i>-1)db.tasks[i]=ex}else db.tasks.pop();
    return;
  }
  closeModal();render();toast(editId?'Task updated':'Task added')
}
function toggleTask(id){const t=db.tasks.find(t=>t.id===id);if(!t)return;t.completed=!t.completed;t.completedAt=t.completed?new Date().toISOString():null;saveDB(db);render();toast(t.completed?'Done ✓ — tap Reopen to undo':'Task reopened')}
function deleteTask(id){if(!confirm('Delete this task?'))return;db.tasks=db.tasks.filter(t=>t.id!==id);saveDB(db);render();toast('Task deleted')}
function clearArchive(){if(!confirm('Clear all completed tasks?'))return;db.tasks=db.tasks.filter(t=>!t.completed);saveDB(db);render();toast('Archive cleared')}

// ── Tool modal ────────────────────────────────────────────────
function openAddTool(){openModal(`<div class="mh"><div class="mt">Add Tool</div><button class="ib" onclick="closeModal()">&#10005;</button></div><div class="fg"><label class="fl">Tool Name</label><input type="text" class="fi" id="tn" placeholder="e.g. Angle Grinder"/></div><div class="fg"><label class="fl">Buy / Reference Link</label><input type="url" class="fi" id="tl" placeholder="https://..."/></div><div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitTool(null)">Add</button></div>`)}
function openEditTool(id){const t=db.tools.find(t=>t.id===id);if(!t)return;openModal(`<div class="mh"><div class="mt">Edit Tool</div><button class="ib" onclick="closeModal()">&#10005;</button></div><div class="fg"><label class="fl">Tool Name</label><input type="text" class="fi" id="tn" value="${esc(t.name)}"/></div><div class="fg"><label class="fl">Buy / Reference Link</label><input type="url" class="fi" id="tl" value="${esc(t.link||'')}"/></div><div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitTool('${id}')">Save</button></div>`)}
function submitTool(editId){const name=document.getElementById('tn').value.trim();if(!name){toast('Enter tool name');return}const link=document.getElementById('tl').value.trim();if(editId){const t=db.tools.find(t=>t.id===editId);t.name=name;t.link=link}else db.tools.push({id:uid(),name,link});saveDB(db);closeModal();render();toast(editId?'Tool updated':'Tool added')}
function deleteTool(id){if(!confirm('Remove this tool?'))return;db.tools=db.tools.filter(t=>t.id!==id);saveDB(db);render();toast('Tool removed')}

// ── Reminder modal ────────────────────────────────────────────
function openAddReminder(){openModal(`<div class="mh"><div class="mt">New Reminder</div><button class="ib" onclick="closeModal()">&#10005;</button></div>${remForm(null)}<div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitReminder(null)">Add</button></div>`)}
function openEditReminder(id){const r=db.reminders.find(r=>r.id===id);if(!r)return;openModal(`<div class="mh"><div class="mt">Edit Reminder</div><button class="ib" onclick="closeModal()">&#10005;</button></div>${remForm(r)}<div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitReminder('${id}')">Save</button></div>`)}
function remForm(r){return`
  <div class="fg"><label class="fl">Title</label><input type="text" class="fi" id="rem-title" value="${esc(r?.title||'')}" placeholder="What should I remind you about?"/></div>
  <div class="fr">
    <div class="fg"><label class="fl">Type</label><select class="fsel" id="rem-remtype" onchange="onRemCh('rem')"><option value="once" ${r?.type==='once'?'selected':''}>Once</option><option value="daily" ${r?.type==='daily'?'selected':''}>Every day</option><option value="weekly" ${r?.type==='weekly'?'selected':''}>Every week</option><option value="monthly" ${r?.type==='monthly'?'selected':''}>Every month</option><option value="custom" ${r?.type==='custom'?'selected':''}>Custom interval</option></select></div>
    <div class="fg"><label class="fl">Time</label><input type="time" class="fi" id="rem-remtime" value="${r?.time||'09:00'}"/></div>
  </div>
  <div id="rem-remex" style="margin-bottom:12px">${r?.type==='once'?`<input type="date" class="fi" id="rem-remdate" value="${r?.date||toDay()}"/>`:''}${r?.type==='weekly'?`<select class="fsel" id="rem-remday">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>`<option ${r?.weekday===d?'selected':''}>${d}</option>`).join('')}</select>`:''}${r?.type==='monthly'?`<input type="number" class="fi" id="rem-remmday" min="1" max="28" value="${r?.monthDay||1}"/>`:''}${r?.type==='custom'?`<input type="number" class="fi" id="rem-remint" min="1" value="${r?.intervalDays||7}" placeholder="Every X days"/>`:''}
  </div>
  <div class="fg"><label class="fl">Project (optional)</label><select class="fsel" id="rem-proj"><option value="">None</option>${Object.entries(db.projects).map(([k,p])=>`<option value="${k}" ${r?.project===k?'selected':''}>${p.name}</option>`).join('')}</select></div>
  <div class="fg"><label class="fl">Notes</label><textarea class="fta" id="rem-notes" placeholder="Additional context...">${esc(r?.notes||'')}</textarea></div>`}
function submitReminder(editId){
  const title=document.getElementById('rem-title').value.trim();if(!title){toast('Enter a reminder title');return}
  const type=document.getElementById('rem-remtype').value;
  const r={id:editId||uid(),title,type,time:document.getElementById('rem-remtime').value,project:document.getElementById('rem-proj').value,notes:document.getElementById('rem-notes').value.trim()};
  if(type==='once')r.date=document.getElementById('rem-remdate')?.value;
  if(type==='weekly')r.weekday=document.getElementById('rem-remday')?.value;
  if(type==='monthly')r.monthDay=document.getElementById('rem-remmday')?.value;
  if(type==='custom')r.intervalDays=document.getElementById('rem-remint')?.value;
  if(editId){const i=db.reminders.findIndex(r=>r.id===editId);db.reminders[i]=r}else db.reminders.push(r);
  saveDB(db);closeModal();render();toast(editId?'Reminder updated':'Reminder added');schedRem(r)
}
function deleteReminder(id){if(!confirm('Delete this reminder?'))return;db.reminders=db.reminders.filter(r=>r.id!==id);saveDB(db);render();toast('Reminder deleted')}
function toggleDigest(){db.settings.morningDigest=document.getElementById('digt').checked;saveDB(db);toast(db.settings.morningDigest?'Morning digest on':'Morning digest off')}
function saveDigestTime(){db.settings.morningDigestTime=document.getElementById('digt-time').value;saveDB(db);toast('Time saved')}
function addRC(){const n=prompt('New repair category:');if(!n||!n.trim())return;db.repairCategories.push(n.trim());saveDB(db);curRepairCat=n.trim();render()}
async function reqNotif(){if(typeof Notification==='undefined'){toast('Not supported here');return}const p=await Notification.requestPermission();db.settings.notificationsEnabled=p==='granted';saveDB(db);render();toast(p==='granted'?'Notifications enabled!':'Not granted')}

function schedRem(r){
  if(typeof Notification==='undefined'||Notification.permission!=='granted')return;
  const now=new Date();const[h,m]=(r.time||'09:00').split(':').map(Number);let target=null;
  if(r.type==='once'&&r.date)target=new Date(r.date+'T'+r.time);
  else if(r.type==='daily'){target=new Date();target.setHours(h,m,0,0);if(target<=now)target.setDate(target.getDate()+1)}
  else if(r.type==='weekly'&&r.weekday){const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];const td=days.indexOf(r.weekday);target=new Date();target.setHours(h,m,0,0);while(target.getDay()!==td||target<=now)target.setDate(target.getDate()+1)}
  if(target&&target>now)setTimeout(()=>{new Notification('Life OS — '+r.title,{body:r.notes||fmtRem(r)})},target-now)
}

function exportJSON(){dl(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),`lifeos-backup-${toDay()}.json`)}
function exportCSV(){const h=['Title','Project','Category','Priority','Due','Cost','Tools','Notes','Done','Completed At'];const rows=db.tasks.map(t=>[t.title,db.projects[t.project]?.name||'',t.repairCat||'',t.priority||'',t.dueDate||'',t.cost||'',(t.tools||[]).join('; '),t.notes||'',t.completed?'Yes':'No',t.completedAt||'']);const csv=[h,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');dl(new Blob([csv],{type:'text/csv'}),`lifeos-tasks-${toDay()}.csv`)}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click()}
function importJSON(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const d=JSON.parse(e.target.result);if(!d.tasks||!d.projects)throw 0;if(!confirm('Replace all data?'))return;db=d;saveDB(db);render();toast('Restored!')}catch{toast('Invalid file')}};r.readAsText(f)}
function copyProjSummary(){const k=document.getElementById('sp-sel').value;const p=db.projects[k];const tasks=db.tasks.filter(t=>t.project===k&&!t.completed);const cost=projCost(k);let text=`${p.name} — Summary\n${new Date().toLocaleDateString()}\n\n`;tasks.forEach(t=>{text+=`[${t.priority}] ${t.title}${t.dueDate?' — Due '+fmtDate(t.dueDate):''}${t.cost?' — $'+parseFloat(t.cost).toFixed(2):''}\n`});if(cost>0)text+=`\nTotal: $${cost.toFixed(2)}`;if(p.notes)text+=`\nNotes:\n${p.notes}`;navigator.clipboard.writeText(text).then(()=>toast('Copied!'))}
function shareProject(key){const p=db.projects[key];const tasks=db.tasks.filter(t=>t.project===key&&!t.completed);let text=`${p.name} — ${new Date().toLocaleDateString()}\n\n`;tasks.forEach(t=>{text+=`[${t.priority}] ${t.title}${t.dueDate?' (Due '+fmtDate(t.dueDate)+')':''}\n`});navigator.clipboard.writeText(text).then(()=>toast('Copied!'))}
function viewPhoto(src){openModal(`<div class="mh"><div class="mt">Photo</div><button class="ib" onclick="closeModal()">&#10005;</button></div><img src="${src}" style="width:100%;border-radius:var(--r);margin-top:8px"/>`)}

function openModal(html){document.getElementById('mc').innerHTML=html;document.getElementById('mo').classList.remove('h')}
function closeModal(){document.getElementById('mo').classList.add('h')}
let tt;function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.remove('h');clearTimeout(tt);tt=setTimeout(()=>el.classList.add('h'),2800)}

function toDay(){return new Date().toISOString().slice(0,10)}
function fmtDate(s){if(!s)return'';const[y,mo,d]=s.split('-');return`${mo}/${d}/${y}`}
function fmtDateLong(s){if(!s)return'';const d=new Date(s+'T12:00:00');return d.toLocaleDateString('en-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('sbt').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('collapsed'));
  document.querySelectorAll('.ni').forEach(b=>b.addEventListener('click',()=>{curRepairCat=null;nav(b.dataset.view,b.dataset.project||null)}));
  document.querySelectorAll('.bn-item').forEach(b=>b.addEventListener('click',()=>{curRepairCat=null;nav(b.dataset.view,null)}));
  document.getElementById('mo').addEventListener('click',e=>{if(e.target===document.getElementById('mo'))closeModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/LifeOS/sw.js',{scope:'/LifeOS/'}).catch(()=>{});
  }
  db.reminders.forEach(schedRem);
  render();
});
