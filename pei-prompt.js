// pei-prompt.js
// Porting ESM di server/prompt.js (progetto "Generatore PEI", G:\Il mio Drive\ICF_Scuola\PEI con Claude)
// Nessuna modifica di logica — solo require/module.exports -> import/export.

import { getConfig } from './pei-gradi.js';

// ── Calcola classe frequentata dall'età ──────────────────────────────────────
function calcolaClasse(eta, grado) {
  const e = parseInt(eta, 10) || 0;
  if (grado === 'infanzia') {
    const a = Math.min(Math.max(e - 2, 1), 3);
    return `${a}° anno di sezione (${e} anni)`;
  }
  if (grado === 'primaria') {
    const c = Math.min(Math.max(e - 5, 1), 5);
    return `${c}ª classe primaria`;
  }
  if (grado === 'sec1') {
    const c = Math.min(Math.max(e - 10, 1), 3);
    return `${c}ª classe scuola secondaria di primo grado`;
  }
  if (grado === 'sec2') {
    const c = Math.min(Math.max(e - 13, 1), 5);
    return `${c}ª classe scuola secondaria di secondo grado`;
  }
  return '';
}

// ── Etichetta riferimento programmi ──────────────────────────────────────────
function labelProgrammi(grado, istituto) {
  if (grado === 'infanzia')  return 'Indicazioni Nazionali per il curricolo (MIUR 2012) – traguardi di sviluppo';
  if (grado === 'primaria')  return 'Indicazioni Nazionali per il curricolo (MIUR 2012) – scuola primaria';
  if (grado === 'sec1')      return 'Indicazioni Nazionali per il curricolo (MIUR 2012) – scuola secondaria di primo grado';
  if (!istituto)             return 'Linee Guida per il secondo ciclo (DPR 15/03/2010)';
  if (istituto.startsWith('Liceo')) return `Indicazioni Nazionali per i Licei (DPR 89/2010) – ${istituto}`;
  if (istituto.startsWith('IT'))   return `Linee Guida Istituti Tecnici (DPR 88/2010) – ${istituto}`;
  if (istituto.startsWith('IP'))   return `Linee Guida Istituti Professionali (D.Lgs. 61/2017) – ${istituto}`;
  return `Linee Guida per il secondo ciclo – ${istituto}`;
}

// ── Contesto comune (dati + regole) ──────────────────────────────────────────
function buildContext({ eta, sesso, grado, istituto }, term, discStr, campoLabel) {
  const sessoLabel  = sesso === 'M' ? term.soggetto_m : term.soggetto_f;
  const istitutoStr = grado === 'sec2' && istituto ? `\n- Tipo di istituto: ${istituto}` : '';
  const classe      = calcolaClasse(eta, grado);
  return `DATI DEL/DELLA ${term.soggetto.toUpperCase()}:
- Età: ${eta} anni
- Classe frequentata: ${classe}
- Sesso: ${sessoLabel}
- Grado scolastico: ${term.intestazione}${istitutoStr}
- ${campoLabel === 'campi di esperienza' ? 'Campi di esperienza' : 'Discipline'}: ${discStr}

TERMINOLOGIA OBBLIGATORIA:
- Soggetto: "${term.soggetto}"
- Unità scolastica: "${term.sezione}"
- Organo collegiale: "${term.organo}"
- Usa sempre il nome proprio rilevato dal JSON (mai ID numerici)

REGOLE FONDAMENTALI:
1. Sezione 1: ZERO codici ICF, ZERO diagnosi cliniche, linguaggio positivo e narrativo.
2. Ogni "deficit" → "area di sviluppo"; ogni "sostituzione" → "supporto orientato all'autonomia".
3. NON usare placeholder "[...]" — scrivi ogni sezione integralmente.
4. Sezione 8: usa ESATTAMENTE i ${campoLabel} elencati sopra, nessuno di più, nessuno di meno.
5. VIETATO usare "autonomamente", "in modo autonomo", "uso autonomo" per descrivere P=0.
   In ICF "autonomia" indica la capacità intrinseca (qualifier C), non l'assenza di difficoltà in performance.
   Per P=0 usa: "non presenta difficoltà", "performance ottimale", "svolge senza difficoltà".
6. Usa SEMPRE "ASL" (Alternanza Scuola-Lavoro) come denominazione nel PEI, mai "PCTO".
   La sezione 8.3 si chiama ufficialmente "ASL" nel modello PEI ministeriale (D.Lgs. 96/2019).`;
}

// ── Analisi ICF (blocco comune a Parte 1 e Parte 2) ──────────────────────────
const ANALISI_ICF = `ANALISI ICF — CALCOLO INTERNO (⚠️ NON RIPORTARE NEL DOCUMENTO):
TASSATIVO: NON scrivere "FASE 1", "FASE 2", né i conteggi numerici nel corpo del PEI.
Usa i risultati solo per determinare quali dimensioni sono VA DEFINITA / OMISSIBILE.
FASE 1 — Censimento: tutti i codici "d" con P e C. Escludi P=9 o vuoto.
FASE 2 — Calcolo per dimensione:
  A – Relazione e Socializzazione: d7*, d9*
  B – Comunicazione e Linguaggio:  d3*
  C – Autonomia e Orientamento:    d2*, d4*, d5*, d6*, d8*
  D – Cognitiva e Apprendimento:   d1*
  Media = ∑P / N (solo codici validi)
  ≥ 1.50 → VA DEFINITA
  < 1.50 con almeno un P≥3 → OMISSIBILE + nota "Area di monitoraggio prioritario per il Progetto di Vita"
  < 1.50 → OMISSIBILE
  Legenda qualificatori ICF (intensità O frequenza del problema):
    0 = nessuna difficoltà / partecipazione piena e regolare
    1 = difficoltà lieve / partecipazione per lo più presente ma con qualche incostanza
    2 = difficoltà moderata / partecipazione saltuaria o parziale
    3 = difficoltà grave / partecipazione rara o molto limitata
    4 = difficoltà completa / partecipazione assente

LINGUAGGIO NARRATIVO OBBLIGATORIO (mai termini clinici nudi):
  P=0 → "svolge senza difficoltà", "partecipa pienamente", "riesce bene"
  P=1 → "svolge con buona efficacia", "partecipa con discreta regolarità",
         "non presenta particolari difficoltà", "riesce quasi sempre"
         ⚠️ MAI usare la parola "lieve" da sola: è tecnica e svalutante nel testo narrativo.
  P=2 → "incontra qualche difficoltà", "partecipa in modo saltuario/discontinuo",
         "riesce con supporto", "mostra difficoltà di livello moderato"
  P=3 → "incontra difficoltà significative", "partecipa raramente",
         "necessita di supporto intensivo"
  P=4 → "non riesce senza supporto completo", "la partecipazione è assente"

INTERPRETAZIONE P vs C (obbligatoria nella narrativa della Sezione 4):
  • P > C (es. P=3, C=2): l'ambiente reale PEGGIORA la performance → BARRIERE AMBIENTALI ATTIVE.
  • P < C (es. P=1, C=3): l'ambiente reale MIGLIORA la performance → FACILITATORI ATTIVI.
    Se P rimane ≥ 2 i facilitatori sono INSUFFICIENTI: indicalo e suggerisci come potenziarli.
  • P = C con P ≥ 2: difficoltà intrinseca non compensata (nessuna influenza ambientale attiva).
  • P = C con P = 0 o 1: funzionamento ottimale, nessuna influenza ambientale rilevante.`;

// ── PARTE 1: Sezioni 1–4 ─────────────────────────────────────────────────────
function buildPromptPart1({ eta, sesso, grado, istituto, jsonData }) {
  const { term, discipline } = getConfig(grado, istituto);
  const discStr    = discipline.join(', ');
  const campoLabel = grado === 'infanzia' ? 'campi di esperienza' : 'discipline';
  const ctx        = buildContext({ eta, sesso, grado, istituto }, term, discStr, campoLabel);

  return `Sei un docente esperto nella redazione del PEI ministeriale italiano (${term.intestazione}).
Stai generando la PRIMA PARTE del PEI: Sezioni 1–4.

${ctx}

${ANALISI_ICF}

---

## Sezione 1 – Quadro Informativo

**a) Situazione familiare e contesto**
⚠️ REGOLE ASSOLUTE PER QUESTA SEZIONE — NESSUNA ECCEZIONE:
- ZERO codici ICF: non scrivere e310, e320, e330, e340, e355, e410, e125 né qualsiasi altro codice alfanumerico ICF.
- ZERO qualificatori: non scrivere F++, F+, B+, B-, B++ né nessuna altra sigla di qualificatore.
- ZERO analisi di barriere e facilitatori — quella appartiene alla Sezione 6, non qui.
- Per le figure familiari usa SOLO linguaggio naturale: se il JSON contiene nomi specifici (es. "mamma", "papà", "nonno Mario") usali; altrimenti scrivi "i genitori", "la famiglia", "i nonni", "il fratello/la sorella" ecc. MAI "famiglia immediata (e310: F++)".
Scrivi una narrativa biografica calda e sintetica (max 120 parole) sul contesto familiare, la rete di supporto affettivo, l'ambiente di vita.

**b) Profilo Biografico, Punti di Forza e Personalità**
[Ritratto identitario: interessi, attitudini, punti di forza, consapevolezza dei propri bisogni. ZERO codici ICF. Usa passioni specifiche trovate nel JSON come "ganci" narrativi.]

---

## Sezione 2 – Dimensioni da definire nel PEI

| Dimensione | Esito (∑P; N; Media) | Motivazione |
|---|---|---|
[4 righe con valori calcolati esattamente dal JSON — non stimare, calcola]

---

## Sezione 3 – Raccordo con il Progetto di Vita (D.Lgs. 62/2024)

Segui il modello ministeriale con le due opzioni — scegli la più pertinente in base al JSON:

**a) Se il Progetto Individuale è già attivo:**
Descrivi brevemente (3-4 frasi) i raccordi tra PEI e Progetto Individuale nei seguenti ambiti (solo extrascolastici): salute e benessere (interventi riabilitativi, raccordo con équipe ASL), indipendenza e mobilità (autonomia negli spostamenti), vita relazionale e sociale (amicizie, attività ricreative), orientamento al lavoro (competenze pre-vocazionali).

**b) Se il Progetto Individuale non è ancora stato richiesto:**
Suggerisci di avviarlo al più presto e proponi almeno 3 degli ambiti seguenti, SPECIFICI per il profilo ICF di QUESTO studente:
- Obiettivi di autonomia personale e domestica (es. routine, spostamenti, gestione del tempo)
- Partecipazione alla vita sociale e comunitaria (es. attività sportive/ricreative, gruppi di pari)
- Interessi e talenti da valorizzare in chiave occupazionale
- Supporti necessari nel territorio (trasporti, assistenza, servizi)
- Orientamento verso percorsi formativi o lavorativi futuri

---

## Sezione 4 – Osservazioni sul/sulla ${term.soggetto} per progettare gli interventi

⚠️ STILE SINTETICO OBBLIGATORIO: massimo 3-4 frasi per dimensione. NON elencare ogni singolo codice ICF con i suoi qualificatori: raggruppa i codici in aree di funzionamento e offri un quadro d'insieme. Cita tra parentesi i codici chiave [d7xx.P.C] solo dove aggiungono informazione rilevante — non come elenco sistematico.

Struttura per ogni dimensione:
1. Punti di forza (P=0 o P=1): 1-2 frasi con linguaggio positivo (mai "lieve"; P=1 → "buona efficacia", "partecipa con regolarità"). Se P<C segnala brevemente i facilitatori attivi.
2. Aree di sviluppo (P≥2): 1-2 frasi con la dimensione frequenza quando pertinente. Se P>C, una frase sulle barriere.

**a) Dimensione della Relazione, Interazione e Socializzazione**
[Codici d7*, d9*. Sintesi in 3-4 frasi totali.]

**b) Dimensione della Comunicazione e del Linguaggio**
[Codici d3*. Sintesi in 3-4 frasi totali.]

**c) Dimensione dell'Autonomia e dell'Orientamento**
[Codici d2*, d4*, d5*, d6*, d8*. Sintesi in 3-4 frasi totali. Se OMISSIBILE: 1-2 frasi su elementi rilevanti per il Progetto di Vita.]

**d) Dimensione Cognitiva, Neuropsicologica e dell'Apprendimento**
[Codici d1*. Sintesi in 3-4 frasi totali.]

---

JSON ICF DA ANALIZZARE:
${jsonData}`;
}

// ── PARTE 2: Sezione 5 (obiettivi) ───────────────────────────────────────────
function buildPromptPart2({ eta, sesso, grado, istituto, jsonData }) {
  const { term, discipline } = getConfig(grado, istituto);
  const discStr    = discipline.join(', ');
  const campoLabel = grado === 'infanzia' ? 'campi di esperienza' : 'discipline';
  const ctx        = buildContext({ eta, sesso, grado, istituto }, term, discStr, campoLabel);
  const classe     = calcolaClasse(eta, grado);
  const refProgr   = labelProgrammi(grado, istituto);

  const obiettiviFmt = grado === 'infanzia'
    ? `I traguardi devono fare riferimento alle Indicazioni Nazionali 2012 per il ${classe}.`
    : `Calibra gli obiettivi sui programmi della ${classe} (${refProgr}). Usa gli interessi del/della ${term.soggetto} come gancio motivazionale.`;

  return `Sei un docente esperto nella redazione del PEI ministeriale italiano (${term.intestazione}).
Stai generando la SECONDA PARTE del PEI: Sezione 5 (obiettivi educativi e didattici).

${ctx}

${ANALISI_ICF}

---

## Sezione 5 – Obiettivi educativi e didattici

REGOLA TASSATIVA: scrivi ESATTAMENTE 2 obiettivi per ogni dimensione VA DEFINITA.
Per ogni dimensione OMISSIBILE con almeno un P≥3: scrivi 2 obiettivi orientati al Progetto di Vita.
Tutti i campi di ogni obiettivo sono OBBLIGATORI — non omettere strategie né verifica.

⚠️ NUMERAZIONE TASSATIVA: il primo obiettivo dell'intero documento DEVE chiamarsi "### Obiettivo 1". Numera in modo CONSECUTIVO: 1, 2, 3, 4, 5, 6, 7, 8. Non saltare mai il numero 1. Non ripartire da 1 per ogni dimensione.

⚠️ FORMATO TESTO: usa SOLO **grassetto** per le etichette dei campi (es. **Punto di forza di partenza:**). NON usare *corsivo con asterisco singolo* nel testo. Se devi enfatizzare, usa **grassetto**. Scrivi tutto il resto in testo normale.

⚠️ NO DESCRIZIONI INTERMEDIE: non aggiungere paragrafi descrittivi tra il titolo di una dimensione e il primo obiettivo di quella dimensione. Vai direttamente a ### Obiettivo N.

${obiettiviFmt}

Formato per ogni obiettivo (ripetilo IDENTICO per tutti):

### Obiettivo [n] – [breve titolo]
**Dimensione:** [A / B / C / D]
**Punto di forza di partenza:** [specificare il punto di forza ICF su cui si innesta]
**Obiettivo:** [enunciato chiaro e osservabile]
**Esito atteso (misurabile):** [criterio quantitativo o qualitativo verificabile]
**Interventi e Strategie:** Chi: [ruoli] / Cosa: [contenuto] / Come: [metodo e strumenti] / Dove: [contesto] / Quando: [tempistica]
**Modalità di verifica:** [strumenti, frequenza, responsabile]

---

JSON ICF DA ANALIZZARE:
${jsonData}`;
}

// ── PARTE 3: Sezioni 6–7 (contesto) ──────────────────────────────────────────
function buildPromptPart3({ eta, sesso, grado, istituto, jsonData }) {
  const { term, discipline } = getConfig(grado, istituto);
  const discStr    = discipline.join(', ');
  const campoLabel = grado === 'infanzia' ? 'campi di esperienza' : 'discipline';
  const ctx        = buildContext({ eta, sesso, grado, istituto }, term, discStr, campoLabel);

  return `Sei un docente esperto nella redazione del PEI ministeriale italiano (${term.intestazione}).
Stai generando la TERZA PARTE del PEI: Sezioni 6–7 (analisi del contesto e interventi ambientali).

${ctx}

---

## Sezione 6 – Osservazioni sul contesto: barriere e facilitatori

Analizza i fattori ambientali e* del JSON, poi descrivi per ogni ambito barriere e facilitatori con intensità.
Legenda: F++ facilitatore importante · F+ presente ma non sufficiente · B- barriera media · B+ elevata · B++ necessaria ma assente

**Ambito 1 – Ambiente fisico, prodotti e tecnologie (e1, e2)**
[Narrativa con qualificatori di intensità basata sui codici e1*, e2* del JSON. Indica almeno 3 elementi concreti.]

**Ambito 2 – Relazioni e supporti sociali (e3)**
[Narrativa: famiglia, insegnanti, compagni, assistenti. Qualificatori di intensità basati su e3*. Almeno 3 elementi.]

**Ambito 3 – Atteggiamenti (e4)**
[Narrativa: atteggiamenti di docenti, compagni, comunità, famiglia. Qualificatori basati su e4*. Almeno 2 elementi.]

---

## Sezione 7 – Interventi sul contesto per un ambiente di apprendimento inclusivo

⚠️ OBBLIGATORIO: scrivi SEMPRE tutte e 3 le categorie — MAI "Da compilare" o placeholder.
Struttura secondo le Linee Guida ministeriali sul PEI (D.Lgs. 66/2017 e D.M. 182/2020).
Formato per ogni azione (una riga, separatori pipe):
**Azione:** [descrizione] | **Destinatari:** [chi] | **Tempi:** [quando]

### Categoria 1 – Rimozione delle barriere
(Elimina ostacoli fisici, tecnologici, comunicativi, attitudinali emersi in Sezione 6.
Almeno 2 azioni concrete basate sulle barriere B+ / B++ identificate.)
**Azione:** [rimozione barriera concreta 1] | **Destinatari:** [chi] | **Tempi:** [quando]
**Azione:** [rimozione barriera concreta 2] | **Destinatari:** [chi] | **Tempi:** [quando]

### Categoria 2 – Introduzione di facilitatori universali
(Interventi che migliorano l'inclusione per l'INTERA classe, non solo per lo studente.
Almeno 2 azioni di design universale per l'apprendimento.)
**Azione:** [facilitatore universale 1 — beneficia tutta la classe] | **Destinatari:** intera classe | **Tempi:** [quando]
**Azione:** [facilitatore universale 2] | **Destinatari:** intera classe | **Tempi:** [quando]

### Categoria 3 – Facilitatori personalizzati
(Supporti e adattamenti specifici per lo studente: ausili, accomodamenti individuali,
figure di supporto. Almeno 2 azioni basate su facilitatori F++ / F+ della Sezione 6.)
**Azione:** [facilitatore personalizzato 1] | **Destinatari:** studente | **Tempi:** [quando]
**Azione:** [facilitatore personalizzato 2] | **Destinatari:** studente | **Tempi:** [quando]

---

JSON ICF DA ANALIZZARE:
${jsonData}`;
}

// ── PARTE 4: Sezione 8 + Nota Metodologica ───────────────────────────────────
function buildPromptPart4({ eta, sesso, grado, istituto, jsonData }) {
  const { term, sez8, std81, discipline } = getConfig(grado, istituto);
  const discStr    = discipline.join(', ');
  const campoLabel = grado === 'infanzia' ? 'campi di esperienza' : 'discipline';
  const ctx        = buildContext({ eta, sesso, grado, istituto }, term, discStr, campoLabel);
  const bloccoSez8 = buildSez8Block(grado, sez8, std81, discStr, istituto, term, eta);

  const notaLabel = grado === 'infanzia'
    ? 'Nota Metodologica per il team di sezione'
    : 'Nota Metodologica per il Consiglio di Classe / Team dei docenti';

  const notaDesc = grado === 'infanzia'
    ? `Indicazioni pratiche su: mediazione delle esperienze di gioco e apprendimento nei campi di esperienza, sviluppo dell'indipendenza (routine visive, sequenze operative), inclusione nel gruppo sezione. Esempi per almeno 3 dei 5 campi di esperienza.`
    : `⚠️ ATTENZIONE: NON ripetere né riepilogare il contenuto della Sezione 8.2 (le discipline e i loro adattamenti sono già indicati lì — non riscrivere quella lista).
Offri invece 4-5 PRINCIPI GENERALI di didattica speciale SPECIFICI per il profilo di QUESTO studente, basandoti sulle sue caratteristiche ICF (punti di forza, aree di sviluppo, stile di apprendimento rilevato). Usa i principi pertinenti tra questi (non elencarli tutti meccanicamente):
- Apprendimento concreto/esperienziale e ancoraggio a interessi motivanti
- Strutturazione visiva dello spazio e del tempo (agende visive, Time-Timer, organizzatori grafici)
- Task-analysis per la scomposizione di compiti complessi in sotto-passi
- Scaffolding graduale con riduzione progressiva del supporto (fading)
- Cooperative learning e tutoring tra pari come leva inclusiva
- Rinforzo positivo, auto-monitoraggio e strategie metacognitive
- UDL (Universal Design for Learning): multiple rappresentazioni, azioni, espressioni
Collega ogni principio alle caratteristiche specifiche di questo studente (es. "data la tendenza all'isolamento nei momenti non strutturati, il cooperative learning…"). Stile narrativo, non elenco puntato rigido. Lunghezza massima: 350 parole.`;

  return `Sei un docente esperto nella redazione del PEI ministeriale italiano (${term.intestazione}).
Stai generando la QUARTA PARTE del PEI: Sezione 8 e Nota Metodologica.

${ctx}

---

${bloccoSez8}

---

## ${notaLabel}

${notaDesc}

---

JSON ICF DA ANALIZZARE:
${jsonData}`;
}

// ── Blocco sezione 8 calibrato per grado ─────────────────────────────────────
function buildSez8Block(grado, sez8, std81, discStr, istituto, term, eta = '') {
  const classe   = calcolaClasse(eta, grado);
  const refProgr = labelProgrammi(grado, istituto);

  if (grado === 'infanzia') {
    return `## Sezione 8 – Interventi sul percorso educativo nei Campi di Esperienza

**${sez8.titolo81}**
${std81}

Per ciascuno dei 5 campi di esperienza scrivi:
**Campo:** Il sé e l'altro | **Attività:** [specificare] | **Strategie e Strumenti:** [specificare]
**Campo:** Il corpo e il movimento | **Attività:** [specificare] | **Strategie e Strumenti:** [specificare]
**Campo:** Immagini, suoni, colori | **Attività:** [specificare] | **Strategie e Strumenti:** [specificare]
**Campo:** I discorsi e le parole | **Attività:** [specificare] | **Strategie e Strumenti:** [specificare]
**Campo:** La conoscenza del mondo | **Attività:** [specificare] | **Strategie e Strumenti:** [specificare]

Nota: ${sez8.noteValutazione}`;
  }

  if (grado === 'primaria') {
    return `## Sezione 8 – Interventi sul percorso curricolare

**${sez8.titolo81}**
${std81}

⚑ OBBLIGATORIO — scrivi questa riga iniziando con "SPEC81:":
SPEC81: [2-4 frasi specifiche per QUESTO studente: distribuzione ore sostegno nelle discipline, raccordo con Sez.5, ruolo assistente]

**8.2 – Progettazione disciplinare**
${sez8.note82}

Per ogni disciplina scrivi una riga che inizia con "DISC:" (OBBLIGATORIO — nessun altro formato):
DISC: [nome disciplina] | [personalizzazioni: obiettivi calibrati sui programmi della ${classe} (${refProgr}), ridotti/semplificati; strategie; verifica; criteri di valutazione]

Esempio corretto:
DISC: Italiano | Testi semplificati, verifiche con supporto visivo, produzione guidata
DISC: Educazione Fisica | Nessuna modifica al programma ordinario

Discipline: ${discStr}

⚑ OBBLIGATORIO — scrivi questa riga iniziando con "CRIT84:" (scegli A o B in base al profilo):
CRIT84: A – stessi criteri della classe

${sez8.noteValutazione}

**Certificazione delle Competenze**
${sez8.certCompetenze}`;
  }

  if (grado === 'sec1') {
    return `## Sezione 8 – Interventi sul percorso curricolare

**${sez8.titolo81}**
${std81}
⚑ OBBLIGATORIO — scrivi questa riga iniziando con "SPEC81:":
SPEC81: [2-4 frasi specifiche per QUESTO studente: ore di sostegno nelle discipline prioritarie, raccordo con Sez.5, ruolo assistente, orientamento al secondo ciclo]

**8.2 – Progettazione disciplinare**
${sez8.note82}

Per ogni disciplina scrivi una riga che inizia con "DISC:" (OBBLIGATORIO — nessun altro formato):
DISC: [nome disciplina] | [A o B] | [personalizzazioni se B; vuoto se A]

Opzione A: Educazione Fisica e Religione. Opzione B: tutte le altre discipline.
Esempio corretto:
DISC: Italiano | B | Testi semplificati, verifiche semplificate con tempi estesi
DISC: Educazione Fisica | A |

Discipline: ${discStr}

⚑ OBBLIGATORIO — scrivi questa riga iniziando con "CRIT84:" (scegli A o B in base al profilo):
CRIT84: A – stessi criteri della classe

${sez8.noteValutazione}

**Certificazione delle Competenze**
${sez8.certCompetenze}`;
  }

  // sec2
  return `## Sezione 8 – Interventi sul percorso curricolare

**${sez8.titolo81}**
${std81}
⚑ OBBLIGATORIO — scrivi questa riga iniziando con "SPEC81:":
SPEC81: [2-4 frasi specifiche per QUESTO studente: distribuzione ore sostegno nelle discipline${istituto ? ' di ' + istituto : ''}, raccordo con Sez.5, ruolo assistente scolastico, orientamento ASL]

**8.2 – Progettazione disciplinare**
${sez8.note82}

Per ogni disciplina scrivi una riga che inizia con "DISC:" (OBBLIGATORIO — nessun altro formato):
DISC: [nome disciplina] | [A, B o C] | [personalizzazioni se B o C; vuoto se A]

Opzione A: Educazione Fisica e Religione (di default). Opzione B: obiettivi differenziati. Opzione C: percorso differenziato (deliberato dal CdC).
Esempio corretto:
DISC: Italiano | B | Testi semplificati, verifiche scritte con supporto visivo, meno temi
DISC: Matematica | B | Esercizi guidati passo-passo, calcolatrice, prove ridotte
DISC: Educazione Fisica | A |

Discipline: ${discStr}

${sez8.percorsoDifferenziato}

**8.3 – ASL – Alternanza Scuola-Lavoro**
Obbligatoria dalla classe III (D.Lgs. 77/2005, come mod. dalla L. 107/2015).

**Tipologia percorso:** □ A – Aziendale  □ B – Scolastico  □ C – Altra tipologia
**Ente / Azienda ospitante:** [specificare]
**Tutor scolastico (interno):** [nome e ruolo]
**Tutor aziendale (esterno):** [nome e ruolo]
**Durata e organizzazione temporale:** [ore totali, periodo]
**Obiettivi di competenza:** [elencare]
**Barriere e facilitatori nel contesto:** [specificare]
**Tipologie di attività:** [specificare]
**Monitoraggio e valutazione:** [metodi e frequenza]
**Osservazioni dello/a studente/essa:** [spazio riservato]

⚑ OBBLIGATORIO — scrivi questa riga iniziando con "CRIT84:" (scegli A o B in base al profilo dello studente):
CRIT84: A – stessi criteri della classe
[se B: CRIT84: B – criteri personalizzati: rispetto delle regole condivise, partecipazione alle attività, collaborazione con i compagni]

${sez8.noteValutazione}

**Certificazione delle Competenze**
${sez8.certCompetenze}`;
}

export { buildPromptPart1, buildPromptPart2, buildPromptPart3, buildPromptPart4 };
