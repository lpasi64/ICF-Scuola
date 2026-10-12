// icf-export-piattaforma.js — esporta il lavoro di PEI APP nella STESSA struttura del file di ICF Applicazioni (questionario breve), così che la
// piattaforma lo riconosca e ne faccia il controllo prima della convalida. È il percorso inverso di icf-import.js.
// Nel file ci sono solo le chiavi della piattaforma che PEI APP può conoscere: gli identificativi (questionario, compilatore, anagrafica, paziente)
// e la «valutazione» automatica li assegna e li calcola la piattaforma, quindi non si scrivono; nome ed età dell'alunno non sono nel file.
// Classic script nel browser (window.ICFExportPiattaforma) ed esposto anche per Node (test-export-piattaforma.mjs).
// Richiede icf-modello-piattaforma.js, icf-transform.js, icf-bs.js e icf-import.js già caricati.
(function () {

const M = globalThis.ICFModello, T = globalThis.ICFTransform, BS = globalThis.ICFBS, I = globalThis.ICFImport;
const SIMBOLI = I.SIMBOLI_FATTORE;

const sc = (v) => (v === null || v === undefined || v === "" ? "" : String(v));
const codice = (v) => String(v === null || v === undefined ? "" : v).trim().toLowerCase();

// Nel questionario importato la nota di un fattore sta nell'etichetta («Nome standard — nota»): qui si separa di nuovo.
function notaDelFattore(code, label) {
  const l = String(label || "").trim(), nome = I.ETICHETTE_E[code] || code;
  if (!l || l === nome || l === code) return "";
  if (l.startsWith(nome + " — ")) return l.slice(nome.length + 3).trim();
  return l;
}
const simboloFattore = (effect) => { const q = T.qualificatoreFattore(effect); return SIMBOLI.includes(q) ? q : ""; };

function esportaPerPiattaforma(stato, opzioni) {
  const { anagrafica = {}, profile = {}, bItems = [], sItems = [], fpItems = [] } = stato || {};
  const data = (opzioni && opzioni.data) || new Date().toISOString().slice(0, 10);
  const compo = (cod) => M.componenti.find(c => c.codice === cod) || { domini: [] };

  // Item d: i valori sono nel dominio a cui l'item appartiene (si cerca comunque in tutti, per le bozze vecchie)
  const tuttiGliItem = Object.values(profile).flatMap(d => (d && d.items) || []);
  const trovaItem = (code) => tuttiGliItem.find(x => codice(x.code) === code);

  const componentiD = compo("d").domini.map(dom => {
    const id = dom.codice.toUpperCase(), d = profile[id] || {};
    const noti = new Set(dom.voci.map(v => v.icf));
    const codici_icf = dom.voci.map(v => {
      const f = trovaItem(v.icf);
      return { capacita: sc(f && f.cap), icf: v.icf, descrizione: v.descrizione, performance: sc(f && f.pf), informazioni: v.informazioni, note: (f && f.nota) || "" };
    });
    // item del dominio che il modello non elenca: non si perdono
    ((d.items) || []).forEach(f => {
      const c = codice(f.code);
      if (!c || noti.has(c) || dom.voci.some(v => v.icf === c)) return;
      if (!codici_icf.some(x => x.icf === c)) codici_icf.push({ capacita: sc(f.cap), icf: c, descrizione: T.labelForCode(c), performance: sc(f.pf), informazioni: "", note: f.nota || "" });
    });

    // Fattori ambientali e personali del dominio, nell'ordine della piattaforma; lo stesso fattore valutato più volte dà più righe
    const fa = (d.faItems || []).filter(f => codice(f.code));
    const fp = fpItems.filter(f => codice(f.code) && f.dominio === id);
    const righe = [];
    const usatiFa = new Set(), usatiFp = new Set();
    dom.fattori.forEach(t => {
      const delCodice = fa.filter(f => codice(f.code) === t.icf);
      const personali = fp.filter(f => codice(f.code) === t.icf);
      delCodice.forEach(f => usatiFa.add(f));
      personali.forEach(f => usatiFp.add(f));
      const base = { icf: t.icf, descrizione: t.descrizione };
      if (!delCodice.length && !personali.length) { righe.push({ ...base, performance: "", informazioni: t.informazioni, note: "" }); return; }
      delCodice.forEach(f => righe.push({ ...base, performance: simboloFattore(f.effect), informazioni: t.informazioni, note: notaDelFattore(t.icf, f.label) }));
      personali.forEach(f => righe.push({ ...base, performance: SIMBOLI.includes(f.qualificatore) ? f.qualificatore : "", informazioni: t.informazioni, note: f.note || "" }));
    });
    fa.filter(f => !usatiFa.has(f)).forEach(f => { const c = codice(f.code); righe.push({ icf: c, descrizione: I.ETICHETTE_E[c] || f.label || c, performance: simboloFattore(f.effect), informazioni: "", note: notaDelFattore(c, f.label) }); });
    fp.filter(f => !usatiFp.has(f)).forEach(f => { const c = codice(f.code); righe.push({ icf: c, descrizione: f.label || c, performance: SIMBOLI.includes(f.qualificatore) ? f.qualificatore : "", informazioni: "", note: f.note || "" }); });
    return { fattori_ambientali: righe, nome: dom.nome, codice: dom.codice, codici_icf };
  });

  // Funzioni (b) e strutture (s): una voce per ogni item del modello, con il qualificatore e la nota raccolti
  const corporee = (cod, voci, conFattori) => compo(cod).domini.map(dom => {
    const noti = new Set(dom.voci.map(v => v.icf));
    const codici_icf = dom.voci.map(v => {
      const f = voci.find(x => codice(x.code) === v.icf);
      return { icf: v.icf, descrizione: v.descrizione, qualificatore: sc(f && f.qualifier), informazioni: v.informazioni, note: (f && f.note) || "" };
    });
    voci.forEach(f => {
      const c = codice(f.code), g = (c.match(/^[bs]\d/) || [""])[0];
      if (!c || noti.has(c) || g !== dom.codice) return;
      const uff = BS.voceBS(c);
      codici_icf.push({ icf: c, descrizione: (uff && uff.testo) || f.label || c, qualificatore: sc(f.qualifier), informazioni: "", note: f.note || "" });
    });
    return conFattori ? { fattori_ambientali: [], nome: dom.nome, codice: dom.codice, codici_icf } : { nome: dom.nome, codice: dom.codice, codici_icf };
  });

  // Altre valutazioni non ICF: qui finiscono i fattori personali non legati a un dominio, che la piattaforma non colloca altrove
  const altre = compo("A").domini.map(dom => ({
    nome: dom.nome, codice: dom.codice,
    codici_icf: [
      ...dom.voci.map(v => ({ icf: v.icf, descrizione: v.descrizione, qualificatore: "", informazioni: v.informazioni, note: "" })),
      ...fpItems.filter(f => codice(f.code) && !f.dominio).map(f => ({ icf: codice(f.code), descrizione: f.label || codice(f.code), qualificatore: SIMBOLI.includes(f.qualificatore) ? f.qualificatore : "", informazioni: "", note: f.note || "" })),
    ],
  }));

  const nomeComp = (cod) => compo(cod).nome;
  return {
    ruolo_compilatore: "ND",
    data,
    componenti: [
      { domini: corporee("b", bItems, true), nome: nomeComp("b"), codice: "b" },
      { domini: componentiD, nome: nomeComp("d"), codice: "d" },
      { domini: corporee("s", sItems, false), nome: nomeComp("s"), codice: "s" },
      { domini: altre, nome: nomeComp("A"), codice: "A" },
    ],
    applicazione: "ICF Scuola",
    quadro_informativo: { classe: anagrafica.classe || "", situazione_familiare: anagrafica.famiglia || "", grado_scuola: anagrafica.scuola || "", descrizione_biografica: anagrafica.interessi || "" },
    tipologia: "ICF Scuola Breve",
  };
}

const ICFExportPiattaforma = { esportaPerPiattaforma };
if (typeof globalThis !== "undefined") globalThis.ICFExportPiattaforma = ICFExportPiattaforma;
if (typeof module !== "undefined" && module.exports) module.exports = ICFExportPiattaforma;

})();
