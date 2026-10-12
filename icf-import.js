// icf-import.js — caricamento di un questionario ICF-Scuola già compilato con la piattaforma ICF Applicazioni (file JSON).
// Estrazione mirata: dal file si prendono solo i dati che servono al PEI (i 47 item d del questionario breve, funzioni e strutture
// previste dagli allegati, fattori ambientali e personali, dati del caso del quadro informativo). Gli identificativi del file
// (codici di paziente e di questionario, compilatore) e la valutazione automatica non si importano mai.
// Classic script nel browser (window.ICFImport) ed esposto anche per Node (test-import.mjs), come icf-transform.js.
// Richiede icf-transform.js e icf-bs.js già caricati.
(function () {

const T = globalThis.ICFTransform, BS = globalThis.ICFBS;
const { ICF_DOMAINS, getMissingItems, labelForCode, qualificatoreFattore } = T;

const SCALA_VALIDA = [0, 1, 2, 3, 4, 9];
// La scala dei fattori ambientali della piattaforma: F++ facilitatore importante, F- facilitatore presente ma non sufficiente a
// compensare i limiti delle capacità, B- barriera media, B+ barriera elevata, B++ facilitatore necessario ma assente.
const SIMBOLI_FATTORE = ["F++", "F-", "B-", "B+", "B++"];
const DOMINIO_DI_ITEM = {};
ICF_DOMAINS.forEach(d => d.items.forEach(i => { DOMINIO_DI_ITEM[i.code] = d.id; }));

// Nomi ICF dei fattori ambientali che compaiono nel questionario (la piattaforma li esprime come domande)
const ETICHETTE_E = {
  e1100: "Cibo", e1101: "Farmaci", e115: "Prodotti e tecnologie per l'uso personale", e120: "Prodotti e tecnologie per la mobilità e il trasporto",
  e125: "Prodotti e tecnologie per la comunicazione", e130: "Prodotti e materiali per l'istruzione", e150: "Edifici pubblici (progettazione e costruzione)",
  e165: "Risorse e beni", e310: "Famiglia ristretta", e315: "Famiglia allargata", e320: "Amici",
  e325: "Conoscenti, compagni, colleghi, vicini e membri della comunità", e330: "Persone in posizione di autorità",
  e340: "Persone che forniscono aiuto o assistenza", e350: "Animali domestici", e355: "Operatori sanitari",
  e410: "Atteggiamenti dei membri della famiglia ristretta", e540: "Servizi di trasporto", e555: "Associazioni e organizzazioni del territorio",
  e575: "Servizi sociali e assistenziali", e580: "Servizi sanitari", e585: "Servizi dell'istruzione e della formazione",
};

const ORIGINE = { fonte: "file", evidenza: { frase: "Dal file importato da ICF Applicazioni", turno: 0 } };
const conOrigine = (x) => ({ ...x, fonte: ORIGINE.fonte, evidenza: { ...ORIGINE.evidenza } });
const testo = (v) => (v === null || v === undefined ? "" : String(v)).replace(/\s+/g, " ").trim();

// Valore di scala (PF, CAP, qualificatore di funzioni e strutture): numero ammesso, null se vuoto, undefined se non valido
function valoreScala(v) {
  const t = testo(v);
  if (t === "") return null;
  const n = Number(t);
  return Number.isInteger(n) && SCALA_VALIDA.includes(n) ? n : undefined;
}

// Il file è di ICF Applicazioni? Altrimenti spiega, al Lei, che cosa non va
function riconosciQuestionario(json) {
  const generico = "Il file non sembra un questionario ICF-Scuola esportato da ICF Applicazioni: non ne riconosco la struttura. Controlli di aver scelto il file JSON giusto.";
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ok: false, errore: generico };
  if (!Array.isArray(json.componenti)) {
    if (json.profilo || json.funzioniCorporee || json._history) return { ok: false, errore: "Questo file è una sessione salvata da PEI APP, non un questionario di ICF Applicazioni: per riprenderla usi il pulsante «Carica» nel pannello a destra, dopo l'avvio." };
    return { ok: false, errore: generico };
  }
  if (!json.componenti.some(c => c && Array.isArray(c.domini))) return { ok: false, errore: generico };
  return { ok: true, tipologia: testo(json.tipologia), data: testo(json.data) };
}

const componente = (json, codice) => (json.componenti || []).find(c => c && String(c.codice).toLowerCase() === codice) || { domini: [] };
const voci = (dominio) => (dominio && Array.isArray(dominio.codici_icf) ? dominio.codici_icf : []);
const fattori = (dominio) => (dominio && Array.isArray(dominio.fattori_ambientali) ? dominio.fattori_ambientali : []);

function estraiDaQuestionario(json) {
  const rc = riconosciQuestionario(json);
  if (!rc.ok) return { ok: false, errore: rc.errore };
  const avvisi = [];
  const profile = {};
  const dom = (id) => (profile[id] = profile[id] || { items: [], faItems: [] });
  let dIgnorati = 0, faSenzaQualificatore = 0, faNonValidi = 0;
  const simboliNonValidi = new Set();

  // Attività e partecipazione (d) e fattori ambientali (e) dei domini d1…d9
  const fpPerCodice = {};
  componente(json, "d").domini.forEach(dominio => {
    const idDominio = /^d[1-9]$/i.test(String(dominio.codice)) ? String(dominio.codice).toUpperCase() : null;
    voci(dominio).forEach(v => {
      const code = testo(v.icf).toLowerCase();
      const id = DOMINIO_DI_ITEM[code];
      if (!id) { if (/^d\d/.test(code)) dIgnorati++; return; }
      const pf = valoreScala(v.performance), cap = valoreScala(v.capacita);
      if (pf === undefined || cap === undefined) avvisi.push(`Valore non valido per ${code}: l'item resta da completare nella revisione.`);
      const p = pf === undefined ? null : pf, c = cap === undefined ? null : cap, nota = testo(v.note);
      if (p === null && c === null && !nota) return;
      const items = dom(id).items;
      const i = items.findIndex(x => x.code === code);
      const nuovo = conOrigine({ code, label: labelForCode(code), pf: p, cap: c, nota });
      if (i >= 0) items[i] = nuovo; else items.push(nuovo);
    });
    if (!idDominio) return;
    fattori(dominio).forEach(f => {
      const code = testo(f.icf).toLowerCase(), q = testo(f.performance), nota = testo(f.note);
      const valido = SIMBOLI_FATTORE.includes(q);
      if (/^i\d/.test(code)) {
        // fattori personali elencati dalla piattaforma tra i fattori ambientali: si valutano dopo ogni dominio, quindi
        // se ne tiene uno per codice e per dominio (la stessa abitudine può contare in un'area e non in un'altra)
        if (!valido && !nota) return;
        const chiave = code + "|" + idDominio;
        const x = fpPerCodice[chiave] = fpPerCodice[chiave] || { code, label: testo(f.descrizione) || code, note: "", qualificatore: valido ? q : "", dominio: idDominio };
        if (nota && !x.note.split("; ").includes(nota)) x.note = x.note ? x.note + "; " + nota : nota;
        return;
      }
      if (!/^e\d/.test(code)) return;
      // un qualificatore che non esiste nella scala (es. «F-») non si scarta in silenzio: il fattore resta, con la sua nota, da completare nella revisione
      if (!valido && !q && !nota) return;
      if (!valido) { if (q) { faNonValidi++; simboliNonValidi.add(q); } else faSenzaQualificatore++; }
      const nome = ETICHETTE_E[code] || code;
      dom(idDominio).faItems.push(conOrigine({ code, label: nota ? `${nome} — ${nota}` : nome, effect: valido ? q : "" }));
    });
  });
  if (faSenzaQualificatore) avvisi.push(`${faSenzaQualificatore} fattori ambientali hanno una nota ma nessun qualificatore: li completi nella revisione.`);
  if (faNonValidi) avvisi.push(`${faNonValidi} fattori ambientali hanno un qualificatore che non esiste nella scala (${[...simboliNonValidi].map(x => "«" + x + "»").join(", ")}; i validi sono ${SIMBOLI_FATTORE.join(", ")}): restano da completare nella revisione, altrimenti non entrano nel PEI.`);

  // Funzioni (b) e strutture (s): solo le voci valorizzate e previste dagli allegati
  const corporee = (codice, tipo) => {
    const candidate = [];
    componente(json, codice).domini.forEach(dominio => voci(dominio).forEach(v => {
      const q = valoreScala(v.qualificatore), nota = testo(v.note);
      if (q === undefined) avvisi.push(`Qualificatore non valido per ${testo(v.icf)}: la voce non è stata importata.`);
      if (q === undefined || (q === null && !nota)) return;
      candidate.push(conOrigine({ code: testo(v.icf).toLowerCase(), label: "", qualifier: q === null ? "" : q, note: nota }));
    }));
    return BS.normalizzaVoci(candidate, tipo);
  };
  const b = corporee("b", "b"), s = corporee("s", "s");
  const bScartate = [...new Set([...b.scartati, ...s.scartati].map(x => x.code))];

  const fpItems = Object.values(fpPerCodice).map(x => conOrigine(x));

  const qi = json.quadro_informativo && typeof json.quadro_informativo === "object" ? json.quadro_informativo : {};
  const anagrafica = {};
  [["classe", qi.classe], ["scuola", qi.grado_scuola], ["famiglia", qi.situazione_familiare], ["interessi", qi.descrizione_biografica]].forEach(([k, v]) => { if (testo(v)) anagrafica[k] = testo(v); });

  const stato = { anagrafica, profile, bItems: b.voci, sItems: s.voci, fpItems };
  const dMancanti = getMissingItems(profile).map(m => ({ code: m.code, label: m.label, domainId: m.domainId }));
  const totale = ICF_DOMAINS.reduce((n, d) => n + d.items.length, 0);
  const report = {
    tipologia: rc.tipologia, data: rc.data,
    dImportati: totale - dMancanti.length, dMancanti, dIgnorati,
    bImportate: b.voci.length, sImportate: s.voci.length, bScartate,
    faImportati: Object.values(profile).reduce((n, d) => n + d.faItems.length, 0), fpImportati: fpItems.length,
    avvisi,
  };
  return { ok: true, stato, report, nomiPossibili: rilevaNomiPropri(stato) };
}

// ── Nomi propri nelle note: il file non contiene il nome dell'alunno, ma le note possono citarlo ──────────
const NON_NOMI = new Set(["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
  "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica", "italiano", "matematica", "inglese", "storia", "scienze", "geografia", "francese",
  "tedesco", "spagnolo", "autismo", "asperger", "down", "scuola", "stato", "comune", "regione", "parole", "internet"].map(s => s.toLowerCase()));

function testiDelloStato(stato) {
  const t = [];
  Object.values(stato.anagrafica || {}).forEach(v => t.push(testo(v)));
  Object.values(stato.profile || {}).forEach(d => {
    (d.items || []).forEach(i => t.push(testo(i.nota)));
    (d.faItems || []).forEach(f => t.push(testo(f.label)));
  });
  [...(stato.bItems || []), ...(stato.sItems || [])].forEach(x => t.push(testo(x.note)));
  (stato.fpItems || []).forEach(x => { t.push(testo(x.note)); t.push(testo(x.label)); });
  return t.filter(Boolean);
}

// Parole con l'iniziale maiuscola a metà frase (non a inizio nota né dopo punteggiatura forte): possibili nomi di persona o di luogo
function rilevaNomiPropri(stato) {
  const testi = testiDelloStato(stato), trovati = new Set();
  testi.forEach(t => {
    const rx = /[\p{L}][\p{L}'’]*/gu;
    let m;
    while ((m = rx.exec(t))) {
      const w = m[0];
      if (m.index === 0 || w.length < 3 || !/^\p{Lu}\p{Ll}/u.test(w) || NON_NOMI.has(w.toLowerCase())) continue;
      const prima = t.slice(0, m.index).trimEnd();
      if (!prima || /[.!?:;(\-–—…"«'’]$/.test(prima)) continue;
      trovati.add(w);
    }
  });
  const conta = (nome) => testi.reduce((n, t) => n + (t.match(new RegExp("(?<![\\p{L}\\p{N}_])" + nome + "(?![\\p{L}\\p{N}_])", "gu")) || []).length, 0);
  return [...trovati].map(nome => ({ nome, occorrenze: conta(nome) })).sort((a, b) => b.occorrenze - a.occorrenze || a.nome.localeCompare(b.nome, "it"));
}

// Sostituisce, come parola intera e in tutte le note, i nomi indicati con quello di fantasia. Lo stato originale non si modifica.
function sostituisciNomi(stato, nomi, sostituto) {
  const copia = JSON.parse(JSON.stringify(stato));
  const lista = [...new Set((nomi || []).map(testo).filter(Boolean))], nuovo = testo(sostituto);
  if (!lista.length || !nuovo) return { stato: copia, sostituzioni: 0 };
  const rx = new RegExp("(?<![\\p{L}\\p{N}_])(?:" + lista.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?![\\p{L}\\p{N}_])", "giu");
  let sostituzioni = 0;
  const visita = (nodo) => {
    if (Array.isArray(nodo)) { nodo.forEach((v, i) => { if (typeof v === "string") nodo[i] = rimpiazza(v); else visita(v); }); return; }
    if (nodo && typeof nodo === "object") Object.keys(nodo).forEach(k => { if (typeof nodo[k] === "string") nodo[k] = rimpiazza(nodo[k]); else visita(nodo[k]); });
  };
  const rimpiazza = (s) => s.replace(rx, () => { sostituzioni++; return nuovo; });
  visita(copia);
  return { stato: copia, sostituzioni };
}

const ICFImport = { riconosciQuestionario, estraiDaQuestionario, rilevaNomiPropri, sostituisciNomi, qualificatoreFattore, ETICHETTE_E, SIMBOLI_FATTORE };
if (typeof globalThis !== "undefined") globalThis.ICFImport = ICFImport;
if (typeof module !== "undefined" && module.exports) module.exports = ICFImport;

})();
