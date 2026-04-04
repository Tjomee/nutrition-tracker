import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "calorie-tracker-v6";
const GOALS_KEY   = "calorie-goals-v6";
const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65, fiber: 30 };

const NUTRIENTS = [
  { key: "calories", label: "Calories",    unit: "kcal", color: "#ff6b4a" },
  { key: "protein",  label: "Protein",     unit: "g",    color: "#4a9eff" },
  { key: "carbs",    label: "Carbs",       unit: "g",    color: "#f0b429" },
  { key: "fat",      label: "Fat",         unit: "g",    color: "#c084fc" },
  { key: "fiber",    label: "Fiber",       unit: "g",    color: "#34d399" },
];

const MEAL_CATS = [
  { key: "breakfast", label: "Breakfast", icon: "🌅" },
  { key: "lunch",     label: "Lunch",     icon: "☀️" },
  { key: "snack",     label: "Snack",     icon: "🍎" },
  { key: "dinner",    label: "Dinner",    icon: "🌙" },
];

// Analysis bar colors — original per nutrient, orange for calories
const ANALYSIS_COLORS = {
  calories: "#f97316",
  protein:  "#4a9eff",
  carbs:    "#f0b429",
  fat:      "#c084fc",
  fiber:    "#34d399",
  burned:   "#34d399",
};

function getTodayKey() { return new Date().toISOString().split("T")[0]; }
function loadData()    { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"); } catch { return {}; } }
function saveData(d)   { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function emptyDay() {
  return { meals:{breakfast:[],lunch:[],snack:[],dinner:[]}, workouts:[], totals:{calories:0,protein:0,carbs:0,fat:0,fiber:0}, burned:0 };
}
function calcTotals(meals) {
  return Object.values(meals).flat().reduce((a,m)=>({
    calories:a.calories+(m.calories||0), protein:a.protein+(m.protein||0),
    carbs:a.carbs+(m.carbs||0), fat:a.fat+(m.fat||0), fiber:a.fiber+(m.fiber||0),
  }), {calories:0,protein:0,carbs:0,fat:0,fiber:0});
}
function calcBurned(w){ return (w||[]).reduce((a,x)=>a+(x.calories||0),0); }

function dateKey(daysAgo) {
  const d=new Date(); d.setDate(d.getDate()-daysAgo);
  return d.toISOString().split("T")[0];
}
function ml(name,cal,p,c,f,fi,time){ return {name,calories:cal,protein:p,carbs:c,fat:f,fiber:fi,time}; }
function wk(type,min,cal,time){ return {type,minutes:min,calories:cal,time}; }
function buildDay(breakfast,lunch,snack,dinner,workouts){
  const meals={breakfast,lunch,snack,dinner};
  return {meals,workouts,totals:calcTotals(meals),burned:calcBurned(workouts)};
}
const SAMPLE_DATA = {
  [dateKey(1)]: buildDay(
    [ml("Scrambled Eggs",280,18,2,20,0,"08:10"),ml("Whole Wheat Toast",140,4,26,2,3,"08:10")],
    [ml("Grilled Chicken Breast",320,48,0,8,0,"13:00"),ml("White Rice",230,4,50,1,1,"13:00"),ml("Steamed Broccoli",55,4,11,1,4,"13:00")],
    [ml("Apple",95,0,25,0,4,"16:00"),ml("Almonds",180,6,6,16,3,"16:30")],
    [ml("Salmon Fillet",350,38,0,22,0,"19:30"),ml("Roasted Zucchini",60,3,10,1,3,"19:30"),ml("Cherry Tomatoes",35,2,7,0,2,"19:30")],
    [wk("Gym",70,480,"18:00")]
  ),
  [dateKey(2)]: buildDay(
    [ml("Oatmeal",180,6,32,3,4,"07:45"),ml("Banana",105,1,27,0,3,"07:45"),ml("Honey",65,0,18,0,0,"07:45")],
    [ml("Tuna",140,26,0,3,0,"12:30"),ml("Whole Grain Bread",160,6,30,2,4,"12:30"),ml("Lettuce & Tomato",35,2,7,0,2,"12:30"),ml("Mayonnaise",90,0,1,10,0,"12:30")],
    [ml("Greek Yogurt",150,15,12,3,0,"15:45")],
    [ml("Beef",380,38,0,24,0,"20:00"),ml("Egg Noodles",220,8,42,3,2,"20:00"),ml("Bell Pepper & Onion",55,2,12,0,3,"20:00"),ml("Soy Sauce",15,2,2,0,0,"20:00")],
    []
  ),
  [dateKey(3)]: buildDay(
    [ml("Whey Protein Shake",150,25,6,3,0,"08:00"),ml("Rolled Oats",150,5,27,3,4,"08:00"),ml("Blueberries",55,1,14,0,2,"08:00")],
    [ml("Chicken Breast",260,38,0,10,0,"13:15"),ml("Flour Tortilla",140,4,26,3,2,"13:15"),ml("Avocado",80,1,4,7,3,"13:15"),ml("Salsa",25,1,5,0,1,"13:15")],
    [],
    [ml("Pork Chop",380,40,0,24,0,"19:00"),ml("Mashed Potatoes",210,4,38,6,3,"19:00"),ml("Mixed Green Salad",55,3,10,1,3,"19:05"),ml("Olive Oil Dressing",60,0,1,6,0,"19:05")],
    [wk("Running",45,380,"07:00")]
  ),
  [dateKey(4)]: buildDay(
    [ml("Sourdough Bread",160,6,32,1,2,"09:00"),ml("Avocado",120,2,6,10,5,"09:00"),ml("Poached Egg",70,6,0,5,0,"09:00"),ml("Cherry Tomatoes",30,1,6,0,2,"09:00")],
    [ml("Romaine Lettuce",25,2,5,0,2,"13:00"),ml("Grilled Chicken",220,36,0,8,0,"13:00"),ml("Parmesan",80,7,1,5,0,"13:00"),ml("Caesar Dressing",120,1,2,12,0,"13:00"),ml("Croutons",60,2,10,2,0,"13:00")],
    [ml("Banana",105,1,27,0,3,"16:15"),ml("Rice Cakes",80,2,17,1,1,"16:20"),ml("Peanut Butter",190,7,7,16,2,"16:20")],
    [ml("Spaghetti",280,10,56,1,2,"20:00"),ml("Ground Beef",240,22,0,16,0,"20:00"),ml("Tomato Sauce",90,4,18,1,4,"20:00"),ml("Parmesan",70,6,1,5,0,"20:00")],
    [wk("Gym",65,440,"17:30")]
  ),
  [dateKey(5)]: buildDay(
    [ml("Pancakes",320,8,58,8,2,"10:00"),ml("Maple Syrup",120,0,31,0,0,"10:00"),ml("Butter",70,0,0,8,0,"10:00")],
    [ml("Beef Patty",380,28,0,30,0,"13:30"),ml("Brioche Bun",150,5,28,3,1,"13:30"),ml("Sweet Potato Fries",280,3,52,8,5,"13:30"),ml("Cheddar Cheese",110,7,0,9,0,"13:30")],
    [ml("Orange",85,1,21,0,4,"16:00")],
    [ml("Shrimp",150,28,2,3,0,"19:30"),ml("Quinoa",220,8,40,4,5,"19:30"),ml("Lemon Butter Sauce",110,1,1,12,0,"19:30"),ml("Asparagus",40,4,6,0,3,"19:30")],
    []
  ),
};

async function parseInput(text) {
  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:1200,
      system:`You are a nutritionist and fitness tracker. The user describes meals and/or workouts in any language.

YOUR MOST IMPORTANT RULE: Every single ingredient or food item MUST be a SEPARATE entry in the array. NEVER combine multiple foods into one entry.

EXAMPLE INPUT: "Za rucak sam jeo papriku 100g, pecurke 200g i piletinu 200g"
CORRECT OUTPUT:
[
  {"type":"meal","category":"lunch","name":"Bell Pepper 100g","calories":31,"protein":1,"carbs":7,"fat":0,"fiber":2},
  {"type":"meal","category":"lunch","name":"Mushrooms 200g","calories":44,"protein":6,"carbs":6,"fat":1,"fiber":2},
  {"type":"meal","category":"lunch","name":"Chicken Breast 200g","calories":330,"protein":62,"carbs":0,"fat":7,"fiber":0}
]

WRONG OUTPUT (never do this):
[{"type":"meal","category":"lunch","name":"Pepper, mushrooms and chicken","calories":405,...}]

RULES:
- One array entry per ingredient/food — always split, never combine
- Include weight/quantity in the name if mentioned (e.g. "Eggs 3pcs", "Rice 150g")
- Translate all names to English
- All ingredients of the same meal share the same category
- Workout format: {"type":"workout","workoutType":"English name","minutes":number,"calories":number}
- Respond ONLY with the JSON array, zero text before or after`,
      messages:[{role:"user",content:text}],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.error || err.detail?.error?.message || `API error ${res.status}`);
  }
  const data=await res.json();
  const txt=(data.content||[]).map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
  const p=JSON.parse(txt); return Array.isArray(p)?p:[p];
}

// ── Bar chart ──────────────────────────────────────────────────────────────
function BarChart({ data, color, label, overColor }) {
  if(!data.length) return null;
  const max=Math.max(...data.map(d=>d.value),1);
  return (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:12,fontWeight:600,color:"#8899aa",marginBottom:8}}>{label}</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80}}>
        {data.map((d,i)=>{
          const h=Math.max((d.value/max)*80, d.value>0?3:0);
          const barColor = overColor && d.over ? "#7f1d1d" : color;
          return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:"100%",height:h,background:barColor,borderRadius:"3px 3px 0 0",transition:"height .3s",minWidth:4,opacity:d.value>0?1:0.15}}/>
              <div style={{fontSize:8,color:"#334455",textAlign:"center",lineHeight:1,whiteSpace:"nowrap"}}>{d.label}</div>
            </div>
          );
        })}
      </div>
      {overColor&&<div style={{fontSize:10,color:"#334455",marginTop:4,display:"flex",alignItems:"center",gap:6}}><span style={{display:"inline-block",width:10,height:3,background:"#ff6b4a",borderRadius:1}}/>over goal</div>}
    </div>
  );
}

// ── Donut ──────────────────────────────────────────────────────────────────
function DonutChart({ slices, size=110 }) {
  const r=(size-16)/2, circ=2*Math.PI*r;
  const total=slices.reduce((a,s)=>a+s.value,0)||1;
  let offset=0;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a2235" strokeWidth={12}/>
      {slices.map((s,i)=>{
        const dash=(s.value/total)*circ;
        const el=<circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth={12} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} strokeLinecap="butt"/>;
        offset+=dash; return el;
      })}
    </svg>
  );
}

// ── Ring ───────────────────────────────────────────────────────────────────
function Ring({value,max,color,size=88}){
  const r=(size-10)/2,circ=2*Math.PI*r,pct=Math.min(value/max,1);
  return(
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a2235" strokeWidth={7}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round"
        style={{transition:"stroke-dasharray .5s ease"}}/>
    </svg>
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────
function EditMealModal({meal,onSave,onClose}){
  const [draft,setDraft]=useState({...meal});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={onClose}>
      <div style={{background:"#151c2c",borderRadius:"20px 20px 0 0",padding:24,width:"100%",border:"1px solid #1e2a3a",boxSizing:"border-box"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:16}}>Edit Entry</div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#556677",marginBottom:4}}>Name</div>
          <input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}
            style={{width:"100%",background:"#0d1117",border:"1px solid #2a3a50",borderRadius:8,color:"#e8eaf0",padding:"8px 12px",fontSize:14,boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {NUTRIENTS.map(n=>(
            <div key={n.key}>
              <div style={{fontSize:11,color:n.color,marginBottom:4}}>{n.label} ({n.unit})</div>
              <input type="number" value={draft[n.key]} onChange={e=>setDraft(d=>({...d,[n.key]:Number(e.target.value)}))}
                style={{width:"100%",background:"#0d1117",border:"1px solid #2a3a50",borderRadius:8,color:"#e8eaf0",padding:"8px 10px",fontSize:14,boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,background:"#1e2a3a",border:"1px solid #2a3a50",borderRadius:10,color:"#8899aa",padding:12,cursor:"pointer",fontSize:14}}>Cancel</button>
          <button onClick={()=>onSave(draft)} style={{flex:1,background:"#4a9eff",border:"none",borderRadius:10,color:"#fff",padding:12,cursor:"pointer",fontSize:14,fontWeight:700}}>Save</button>
        </div>
      </div>
    </div>
  );
}

function GoalsModal({goals,onSave,onClose}){
  const [draft,setDraft]=useState({...goals});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={onClose}>
      <div style={{background:"#151c2c",borderRadius:"20px 20px 0 0",padding:24,width:"100%",border:"1px solid #1e2a3a",boxSizing:"border-box"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:16}}>⚙ Daily Goals</div>
        {NUTRIENTS.map(n=>(
          <div key={n.key} style={{marginBottom:12}}>
            <div style={{fontSize:11,color:n.color,marginBottom:4}}>{n.label} ({n.unit})</div>
            <input type="number" value={draft[n.key]} onChange={e=>setDraft(d=>({...d,[n.key]:Number(e.target.value)}))}
              style={{width:"100%",background:"#0d1117",border:"1px solid #2a3a50",borderRadius:8,color:"#e8eaf0",padding:"8px 12px",fontSize:14,boxSizing:"border-box"}}/>
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button onClick={onClose} style={{flex:1,background:"#1e2a3a",border:"1px solid #2a3a50",borderRadius:10,color:"#8899aa",padding:12,cursor:"pointer",fontSize:14}}>Cancel</button>
          <button onClick={()=>onSave(draft)} style={{flex:1,background:"#4a9eff",border:"none",borderRadius:10,color:"#fff",padding:12,cursor:"pointer",fontSize:14,fontWeight:700}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Dinner Suggestions ────────────────────────────────────────────────────
function DinnerSuggestions({ today, goals }) {
  const [status, setStatus]           = useState("idle"); // idle|loading|done|err
  const [suggestions, setSuggestions] = useState([]);

  async function getSuggestions() {
    setStatus("loading"); setSuggestions([]);
    const remaining = {
      calories: Math.max(0, goals.calories - today.totals.calories - (today.burned||0)),
      protein:  Math.max(0, goals.protein  - today.totals.protein),
      carbs:    Math.max(0, goals.carbs    - today.totals.carbs),
      fat:      Math.max(0, goals.fat      - today.totals.fat),
      fiber:    Math.max(0, goals.fiber    - today.totals.fiber),
    };
    const eaten = Object.values(today.meals).flat().map(m=>m.name).join(", ") || "nothing yet";
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:600,
          system:`You are a nutritionist. Suggest dinner options based on what the user has eaten today and what nutrients they still need. Respond ONLY with a JSON array, no text before or after:
[{"name":"Meal name","calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number,"description":"1 short sentence why this fits"}]
Give exactly 3 suggestions. Keep names short (max 5 words). Make suggestions realistic and varied.`,
          messages:[{role:"user",content:`Eaten today: ${eaten}. Still need: ${remaining.calories} kcal, ${remaining.protein}g protein, ${remaining.carbs}g carbs, ${remaining.fat}g fat, ${remaining.fiber}g fiber.`}],
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const txt = (data.content||[]).map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(txt);
      setSuggestions(Array.isArray(parsed)?parsed:[parsed]);
      setStatus("done");
    } catch {
      setStatus("err");
    }
  }

  return (
    <div style={{background:"#121927",borderRadius:16,border:"1px solid #1a2235",marginBottom:10,overflow:"hidden"}}>
      <div style={{padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span>💡</span>
          <span style={{fontWeight:700,fontSize:14}}>Dinner Suggestions</span>
        </div>
        <button onClick={getSuggestions} disabled={status==="loading"}
          style={{background:status==="loading"?"#1a2235":"#4a9eff",border:"none",borderRadius:8,color:status==="loading"?"#445566":"#fff",padding:"5px 12px",fontSize:12,fontWeight:600,cursor:status==="loading"?"not-allowed":"pointer"}}>
          {status==="loading"?<span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>↻</span>:"Suggest"}
        </button>
      </div>

      {status==="loading"&&(
        <div style={{padding:"10px 14px",borderTop:"1px solid #1a2235",fontSize:12,color:"#4a9eff"}}>⏳ Analyzing your day...</div>
      )}
      {status==="err"&&(
        <div style={{padding:"10px 14px",borderTop:"1px solid #1a2235",fontSize:12,color:"#ff6b4a"}}>Error — try again.</div>
      )}
      {status==="done"&&suggestions.map((s,i)=>(
        <div key={i} style={{padding:"11px 14px",borderTop:"1px solid #1a2235"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <span style={{fontSize:13,fontWeight:700,color:"#e8eaf0",flex:1,marginRight:8}}>{s.name}</span>
            <span style={{fontSize:12,color:"#ff6b4a",fontWeight:700,flexShrink:0}}>{s.calories} kcal</span>
          </div>
          <div style={{fontSize:11,color:"#556677",marginBottom:5}}>{s.description}</div>
          <div style={{display:"flex",gap:8,fontSize:10}}>
            <span style={{color:"#4a9eff"}}>P {s.protein}g</span>
            <span style={{color:"#f0b429"}}>C {s.carbs}g</span>
            <span style={{color:"#c084fc"}}>F {s.fat}g</span>
            <span style={{color:"#34d399"}}>Fi {s.fiber}g</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function App(){
  const [allData,setAllData]         = useState({});
  const [goals,setGoals]             = useState(DEFAULT_GOALS);
  const [tab,setTab]                 = useState("today");
  const [input,setInput]             = useState("");
  const [status,setStatus]           = useState("idle");
  const [statusItems,setStatusItems] = useState([]);
  const [editMeal,setEditMeal]       = useState(null);
  const [showGoals,setShowGoals]     = useState(false);
  const [showExport,setShowExport]   = useState(false);  const [expandedDay,setExpandedDay] = useState(null);
  const [expandedCat,setExpandedCat] = useState({});
  const [analysisPeriod,setAnalysisPeriod] = useState(7);


  useEffect(()=>{
    setAllData(loadData());
    try{const g=JSON.parse(localStorage.getItem(GOALS_KEY));if(g)setGoals(g);}catch{}
  },[]);

  const todayKey=getTodayKey();

  function getDay(key){
    const d=allData[key];
    if(!d||!d.meals||Array.isArray(d.meals)) return emptyDay();
    return {...d, meals:{
      breakfast:d.meals.breakfast||d.meals.dorucak||[],
      lunch:    d.meals.lunch    ||d.meals.rucak  ||[],
      snack:    d.meals.snack    ||d.meals.uzina  ||[],
      dinner:   d.meals.dinner   ||d.meals.vecera ||[],
    }};
  }

  const today=getDay(todayKey);

  function commitDay(day){
    day.totals=calcTotals(day.meals);
    day.burned=calcBurned(day.workouts);
    const updated={...allData,[todayKey]:day};
    setAllData(updated); saveData(updated);
  }

  function loadSampleData(){
    const merged={...allData,...SAMPLE_DATA};
    setAllData(merged); saveData(merged); setTab("history");
  }

  async function handleAdd(){
    if(!input.trim()||status==="loading") return;
    setStatus("loading"); setStatusItems([]);
    try{
      const results=await parseInput(input.trim());
      const day=JSON.parse(JSON.stringify(getDay(todayKey)));
      const time=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
      const added=[];
      for(const r of results){
        if(r.type==="meal"){
          const cat=r.category||"snack";
          day.meals[cat]=[...(day.meals[cat]||[]),{name:r.name,calories:r.calories,protein:r.protein,carbs:r.carbs,fat:r.fat,fiber:r.fiber,time}];
          added.push(`${MEAL_CATS.find(c=>c.key===cat)?.label||cat}: ${r.name} (${r.calories} kcal)`);
        } else if(r.type==="workout"){
          day.workouts=[...(day.workouts||[]),{type:r.workoutType,minutes:r.minutes,calories:r.calories,time}];
          added.push(`Workout: ${r.workoutType} ${r.minutes}min (-${r.calories} kcal)`);
        }
      }
      commitDay(day); setInput(""); setStatus("ok"); setStatusItems(added);
      setTimeout(()=>setStatus("idle"),4000);
    }catch{
      setStatus("err"); setStatusItems(["Error — please try again."]);
      setTimeout(()=>setStatus("idle"),4000);
    }
  }

  function deleteMeal(catKey,index){
    const day=JSON.parse(JSON.stringify(getDay(todayKey)));
    day.meals[catKey]=day.meals[catKey].filter((_,i)=>i!==index); commitDay(day);
  }
  function saveEditMeal(catKey,index,updated){
    const day=JSON.parse(JSON.stringify(getDay(todayKey)));
    day.meals[catKey][index]=updated; commitDay(day); setEditMeal(null);
  }
  function deleteWorkout(i){
    const day=JSON.parse(JSON.stringify(getDay(todayKey)));
    day.workouts=day.workouts.filter((_,j)=>j!==i); commitDay(day);
  }
  function saveGoals(g){setGoals(g);localStorage.setItem(GOALS_KEY,JSON.stringify(g));setShowGoals(false);}

  function buildCSV() {
    const rows = [];
    rows.push(["Date","Weekday","Category","Food Item","Calories","Protein(g)","Carbs(g)","Fat(g)","Fiber(g)"]);
    const sortedDays = Object.keys(allData).sort();
    for (const day of sortedDays) {
      const d = allData[day];
      if (!d || !d.meals) continue;
      const date = new Date(day + "T12:00:00");
      const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
      const dateStr = date.toLocaleDateString("en-US", { year:"numeric", month:"2-digit", day:"2-digit" });
      const meals = {
        breakfast: d.meals.breakfast || d.meals.dorucak || [],
        lunch:     d.meals.lunch     || d.meals.rucak   || [],
        snack:     d.meals.snack     || d.meals.uzina   || [],
        dinner:    d.meals.dinner    || d.meals.vecera  || [],
      };
      for (const [catKey, items] of Object.entries(meals)) {
        const catLabel = MEAL_CATS.find(c=>c.key===catKey)?.label || catKey;
        for (const m of items) {
          rows.push([dateStr, weekday, catLabel, m.name, m.calories, m.protein, m.carbs, m.fat, m.fiber]);
        }
      }
      for (const w of (d.workouts||[])) {
        rows.push([dateStr, weekday, "Workout", `${w.type} ${w.minutes}min`, -w.calories, "", "", "", ""]);
      }
      if (d.totals) {
        rows.push([dateStr, weekday, "TOTAL", "", Math.round(d.totals.calories), Math.round(d.totals.protein), Math.round(d.totals.carbs), Math.round(d.totals.fat), Math.round(d.totals.fiber)]);
        rows.push([]);
      }
    }
    return rows.map(r => r.join(",")).join("\n");
  }

  function toggleCat(dayKey,catKey){
    const k=`${dayKey}_${catKey}`;
    setExpandedCat(prev=>({...prev,[k]:!prev[k]}));
  }

  const net=today.totals.calories-(today.burned||0);
  const historyDays=Object.keys(allData).filter(k=>k!==todayKey).sort((a,b)=>b.localeCompare(a)).slice(0,60);
  const hasAnything=Object.values(today.meals).some(a=>a.length>0)||(today.workouts||[]).length>0;

  // Analytics
  function getAnalysisData(days){
    const result=[];
    for(let i=days-1;i>=0;i--){
      const key=dateKey(i);
      const d=allData[key];
      const date=new Date(); date.setDate(date.getDate()-i);
      const shortLabel=date.toLocaleDateString("en-US",{weekday:"short"}).slice(0,2);
      const dateLabel=date.toLocaleDateString("en-US",{month:"numeric",day:"numeric"});
      result.push({
        key, label:days<=7?shortLabel:dateLabel, date,
        totals:d?.totals||{calories:0,protein:0,carbs:0,fat:0,fiber:0},
        burned:d?.burned||0, hasData:!!(d?.totals),
      });
    }
    return result;
  }

  const analysisData=getAnalysisData(analysisPeriod);
  const daysWithData=analysisData.filter(d=>d.hasData);
  const avg=(key)=>daysWithData.length?Math.round(daysWithData.reduce((a,d)=>a+d.totals[key],0)/daysWithData.length):0;
  const avgCalories=avg("calories"), avgProtein=avg("protein"), avgCarbs=avg("carbs"), avgFat=avg("fat");
  const workoutDays=daysWithData.filter(d=>d.burned>0).length;
  const totalBurned=daysWithData.reduce((a,d)=>a+d.burned,0);
  const macroTotal=avgProtein*4+avgCarbs*4+avgFat*9||1;
  const macroSlices=[
    {label:"Protein",value:avgProtein*4,color:"#4a9eff"},
    {label:"Carbs",  value:avgCarbs*4,  color:"#f0b429"},
    {label:"Fat",    value:avgFat*9,    color:"#c084fc"},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#0d1117",color:"#e8eaf0",fontFamily:"DM Sans,Segoe UI,sans-serif",paddingBottom:60}}>

      {/* Header */}
      <div style={{background:"#0d1117",borderBottom:"1px solid #1a2235",padding:"18px 16px 0",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontSize:10,letterSpacing:3,color:"#4a9eff",textTransform:"uppercase",marginBottom:2}}>Daily</div>
            <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5}}>Nutrition Tracker</div>
          </div>
          <button onClick={()=>setShowGoals(true)} style={{background:"#1a2235",border:"1px solid #2a3a50",borderRadius:8,color:"#8899aa",padding:"6px 12px",fontSize:12,cursor:"pointer"}}>⚙ Goals</button>
          <button onClick={()=>setShowExport(true)} style={{background:"#1a2235",border:"1px solid #2a3a50",borderRadius:8,color:"#34d399",padding:"6px 12px",fontSize:12,cursor:"pointer"}}>↓ Export</button>
        </div>
        <div style={{display:"flex"}}>
          {["today","history","analysis"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:"none",border:"none",borderBottom:tab===t?"2px solid #4a9eff":"2px solid transparent",color:tab===t?"#4a9eff":"#445566",padding:"10px 0",fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>
              {t==="today"?"Today":t==="history"?"History":"Analysis"}
            </button>
          ))}
        </div>
      </div>

      {/* ── TODAY ── */}
      {tab==="today"&&(
        <div style={{padding:"14px 14px"}}>
          <div style={{background:"#121927",borderRadius:18,padding:16,marginBottom:14,border:"1px solid #1a2235"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{position:"relative",width:88,height:88,flexShrink:0}}>
                <Ring value={net} max={goals.calories} color={net>goals.calories?"#ff6b4a":"#4a9eff"} size={88}/>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#ff6b4a",lineHeight:1}}>{Math.round(today.totals.calories)}</div>
                  <div style={{fontSize:8,color:"#334455",letterSpacing:1}}>EATEN</div>
                  {today.burned>0&&<><div style={{fontSize:12,fontWeight:700,color:"#34d399",lineHeight:1}}>-{today.burned}</div><div style={{fontSize:8,color:"#334455",letterSpacing:1}}>BURNED</div></>}
                </div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:net>goals.calories?"#ff6b4a":"#8899aa",marginBottom:8}}>
                  {net>goals.calories?`⚠ Over by ${Math.round(net-goals.calories)} kcal`:`Net remaining: ${Math.round(goals.calories-net)} kcal`}
                </div>
                {NUTRIENTS.slice(1).map(n=>(
                  <div key={n.key} style={{marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <span style={{fontSize:11,color:"#445566"}}>{n.label}</span>
                      <span style={{fontSize:11,color:n.color,fontWeight:600}}>{Math.round(today.totals[n.key])}<span style={{color:"#2a3a50"}}>/{goals[n.key]}{n.unit}</span></span>
                    </div>
                    <div style={{height:3,background:"#1a2235",borderRadius:3}}>
                      <div style={{height:"100%",width:`${Math.min(today.totals[n.key]/goals[n.key]*100,100)}%`,background:n.color,borderRadius:3,transition:"width .4s"}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Input */}
          <div style={{background:"#121927",borderRadius:18,padding:16,marginBottom:14,border:"1px solid #1a2235"}}>
            <div style={{fontSize:11,color:"#445566",letterSpacing:1,marginBottom:4}}>WHAT DID YOU EAT / WORKOUT</div>
            <div style={{fontSize:11,color:"#2a3a50",marginBottom:10}}>Each ingredient is logged separately</div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()}
                placeholder="e.g. breakfast eggs tomato bread, gym 60min"
                disabled={status==="loading"}
                style={{flex:1,background:"#0d1117",border:"1px solid #2a3a50",borderRadius:10,color:"#e8eaf0",padding:"10px 13px",fontSize:13,outline:"none",opacity:status==="loading"?0.6:1}}/>

              <button onClick={handleAdd} disabled={status==="loading"||!input.trim()}
                style={{background:status==="loading"||!input.trim()?"#1a2235":"#4a9eff",border:"none",borderRadius:10,color:status==="loading"||!input.trim()?"#445566":"#fff",width:44,fontSize:20,fontWeight:700,cursor:status==="loading"||!input.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {status==="loading"?<span style={{fontSize:14,display:"inline-block",animation:"spin 1s linear infinite"}}>↻</span>:"+"}
              </button>
            </div>
            {status==="loading"&&<div style={{fontSize:12,color:"#4a9eff",padding:"7px 10px",background:"#0a1a2a",borderRadius:8}}>⏳ Analyzing...</div>}
            {status==="ok"&&statusItems.length>0&&(
              <div style={{padding:"8px 10px",background:"#0a2a1a",border:"1px solid #1a4a2a",borderRadius:8,maxHeight:140,overflowY:"auto"}}>
                {statusItems.map((s,i)=><div key={i} style={{fontSize:11,color:"#34d399",lineHeight:1.7}}>✓ {s}</div>)}
              </div>
            )}
            {status==="err"&&<div style={{fontSize:12,color:"#ff6b4a",padding:"7px 10px",background:"#2a0a0a",border:"1px solid #4a1a1a",borderRadius:8}}>{statusItems[0]}</div>}

          </div>

          {MEAL_CATS.map(cat=>{
            const items=today.meals[cat.key]||[];
            if(!items.length) return null;
            const catCal=items.reduce((a,m)=>a+(m.calories||0),0);
            const todayCatKey=`today_${cat.key}`;
            const isOpen=!!expandedCat[todayCatKey];
            return(
              <div key={cat.key} style={{background:"#121927",borderRadius:16,border:"1px solid #1a2235",marginBottom:10,overflow:"hidden"}}>
                {/* Header — tap to expand */}
                <div onClick={()=>toggleCat("today",cat.key)}
                  style={{padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span>{cat.icon}</span>
                    <span style={{fontWeight:700,fontSize:14}}>{cat.label}</span>
                    <span style={{fontSize:11,color:"#445566"}}>({items.length})</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,color:"#ff6b4a",fontWeight:600}}>{catCal} kcal</span>
                    <span style={{color:"#334455",fontSize:14,transition:"transform .2s",display:"inline-block",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
                  </div>
                </div>
                {/* Items — shown when open */}
                {isOpen&&items.map((m,i)=>(
                  <div key={i} style={{padding:"9px 14px",borderTop:"1px solid #141d2c",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:2}}>
                        <span style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</span>
                        <span style={{color:"#ff6b4a",fontWeight:700,fontSize:12,flexShrink:0}}>{m.calories} kcal</span>
                      </div>
                      <div style={{display:"flex",gap:8,fontSize:10}}>
                        <span style={{color:"#4a9eff"}}>P {m.protein}g</span>
                        <span style={{color:"#f0b429"}}>C {m.carbs}g</span>
                        <span style={{color:"#c084fc"}}>F {m.fat}g</span>
                        <span style={{color:"#34d399"}}>Fi {m.fiber}g</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      <button onClick={e=>{e.stopPropagation();setEditMeal({cat:cat.key,index:i});}} style={{background:"none",border:"1px solid #2a3a50",borderRadius:6,color:"#4a9eff",width:26,height:26,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button>
                      <button onClick={e=>{e.stopPropagation();deleteMeal(cat.key,i);}} style={{background:"none",border:"1px solid #2a3a50",borderRadius:6,color:"#445566",width:26,height:26,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {(today.workouts||[]).length>0&&(
            <div style={{background:"#121927",borderRadius:16,border:"1px solid #1a2235",overflow:"hidden"}}>
              <div style={{padding:"11px 14px",borderBottom:"1px solid #1a2235",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}><span>🏋️</span><span style={{fontWeight:700,fontSize:14}}>Workouts</span></div>
                <span style={{fontSize:12,color:"#34d399",fontWeight:600}}>-{today.burned} kcal</span>
              </div>
              {today.workouts.map((wkt,i)=>(
                <div key={i} style={{padding:"10px 14px",borderBottom:i<today.workouts.length-1?"1px solid #141d2c":"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{wkt.type}</div>
                    <div style={{fontSize:11,color:"#445566"}}>{wkt.minutes} min</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{color:"#34d399",fontWeight:700,fontSize:13}}>-{wkt.calories} kcal</span>
                    <button onClick={()=>deleteWorkout(i)} style={{background:"none",border:"1px solid #2a3a50",borderRadius:6,color:"#445566",width:26,height:26,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dinner suggestions */}
          <DinnerSuggestions today={today} goals={goals}/>

          {!hasAnything&&(
            <div style={{textAlign:"center",color:"#2a3a4a",padding:"40px 20px",fontSize:14}}>
              No entries yet today.<br/>
              <span style={{fontSize:12,color:"#1e2a3a"}}>Log what you ate or your workout above ↑</span>
              <div style={{marginTop:20}}>
                <button onClick={loadSampleData} style={{background:"#1a2235",border:"1px dashed #2a3a50",borderRadius:10,color:"#445566",padding:"10px 20px",fontSize:12,cursor:"pointer"}}>
                  Load Sample Data (5 days)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab==="history"&&(
        <div style={{padding:"14px 14px"}}>
          {historyDays.length===0?(
            <div style={{textAlign:"center",color:"#2a3a4a",padding:"60px 20px",fontSize:14}}>
              No history yet.
              <div style={{marginTop:20}}>
                <button onClick={loadSampleData} style={{background:"#1a2235",border:"1px dashed #2a3a50",borderRadius:10,color:"#445566",padding:"10px 20px",fontSize:12,cursor:"pointer"}}>Load Sample Data (5 days)</button>
              </div>
            </div>
          ):historyDays.map(day=>{
            const d=allData[day];
            if(!d||!d.totals) return null;
            const date=new Date(day+"T12:00:00");
            const weekday=date.toLocaleDateString("en-US",{weekday:"long"});
            const dateStr=date.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
            const over=d.totals.calories>goals.calories;
            const burned=d.burned||0;
            const isExpanded=expandedDay===day;
            const meals={
              breakfast:d.meals?.breakfast||d.meals?.dorucak||[],
              lunch:    d.meals?.lunch    ||d.meals?.rucak  ||[],
              snack:    d.meals?.snack    ||d.meals?.uzina  ||[],
              dinner:   d.meals?.dinner   ||d.meals?.vecera ||[],
            };
            const allMeals=Object.values(meals).flat();

            return(
              <div key={day} style={{background:"#121927",borderRadius:14,marginBottom:10,border:"1px solid #1a2235",overflow:"hidden"}}>
                <div onClick={()=>setExpandedDay(isExpanded?null:day)}
                  style={{padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{weekday}</div>
                    <div style={{fontSize:11,color:"#445566",marginTop:1}}>{dateStr}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:over?"#ff6b4a":"#34d399",fontWeight:700,fontSize:14}}>{Math.round(d.totals.calories)} kcal</div>
                      {burned>0&&<div style={{fontSize:11,color:"#34d399"}}>-{burned} burned</div>}
                    </div>
                    <div style={{color:"#334455",fontSize:16,transition:"transform .2s",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
                  </div>
                </div>

                <div style={{height:3,background:"#1a2235",margin:"0 16px"}}>
                  <div style={{height:"100%",width:`${Math.min(d.totals.calories/goals.calories*100,100)}%`,background:over?"#ff6b4a":"#34d399",borderRadius:3}}/>
                </div>

                {isExpanded&&(
                  <div style={{padding:"12px 14px 14px"}}>
                    <div style={{display:"flex",gap:10,fontSize:11,padding:"10px 0",borderTop:"1px solid #1a2235",borderBottom:"1px solid #1a2235",marginBottom:12}}>
                      <span style={{color:"#4a9eff"}}>P {Math.round(d.totals.protein)}g</span>
                      <span style={{color:"#f0b429"}}>C {Math.round(d.totals.carbs)}g</span>
                      <span style={{color:"#c084fc"}}>F {Math.round(d.totals.fat)}g</span>
                      <span style={{color:"#34d399"}}>Fi {Math.round(d.totals.fiber)}g</span>
                      <span style={{color:"#445566",marginLeft:"auto"}}>{allMeals.length} items</span>
                    </div>

                    {/* Meal category dropdowns */}
                    {MEAL_CATS.map(cat=>{
                      const items=meals[cat.key]||[];
                      if(!items.length) return null;
                      const catCal=items.reduce((a,m)=>a+(m.calories||0),0);
                      const catExpKey=`${day}_${cat.key}`;
                      const isCatOpen=!!expandedCat[catExpKey];
                      return(
                        <div key={cat.key} style={{marginBottom:8,background:"#0d1117",borderRadius:10,overflow:"hidden",border:"1px solid #1a2235"}}>
                          <div onClick={()=>toggleCat(day,cat.key)}
                            style={{padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:13}}>{cat.icon}</span>
                              <span style={{fontSize:13,fontWeight:600,color:"#c8cfe0"}}>{cat.label}</span>
                              <span style={{fontSize:11,color:"#445566"}}>({items.length})</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:12,color:"#ff6b4a",fontWeight:600}}>{catCal} kcal</span>
                              <span style={{color:"#334455",fontSize:13,transition:"transform .2s",display:"inline-block",transform:isCatOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
                            </div>
                          </div>
                          {isCatOpen&&items.map((m,i)=>(
                            <div key={i} style={{padding:"8px 12px 8px 16px",borderTop:"1px solid #141d2c",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,color:"#c8cfe0",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{m.name}</div>
                                <div style={{fontSize:10,color:"#334455"}}>P {m.protein}g · C {m.carbs}g · F {m.fat}g · Fi {m.fiber}g</div>
                              </div>
                              <span style={{fontSize:12,color:"#ff6b4a",fontWeight:600,flexShrink:0}}>{m.calories} kcal</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    {(d.workouts||[]).length>0&&(
                      <div style={{background:"#0d1117",borderRadius:10,border:"1px solid #1a2235",overflow:"hidden"}}>
                        <div style={{padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span>🏋️</span>
                            <span style={{fontSize:13,fontWeight:600,color:"#c8cfe0"}}>Workouts</span>
                          </div>
                          <span style={{fontSize:12,color:"#34d399",fontWeight:600}}>-{burned} kcal</span>
                        </div>
                        {d.workouts.map((wkt,i)=>(
                          <div key={i} style={{padding:"8px 12px 8px 16px",borderTop:"1px solid #141d2c",display:"flex",justifyContent:"space-between"}}>
                            <span style={{fontSize:12,color:"#c8cfe0"}}>{wkt.type} · {wkt.minutes} min</span>
                            <span style={{fontSize:12,color:"#34d399",fontWeight:600}}>-{wkt.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ANALYSIS ── */}
      {tab==="analysis"&&(
        <div style={{padding:"14px 14px"}}>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[7,14,30].map(p=>(
              <button key={p} onClick={()=>setAnalysisPeriod(p)}
                style={{flex:1,background:analysisPeriod===p?"#4a9eff":"#121927",border:`1px solid ${analysisPeriod===p?"#4a9eff":"#1a2235"}`,borderRadius:10,color:analysisPeriod===p?"#fff":"#445566",padding:"9px 0",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                {p} days
              </button>
            ))}
          </div>

          {daysWithData.length===0?(
            <div style={{textAlign:"center",color:"#2a3a4a",padding:"60px 20px",fontSize:14}}>
              No data for this period.
              <div style={{marginTop:20}}>
                <button onClick={loadSampleData} style={{background:"#1a2235",border:"1px dashed #2a3a50",borderRadius:10,color:"#445566",padding:"10px 20px",fontSize:12,cursor:"pointer"}}>Load Sample Data</button>
              </div>
            </div>
          ):(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[
                  {label:"Avg Calories", value:`${avgCalories} kcal`, color:ANALYSIS_COLORS.calories, sub:`Goal: ${goals.calories} kcal`},
                  {label:"Avg Protein",  value:`${avgProtein}g`,      color:ANALYSIS_COLORS.protein,  sub:`Goal: ${goals.protein}g`},
                  {label:"Workout Days", value:`${workoutDays}/${daysWithData.length}`, color:ANALYSIS_COLORS.burned, sub:`${totalBurned} kcal burned`},
                  {label:"Avg Carbs",    value:`${avgCarbs}g`,        color:ANALYSIS_COLORS.carbs,    sub:`Goal: ${goals.carbs}g`},
                ].map((card,i)=>(
                  <div key={i} style={{background:"#121927",borderRadius:14,padding:14,border:"1px solid #1a2235"}}>
                    <div style={{fontSize:11,color:"#445566",marginBottom:4}}>{card.label}</div>
                    <div style={{fontSize:18,fontWeight:800,color:card.color}}>{card.value}</div>
                    <div style={{fontSize:10,color:"#334455",marginTop:2}}>{card.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{background:"#121927",borderRadius:16,padding:16,marginBottom:16,border:"1px solid #1a2235"}}>
                <div style={{fontSize:12,fontWeight:600,color:"#8899aa",marginBottom:14}}>Average Macro Split</div>
                <div style={{display:"flex",alignItems:"center",gap:20}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <DonutChart slices={macroSlices} size={110}/>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{fontSize:9,color:"#445566",textAlign:"center"}}>avg<br/>daily</div>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    {macroSlices.map(s=>{
                      const pct=Math.round(s.value/macroTotal*100);
                      return(
                        <div key={s.label} style={{marginBottom:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontSize:12,color:s.color,fontWeight:600}}>{s.label}</span>
                            <span style={{fontSize:12,color:"#8899aa"}}>{pct}%</span>
                          </div>
                          <div style={{height:4,background:"#1a2235",borderRadius:3}}>
                            <div style={{height:"100%",width:`${pct}%`,background:s.color,borderRadius:3}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{background:"#121927",borderRadius:16,padding:16,marginBottom:16,border:"1px solid #1a2235"}}>
                <BarChart
                  data={analysisData.map(d=>({label:d.label,value:d.totals.calories,over:d.totals.calories>goals.calories}))}
                  color={ANALYSIS_COLORS.calories} overColor="#ff6b4a" label="Calories (kcal)"/>
                <BarChart
                  data={analysisData.map(d=>({label:d.label,value:d.totals.protein,over:d.totals.protein>goals.protein}))}
                  color={ANALYSIS_COLORS.protein} overColor="#ff6b4a" label="Protein (g)"/>
                <BarChart
                  data={analysisData.map(d=>({label:d.label,value:d.totals.carbs,over:d.totals.carbs>goals.carbs}))}
                  color={ANALYSIS_COLORS.carbs} overColor="#ff6b4a" label="Carbs (g)"/>
                <BarChart
                  data={analysisData.map(d=>({label:d.label,value:d.totals.fat,over:d.totals.fat>goals.fat}))}
                  color={ANALYSIS_COLORS.fat} overColor="#ff6b4a" label="Fat (g)"/>
              </div>

              {daysWithData.some(d=>d.burned>0)&&(
                <div style={{background:"#121927",borderRadius:16,padding:16,border:"1px solid #1a2235"}}>
                  <BarChart
                    data={analysisData.map(d=>({label:d.label,value:d.burned}))}
                    color={ANALYSIS_COLORS.burned} label="Calories Burned (kcal)"/>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {editMeal&&<EditMealModal meal={today.meals[editMeal.cat][editMeal.index]} onSave={u=>saveEditMeal(editMeal.cat,editMeal.index,u)} onClose={()=>setEditMeal(null)}/>}
      {showGoals&&<GoalsModal goals={goals} onSave={saveGoals} onClose={()=>setShowGoals(false)}/>}

      {showExport&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setShowExport(false)}>
          <div style={{background:"#151c2c",borderRadius:"20px 20px 0 0",padding:20,width:"100%",border:"1px solid #1e2a3a",boxSizing:"border-box",maxHeight:"75vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Export CSV</div>
            <div style={{fontSize:11,color:"#556677",marginBottom:10,lineHeight:1.5}}>
              Tap inside the box → tap again → <strong style={{color:"#e8eaf0"}}>Select All</strong> → <strong style={{color:"#e8eaf0"}}>Copy</strong> → paste into Google Sheets or Excel.
            </div>
            <textarea
              readOnly
              defaultValue={buildCSV()}
              onFocus={e=>{e.target.select();}}
              onClick={e=>{e.target.select();}}
              style={{flex:1,minHeight:200,background:"#0d1117",border:"1px solid #34d399",borderRadius:8,color:"#8abeaa",padding:10,fontSize:9,fontFamily:"monospace",resize:"none",outline:"none",WebkitUserSelect:"text",userSelect:"text"}}
            />
            <button onClick={()=>setShowExport(false)} style={{marginTop:12,width:"100%",background:"#1e2a3a",border:"1px solid #2a3a50",borderRadius:10,color:"#8899aa",padding:12,cursor:"pointer",fontSize:14}}>Close</button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>
    </div>
  );
}
