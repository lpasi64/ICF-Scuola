// voce.js — sintesi vocale di PEI APP: prepara il testo per la lettura, lo divide in frasi con pause e sceglie la voce più naturale.
// Classic script nel browser (window.VoceTTS); esposto anche per Node (test-voce.mjs), come icf-transform.js.
(function () {

const ORDINALI_M = ["", "primo", "secondo", "terzo", "quarto", "quinto", "sesto", "settimo", "ottavo", "nono", "decimo"];
const ORDINALI_F = ["", "prima", "seconda", "terza", "quarta", "quinta", "sesta", "settima", "ottava", "nona", "decima"];
// Sigle che l'AI e i documenti usano spesso: scandite lettera per lettera, come le direbbe una persona
const SIGLE = ["ICF", "GLO", "DSA", "ADHD", "ASD", "PCTO", "FSL", "MIM", "PF", "BES", "PDF", "IA", "PDP", "PFI"];
const RX_SIGLE = new RegExp("\\b(" + SIGLE.join("|") + ")\\b", "g");

// Testo come lo leggerebbe una persona: niente simboli letti ad alta voce, forme con la barra per esteso, sigle scandite
function preparaTestoVocale(input) {
  let t = String(input == null ? "" : input);
  t = t.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]*>/g, " ");
  t = t.replace(/\*\*|__|`+/g, "").replace(/^\s*#{1,6}\s*/gm, "").replace(/#+/g, " ").replace(/^\s*[-*•]\s+/gm, "");
  t = t.replace(/[’‘´`]/g, "'").replace(/[“”«»"]/g, " ");
  t = t.replace(/[\p{Extended_Pictographic}‍️]/gu, " ");
  // forme con la barra
  t = t.replace(/\balunno\/a\b/gi, "alunno o alunna").replace(/\bbambino\/a\b/gi, "bambino o bambina").replace(/\bstudente\/essa\b/gi, "studente o studentessa");
  t = t.replace(/\be\/o\b/gi, "e o");
  t = t.replace(/(\d+)\/(\d+)/g, "$1 del $2");
  t = t.replace(/(\p{L}+)\/(\p{L}+)/gu, "$1 o $2");
  // abbreviazioni
  t = t.replace(/\bD\.\s?Lgs\.?/gi, "decreto legislativo").replace(/\bD\.\s?I\.(?=\s|\d)/g, "decreto interministeriale").replace(/\bD\.\s?M\.(?=\s|\d)/g, "decreto ministeriale");
  t = t.replace(/\bartt\.\s*/gi, "articoli ").replace(/\bart\.\s*/gi, "articolo ").replace(/\bn\.\s*(?=\d)/gi, "numero ").replace(/\bL\.\s*(?=\d)/g, "legge ");
  t = t.replace(/\becc\./gi, "eccetera").replace(/\bad es\./gi, "ad esempio").replace(/\bes\./gi, "per esempio");
  t = t.replace(/(\d+)\s?%/g, "$1 per cento");
  t = t.replace(/(\d+)ª/g, (m, n) => (+n >= 1 && +n <= 10 ? ORDINALI_F[+n] : n));
  t = t.replace(/(\d+)\s?[°º]/g, (m, n) => (+n >= 1 && +n <= 10 ? ORDINALI_M[+n] : n));
  t = t.replace(/\bPEI APP\b/g, "Piano Educativo Individualizzato app").replace(/\bPEI\b/g, "Piano Educativo Individualizzato");   // scandita lettera per lettera suona inglese: meglio la forma estesa
  t = t.replace(RX_SIGLE, (s) => s.split("").join(" "));
  // pause al posto dei simboli
  t = t.replace(/\s[—–-]\s|[—–]/g, ", ").replace(/[·•]/g, ", ").replace(/[()\[\]]/g, ", ").replace(/…/g, ".");
  // spazi e punteggiatura (i capoversi restano)
  t = t.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n");
  // i capoversi (riga vuota) si proteggono; un a capo singolo vale una pausa: punto se manca, altrimenti spazio
  t = t.replace(/\n{2,}/g, "\u0001").replace(/([^.!?:;,\n\u0001])\n/g, "$1. ").replace(/\n/g, " ").replace(/\u0001/g, "\n\n");
  t = t.replace(/,(\s*,)+/g, ",").replace(/\s+([,.;:!?])/g, "$1").replace(/([,;:])\s*([.!?])/g, "$2").replace(/^[\s,;:]+/, "").replace(/ {2,}/g, " ");
  return t.trim();
}

// Spezza una frase troppo lunga alle virgole (le voci online si bloccano o perdono intonazione sui testi lunghi)
function spezza(f, max) {
  if (f.length <= max) return [f];
  const out = []; let cur = "";
  for (const tok of f.split(/(?<=[,;:])\s+/)) {
    if (cur && (cur + " " + tok).length > max) { out.push(cur); cur = tok; } else cur = cur ? cur + " " + tok : tok;
  }
  if (cur) out.push(cur);
  return out.flatMap(p => {
    if (p.length <= max) return [p];
    const parti = []; let r = p;
    while (r.length > max) { let i = r.lastIndexOf(" ", max); if (i < 1) i = max; parti.push(r.slice(0, i).trim()); r = r.slice(i).trim(); }
    if (r) parti.push(r);
    return parti;
  });
}

// Una frase per volta, con una breve pausa a fine frase e più lunga a fine capoverso: la voce respira come una persona
function dividiInFrasi(text, max = 220) {
  const paragrafi = String(text == null ? "" : text).split(/\n{2,}/).map(p => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  const out = [];
  paragrafi.forEach((p, pi) => {
    const frasi = (p.match(/[^.!?…]+[.!?…]+["')]*|[^.!?…]+$/g) || [p]).map(s => s.trim()).filter(Boolean);
    frasi.forEach((f, fi) => {
      const pezzi = spezza(f, max);
      pezzi.forEach((z, zi) => {
        const finePezzi = zi === pezzi.length - 1;
        const fineParagrafo = finePezzi && fi === frasi.length - 1 && pi < paragrafi.length - 1;
        out.push({ testo: z, pausa: fineParagrafo ? 450 : (finePezzi ? 140 : 60) });
      });
    });
  });
  return out;
}

// Le frasi di un messaggio in gruppi da leggere con una sola richiesta alla voce neurale (limite di caratteri per richiesta)
function raggruppaFrasi(frasi, maxCaratteri = 1500) {
  const gruppi = []; let corrente = [], n = 0;
  for (const f of Array.isArray(frasi) ? frasi : []) {
    if (corrente.length && n + f.testo.length > maxCaratteri) { gruppi.push(corrente); corrente = []; n = 0; }
    corrente.push(f); n += f.testo.length;
  }
  if (corrente.length) gruppi.push(corrente);
  return gruppi;
}

const isItaliana =(v) => /^it([-_]|$)/i.test((v && v.lang) || "");

// Più alto = più naturale. Le voci «Natural»/neurali (Edge, Chrome online) battono di molto quelle locali meccaniche.
function punteggioVoce(v) {
  const n = ((v && v.name) || "").toLowerCase();
  let s = 0;
  if (/natural/.test(n)) s += 100;
  if (/neural|wavenet|studio/.test(n)) s += 90;
  if (/premium|enhanced|migliorata|siri/.test(n)) s += 70;
  if (/online/.test(n)) s += 40;
  if (/google/.test(n)) s += 30;
  if (v && v.localService === false) s += 10;
  if (/isabella/.test(n)) s += 8;
  if (/elsa/.test(n)) s += 6;
  if (/diego|federica|alice|luca|paola|silvia|emma/.test(n)) s += 3;
  if (/espeak|festival|compact/.test(n)) s -= 100;
  return s;
}

// Voci italiane ordinate dalla più naturale; se non ce ne sono, tutte
function classificaVoci(voci) {
  const lista = Array.isArray(voci) ? voci : [];
  const it = lista.filter(isItaliana);
  return (it.length ? it : lista)
    .map((voce, i) => ({ voce, punteggio: punteggioVoce(voce), i }))
    .sort((a, b) => b.punteggio - a.punteggio || a.i - b.i)
    .map(({ voce, punteggio }) => ({ voce, punteggio, naturale: punteggio >= 90 }));
}

// La voce scelta dall'utente, altrimenti la più naturale tra le italiane
function scegliVoce(voci, nomePreferito) {
  const lista = Array.isArray(voci) ? voci : [];
  if (nomePreferito) {
    const f = lista.find(v => v.name === nomePreferito);
    if (f) return { voce: f, punteggio: punteggioVoce(f) };
  }
  const c = classificaVoci(lista);
  return c.length ? { voce: c[0].voce, punteggio: c[0].punteggio } : { voce: null, punteggio: 0 };
}

// Spiegazione, al Lei e con il rimedio, di ciò che il browser segnala quando la dettatura non parte o si interrompe
function messaggioErroreDettatura(codice) {
  switch (codice) {
    case "not-allowed":
    case "service-not-allowed":
      return "Il browser non ha il permesso di usare il microfono. Clicchi sull'icona del lucchetto accanto all'indirizzo della pagina, consenta il microfono e riprovi.";
    case "audio-capture":
      return "Non trovo nessun microfono attivo. Controlli che sia collegato e che sia quello selezionato nelle impostazioni audio del computer.";
    case "no-speech":
      return "Non ho sentito nulla. Riprovi e inizi a parlare subito dopo l'attivazione, avvicinandosi al microfono.";
    case "network":
      return "La dettatura usa i server di riconoscimento vocale del browser e non riesce a raggiungerli: controlli la connessione o eventuali blocchi di rete.";
    case "language-not-supported":
      return "Il browser non supporta la dettatura in italiano.";
    case "aborted":
      return "";
    default:
      return `La dettatura si è interrotta (${codice}). Riprovi, oppure scriva la risposta.`;
  }
}

// Quando la dettatura si chiude senza testo e senza errori, gli eventi del browser dicono dove si è fermata la catena:
// audio dal microfono → suono rilevato → voce riconosciuta come parlato → testo restituito dal servizio
function diagnosiDettatura({ audio, suono, parlato }) {
  if (!audio) return "Il browser non ha ricevuto audio dal microfono. Controlli che il microfono scelto nelle impostazioni audio del computer sia quello giusto e non sia disattivato, poi riprovi.";
  if (!suono) return "Il microfono è attivo ma non rileva suono. Controlli che non sia disattivato, che il volume di ingresso non sia a zero e che sia selezionato il microfono giusto: può verificarlo con «Prova del microfono» nel pannello Voce.";
  if (!parlato) return "Rilevo rumore ma non voce. Avvicini il microfono e parli in modo più chiaro, oppure scelga un microfono diverso.";
  return "Il servizio di riconoscimento vocale del browser non ha restituito testo. Controlli la connessione e che nessuna estensione o regola di rete blocchi il servizio, poi riprovi oppure scriva la risposta.";
}

// Livello (0-100) di un segnale audio nel dominio del tempo (valori 0-255, silenzio = 128), per la «Prova del microfono»
function livelloMicrofono(dati) {
  if (!dati || !dati.length) return 0;
  let somma = 0;
  for (let i = 0; i < dati.length; i++) { const v = (dati[i] - 128) / 128; somma += v * v; }
  const rms = Math.sqrt(somma / dati.length);
  return Math.min(100, Math.round(rms * 100 * 4));
}

const VoceTTS = { preparaTestoVocale, dividiInFrasi, raggruppaFrasi, scegliVoce, classificaVoci, punteggioVoce, messaggioErroreDettatura, diagnosiDettatura, livelloMicrofono };
if (typeof globalThis !== "undefined") globalThis.VoceTTS = VoceTTS;
if (typeof module !== "undefined" && module.exports) module.exports = VoceTTS;

})();
