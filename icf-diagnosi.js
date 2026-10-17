// icf-diagnosi.js — funzioni (b) e strutture (s) corporee che discendono da una diagnosi DICHIARATA dall'interlocutore.
// È la stessa tabella «diagnosi → funzioni» e «strutture da diagnosi dichiarata» del prompt del colloquio (server.js), ma applicata dal
// programma: il risultato è identico a ogni colloquio, non dipende da quanto il modello la segue, e si verifica con i test.
// Tutti i codici appartengono all'elenco chiuso del questionario (icf-bs.js). Nulla si deduce da una diagnosi che non è stata detta.
// Classic script nel browser (window.ICFDiagnosi) ed esposto anche per Node (test-diagnosi.mjs). Richiede icf-bs.js già caricato.
(function () {

const BS = globalThis.ICFBS;

// Una regola riconosce la condizione in un frammento del testo della diagnosi e dice cosa comporta.
// b / s: codici previsti dal questionario. gravita: true se il testo può indicarne il grado (lieve=1, moderata=2, grave=3, completa=4).
const REGOLE = [
  { id: "autismo", nome: "autismo", rx: /\bautis|\basperger|spettro autistic|\bASD\b/i, b: ["b122", "b130", "b164", "b167"], livello: true },
  { id: "adhd", nome: "ADHD", rx: /\bADHD\b|\bADD\b|deficit (?:di )?attenzione|iperattivit/i, b: ["b140", "b130", "b147"] },
  { id: "dsa", nome: "disturbo specifico dell'apprendimento", rx: /\bDSA\b|disturbi? specific[oi] (?:dell|di|degli)[’' ]? ?apprendiment|dislessi|disortografi/i, b: ["b167"] },
  { id: "disgrafia", nome: "disgrafia", rx: /disgrafi/i, b: ["b167", "b7602"] },
  { id: "discalculia", nome: "discalculia", rx: /discalculi/i, b: [] },   // nessuna funzione dell'elenco: il calcolo si rileva come attività (d172)
  { id: "dcd", nome: "disprassia / disturbo della coordinazione motoria", rx: /disprassi|coordinazione motoria|\bDCD\b/i, b: ["b147", "b7602"] },
  { id: "disabilita_intellettiva", nome: "disabilità intellettiva", rx: /disabilit[àa] intellettiv|ritardo mentale|ritardo cognitiv|deficit cognitiv/i, b: ["b117"], gravita: true },
  { id: "down", nome: "sindrome di Down", rx: /sindrome di down|trisomia 21/i, b: ["b117", "b122", "b167", "b3"], s: ["s110"], gravita: true },
  { id: "sindrome_genetica", nome: "sindrome genetica con disabilità intellettiva", rx: /x fragile|williams|angelman|prader|sindrome di rett|cornelia de lange/i, b: ["b117"], s: ["s110"], gravita: true },
  { id: "linguaggio", nome: "disturbo del linguaggio", rx: /disturbo (?:specifico |primario )?del linguaggio|\bDSL\b|\bDL\b|ritardo (?:del|di|nel) linguaggio|disfasi|disturbo fonologic/i, b: ["b167", "b3"] },
  { id: "balbuzie", nome: "balbuzie / disturbo della fluenza", rx: /balbuzie|disfluenz|disturbo della fluenza/i, b: ["b3"] },
  { id: "pci", nome: "paralisi cerebrale infantile", rx: /paralisi cerebral|\bPCI\b/i, b: ["b735", "b7602", "b770"], s: ["s110"], gravita: true, sede: true },
  { id: "lesione_cerebrale", nome: "lesione o malformazione cerebrale", rx: /cerebrolesion|lesione cerebral|trauma cranic|esiti di ictus|ictus|idrocefal|malformazion\w* cerebral|tumore cerebral/i, b: [], s: ["s110"], sede: true },
  { id: "dop", nome: "disturbo oppositivo-provocatorio", rx: /oppositiv|\bDOP\b/i, b: ["b125", "b152", "b130"] },
  { id: "condotta", nome: "disturbo della condotta", rx: /disturbo della condotta|disturbo del comportamento/i, b: ["b125", "b152", "b164"] },
  { id: "ansia", nome: "disturbo d'ansia", rx: /\bansia\b|ansios|attacchi di panico/i, b: ["b152"] },
  { id: "mutismo", nome: "mutismo selettivo", rx: /mutismo/i, b: ["b3", "b152"] },
  { id: "ptsd", nome: "trauma / PTSD", rx: /\bPTSD\b|stress post-?traumatic|\btrauma\b(?! cranic)/i, b: ["b152", "b144", "b164"] },
  { id: "udito", nome: "ipoacusia / sordità", rx: /ipoacusi|sordit|\bsord[oa]\b|deficit uditiv/i, b: ["b230"], s: ["s2"], gravita: true },
  { id: "vista", nome: "deficit visivo / cecità", rx: /cecit|non vedent|ipovision|ipovedent|deficit visiv/i, b: ["b210"], s: ["s2"], gravita: true },
  // solo strutture
  { id: "spina_bifida", nome: "spina bifida / lesione midollare", rx: /spina bifida|mielomeningocel|lesione midollar|midollo spinale/i, s: ["s120"], vescica: true },
  { id: "schisi", nome: "schisi labiopalatina / malformazioni di bocca o laringe", rx: /schisi|labiopalatin|palatoschisi|labioschisi|laringe/i, s: ["s3"] },
  { id: "neuromuscolare", nome: "malattia neuromuscolare", rx: /distrofi\w* muscolar|atrofia muscolare spinale|\bSMA\b|artrogriposi|neuromuscolar/i, s: ["s770"] },
  { id: "arto", nome: "agenesia o amputazione di un arto", rx: /agenesi\w*\b.{0,15}\b(?:arto|mano|mani|piede|piedi|gamba|gambe|braccio|bracci)\b|amputazion|amputat/i, s: [], arto: true },
  { id: "scoliosi", nome: "scoliosi / deformità del tronco", rx: /scoliosi|deformit\w* (?:del )?tronco|cifosi/i, s: ["s760"] },
  { id: "cardiorespiratorio", nome: "cardiopatia / patologia respiratoria / immunodeficienza", rx: /cardiopati|asma grave|fibrosi cistica|immunodeficienz/i, s: ["s4"] },
  { id: "metabolico", nome: "diabete / celiachia / malattia metabolica o endocrina", rx: /diabete (?:di )?tipo (?:1|i|uno)\b|diabete giovanile|celiachia|malattia metabolic|malattia endocrin/i, s: ["s5"] },
  { id: "cute", nome: "patologia grave della cute", rx: /epidermolisi|dermatite (?:atopica )?grav/i, s: ["s8"] },
  // riconosciuta, ma senza funzioni né strutture automatiche (solo se documentato: il modello o l'insegnante possono aggiungerle)
  { id: "epilessia", nome: "epilessia", rx: /epilessi|epilettic/i, b: [] },
];

// Condizione indicata come passata o superata: non determina il funzionamento attuale
const RX_PASSATA = /pregress|in passato|da piccol|da bambin|risolt|superat|remot|guarit/i;
const RX_GRAVITA = [[/profond|complet/i, 4], [/grave|gravi|severo|severa|importante/i, 3], [/moderat|medio|media|medi[ao]-/i, 2], [/lieve|lievi|leggero|leggera/i, 1]];
const RX_ARTO_SUP = /arto superiore|braccio|bracci|mano\b|mani\b/i, RX_ARTO_INF = /arto inferiore|gamba|gambe|piede|piedi/i, RX_TRONCO = /\btronco\b/i;

// Il testo si divide in frammenti (virgole, punti, congiunzioni): gravità e «pregresso» valgono per la sola condizione del frammento
const frammenti = (testo) => String(testo || "").split(/[;.,\n]| e | ed | con | \+ /i).map(x => x.trim()).filter(Boolean);
const trova = (rx, parti) => parti.find(p => rx.test(p));

function qualificatoreDa(frammento, regola) {
  if (regola.livello) { const m = /livello\s*([123])\b/i.exec(frammento); if (m) return { q: Number(m[1]), riferita: true }; }
  if (regola.gravita || regola.livello) for (const [rx, q] of RX_GRAVITA) if (rx.test(frammento)) return { q, riferita: true };
  return { q: 2, riferita: false };
}

// Dal testo della diagnosi: funzioni, strutture, condizioni riconosciute e condizioni ignorate (perché passate)
function daDiagnosi(testo) {
  const t = String(testo || "").trim();
  const out = { b: [], s: [], condizioni: [], ignorate: [] };
  if (!t || !BS) return out;
  const parti = frammenti(t);
  const aggiungi = (lista, code, q, riferita, regola) => {
    if (!BS.voceBS(code)) return;
    const nota = `da diagnosi dichiarata (${regola.nome})${riferita ? "" : "; gravità non riferita: qualificatore 2 provvisorio"}`;
    const e = lista.find(x => x.code === code);
    if (e) {
      if (q > e.qualifier) e.qualifier = q;
      if (!e.note.includes(regola.nome)) e.note += "; " + nota;
    } else lista.push({ code, label: BS.voceBS(code).testo, qualifier: q, note: nota, fonte: "inferenza", daDiagnosi: true });
  };
  for (const r of REGOLE) {
    const f = trova(r.rx, parti);
    if (!f) continue;
    if (RX_PASSATA.test(f)) { out.ignorate.push({ id: r.id, nome: r.nome, motivo: "condizione indicata come passata" }); continue; }
    out.condizioni.push({ id: r.id, nome: r.nome });
    const { q, riferita } = qualificatoreDa(f, r);
    (r.b || []).forEach(c => aggiungi(out.b, c, q, riferita, r));
    const strutture = [...(r.s || [])];
    if (r.sede) { if (RX_ARTO_SUP.test(t)) strutture.push("s730"); if (RX_ARTO_INF.test(t)) strutture.push("s750"); if (RX_TRONCO.test(t)) strutture.push("s760"); }
    if (r.arto) { if (RX_ARTO_SUP.test(f)) strutture.push("s730"); if (RX_ARTO_INF.test(f)) strutture.push("s750"); }
    if (r.vescica && /vescica|vescicale|urinar/i.test(t)) strutture.push("s6");
    strutture.forEach(c => aggiungi(out.s, c, q, riferita, r));
  }
  return out;
}

// Una struttura registrata dal modello si tiene solo se la sostiene la diagnosi, oppure se la nota cita una lesione/malformazione riferita
const RX_STRUTTURALE = /lesion|malformaz|amputaz|agenesi|deformit|frattur|atrofi|atresia|schisi|ustion|cicatric|distrofi|assenza|danno strutturale|esiti? (?:di|da) /i;

// Integra nello stato del colloquio (anagrafica, bItems, sItems: array modificati sul posto) le voci che discendono dalla diagnosi.
// Le voci già registrate (dal modello o dall'insegnante) non si toccano. Restituisce le voci aggiunte e le strutture non sostenute rimosse.
function integraDiagnosi(stato, { turno = 0 } = {}) {
  const { anagrafica = {}, bItems = [], sItems = [] } = stato || {};
  const risultato = { registro: [], aggiunte: [], nonSostenute: [], condizioni: [] };
  const testo = anagrafica.diagnosi;
  if (!testo || !BS) return risultato;
  const d = daDiagnosi(testo);
  risultato.condizioni = d.condizioni;
  const evidenza = { frase: `Dalla diagnosi dichiarata: «${String(testo).slice(0, 160)}»`, turno };
  const aggiungi = (arr, tipo, v) => {
    if (arr.some(x => x.code === v.code)) return;
    arr.push({ code: v.code, label: v.label, qualifier: v.qualifier, note: v.note, fonte: "inferenza", evidenza: { ...evidenza } });
    risultato.aggiunte.push(v.code);
    risultato.registro.push({ tipo, codice: v.code, testo: `${v.label} — qualificatore ${v.qualifier}`, nota: v.note, inferito: true });
  };
  d.b.forEach(v => aggiungi(bItems, "Funzione corporea", v));
  d.s.forEach(v => aggiungi(sItems, "Struttura corporea", v));
  // strutture registrate dal modello senza sostegno nella diagnosi (es. s110 per un ADHD): non si registrano
  if (d.condizioni.length) {
    for (let i = sItems.length - 1; i >= 0; i--) {
      const s = sItems[i];
      if (!s || s.fonte === "insegnante" || s.fonte === "file") continue;
      if (d.s.some(x => x.code === s.code) || RX_STRUTTURALE.test(String(s.note || ""))) continue;
      risultato.nonSostenute.push({ code: s.code, label: s.label || "" });
      sItems.splice(i, 1);
    }
  }
  return risultato;
}

const ICFDiagnosi = { REGOLE, daDiagnosi, integraDiagnosi };
if (typeof globalThis !== "undefined") globalThis.ICFDiagnosi = ICFDiagnosi;
})();
