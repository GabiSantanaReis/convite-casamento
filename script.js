// ====== CONFIGURE AQUI ======
const CONFIG = {
  dataEvento: "2027-05-01",     // AAAA-MM-DD
  horario: "13:00",             // horário de início (HH:MM)
  duracaoHoras: 5,              // duração usada no evento do calendário
  endereco: "R. das Palmeiras, 643 - Jardim, Santo André - SP",
  mapsLink: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Espaço Nattu, R. das Palmeiras, 643 - Jardim, Santo André - SP, 09080-160"),
  wazeLink: "https://waze.com/ul?q=" + encodeURIComponent("Espaço Nattu, R. das Palmeiras, 643 - Jardim, Santo André - SP, 09080-160"),
  prazoRSVP: "01/04/2027",
  sheetsUrl: "",                // URL do Apps Script (termina em /exec). Vazio = usa o WhatsApp
  whatsapp: "5511999999999"     // usado só se sheetsUrl estiver vazio: DDI+DDD, só dígitos
};
// ============================

const $ = id => document.getElementById(id);
$("prazo").textContent = CONFIG.prazoRSVP;
$("maps").href = CONFIG.mapsLink;
$("waze").href = CONFIG.wazeLink;
$("endereco").textContent = CONFIG.endereco || "Endereço em breve";
const [hh, mm] = CONFIG.horario.split(":");
const hLabel = mm === "00" ? `${+hh}h` : `${+hh}h${mm}`;
const [ano, mes, dia] = CONFIG.dataEvento.split("-");
$("quando").textContent = `${dia}/${mes}/${ano} às ${hLabel}`;

// ===== adicionar ao calendário (fuso de Brasília, UTC-3) =====
const ini = new Date(`${CONFIG.dataEvento}T${CONFIG.horario}:00-03:00`);
const fim = new Date(ini.getTime() + CONFIG.duracaoHoras * 3600000);
const fmt = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const evTitulo = "Casamento de Matheus & Gabriela";
const evLocal = "Espaço Nattu, " + CONFIG.endereco;
$("gcal").href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(evTitulo) +
  "&dates=" + fmt(ini) + "/" + fmt(fim) + "&location=" + encodeURIComponent(evLocal) +
  "&details=" + encodeURIComponent("Cerimônia e almoço. Confirme sua presença no convite.");
const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Convite Matheus e Gabriela//PT","BEGIN:VEVENT",
  "UID:casamento-" + CONFIG.dataEvento + "@convite","DTSTAMP:" + fmt(new Date()),"DTSTART:" + fmt(ini),"DTEND:" + fmt(fim),
  "SUMMARY:" + evTitulo,"LOCATION:" + evLocal.replace(/,/g, "\\,"),"DESCRIPTION:Cerimônia e almoço.",
  "BEGIN:VALARM","TRIGGER:-P1D","ACTION:DISPLAY","DESCRIPTION:Amanhã é o casamento!","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
$("ics").href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));

const alvo = ini;   // contagem até o início, no fuso de Brasília
function tick(){
  let s = Math.max(0, Math.floor((alvo - new Date()) / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const z = n => String(n).padStart(2, "0");
  $("cd").textContent = d; $("ch").textContent = z(h);
  $("cm").textContent = z(Math.floor(s / 60)); $("cs").textContent = z(s % 60);
}
tick(); setInterval(tick, 1000);

function enviarWhatsApp(texto){
  window.open("https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(texto), "_blank");
}
async function responder(status){
  const form = $("form");
  if (!form.reportValidity()) return;
  const nome = form.elements.nome.value.trim();
  const qtd = form.elements.qtd.value;
  if (!CONFIG.sheetsUrl){
    enviarWhatsApp(status === "sim"
      ? `Olá! Confirmo presença no casamento de Matheus & Gabriela.\nNome: ${nome}\nPessoas: ${qtd}`
      : `Olá! Infelizmente não vou conseguir ir ao casamento.\nNome: ${nome}`);
    return;
  }
  const botoes = form.querySelectorAll("button");
  botoes.forEach(b => b.disabled = true);
  const resp = $("resp");
  try {
    await fetch(CONFIG.sheetsUrl, { method: "POST", mode: "no-cors", body: new URLSearchParams({ nome, qtd, status }) });
    form.hidden = true;
    resp.className = "resp";
    resp.textContent = status === "sim" ? `Presença confirmada, ${nome}! Obrigado, até lá.` : `Obrigado por avisar, ${nome}. Vamos sentir sua falta!`;
  } catch (err) {
    botoes.forEach(b => b.disabled = false);
    resp.className = "resp erro";
    resp.textContent = "Não conseguimos enviar. Confira sua internet e tente de novo.";
  }
  resp.hidden = false;
}
$("form").addEventListener("submit", e => { e.preventDefault(); responder("sim"); });
$("nao").addEventListener("click", () => responder("nao"));

// ===== envelope + animações =====
const env = $("envelope");
const nome = new URLSearchParams(location.search).get("para");
if (nome) $("para").textContent = "Para " + nome.slice(0, 40);   // ex.: ?para=Tia%20Maria

// letras do título, uma a uma
let n = 0;
document.querySelectorAll("h1 .w").forEach(w => {
  const t = w.textContent; w.textContent = "";
  [...t].forEach(ch => { const s = document.createElement("span"); s.className = "l"; s.style.setProperty("--i", n++); s.textContent = ch; w.appendChild(s); });
});

const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
let aberto = false;
function iniciar(){
  document.body.classList.remove("locked");
  document.body.classList.add("go");
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .25 });
  document.querySelectorAll("[data-anim],.draw").forEach(el => {
    if (el.closest(".hero")) setTimeout(() => el.classList.add("in"), 100); else io.observe(el);
  });
}
function abrir(){
  if (aberto) return; aberto = true;
  env.classList.add("open");
  setTimeout(() => { env.classList.add("gone"); iniciar(); }, calmo ? 0 : 2000);
  setTimeout(() => env.remove(), calmo ? 0 : 3000);
}
env.addEventListener("click", abrir);
env.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
