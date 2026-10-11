const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
const sliders = {
  light: document.getElementById("light"),
  co2: document.getElementById("co2"),
  water: document.getElementById("water")
};
const stageData = [
  {
    title: "Işık tepkimeleri",
    description: "Tilakoit zarlarında bulunan klorofil, ışık enerjisini soğurur. Su moleküllerinden elektronlar sağlanır ve oksijen açığa çıkar. Bu aşamada ATP ve NADPH üretilir."
  },
  {
    title: "Elektron taşınması",
    description: "Uyarılan elektronlar zar üzerindeki taşıyıcılar boyunca aktarılır. Bu süreç proton gradyanının oluşmasına katkı verir; ATP sentaz bu farktan yararlanarak ATP üretir."
  },
  {
    title: "Calvin döngüsü",
    description: "Stromada gerçekleşen Calvin döngüsünde CO₂, ATP ve NADPH kullanılarak organik moleküllerin üretiminde kullanılan karbonlu bileşiklere dönüştürülür. Döngü doğrudan ışığı kullanmaz; ışık tepkimelerinin ürünlerine ihtiyaç duyar."
  }
];
let currentStage = 0;
let width = 0, height = 0, frame = 0;
let particles = [];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = rect.width; height = rect.height;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  particles = Array.from({length: 45}, (_, i) => ({
    angle: Math.random() * Math.PI * 2,
    radius: .2 + Math.random() * .78,
    speed: (.002 + Math.random() * .006) * (i % 2 ? 1 : -1),
    size: 1.2 + Math.random() * 2.5,
    kind: i % 4
  }));
  drawScene();
}
function drawScene() {
  if (!width || !height) return;
  frame += reducedMotion ? 0 : 1;
  ctx.clearRect(0, 0, width, height);
  const cx = width * .51, cy = height * .51;
  const rx = Math.min(width * .36, height * .41), ry = Math.min(height * .31, width * .42);
  // soft glow
  const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, rx * 1.5);
  glow.addColorStop(0, "rgba(128,218,145,.13)");
  glow.addColorStop(1, "rgba(14,35,25,0)");
  ctx.fillStyle = glow; ctx.fillRect(0,0,width,height);
  // chloroplast shell
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.18);
  ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
  const shell = ctx.createLinearGradient(-rx,-ry,rx,ry);
  shell.addColorStop(0,"#315f42"); shell.addColorStop(.5,"#214c36"); shell.addColorStop(1,"#153524");
  ctx.fillStyle = shell; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = "#83bd80"; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,0,rx-8,ry-8,0,0,Math.PI*2);
  ctx.lineWidth=1;ctx.strokeStyle="rgba(188,235,165,.35)";ctx.stroke();
  // stroma texture
  for(let i=0;i<35;i++){
    const a=i*2.399, r=Math.sqrt((i+.5)/35)*.78;
    ctx.beginPath();ctx.ellipse(Math.cos(a)*rx*r,Math.sin(a)*ry*r,2.2,1.5,a,0,Math.PI*2);
    ctx.fillStyle="rgba(177,223,150,.22)";ctx.fill();
  }
  // stacks of thylakoids
  const stacks = [
    {x:-rx*.48,y:-ry*.12,s:1.0},{x:0,y:-ry*.35,s:.86},
    {x:rx*.43,y:-ry*.1,s:.92},{x:-rx*.22,y:ry*.35,s:.85},
    {x:rx*.34,y:ry*.34,s:.72}
  ];
  stacks.forEach((p,j)=>{
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate((j-2)*.12);
    const layers=6;
    for(let k=0;k<layers;k++){
      const yy=(k-(layers-1)/2)*7*p.s;
      ctx.beginPath();ctx.ellipse(0,yy,rx*.17*p.s,5.5*p.s,0,0,Math.PI*2);
      ctx.fillStyle=k%2?"#8cc77b":"#4c985d";ctx.fill();
      ctx.lineWidth=1;ctx.strokeStyle="#b2e59a";ctx.stroke();
    }
    ctx.restore();
  });
  // animated molecules orbiting inside
  particles.forEach((p,i)=>{
    if(!reducedMotion)p.angle+=p.speed;
    const x=Math.cos(p.angle)*rx*p.radius*.86;
    const y=Math.sin(p.angle)*ry*p.radius*.78;
    const colors=["#f4d37c","#8bd9ef","#d6b0ff","#c4f49a"];
    ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);
    ctx.fillStyle=colors[p.kind];ctx.globalAlpha=.65;ctx.fill();ctx.globalAlpha=1;
  });
  // light rays enter from upper-left
  const light = Number(sliders.light.value)/100;
  ctx.globalAlpha=.15 + light*.5;
  for(let i=0;i<4;i++){
    const sx=-rx*1.2+i*13, sy=-ry*1.45;
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+rx*.5,sy+ry*1.3);ctx.lineTo(sx+rx*.5+5,sy+ry*1.3);ctx.lineTo(sx+5,sy);ctx.closePath();
    ctx.fillStyle="#f5dc8b";ctx.fill();
  }
  ctx.globalAlpha=1;ctx.restore();
  
  // Oxygen bubbles: a simplified visual representation
  const oxygenRate = getRate();
  const bubbleCount = Math.ceil(oxygenRate / 20);

  for (let i = 0; i < bubbleCount; i++) {
    const phase = reducedMotion ? 0 : frame * 0.025 + i * 1.7;
    const rise = ((phase % 3) / 3) * 24;

    const bx = cx + rx * 0.52 + Math.sin(phase * 1.4) * 7;
    const by = cy + ry * 0.55 - rise;

    ctx.beginPath();
    ctx.arc(bx, by, 2.5 + (i % 3) * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#c4f49a";
    ctx.globalAlpha = 0.45 + oxygenRate / 200;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bx - 0.8, by - 0.8, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = "#f0ffe7";
    ctx.globalAlpha = 0.85;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
// small orbiting labels
  const labels=[{x:cx-rx*.65,y:cy-ry*.9,t:"H₂O",c:"#8bd9ef"},{x:cx+rx*.78,y:cy-ry*.55,t:"CO₂",c:"#d6b0ff"},{x:cx+rx*.72,y:cy+ry*.85,t:"O₂",c:"#c4f49a"}];
  ctx.font="10px monospace";
  labels.forEach(l=>{ctx.fillStyle=l.c;ctx.fillText(l.t,l.x,l.y)});
  if(!reducedMotion) requestAnimationFrame(drawScene);
}
function getRate() {
  const vals = Object.values(sliders).map(el => Number(el.value));
  // Teaching simplification: rate is constrained by the least available input.
  return Math.round(Math.min(...vals));
}
// Son 12 fotosentez hızı ölçümünü sakla
let rateHistory = [];

function updateRateChart(rate) {
  const chartLine = document.getElementById("rateChartLine");
  const chartRate = document.getElementById("chartRate");

  if (!chartLine || !chartRate) return;

  rateHistory.push(rate);

  if (rateHistory.length > 12) {
    rateHistory.shift();
  }

  chartRate.textContent = rate + "%";

  const points = rateHistory.map((value, index) => {
    const x = rateHistory.length === 1
      ? 300
      : (index * 300) / (rateHistory.length - 1);

    const y = 120 - (value / 100) * 120;

    return `${x},${y}`;
  });

  // İlk ölçümde yatay bir çizgi göster
  if (rateHistory.length === 1) {
    chartLine.setAttribute("points", `0,${points[0].split(",")[1]} 300,${points[0].split(",")[1]}`);
  } else {
    chartLine.setAttribute("points", points.join(" "));
  }
}function updateExperiment() {
  for(const [key,el] of Object.entries(sliders)){
    const v=Number(el.value);
    document.getElementById(key+"Out").textContent=v+"%";
    document.getElementById(key+"Mini").style.width=v+"%";
    document.getElementById(key+"MiniText").textContent=v;
  }
  const rate=getRate();
   updateRateChart(rate);
  document.getElementById("rateValue").textContent=rate;
  document.getElementById("rateBar").style.width=rate+"%";
  let note="Koşullar dengeli görünüyor.";
  const names=["Işık","CO₂","Su"];
  const values=Object.values(sliders).map(el=>Number(el.value));
  const min=Math.min(...values), idx=values.indexOf(min);
  if(min<25) note=names[idx]+" çok düşük; bu basit modelde hızı sınırlayan etken bu.";
  else if(min<55) note=names[idx]+" diğerlerine göre daha sınırlayıcı.";
  else note="Koşullar dengeli. Gerçek hız sıcaklık ve diğer etkenlere de bağlıdır.";
  document.getElementById("rateNote").textContent=note;
  // Deney sonucunu koşullara göre açıkla
  const resultTitle = document.querySelector("#experimentResult strong");
  const resultText = document.querySelector("#experimentResult p");
  const suggestion = document.getElementById("experimentSuggestion");

  if (resultTitle && resultText && suggestion) {
    const light = Number(sliders.light.value);
    const co2 = Number(sliders.co2.value);
    const water = Number(sliders.water.value);

    resultTitle.textContent = "Deney sonucu · " + rate + "%";

    if (rate < 25) {
      resultText.textContent =
        "Fotosentez hızı modelde çok düşük. En az bulunan kaynak, süreci sınırlıyor.";
    } else if (rate < 55) {
      resultText.textContent =
        "Fotosentez hızı orta düzeyde. En düşük değerdeki değişken hızı sınırlıyor olabilir.";
    } else {
      resultText.textContent =
        "Modelde fotosentez hızı yüksek. Ancak gerçek bitkilerde sıcaklık ve diğer koşullar da etkilidir.";
    }

    if (light <= co2 && light <= water) {
      suggestion.textContent =
        "Gözlem: Işık en düşük değişken. Diğer değerleri sabit tutup ışığı artırarak sonucu karşılaştır.";
    } else if (co2 <= light && co2 <= water) {
      suggestion.textContent =
        "Gözlem: CO₂ en düşük değişken. Işığı ve suyu sabit tutup CO₂ değerini artırarak sonucu karşılaştır.";
    } else {
      suggestion.textContent =
        "Gözlem: Su en düşük değişken. Diğer değerleri sabit tutup su değerini artırarak sonucu karşılaştır.";
    }
  }
 drawScene();
}
function setStage(index) {
  currentStage=Math.max(0,Math.min(stageData.length-1,index));
  const data=stageData[currentStage];
  document.getElementById("stageNum").textContent=String(currentStage+1).padStart(2,"0");
  document.getElementById("stageTitle").textContent=data.title;
  document.getElementById("stageDescription").textContent=data.description;
  document.querySelectorAll(".stage").forEach((btn,i)=>btn.classList.toggle("active",i===currentStage));
  document.getElementById("prevStage").disabled=currentStage===0;
  document.getElementById("nextStage").innerHTML=currentStage===stageData.length-1?"Başa dön <span>↻</span>":'Sonraki aşama <span>→</span>';
}
// Kloroplast yapıları hakkında etkileşimli bilgiler
const structureData = {
  thylakoid: {
    title: "1 · Tilakoitler",
    description:
      "Tilakoit zarlarında klorofil ve ışık tepkimelerinde görev alan proteinler bulunur. Işık enerjisi kullanılarak ATP ve NADPH üretilir. Suyun parçalanması sonucunda oksijen açığa çıkar."
  },

  stroma: {
    title: "2 · Stroma",
    description:
      "Stroma, kloroplastın içini dolduran sıvı bölgedir. Calvin döngüsünde görev alan enzimler burada bulunur. CO₂, ışık tepkimelerinden gelen ATP ve NADPH kullanılarak organik bileşiklerin üretiminde değerlendirilir."
  },

  calvin: {
    title: "3 · Calvin döngüsü",
    description:
      "Calvin döngüsü stromada gerçekleşir. CO₂ bağlanır ve ATP ile NADPH kullanılarak G3P gibi karbonlu ürünler oluşturulur. Döngü doğrudan ışığı kullanmaz; ışık tepkimelerinin ürünlerine ihtiyaç duyar."
  }
};

document.querySelectorAll(".structure-marker").forEach((button) => {
  button.addEventListener("click", () => {
    const structure = structureData[button.dataset.structure];

    if (!structure) return;

    const info = document.getElementById("structureInfo");
    info.replaceChildren();

    const title = document.createElement("strong");
    title.textContent = structure.title;

    const description = document.createElement("p");
    description.textContent = structure.description;

    info.append(title, description);

    document.querySelectorAll(".structure-marker").forEach((marker) => {
      marker.setAttribute("aria-pressed", String(marker === button));
    });
  });
});
Object.values(sliders).forEach(el=>el.addEventListener("input",updateExperiment));
document.querySelectorAll(".stage").forEach(btn=>btn.addEventListener("click",()=>setStage(Number(btn.dataset.stage))));
document.getElementById("prevStage").addEventListener("click",()=>setStage(currentStage-1));
document.getElementById("nextStage").addEventListener("click",()=>setStage(currentStage===stageData.length-1?0:currentStage+1));
document.getElementById("resetBtn").addEventListener("click",()=>{
  sliders.light.value=60;sliders.co2.value=60;sliders.water.value=70;updateExperiment();setStage(0);
});
window.addEventListener("resize",resizeCanvas);
resizeCanvas();updateExperiment();setStage(0);

/* BioVerse — Deney defteri kaydetme sistemi */

const experimentSaveButton = document.getElementById("saveExperimentBtn");
const experimentObservation = document.getElementById("experimentObservation");
const experimentRecords = document.getElementById("experimentRecords");
const notebookEmpty = document.getElementById("notebookEmpty");

const experimentStorageKey = "bioverse-experiments-v1";

function readSavedExperiments() {
  try {
    const saved = localStorage.getItem(experimentStorageKey);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Deney kayıtları okunamadı:", error);
    return [];
  }
}

function renderSavedExperiments() {
  const experiments = readSavedExperiments();

  experimentRecords.replaceChildren();
  notebookEmpty.hidden = experiments.length > 0;

  experiments.forEach((experiment, index) => {
    const card = document.createElement("article");
    card.className = "experiment-record";

    const title = document.createElement("h5");
    title.textContent = "Deney " + (experiments.length - index);

    const values = document.createElement("small");
    values.textContent =
      "Işık: " + experiment.light + "% · " +
      "CO₂: " + experiment.co2 + "% · " +
      "Su: " + experiment.water + "% · " +
      "Hız: " + experiment.rate + "%";

    const observation = document.createElement("p");
    observation.textContent =
      experiment.observation || "Bu deney için gözlem yazılmadı.";

    const date = document.createElement("small");
    date.textContent = experiment.date;

    card.append(title, values, observation, date);
    experimentRecords.append(card);
  });
}

function saveCurrentExperiment() {
  const observation = experimentObservation.value.trim();

  if (!observation) {
    experimentObservation.focus();
    experimentObservation.setCustomValidity(
      "Lütfen kaydetmeden önce deney gözlemini yaz."
    );
    experimentObservation.reportValidity();
    return;
  }

  experimentObservation.setCustomValidity("");

  const experiments = readSavedExperiments();

  const newExperiment = {
    light: Number(sliders.light.value),
    co2: Number(sliders.co2.value),
    water: Number(sliders.water.value),
    rate: getRate(),
    observation: observation,
    date: new Date().toLocaleString("tr-TR")
  };

  experiments.unshift(newExperiment);

  // Defterin çok büyümemesi için son 50 deneyi tut.
  const limitedExperiments = experiments.slice(0, 50);

  try {
    localStorage.setItem(
      experimentStorageKey,
      JSON.stringify(limitedExperiments)
    );
  } catch (error) {
    console.error("Deney kaydedilemedi:", error);
    alert("Deney kaydedilemedi. Tarayıcının depolama ayarlarını kontrol et.");
    return;
  }

  renderSavedExperiments();
  experimentObservation.value = "";
  alert("Deneyin başarıyla kaydedildi!");
}

if (experimentSaveButton && experimentObservation &&
    experimentRecords && notebookEmpty) {
  experimentSaveButton.addEventListener("click", saveCurrentExperiment);

  experimentObservation.addEventListener("input", () => {
    experimentObservation.setCustomValidity("");
  });

  renderSavedExperiments();
}

/* BioVerse — Hücresel solunum deney sistemi */

const glucoseInput = document.getElementById("glucoseInput");
const oxygenInput = document.getElementById("oxygenInput");
const glucoseValue = document.getElementById("glucoseValue");
const oxygenValue = document.getElementById("oxygenValue");
const atpValue = document.getElementById("atpValue");
const atpBar = document.getElementById("atpBar");
const respirationNote = document.getElementById("respirationNote");

function updateRespirationExperiment() {
  // Gerekli HTML elemanları bulunmuyorsa işlemi durdur.
  if (
    !glucoseInput ||
    !oxygenInput ||
    !glucoseValue ||
    !oxygenValue ||
    !atpValue ||
    !atpBar ||
    !respirationNote
  ) {
    return;
  }

  const glucose = Number(glucoseInput.value);
  const oxygen = Number(oxygenInput.value);

  // Eğitim amaçlı basitleştirilmiş model:
  // Glikoz ve oksijenden düşük olan değer, model puanını sınırlar.
  const energyScore = Math.min(glucose, oxygen);

  glucoseValue.textContent = glucose;
  oxygenValue.textContent = oxygen;
  atpValue.textContent = energyScore;
  atpBar.style.width = energyScore + "%";

  if (glucose === 0) {
    respirationNote.textContent =
      "Modelde glikoz bulunmuyor. Glikoz, hücresel solunumun temel yakıtıdır.";
  } else if (oxygen === 0) {
    respirationNote.textContent =
      "Modelde oksijen bulunmuyor. Oksijenli solunumun elektron taşıma zinciri bu koşulda normal şekilde çalışamaz.";
  } else if (energyScore < 30) {
    respirationNote.textContent =
      "Model puanı düşük. Glikoz veya oksijenden daha az olanı sınırlayıcı değişken olarak gösteriliyor.";
  } else if (energyScore < 65) {
    respirationNote.textContent =
      "Model puanı orta düzeyde. Bir değişkeni sabit tutup diğerini değiştirerek sonucu karşılaştır.";
  } else {
    respirationNote.textContent =
      "Model puanı yüksek. Bu puan gerçek ATP miktarı değil, deney koşullarını karşılaştırmak için kullanılan basitleştirilmiş bir göstergedir.";
  }
}

if (glucoseInput && oxygenInput) {
  glucoseInput.addEventListener("input", updateRespirationExperiment);
  oxygenInput.addEventListener("input", updateRespirationExperiment);

  updateRespirationExperiment();
}

/* BioVerse — Hücresel solunum aşamalarını keşfet */

const respirationStageData = {
  glycolysis: {
    title: "Glikoliz",
    description:
      "Bir glikoz molekülü, sitoplazmada iki pirüvat molekülüne ayrılır. Bu aşamada net 2 ATP ve NADH elde edilir. Glikoliz için doğrudan oksijen gerekmez.",
    location: "Konum: Sitoplazma"
  },

  krebs: {
    title: "Krebs döngüsü",
    description:
      "Ökaryot hücrelerde mitokondrinin matriksinde gerçekleşir. Asetil-CoA'nın parçalanması sırasında CO₂ açığa çıkar; NADH, FADH₂ ve az miktarda ATP veya GTP üretilir.",
    location: "Konum: Mitokondri matriksi"
  },

  etc: {
    title: "Elektron taşıma zinciri",
    description:
      "Ökaryot hücrelerde mitokondrinin iç zarında bulunur. Elektronların aktarılmasıyla oluşan proton gradyanı, ATP sentazın ATP üretmesini sağlar. Oksijen, bu zincirde son elektron alıcısıdır ve su oluşumuna katılır.",
    location: "Konum: Mitokondrinin iç zarı"
  }
};

const respirationStageButtons =
  document.querySelectorAll(".resp-stage-btn");

const respirationStageInfo =
  document.getElementById("respStageInfo");

respirationStageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const stage = respirationStageData[button.dataset.respStage];

    if (!stage || !respirationStageInfo) return;

    const title = document.createElement("h4");
    title.textContent = stage.title;

    const description = document.createElement("p");
    description.textContent = stage.description;

    const location = document.createElement("span");
    location.className = "resp-stage-location";
    location.textContent = stage.location;

    respirationStageInfo.replaceChildren(
      title,
      description,
      location
    );

    respirationStageButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
  });
});

// İlk aşama seçili durumdayken erişilebilirlik durumunu ayarla.
respirationStageButtons.forEach((button, index) => {
  button.setAttribute("aria-pressed", String(index === 0));
});

/* BioVerse — Laboratuvar menüsü */

const labLinks = document.querySelectorAll(".lab-nav-link");

labLinks.forEach((link) => {
  link.addEventListener("click", () => {
    labLinks.forEach((item) => {
      item.classList.toggle("active", item === link);
    });
  });
});

/* BIOVERSE — 9-10. SINIF BİLGİ TESTİ */

const quizQuestions = [
  {
    topic: "FOTOSENTEZ",
    question: "Fotosentez sırasında ışık enerjisini soğurarak kimyasal enerji dönüşümünü başlatan pigment hangisidir?",
    options: ["Klorofil", "Hemoglobin", "Keratin", "Glikojen"],
    answer: 0,
    explanation: "Klorofil, ışık enerjisini soğuran temel fotosentetik pigmenttir. Bu enerji fotosentez tepkimelerinde kullanılır."
  },
  {
    topic: "FOTOSENTEZ",
    question: "Bitkiler fotosentez sırasında atmosferden en çok hangi gazı alır?",
    options: ["Oksijen", "Azot", "Karbondioksit", "Hidrojen"],
    answer: 2,
    explanation: "Fotosentezde karbondioksit kullanılarak organik maddelerin üretiminde karbon sağlanır."
  },
  {
    topic: "FOTOSENTEZ",
    question: "Fotosentezin ışığa bağımlı tepkimeleri, ökaryot bitki hücrelerinde kloroplastın hangi bölümünde gerçekleşir?",
    options: ["Çekirdek", "Tilakoit zar", "Sitoplazma", "Mitokondri matriksi"],
    answer: 1,
    explanation: "Işığa bağımlı tepkimeler kloroplastın tilakoit zarlarında gerçekleşir. Klorofil ve elektron taşıma sistemi burada bulunur."
  },
  {
    topic: "HÜCRESEL SOLUNUM",
    question: "Ökaryot hücrelerde glikoliz hangi bölümde gerçekleşir?",
    options: ["Mitokondrinin iç zarı", "Kloroplastın stroması", "Çekirdek", "Sitoplazma"],
    answer: 3,
    explanation: "Glikoliz sitoplazmada gerçekleşir ve glikozun daha küçük moleküllere parçalanmasıyla başlar."
  },
  {
    topic: "HÜCRESEL SOLUNUM",
    question: "Oksijenli hücresel solunumda oksijenin temel görevi nedir?",
    options: ["Glikozu üretmek", "Son elektron alıcısı olmak", "Işık enerjisini soğurmak", "Protein sentezlemek"],
    answer: 1,
    explanation: "Oksijen, elektron taşıma zincirinde son elektron alıcısıdır ve su oluşumuna katılır."
  },
  {
    topic: "HÜCRESEL SOLUNUM",
    question: "Hücrenin enerji aktarımında doğrudan kullandığı temel molekül hangisidir?",
    options: ["DNA", "Karbondioksit", "ATP", "Selüloz"],
    answer: 2,
    explanation: "ATP, hücrede birçok tepkimeye enerji aktarılmasında kullanılan temel moleküldür."
  },
  {
    topic: "HÜCRE ORGANELLERİ",
    question: "Ökaryot hücrelerde oksijenli solunumun Krebs döngüsü hangi bölümde gerçekleşir?",
    options: ["Mitokondri matriksi", "Çekirdekçik", "Hücre zarı", "Kloroplastın tilakoit boşluğu"],
    answer: 0,
    explanation: "Krebs döngüsü ökaryot hücrelerde mitokondri matriksinde gerçekleşir."
  },
  {
    topic: "BİYOLOJİK ENERJİ",
    question: "Fotosentez ve hücresel solunum arasındaki ilişkiyi en doğru açıklayan ifade hangisidir?",
    options: [
      "İkisi de yalnızca ışıkta gerçekleşir.",
      "İkisi de sadece hayvan hücrelerinde gerçekleşir.",
      "İkisinde de enerji dönüşümü olmaz.",
      "Fotosentez organik madde üretirken solunum organik maddelerdeki enerjinin aktarılmasını sağlar."
    ],
    answer: 3,
    explanation: "Fotosentez ışık enerjisini organik moleküllerdeki kimyasal enerjiye dönüştürür. Hücresel solunum bu moleküllerdeki enerjinin ATP'ye aktarılmasını sağlar."
  },
  {
    topic: "ENZİMLER",
    question: "Enzimlerin hücredeki temel görevi nedir?",
    options: [
      "Bütün tepkimeleri durdurmak",
      "Tepkimelerin aktivasyon enerjisini düşürmek",
      "Her tepkimede tamamen tüketilmek",
      "DNA'yı her zaman enerji kaynağı olarak kullanmak"
    ],
    answer: 1,
    explanation: "Enzimler biyolojik katalizörlerdir. Tepkimelerin aktivasyon enerjisini düşürür ve tepkimenin daha hızlı gerçekleşmesine yardımcı olur."
  },
  {
    topic: "HÜCRE ZARI",
    question: "Hücre zarından maddelerin enerji harcanmadan, yoğunluğun yüksek olduğu ortamdan düşük olduğu ortama net geçişine ne denir?",
    options: ["Aktif taşıma", "Endositoz", "Pasif taşıma", "Ekzositoz"],
    answer: 2,
    explanation: "Pasif taşımada maddeler yoğunluk farkı doğrultusunda net hareket eder ve hücre ATP harcamaz. Difüzyon ve osmoz pasif taşımaya örnektir."
  }
];

const quizQuestionCount = document.getElementById("quizQuestionCount");
const quizScore = document.getElementById("quizScore");
const quizProgress = document.getElementById("quizProgress");
const quizProgressBar = document.getElementById("quizProgressBar");
const quizTopic = document.getElementById("quizTopic");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const quizFeedback = document.getElementById("quizFeedback");
const quizFeedbackTitle = document.getElementById("quizFeedbackTitle");
const quizFeedbackText = document.getElementById("quizFeedbackText");
const quizNextBtn = document.getElementById("quizNextBtn");
const quizFinalResult = document.getElementById("quizFinalResult");
const quizFinalScore = document.getElementById("quizFinalScore");
const quizFinalMessage = document.getElementById("quizFinalMessage");
const quizRestartBtn = document.getElementById("quizRestartBtn");

let currentQuizIndex = 0;
let currentQuizScore = 0;
let quizAnswered = false;

function showQuizQuestion() {
  const item = quizQuestions[currentQuizIndex];

  quizAnswered = false;
  quizQuestionCount.textContent =
    "Soru " + (currentQuizIndex + 1) + " / " + quizQuestions.length;
  quizScore.textContent = "Puan: " + currentQuizScore;
  quizTopic.textContent = item.topic;
  quizQuestion.textContent = item.question;

  quizProgressBar.style.width =
    (currentQuizIndex / quizQuestions.length) * 100 + "%";
  quizProgress.setAttribute("aria-valuenow", currentQuizIndex);

  quizOptions.replaceChildren();
  quizFeedback.hidden = true;
  quizFeedback.classList.remove("correct-feedback", "incorrect-feedback");
  quizNextBtn.hidden = true;
  quizFinalResult.hidden = true;
  document.getElementById("quizQuestionArea").hidden = false;

  item.options.forEach((optionText, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent =
      String.fromCharCode(65 + index) + ". " + optionText;

    button.addEventListener("click", () => {
      checkQuizAnswer(index, button);
    });

    quizOptions.appendChild(button);
  });
}

function checkQuizAnswer(selectedIndex, selectedButton) {
  if (quizAnswered) return;
  quizAnswered = true;

  const item = quizQuestions[currentQuizIndex];
  const optionButtons = quizOptions.querySelectorAll(".quiz-option");
  const isCorrect = selectedIndex === item.answer;

  optionButtons.forEach((button, index) => {
    button.disabled = true;

    if (index === item.answer) {
      button.classList.add("correct");
    }
  });

  if (!isCorrect) {
    selectedButton.classList.add("incorrect");
  } else {
    currentQuizScore++;
  }

  quizScore.textContent = "Puan: " + currentQuizScore;
  quizFeedback.hidden = false;
  quizFeedback.classList.add(
    isCorrect ? "correct-feedback" : "incorrect-feedback"
  );

  quizFeedbackTitle.textContent = isCorrect
    ? "✓ Doğru cevap!"
    : "✗ Bu cevap doğru değil.";

  quizFeedbackText.textContent = item.explanation;

  quizProgressBar.style.width =
    ((currentQuizIndex + 1) / quizQuestions.length) * 100 + "%";
  quizProgress.setAttribute("aria-valuenow", currentQuizIndex + 1);

  quizNextBtn.hidden = false;
  quizNextBtn.textContent =
    currentQuizIndex === quizQuestions.length - 1
      ? "Sonucu gör"
      : "Sonraki soru";
}

function showQuizResult() {
  document.getElementById("quizQuestionArea").hidden = true;
  quizFinalResult.hidden = false;
  quizQuestionCount.textContent = "Test tamamlandı";
  quizScore.textContent = "Puan: " + currentQuizScore;
  quizProgressBar.style.width = "100%";
  quizProgress.setAttribute("aria-valuenow", quizQuestions.length);

  const percentage = currentQuizScore / quizQuestions.length * 100;
  quizFinalScore.textContent =
    "10 soruda " + currentQuizScore + " doğru cevap verdin. Başarı oranı: %" +
    percentage + ".";

  if (percentage === 100) {
    quizFinalMessage.textContent =
      "Mükemmel! Bu konulardaki bilgilerini çok iyi kullanıyorsun.";
  } else if (percentage >= 70) {
    quizFinalMessage.textContent =
      "Çok güzel! Birkaç konuyu daha gözden geçirerek kendini geliştirebilirsin.";
  } else if (percentage >= 40) {
    quizFinalMessage.textContent =
      "İyi bir başlangıç! Yanlış yaptığın konuları tekrar edip testi yeniden deneyebilirsin.";
  } else {
    quizFinalMessage.textContent =
      "Öğrenme yolculuğunun başındasın. BioVerse laboratuvarlarını inceleyip tekrar deneyebilirsin.";
  }
}

quizNextBtn.addEventListener("click", () => {
  if (currentQuizIndex < quizQuestions.length - 1) {
    currentQuizIndex++;
    showQuizQuestion();
  } else {
    showQuizResult();
  }
});

quizRestartBtn.addEventListener("click", () => {
  currentQuizIndex = 0;
  currentQuizScore = 0;
  showQuizQuestion();
});

if (
  quizQuestionCount &&
  quizScore &&
  quizProgress &&
  quizProgressBar &&
  quizTopic &&
  quizQuestion &&
  quizOptions &&
  quizFeedback &&
  quizFeedbackTitle &&
  quizFeedbackText &&
  quizNextBtn &&
  quizFinalResult &&
  quizFinalScore &&
  quizFinalMessage &&
  quizRestartBtn
) {
  showQuizQuestion();
}

/* BIOVERSE — ORGANEL BİLGİ SİSTEMİ */

const organelleInfoData = {
  nucleus: {
    title: "Çekirdek",
    description:
      "DNA'nın büyük bölümünü barındırır ve genetik bilginin korunmasında, gen ifadesinin düzenlenmesinde önemli rol oynar.",
    location: "Konum: Sitoplazmanın içinde"
  },

  mitochondrion: {
    title: "Mitokondri",
    description:
      "Ökaryot hücrelerde oksijenli solunumun önemli aşamaları burada gerçekleşir. ATP üretiminde görev alır.",
    location: "Konum: Sitoplazma"
  },

  golgi: {
    title: "Golgi aygıtı",
    description:
      "Protein ve lipitlerin işlenmesine, sınıflandırılmasına ve uygun yerlere gönderilmesine yardımcı olur.",
    location: "Konum: Sitoplazma"
  },

  vacuole: {
    title: "Koful",
    description:
      "Maddelerin depolanmasında ve hücrenin su dengesinin düzenlenmesinde görev alabilir. Bitki hücrelerinde büyük bir merkezi koful bulunabilir.",
    location: "Konum: Sitoplazma"
  },

  ribosome: {
    title: "Ribozom",
    description:
      "Protein sentezinin gerçekleştiği yapıdır. Hem prokaryot hem de ökaryot hücrelerde bulunur.",
    location: "Konum: Sitoplazmada serbest veya granüllü ER üzerinde"
  }
};

const organelleButtons = document.querySelectorAll(".organelle");
const organelleTitle = document.getElementById("organelleTitle");
const organelleDescription = document.getElementById("organelleDescription");
const organelleLocation = document.getElementById("organelleLocation");

organelleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const organelle = organelleInfoData[button.dataset.organelle];

    if (!organelle || !organelleTitle ||
        !organelleDescription || !organelleLocation) {
      return;
    }

    organelleTitle.textContent = organelle.title;
    organelleDescription.textContent = organelle.description;
    organelleLocation.textContent = organelle.location;

    organelleButtons.forEach((item) => {
      item.classList.toggle("selected", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
  });

  button.setAttribute("aria-pressed", "false");
});

/* BIOVERSE — ATP ANİMASYON KONTROLÜ */
const energyMitochondrion = document.getElementById("energyMitochondrion");
const startEnergyAnimation = document.getElementById("startEnergyAnimation");
const resetEnergyAnimation = document.getElementById("resetEnergyAnimation");
const energyStatus = document.getElementById("energyStatus");

if (
  energyMitochondrion &&
  startEnergyAnimation &&
  resetEnergyAnimation &&
  energyStatus
) {
  startEnergyAnimation.addEventListener("click", () => {
    energyMitochondrion.classList.add("producing");
    energyStatus.textContent =
      "Enerji üretimi canlandırılıyor! ATP molekülleri gösteriliyor.";
  });

  resetEnergyAnimation.addEventListener("click", () => {
    energyMitochondrion.classList.remove("producing");
    energyStatus.textContent = "Animasyon sıfırlandı. Yeniden başlatabilirsin.";
  });
}

/* BIOVERSE — ETKİLEŞİMLİ DENEY MEKANİZMASI */
const missionHypothesis = document.getElementById("missionHypothesis");
const missionLight = document.getElementById("missionLight");
const missionLightValue = document.getElementById("missionLightValue");
const runMission = document.getElementById("runMission");
const missionResult = document.getElementById("missionResult");
const missionProgress = document.getElementById("missionProgress");

// Işık kaydırıcısındaki değeri anlık göster.
if (missionLight && missionLightValue) {
  missionLight.addEventListener("input", () => {
    missionLightValue.textContent = missionLight.value;
  });
}

// Deney sonucunu değerlendir.
if (
  missionHypothesis &&
  missionLight &&
  runMission &&
  missionResult &&
  missionProgress
) {
  runMission.addEventListener("click", () => {
    const hypothesis = missionHypothesis.value;
    const light = Number(missionLight.value);

    if (!hypothesis) {
      missionResult.innerHTML =
        "<h4>Önce hipotezini seç</h4><p>Deneyden önce ne olacağını düşündüğünü belirt.</p>";
      missionProgress.textContent = "Görev beklemede.";
      return;
    }

    // Basitleştirilmiş öğretim modeli:
    // Işık arttıkça fotosentez hızı bir noktaya kadar artabilir.
    // Gerçek fotosentez hızı başka sınırlayıcı etkenlere de bağlıdır.
    let observation;

    if (light < 30) {
      observation =
        "Düşük ışık seviyesinde fotosentez hızı sınırlı olabilir.";
    } else if (light < 70) {
      observation =
        "Orta düzeyde ışıkta fotosentez hızı artabilir.";
    } else {
      observation =
        "Yüksek ışık seviyesinde fotosentez hızı artabilir; ancak başka etkenler nedeniyle artış bir noktada sınırlanabilir.";
    }

    let feedback;

    if (hypothesis === "increase") {
      feedback =
        light >= 30
          ? "Hipotezin, ışığın fotosentezi artırabileceği fikriyle uyumlu."
          : "Hipotezin mümkün; fakat düşük ışık koşulunda fotosentez sınırlı kalabilir.";
    } else if (hypothesis === "decrease") {
      feedback =
        "Bu basitleştirilmiş model, ışık artınca fotosentezin mutlaka azalacağını desteklemiyor. Diğer koşulların da etkili olduğunu unutma.";
    } else {
      feedback =
        "Model, ışığın fotosentezi etkileyebileceğini gösteriyor. Işık miktarını farklı seviyelerde karşılaştır.";
    }

    missionResult.innerHTML = "";

    const heading = document.createElement("h4");
    heading.textContent = "Deney gözlemi";

    const observationText = document.createElement("p");
    observationText.textContent = observation;

    const feedbackText = document.createElement("p");
    feedbackText.textContent = feedback;

    const levelText = document.createElement("p");
    levelText.textContent = "Seçilen ışık seviyesi: " + light + "/100";

    missionResult.append(
      heading,
      observationText,
      feedbackText,
      levelText
    );

    missionProgress.textContent =
      "Görev tamamlandı! Deneyini farklı ışık seviyelerinde de tekrarlayabilirsin.";
  });
}

/* BIOVERSE — DENEY KAYDI VE GRAFİK */
const saveMissionResult = document.getElementById("saveMissionResult");
const clearMissionResults = document.getElementById("clearMissionResults");
const missionChart = document.getElementById("missionChart");
const missionSaveStatus = document.getElementById("missionSaveStatus");

const missionStorageKey = "bioverseMissionResults";

function readMissionResults() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(missionStorageKey) || "[]"
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function renderMissionChart() {
  if (!missionChart) return;

  const results = readMissionResults();
  missionChart.replaceChildren();

  if (results.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "mission-chart-empty";
    emptyMessage.textContent = "Henüz kaydedilmiş deney yok.";
    missionChart.appendChild(emptyMessage);
    return;
  }

  results.forEach((result, index) => {
    const item = document.createElement("div");
    item.className = "mission-bar-item";

    const value = document.createElement("span");
    value.textContent = result.light + "/100";

    const bar = document.createElement("div");
    bar.className = "mission-bar";
    bar.style.height = Math.max(4, result.light) + "px";
    bar.title = "Işık seviyesi: " + result.light;

    const label = document.createElement("span");
    label.textContent = "Deney " + (index + 1);

    item.append(value, bar, label);
    missionChart.appendChild(item);
  });
}

if (
  saveMissionResult &&
  clearMissionResults &&
  missionChart &&
  missionSaveStatus &&
  missionLight &&
  missionHypothesis
) {
  saveMissionResult.addEventListener("click", () => {
    if (!missionHypothesis.value) {
      missionSaveStatus.textContent =
        "Önce bir hipotez seçmelisin.";
      return;
    }

    const results = readMissionResults();

    results.push({
      light: Number(missionLight.value),
      hypothesis: missionHypothesis.value,
      date: new Date().toISOString()
    });

    try {
      localStorage.setItem(
        missionStorageKey,
        JSON.stringify(results)
      );

      renderMissionChart();
      missionSaveStatus.textContent =
        "Deney kaydedildi. Toplam kayıt: " + results.length;
    } catch {
      missionSaveStatus.textContent =
        "Kayıt yapılamadı. Tarayıcı depolama ayarlarını kontrol et.";
    }
  });

  clearMissionResults.addEventListener("click", () => {
    try {
      localStorage.removeItem(missionStorageKey);
      renderMissionChart();
      missionSaveStatus.textContent = "Deney kayıtları temizlendi.";
    } catch {
      missionSaveStatus.textContent =
        "Kayıtlar temizlenemedi.";
    }
  });

  renderMissionChart();
}
