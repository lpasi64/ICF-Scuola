// icf-bs.js — funzioni (b) e strutture (s) corporee previste dagli allegati del Questionario ICF-Scuola.
// Sono un elenco CHIUSO: nel questionario si possono registrare solo questi item. Il modulo vale sia nel browser (window.ICFBS)
// sia sul server (globalThis.ICFBS, con «import './icf-bs.js'»): la stessa lista guida il prompt dell'AI, la registrazione e la revisione.
(function () {

const GRUPPI_B = { B1: "Funzioni mentali", B2: "Funzioni sensoriali e dolore", B3: "Funzioni della voce e dell'eloquio", B4: "Sistemi cardiovascolare, immunologico e respiratorio", B5: "Sistemi digestivo, metabolico ed endocrino", B6: "Funzioni genitourinarie e riproduttive", B7: "Funzioni neuro-muscoloscheletriche e correlate al movimento", B8: "Funzioni della cute e delle strutture correlate" };
const GRUPPI_S = { S1: "Strutture del sistema nervoso", S2: "Occhio, orecchio e strutture correlate", S3: "Strutture coinvolte nella voce e nell'eloquio", S4: "Sistemi cardiovascolare, immunologico e respiratorio", S5: "Apparato digerente e sistemi metabolico ed endocrino", S6: "Sistemi genitourinario e riproduttivo", S7: "Strutture correlate al movimento", S8: "Cute e strutture correlate" };

const f = (code, gruppo, nome, testo) => ({ code, gruppo, nome, testo });
const FUNZIONI_CORPOREE = [
  f("b114", "B1", "Funzioni dell'orientamento", "nell'orientamento spazio-temporale"),
  f("b117", "B1", "Funzioni intellettive", "nel funzionamento intellettivo"),
  f("b122", "B1", "Funzioni psicosociali globali", "nelle funzioni psicosociali necessarie a stabilire relazioni con gli altri"),
  f("b125", "B1", "Disposizioni e funzioni intrapersonali", "nelle funzioni e attitudini intrapersonali"),
  f("b130", "B1", "Funzioni dell'energia e delle pulsioni", "nella pulsione ad agire"),
  f("b134", "B1", "Funzioni del sonno", "di sonno"),
  f("b140", "B1", "Funzioni dell'attenzione", "nell'attenzione"),
  f("b144", "B1", "Funzioni della memoria", "di memoria"),
  f("b147", "B1", "Funzioni psicomotorie", "nelle funzioni di controllo psicomotorio"),
  f("b152", "B1", "Funzioni emozionali", "nell'appropriatezza delle emozioni, della loro intensità e durata"),
  f("b164", "B1", "Funzioni cognitive di livello superiore", "nelle funzioni cognitive superiori"),
  f("b167", "B1", "Funzioni mentali del linguaggio", "nelle funzioni mentali specifiche del riconoscimento e dell'utilizzo di segni, simboli e altre componenti di un linguaggio"),
  f("b180", "B1", "Funzioni dell'esperienza del sé e del tempo", "nella consapevolezza della propria identità, del proprio corpo, della propria posizione nello spazio e nel tempo"),
  f("b210", "B2", "Funzioni della vista", "nella vista"),
  f("b230", "B2", "Funzioni uditive", "nell'udito"),
  f("b279", "B2", "Funzioni sensoriali aggiuntive", "nell'elaborazione degli stimoli sensoriali"),
  f("b280", "B2", "Sensazione di dolore", "nella percezione del dolore"),
  f("b3", "B3", "Funzioni della voce e dell'eloquio", "nel produrre suoni e parole"),
  f("b410", "B4", "Funzioni del cuore", "nelle funzioni del cuore"),
  f("b440", "B4", "Funzioni respiratorie", "nelle funzioni respiratorie"),
  f("b510", "B5", "Funzioni di ingestione", "nell'assunzione dei cibi (prendere, masticare, deglutire)"),
  f("b5104", "B5", "Salivazione", "nella salivazione"),
  f("b5105", "B5", "Deglutizione", "nella deglutizione"),
  f("b515", "B5", "Funzioni digestive", "nella digestione"),
  f("b525", "B5", "Funzioni di defecazione", "di defecazione"),
  f("b5253", "B5", "Continenza fecale", "nella continenza fecale"),
  f("b530", "B5", "Funzioni di mantenimento del peso", "nel peso corporeo"),
  f("b620", "B6", "Funzioni urinarie", "nelle funzioni urinarie"),
  f("b710", "B7", "Funzioni della mobilità dell'articolazione", "nella mobilità dell'articolazione"),
  f("b730", "B7", "Funzioni della forza muscolare", "nella forza muscolare"),
  f("b735", "B7", "Funzioni del tono muscolare", "nel tono muscolare"),
  f("b7602", "B7", "Coordinazione dei movimenti volontari", "nel coordinamento volontario dei movimenti"),
  f("b765", "B7", "Movimenti involontari", "nei movimenti involontari (contrazioni, tremori, tic, stereotipie)"),
  f("b770", "B7", "Funzioni del pattern dell'andatura", "nei pattern di movimento necessari per camminare, correre o per altri movimenti di tutto il corpo"),
  f("b8", "B8", "Funzioni della cute e delle strutture correlate", "nelle funzioni protettive e di riparazione della cute e degli annessi cutanei"),
];
const STRUTTURE_CORPOREE = [
  f("s110", "S1", "Struttura del cervello", "nella struttura del cervello"),
  f("s120", "S1", "Midollo spinale e strutture collegate", "nel midollo spinale e nelle strutture collegate"),
  f("s2", "S2", "Occhio, orecchio e strutture correlate", "nelle strutture di occhio o orecchio"),
  f("s3", "S3", "Strutture coinvolte nella voce e nell'eloquio", "nelle strutture di naso, bocca, gola"),
  f("s4", "S4", "Sistemi cardiovascolare, immunologico e respiratorio", "nelle strutture dei sistemi cardiovascolare, immunologico e respiratorio"),
  f("s5", "S5", "Apparato digerente e sistemi metabolico ed endocrino", "nelle strutture dell'apparato digerente, nelle strutture sistema metabolico ed endocrino"),
  f("s6", "S6", "Sistemi genitourinario e riproduttivo", "nella struttura di reni, ureteri, vescica, uretra, pavimento pelvico o componenti del sistema riproduttivo"),
  f("s710", "S7", "Regione del capo e del collo", "nelle strutture della regione del capo e del collo"),
  f("s730", "S7", "Arto superiore", "nella struttura dell'arto superiore"),
  f("s750", "S7", "Arto inferiore", "nella struttura dell'arto inferiore"),
  f("s760", "S7", "Tronco", "nella struttura del tronco"),
  f("s770", "S7", "Strutture muscoloscheletriche correlate al movimento", "nelle strutture muscoloscheletriche correlate al movimento"),
  f("s8", "S8", "Cute e strutture correlate", "nella struttura della cute o degli annessi cutanei"),
];

// Codici che l'AI o i documenti usano ma che nell'allegato sono accorpati in un altro item (i figli di un item previsto si
// riconducono da soli al codice più corto: b1670 → b167, s2300 → s2)
const SINONIMI = {
  b126: "b125", b160: "b164", b163: "b164", b176: "b7602", b760: "b7602", b7601: "b7602", b7650: "b765", b156: "b279",
  s720: "s770", s740: "s770",
};

const lista = (tipo) => (tipo === "s" ? STRUTTURE_CORPOREE : FUNZIONI_CORPOREE);
const voceBS = (code) => [...FUNZIONI_CORPOREE, ...STRUTTURE_CORPOREE].find(x => x.code === String(code || "").trim().toLowerCase()) || null;

// Il codice previsto dall'allegato corrispondente, oppure null se l'item non fa parte del questionario
function normalizzaCodiceBS(codice, tipo) {
  const c = String(codice || "").trim().toLowerCase();
  if (!/^[bs]\d+$/.test(c)) return null;
  if (tipo && c[0] !== tipo) return null;
  const ammessi = new Set(lista(c[0]).map(x => x.code));
  if (ammessi.has(c)) return c;
  if (SINONIMI[c]) return SINONIMI[c];
  for (let n = c.length - 1; n >= 2; n--) {
    const p = c.slice(0, n);
    if (ammessi.has(p)) return p;
    if (SINONIMI[p]) return SINONIMI[p];
  }
  return null;
}

const numQ = (q) => { const n = Number(q); return q === "" || q === null || q === undefined || Number.isNaN(n) ? null : n; };

// Porta un elenco di voci b o s agli item previsti: etichetta ufficiale, codici accorpati, voci non previste scartate (e restituite)
function normalizzaVoci(voci, tipo) {
  const out = [], scartati = [];
  for (const v of Array.isArray(voci) ? voci : []) {
    const code = normalizzaCodiceBS(v && v.code, tipo);
    if (!code) { scartati.push({ code: (v && v.code) || "", label: (v && v.label) || "" }); continue; }
    const ufficiale = voceBS(code);
    const q = numQ(v.qualifier);
    const esistente = out.find(x => x.code === code);
    if (esistente) {
      const qe = numQ(esistente.qualifier);
      if (q !== null && (qe === null || q > qe)) esistente.qualifier = q;
      if (v.note && !String(esistente.note || "").includes(v.note)) esistente.note = [esistente.note, v.note].filter(Boolean).join("; ");
    } else {
      out.push({ ...v, code, label: ufficiale.testo, qualifier: q === null ? "" : q, note: v.note || "" });
    }
  }
  return { voci: out, scartati };
}

// Elenco da inserire nel prompt dell'AI: sono ammessi solo questi codici
function elencoPerPrompt() {
  const riga = (x) => `- ${x.code} — ${x.nome}: ${x.testo}`;
  return "ELENCO CHIUSO — Funzioni corporee (serie b), le uniche ammesse:\n" + FUNZIONI_CORPOREE.map(riga).join("\n")
    + "\n\nELENCO CHIUSO — Strutture corporee (serie s), le uniche ammesse:\n" + STRUTTURE_CORPOREE.map(riga).join("\n");
}

const ICFBS = { FUNZIONI_CORPOREE, STRUTTURE_CORPOREE, GRUPPI_B, GRUPPI_S, SINONIMI, voceBS, normalizzaCodiceBS, normalizzaVoci, elencoPerPrompt };
if (typeof globalThis !== "undefined") globalThis.ICFBS = ICFBS;
if (typeof module !== "undefined" && module.exports) module.exports = ICFBS;

})();
