// icf-transform.js
// Dati statici e funzioni pure per trasformare lo stato del colloquio ICF-Scuola
// nello schema di export atteso a valle (vedi questionario_icf_scuola_breve_*.json).
// Nessuna dipendenza da AI/browser: testabile con Node puro (vedi test-icf-transform.js).
// Caricato sia da index.html (<script src="icf-transform.js">) sia da Node (import "./icf-transform.js").
// Tutto avvolto in una IIFE: le const locali (ICF_DOMAINS, ecc.) non devono collidere con lo
// script principale di index.html, che le legge solo tramite globalThis.ICFTransform.
(function () {

const ICF_DOMAINS = [
  { id:"D1", cls:"d-d1", icon:"🧠", label:"Apprendimento e Applicazione Conoscenze",
    items:[{code:"d137",label:"Acquisire concetti"},{code:"d138",label:"Cercare e comprendere fatti"},{code:"d155",label:"Apprendere abilità pratiche/cognitive"},{code:"d160",label:"Attenzione al compito"},{code:"d166",label:"Leggere"},{code:"d170",label:"Scrivere"},{code:"d172",label:"Calcolare"},{code:"d175",label:"Problem solving"},{code:"d177",label:"Prendere decisioni"},{code:"d179",label:"Applicare conoscenze"}]},
  { id:"D2", cls:"d-d2", icon:"📋", label:"Compiti e Richieste Generali",
    items:[{code:"d210",label:"Compito semplice"},{code:"d220",label:"Più compiti in parallelo"},{code:"d230",label:"Attività abituali della giornata"},{code:"d240",label:"Controllare emotività/stress"}]},
  { id:"D3", cls:"d-d3", icon:"💬", label:"Comunicazione",
    items:[{code:"d310",label:"Comprendere messaggi verbali"},{code:"d315",label:"Comprendere messaggi non verbali"},{code:"d320",label:"Comprendere LIS"},{code:"d330",label:"Parlare"},{code:"d335",label:"Esprimere messaggi non verbali"},{code:"d340",label:"Produrre LIS"},{code:"d349",label:"Altre lingue"},{code:"d350",label:"Dialogare"},{code:"d360",label:"Strumenti di comunicazione"}]},
  { id:"D4", cls:"d-d4", icon:"🚶", label:"Mobilità",
    items:[{code:"d430",label:"Sollevare/trasportare oggetti"},{code:"d440",label:"Uso delle mani (precisione)"},{code:"d450",label:"Camminare"},{code:"d460",label:"Raggiungere luoghi"},{code:"d465",label:"Spostarsi con ausili"},{code:"d470",label:"Mezzo di trasporto"}]},
  { id:"D5", cls:"d-d5", icon:"🧴", label:"Cura di Sé",
    items:[{code:"d510",label:"Igiene personale"},{code:"d530",label:"Bisogni corporali"},{code:"d540",label:"Vestirsi/svestirsi"},{code:"d550",label:"Mangiare"},{code:"d570",label:"Cura della salute"}]},
  { id:"D6", cls:"d-d6", icon:"🏠", label:"Vita Domestica",
    items:[{code:"d6308",label:"Preparare pasti semplici"},{code:"d6408",label:"Lavori domestici"}]},
  { id:"D7", cls:"d-d7", icon:"🤝", label:"Relazioni Interpersonali",
    items:[{code:"d710",label:"Interazioni semplici"},{code:"d720",label:"Regolare il comportamento"},{code:"d730",label:"Relazione con estranei"},{code:"d750",label:"Relazioni informali"}]},
  { id:"D8", cls:"d-d8", icon:"🏫", label:"Aree di Vita — Istruzione",
    items:[{code:"d820",label:"Frequentare la scuola"},{code:"d835",label:"Vita scolastica"},{code:"d840",label:"Stage/PCTO"},{code:"d860",label:"Usare il denaro"}]},
  { id:"D9", cls:"d-d9", icon:"🌳", label:"Vita Sociale e di Comunità",
    items:[{code:"d910",label:"Attività sociali"},{code:"d920",label:"Attività ricreative/sportive"},{code:"d9200",label:"Attività di gioco"}]}
];

const DOMINI_TITOLI = {
  D1: "D1. Apprendimento e applicazione delle conoscenze",
  D2: "D2. Compiti e richieste generali",
  D3: "D3. Comunicazione",
  D4: "D4. Mobilità",
  D5: "D5. Cura di sé",
  D6: "D6. Vita domestica",
  D7: "D7. Interazioni e relazioni interpersonali",
  D8: "D8. Principali aree di vita (istruzione)",
  D9: "D9. Vita sociale, civile e di comunità"
};

const ITEM_DESCRIZIONI = {
  d137: "Comprendere e organizzare idee, categorie o significati generali a partire da esperienze, informazioni o esempi (es. acquisire concetti come quantità, lunghezza, uguale o diverso)",
  d138: "Cercare e comprendere fatti, dati o contenuti provenienti da fonti diverse (es. cercare informazioni anche attraverso internet)",
  d155: "Apprendere e sviluppare abilità pratiche, cognitive o sociali attraverso l'esperienza e l'esercizio (es. l'utilizzo di strumenti, giochi, ausili)",
  d160: "Dirigere e mantenere l'attenzione su un compito o un'attività per il tempo necessario",
  d166: "Leggere (comprendere parole, frasi o testi scritti per ricavarne informazioni o significati)",
  d170: "Scrivere (produrre parole, frasi o testi scritti per comunicare informazioni o significati)",
  d172: "Calcolare",
  d175: "Individuare soluzioni ai comuni problemi della vita quotidiana (problem solving mentale, non risoluzione pratica)",
  d177: "Prendere decisioni (es. effettuare una scelta tra più opzioni per risolvere un problema)",
  d179: "Applicare le conoscenze (orientamento spazio-temporale, senso critico, imparare a imparare, creatività)",
  d210: "Svolgere un compito semplice, organizzando tempo, spazio e materiali",
  d220: "Gestire più compiti o azioni nello stesso momento o in successione",
  d230: "Organizzare e portare avanti le attività abituali della giornata (tempo, cambiamenti)",
  d240: "Controllare l'emotività, gestire le responsabilità, l'ansia, lo stress, la rabbia etc.",
  d310: "Comprendere messaggi verbali",
  d315: "Comprendere messaggi non verbali",
  d320: "Comprendere messaggi nella lingua dei segni",
  d330: "Parlare (valutare anche fluenza, chiarezza, affaticamento)",
  d335: "Esprimere messaggi attraverso segnali non verbali (es. gesti, fotografie, disegni)",
  d340: "Produrre messaggi nella lingua dei segni",
  d349: "Comunicare in altre lingue",
  d350: "Dialogare con una o più persone, conosciute o estranee",
  d360: "Utilizzare strumenti di comunicazione (es. comunicatore, cellulare)",
  d430: "Sollevare, trasportare o spostare oggetti (peso e dimensioni)",
  d440: "Usare le mani con precisione (impugnare, tagliare, raccogliere, digitare, etc.)",
  d450: "Camminare (brevi/lunghe distanze, superfici diverse, ostacoli)",
  d460: "Raggiungere luoghi della vita quotidiana (es. raggiungere la scuola)",
  d465: "Spostarsi usando apparecchiature/ausili (sedia a rotelle, deambulatore, etc.)",
  d470: "Usare un mezzo di trasporto come passeggero",
  d510: "Curare l'igiene personale (lavarsi)",
  d530: "Gestire i bisogni corporali (andare in bagno, compresa la manifestazione del bisogno)",
  d540: "Vestirsi e svestirsi (compreso scegliere l'abbigliamento adeguato al contesto e alle stagioni)",
  d550: "Mangiare",
  d570: "Prendersi cura della propria salute e seguire indicazioni utili al proprio benessere (compreso evitare i pericoli)",
  d6308: "Preparare semplici pasti e/o collaborare a tale attività",
  d6408: "Fare i lavori domestici e/o collaborare a tale attività (es. riordinare)",
  d710: "Stabilire semplici interazioni interpersonali (interagire con gli altri in modo appropriato)",
  d720: "Regolare il comportamento nelle relazioni rispettando le regole del contesto",
  d730: "Entrare in relazione con estranei",
  d750: "Creare e mantenere relazioni informali (compagni, vicini di casa, amici, etc.)",
  d820: "Frequentare con regolarità e profitto la scuola",
  d835: "Partecipare alla vita della scuola (es. uscite didattiche, assemblee, etc.)",
  d840: "Frequentare stage, alternanza scuola-lavoro / FSL",
  d860: "Utilizzare il denaro per acquisti e pagamenti e riuscire a gestirlo correttamente (es. risparmiare)",
  d910: "Partecipare ad attività sociali di organizzazioni formali e informali del territorio",
  d920: "Svolgere attività ricreative, sportive, culturali e del tempo libero",
  d9200: "Partecipare ad attività di gioco, spontanee o strutturate"
};

// Mappa fissa codice → dimensione PEI (A/B/C/D/non_mappata), indipendente dal caso.
const ITEM_DIMENSIONE_PEI = {
  d137:"D", d138:"D", d155:"D", d160:"D", d166:"D", d170:"D", d172:"D", d175:"D", d177:"D", d179:"C",
  d210:"D", d220:"D", d230:"D", d240:"D",
  d310:"B", d315:"B", d320:"B", d330:"B", d335:"B", d340:"B", d349:"B", d350:"B", d360:"B",
  d430:"C", d440:"C", d450:"C", d460:"C", d465:"C", d470:"C",
  d510:"C", d530:"C", d540:"C", d550:"C", d570:"C",
  d6308:"C", d6408:"C",
  d710:"A", d720:"A", d730:"A", d750:"A",
  d820:"non_mappata", d835:"non_mappata", d840:"non_mappata", d860:"C",
  d910:"A", d920:"non_mappata", d9200:"non_mappata"
};

const DIMENSIONE_LABELS = {
  A: "Relazione, interazione e socializzazione",
  B: "Comunicazione e linguaggio",
  C: "Autonomia e orientamento",
  D: "Cognitiva, neuropsicologica e dell'apprendimento",
  non_mappata: "Non riconducibili in modo esclusivo a una dimensione (partecipazione scolastica, FSL, tempo libero/gioco)"
};

const SCALA = {
  PF: "Performance osservata nell'ambiente reale negli ultimi 30 giorni, con eventuali aiuti/ostacoli",
  CAP: "Capacità, senza aiuti né influenza dell'ambiente",
  valori: "0 ottimale/sempre | 1 molto bene/spesso | 2 abbastanza bene/qualche volta | 3 non bene/raramente | 4 per nulla/mai | 9 non applicabile"
};

const NOTA_PER_PROMPT = "Usare PF come indicatore principale del funzionamento reale; usare CAP e il gap CAP-PF per leggere il potenziale e l'influenza del contesto. Le dimensioni con esito \"Va definita\" indicano le aree su cui programmare obiettivi di PEI.";

function totalItemCount() {
  return ICF_DOMAINS.reduce((n, d) => n + d.items.length, 0);
}

function toNumOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function findProfileItem(profile, domainId, code) {
  const items = profile && profile[domainId] && profile[domainId].items;
  if (!items) return null;
  return items.find(x => x.code === code) || null;
}

// Costruisce l'elenco completo dei 47 item (skeleton sempre presente),
// unendo le tabelle statiche (descrizione, dimensione_pei) con i dati raccolti dal colloquio.
function buildCodiciIcf(profile) {
  const out = {};
  ICF_DOMAINS.forEach(domain => {
    domain.items.forEach(({ code }) => {
      const found = findProfileItem(profile, domain.id, code);
      const performance = found ? toNumOrNull(found.pf) : null;
      const capacita = found ? toNumOrNull(found.cap) : null;
      const gapValida = performance !== null && capacita !== null && performance !== 9 && capacita !== 9;
      out[code] = {
        codice: code,
        descrizione: ITEM_DESCRIZIONI[code] || "",
        performance,
        capacita,
        gap_C_meno_P: gapValida ? capacita - performance : null,
        dimensione_pei: ITEM_DIMENSIONE_PEI[code] || "non_mappata",
        nota: (found && found.nota) || "",
        fonte: found ? (found.fonte || "colloquio") : null
      };
    });
  });
  return out;
}

// Costruisce il blocco domini_icf (titolo, elenco codici statico, fattori ambientali raccolti).
// Nota: qui i fattori ambientali sono esposti come lista {codice,label,effetto} per dominio —
// non riproducono la categorizzazione F++/F-/B-/B+/B++ vista in altri export (sintesi editoriale
// che sembra un passaggio successivo, es. lato Generatore PEI — fuori scope per questo colloquio).
function buildDominiIcf(profile) {
  const out = {};
  ICF_DOMAINS.forEach(domain => {
    const key = domain.id.toLowerCase();
    const faItems = (profile && profile[domain.id] && profile[domain.id].faItems) || [];
    out[key] = {
      titolo: DOMINI_TITOLI[domain.id],
      codici: domain.items.map(i => i.code),
      fattori_ambientali: faItems.map(fa => ({ codice: fa.code, label: fa.label || fa.code, effetto: fa.effect || null }))
    };
  });
  return out;
}

// Calcola le statistiche per dimensione PEI (A/B/C/D/non_mappata) dagli item già costruiti.
// Gli item con performance 9 (non applicabile) o non ancora valutati (null) sono esclusi dalle
// statistiche numeriche ma restano elencati in "codes" — stesso comportamento osservato
// nell'esempio di riferimento (es. dimensione B: 9 codici in elenco, n=7 perché 2 sono 9/9).
function buildSintesiAutomatica(codiciIcf) {
  const dimensioni_pei = {};
  ["A", "B", "C", "D", "non_mappata"].forEach(dim => {
    const codes = Object.keys(ITEM_DIMENSIONE_PEI).filter(c => ITEM_DIMENSIONE_PEI[c] === dim);
    const rated = codes
      .map(c => codiciIcf[c])
      .filter(it => it && it.performance !== null && it.performance !== 9);
    const n = rated.length;
    const sumP = rated.reduce((s, it) => s + it.performance, 0);
    const maxP = n ? Math.max(...rated.map(it => it.performance)) : 0;
    const mediaP = n ? Math.round((sumP / n) * 100) / 100 : null;
    // Euristica semplice e dichiarata: sotto soglia 1.5 di media PF si propone "Monitorare",
    // altrimenti "Va definita". Il Generatore PEI ricalcola comunque queste dimensioni con un
    // proprio modello, quindi questo valore è un default di comodo, non l'unica fonte di verità.
    const esito_proposto = n === 0 ? "Non valutabile" : (mediaP >= 1.5 ? "Va definita" : "Monitorare");
    dimensioni_pei[dim] = { label: DIMENSIONE_LABELS[dim], codes, sumP, n, maxP, mediaP, esito_proposto };
  });

  const item_critici_P_maggiore_uguale_3 = Object.values(codiciIcf)
    .filter(it => it.performance !== null && it.performance !== 9 && it.performance >= 3)
    .map(it => it.codice);

  return { dimensioni_pei, item_critici_P_maggiore_uguale_3, nota_per_prompt: NOTA_PER_PROMPT };
}

// Conteggio di completamento (per badge/progress UI): quanti item hanno già un valore
// (incluso 9 = non applicabile, che conta come "valutato"), sul totale previsto dal questionario.
function countCompletion(profile) {
  let filled = 0;
  const perDomain = {};
  ICF_DOMAINS.forEach(domain => {
    const items = (profile && profile[domain.id] && profile[domain.id].items) || [];
    const domainFilled = items.filter(it => toNumOrNull(it.pf) !== null).length;
    perDomain[domain.id] = { filled: domainFilled, total: domain.items.length };
    filled += domainFilled;
  });
  return { filled, total: totalItemCount(), perDomain };
}

// Orchestratore: costruisce l'oggetto finale per il pulsante "⬇ JSON",
// nello schema atteso a valle (vedi questionario_icf_scuola_breve_*.json di riferimento).
function buildFinalExportData({ anagrafica = {}, profile = {}, bItems = [], sItems = [], fpItems = [] }) {
  const codici_icf = buildCodiciIcf(profile);
  return {
    meta: {
      fonte: "Questionario ICF-Scuola versione breve (PEI, Competenze chiave, Progetto di vita)",
      formato: "json_questionario_icf_scuola_breve",
      generato_il: new Date().toISOString()
    },
    allievo: {
      nome: anagrafica.nome || "",
      data_nascita: null,
      grado_scuola: null,
      grado_scuola_label: anagrafica.scuola || "",
      classe: anagrafica.classe || "",
      indirizzo_studio: "",
      sesso: null,
      compilatore: "",
      qualifica_compilatore: "",
      data_compilazione: new Date().toISOString().slice(0, 10),
      interessi_talenti_ganci_motivazionali: anagrafica.interessi || "",
      note_generali: [anagrafica.diagnosi, anagrafica.famiglia, anagrafica.supporti].filter(Boolean).join(" — ")
    },
    scala: SCALA,
    codici_icf,
    domini_icf: buildDominiIcf(profile),
    sintesi_automatica: buildSintesiAutomatica(codici_icf),
    funzioniCorporee: bItems,
    struttureCorporee: sItems,
    fattoriPersonali: fpItems
  };
}

const ICFTransform = {
  ICF_DOMAINS, DOMINI_TITOLI, ITEM_DESCRIZIONI, ITEM_DIMENSIONE_PEI, DIMENSIONE_LABELS, SCALA,
  totalItemCount, buildCodiciIcf, buildDominiIcf, buildSintesiAutomatica, countCompletion, buildFinalExportData
};

// Esposto sia per il caricamento come <script> classico nel browser (window.ICFTransform)
// sia per Node (globalThis.ICFTransform) — evita l'ambiguità import/require legata al
// "type": "module" del package.json del proxy che condivide questa cartella in locale.
if (typeof globalThis !== "undefined") {
  globalThis.ICFTransform = ICFTransform;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ICFTransform;
}

})();
