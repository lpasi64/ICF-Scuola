// pei-prompt.js
// Porting ESM di server/prompt.js (progetto "Generatore PEI", G:\Il mio Drive\ICF_Scuola\PEI con Claude)
// Nessuna modifica di logica — solo require/module.exports -> import/export.

import { getConfig, getOrdinamentoSec2, TERMINE_VALUTAZIONE } from './pei-gradi.js';
import { tabellaSez2PerPrompt, esitiPerPrompt } from './pei-dimensioni.js';
import { getProgrammiPerDiscipline, getNucleiPerDiscipline, formattaNucleiPerPrompt, LICEI_2010_MIGRATI, riferimentoLiceo } from './pei-programmi.js';

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
function labelProgrammi(grado, istituto, eta = null) {
  if (grado === 'infanzia')  return 'Indicazioni Nazionali per il curricolo 2025 (D.M. 221/2025) – traguardi di sviluppo';
  if (grado === 'primaria')  return 'Indicazioni Nazionali per il curricolo 2025 (D.M. 221/2025) – scuola primaria';
  if (grado === 'sec1')      return 'Indicazioni Nazionali per il curricolo 2025 (D.M. 221/2025) – scuola secondaria di primo grado';
  if (!istituto)             return 'Linee Guida per il secondo ciclo (DPR 15/03/2010)';
  if (LICEI_2010_MIGRATI.has(istituto)) return `${riferimentoLiceo(istituto).etichetta} – ${istituto}`;
  if (istituto.startsWith('Liceo')) return `Indicazioni Nazionali per i Licei (DPR 89/2010; bozza nuove Indicazioni MIM 22/04/2026) – ${istituto}`;
  if (istituto.startsWith('IT')) {
    // Tecnici: D.M. 29/2026 dalle classi prime 2026/27 (poi una classe in più ogni anno); DPR 88/2010 per le altre
    return getOrdinamentoSec2(istituto, eta) === 'nuovo'
      ? `Nuovo ordinamento Istituti Tecnici (D.M. 29/2026, All. B e C) – ${istituto}`
      : `Linee Guida Istituti Tecnici (DPR 88/2010) – ${istituto}`;
  }
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
- Soggetto: "${sessoLabel}" (il sesso è noto: MAI forme con la barra come "${term.soggetto}", "Lo/la", "il/la", "del/della")
- Unità scolastica: "${term.sezione}"
- Organo collegiale: "${term.organo}"
- Usa sempre il nome proprio rilevato dal JSON (mai ID numerici); nelle frasi, anche negli obiettivi, nei punti di forza e negli esiti attesi della Sezione 5, apri con il solo nome di battesimo (es. "Giulia", non nome e cognome) e non con "Lo/la ${term.soggetto}"

REGOLE FONDAMENTALI:
1. Sezione 1: ZERO codici ICF, ZERO diagnosi cliniche, linguaggio positivo e narrativo.
2. Ogni "deficit" → "area di sviluppo"; ogni "sostituzione" → "supporto orientato all'autonomia".
3. NON usare placeholder "[...]" — scrivi ogni sezione integralmente.
4. Sezione 8: usa ESATTAMENTE i ${campoLabel} elencati sopra, nessuno di più, nessuno di meno. L'elenco è separato da punto e virgola (";"): alcuni nomi contengono virgole e vanno riportati per intero, come UNA sola voce (mai spezzati in più righe).
5. VIETATO usare "autonomamente", "in modo autonomo", "uso autonomo" per descrivere P=0.
   In ICF "autonomia" indica la capacità intrinseca (qualifier C), non l'assenza di difficoltà in performance.
   Per P=0 usa: "non presenta difficoltà", "performance ottimale", "svolge senza difficoltà".
6. Usa SEMPRE "FSL" (Formazione Scuola-Lavoro) come denominazione nel PEI, mai "PCTO" né "ASL".
   Il percorso, già "PCTO", è stato rinominato "FSL" dalla L. 213/2023 (legge di bilancio 2024).
7. NON inventare MAI nomi propri di persone, aziende, enti o strutture (tutor, referenti, docenti, sedi di FSL, ecc.):
   indica solo il ruolo o la tipologia generica (es. "docente referente FSL del Consiglio di classe",
   "azienda del settore meccanico convenzionata con l'istituto"). Se un dato non è desumibile scrivi "da definire".
   Gli unici nomi propri ammessi sono quelli presenti nel JSON (il/la ${term.soggetto}).`;
}

// ── Come leggere il JSON ICF (legenda comune alle Parti 1, 2 e 3) ────────────────────────────────────────
const NOTE_NEL_JSON = `COME LEGGERE IL JSON (chiavi per ogni codice ICF):
- P = performance, C = capacità (0-4; 9 = non applicabile).
- Q = qualificatore: per le funzioni e strutture corporee (b, s) la gravità 0-4; per un fattore ambientale (e) o personale (i) senza area di vita i simboli F++ facilitatore presente ed efficace, F- facilitatore presente ma non sufficiente a compensare i limiti delle capacità, B- barriera: fattore presente ma non necessario, che impedisce di fare in autonomia ciò che l'alunno sa fare, B+ barriera attiva (fattore presente e non efficace), B++ facilitatore necessario ma non presente (se ne ha più di uno uniti da "/" il fattore varia da un'area all'altra).
- A = qualificatori per area di vita dei fattori ambientali (e) e personali (i), con gli stessi simboli di Q: {area: simbolo}. Aree: D1 apprendimento e applicazione delle conoscenze, D2 compiti e richieste generali, D3 comunicazione, D4 mobilità, D5 cura della propria persona, D6 vita domestica, D7 interazioni e relazioni interpersonali, D8 aree di vita principali (scuola, formazione), D9 vita sociale, civile e di comunità. Lo stesso fattore può avere qualificatori diversi in aree diverse (es. i genitori facilitatori nella cura della persona e barriera nella vita domestica): è un'informazione importante, non una contraddizione. Rispetta la differenza per area, senza riassumerla in un giudizio unico. Le note N dei fattori hanno il prefisso dell'area (es. "D5: ...").
- L = descrizione della funzione o struttura corporea.
- N = osservazioni scritte dall'insegnante che conosce l'alunno (testo libero; per i fattori ambientali una per area di vita): sono la fonte più concreta e vanno usate per rendere il testo specifico per l'alunno, senza contraddirle. Non aggiungere dettagli, episodi, luoghi o persone che non compaiono né nei codici né nelle note: se un dato manca scrivi in modo generale o "da definire".
- Le diagnosi o i riferimenti clinici citati nelle note non vanno riportati nella Sezione 1 (regola 1).`;

// ── Analisi ICF (blocco comune a Parte 1 e Parte 2) ──────────────────────────
const ANALISI_ICF = `ANALISI ICF — CALCOLO INTERNO (⚠️ NON RIPORTARE NEL DOCUMENTO):
TASSATIVO: NON scrivere "FASE 1", "FASE 2", né i conteggi numerici nel corpo del PEI.
Usa i risultati solo per determinare quali dimensioni sono VA DEFINITA / OMISSIBILE.
FASE 1 — Censimento: tutti i codici "d" con P e C. Escludi P=9 o vuoto.
FASE 2 — Calcolo per dimensione:
  A – Relazione e Socializzazione: d7*, d9*
  B – Comunicazione e Linguaggio:  d3*
  C – Autonomia e Orientamento:    d2*, d4*, d5*, d6*
  D – Cognitiva e Apprendimento:   d1*, d8*
  Media = ∑P / N (solo codici validi)
  ≥ 1.50 → VA DEFINITA
  < 1.50 con almeno un P≥3 → OMISSIBILE (area di monitoraggio prioritario per il Progetto di Vita: serve per la Sezione 5, non va scritto nella Sezione 2)
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
function buildPromptPart1({ eta, sesso, grado, istituto, jsonData, esitiDim }) {
  const { term, discipline } = getConfig(grado, istituto, eta);
  const discStr    = discipline.join('; ');
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
- ZERO qualificatori: non scrivere F++, F-, B+, B-, B++ né nessuna altra sigla di qualificatore.
- ZERO analisi di barriere e facilitatori — quella appartiene alla Sezione 6, non qui.
- Per le figure familiari usa SOLO linguaggio naturale: se il JSON contiene nomi specifici (es. "mamma", "papà", "nonno Mario") usali; altrimenti scrivi "i genitori", "la famiglia", "i nonni", "il fratello/la sorella" ecc. MAI "famiglia immediata (e310: F++)".
Scrivi una narrativa biografica calda e sintetica (max 120 parole) sul contesto familiare, la rete di supporto affettivo, l'ambiente di vita.

**b) Profilo Biografico, Punti di Forza e Personalità**
[Ritratto identitario: interessi, attitudini, punti di forza, consapevolezza dei propri bisogni. ZERO codici ICF. Usa passioni specifiche trovate nel JSON come "ganci" narrativi.]

---

## Sezione 2 – Dimensioni da definire nel PEI

${tabellaSez2PerPrompt(esitiDim)}

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
[Codici d2*, d4*, d5*, d6*. Sintesi in 3-4 frasi totali. Se OMISSIBILE: 1-2 frasi su elementi rilevanti per il Progetto di Vita.]

**d) Dimensione Cognitiva, Neuropsicologica e dell'Apprendimento**
[Codici d1*, d8*. Sintesi in 3-4 frasi totali.]

---

${NOTE_NEL_JSON}

JSON ICF DA ANALIZZARE:
${jsonData}`;
}

// Parte 2: il JSON comprende anche i fattori ambientali per area di vita, che orientano le strategie degli obiettivi
const FATTORI_NEGLI_OBIETTIVI = `FATTORI AMBIENTALI E OBIETTIVI: il JSON comprende anche i fattori ambientali per area di vita (A). Quando scegli le strategie e i supporti di un obiettivo, considera i fattori dell'area a cui l'obiettivo appartiene (D1 apprendimento, D2 compiti, D3 comunicazione, D4 mobilità, D5 cura della persona, D6 vita domestica, D7 relazioni, D8 scuola e formazione, D9 vita sociale): valorizza i facilitatori efficaci (F++), potenzia quelli presenti ma non sufficienti (F-), intervieni sulle barriere (B+ non efficaci; B-: riduci gradualmente il supporto non necessario per lasciare spazio all'autonomia) e su ciò che manca ma serve (B++). Non scrivere sigle né codici nel testo.`;

// ── PARTE 2: Sezione 5 (obiettivi) ───────────────────────────────────────────
function buildPromptPart2({ eta, sesso, grado, istituto, jsonData, esitiDim }) {
  const { term, discipline } = getConfig(grado, istituto, eta);
  const discStr    = discipline.join('; ');
  const campoLabel = grado === 'infanzia' ? 'campi di esperienza' : 'discipline';
  const ctx        = buildContext({ eta, sesso, grado, istituto }, term, discStr, campoLabel);
  const classe     = calcolaClasse(eta, grado);
  const refProgr   = labelProgrammi(grado, istituto, eta);

  const obiettiviFmt = grado === 'infanzia'
    ? `I traguardi devono fare riferimento alle Indicazioni Nazionali per il curricolo 2025 (D.M. 221/2025) per il ${classe}.`
    : `Calibra gli obiettivi sui programmi della ${classe} (${refProgr}). Usa gli interessi del/della ${term.soggetto} come gancio motivazionale.`;

  return `Sei un docente esperto nella redazione del PEI ministeriale italiano (${term.intestazione}).
Stai generando la SECONDA PARTE del PEI: Sezione 5 (obiettivi educativi e didattici).

${ctx}

${ANALISI_ICF}

---

## Sezione 5 – Obiettivi educativi e didattici

${esitiPerPrompt(esitiDim) ? esitiPerPrompt(esitiDim) + '\n\n' : ''}REGOLA TASSATIVA: scrivi ESATTAMENTE 2 obiettivi per ogni dimensione VA DEFINITA.
Per ogni dimensione OMISSIBILE con almeno un P≥3: scrivi 2 obiettivi orientati al Progetto di Vita.
Tutti i campi di ogni obiettivo sono OBBLIGATORI — non omettere strategie né verifica.

⚠️ NUMERAZIONE TASSATIVA: il primo obiettivo dell'intero documento DEVE chiamarsi "### Obiettivo 1". Numera in modo CONSECUTIVO: 1, 2, 3, 4, 5, 6, 7, 8. Non saltare mai il numero 1. Non ripartire da 1 per ogni dimensione.

⚠️ FORMATO TESTO: usa SOLO **grassetto** per le etichette dei campi (es. **Punto di forza di partenza:**). NON usare *corsivo con asterisco singolo* nel testo. Se devi enfatizzare, usa **grassetto**. Scrivi tutto il resto in testo normale.

⚠️ ORDINE TASSATIVO: presenta le dimensioni nell'ordine A, B, C, D (solo quelle con obiettivi), anche se una dimensione successiva è più compromessa, e numera gli obiettivi di conseguenza: Obiettivo 1 e 2 appartengono alla prima dimensione presente nell'ordine A→D, i successivi alla dimensione seguente.

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

${FATTORI_NEGLI_OBIETTIVI}

${NOTE_NEL_JSON}

JSON ICF DA ANALIZZARE:
${jsonData}`;
}

// ── PARTE 3: Sezioni 6–7 (contesto) ──────────────────────────────────────────
function buildPromptPart3({ eta, sesso, grado, istituto, jsonData }) {
  const { term, discipline } = getConfig(grado, istituto, eta);
  const discStr    = discipline.join('; ');
  const campoLabel = grado === 'infanzia' ? 'campi di esperienza' : 'discipline';
  const ctx        = buildContext({ eta, sesso, grado, istituto }, term, discStr, campoLabel);

  return `Sei un docente esperto nella redazione del PEI ministeriale italiano (${term.intestazione}).
Stai generando la TERZA PARTE del PEI: Sezioni 6–7 (analisi del contesto e interventi ambientali).

${ctx}

---

## Sezione 6 – Osservazioni sul contesto: barriere e facilitatori

Analizza i fattori ambientali e* del JSON, poi descrivi per ogni ambito barriere e facilitatori con intensità.
Legenda: F++ facilitatore presente ed efficace · F- facilitatore presente ma non sufficiente a compensare i limiti delle capacità · B- barriera: fattore presente ma non necessario, che impedisce di fare in autonomia ciò che l'alunno sa fare · B+ barriera attiva (fattore presente e non efficace) · B++ facilitatore necessario ma non presente

RIGORE SUI QUALIFICATORI — ogni sigla va usata solo con il proprio significato, mai come sinonimo di un'altra:
- F++ e F- sono SOLO facilitatori. F- è un facilitatore presente ma non sufficiente a compensare i limiti delle capacità (parzialmente efficace): non è una barriera né un "fattore limitante".
- B- e B+ sono SOLO barriere. B- è un fattore presente ma non necessario che impedisce di fare in autonomia ciò che l'alunno sarebbe in grado di fare (per esempio un aiuto che sostituisce l'alunno): l'intervento è ridurre gradualmente quel supporto. B+ è una barriera attiva: il fattore c'è ma non funziona o ostacola.
- B++ si usa SOLO quando un facilitatore necessario manca del tutto (es. un ausilio o un servizio non disponibile): non è una barriera attiva, è un'assenza da colmare.
- Non attribuire a un fattore un qualificatore che non compare nel suo Q o A del JSON; se un fattore ha qualificatori diversi in aree diverse (A), descrivi la differenza area per area (es. «i genitori sono un facilitatore importante nella cura della persona ma una barriera nella vita domestica») senza inventarne altri. Un'organizzazione o un atteggiamento che limita l'autonomia è una barriera: scrivilo solo se il suo Q o A contiene B- o B+.
- Le aree di vita in cui un fattore è una barriera o è assente (B-, B+, B++) sono quelle su cui puntare nella Sezione 7: indica nelle azioni l'area interessata (es. «nella vita domestica»).

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
Almeno 2 azioni concrete basate sulle barriere B- / B+ e sulle assenze B++ identificate; per B- l'azione è ridurre gradualmente il supporto non necessario.)
**Azione:** [rimozione barriera concreta 1] | **Destinatari:** [chi] | **Tempi:** [quando]
**Azione:** [rimozione barriera concreta 2] | **Destinatari:** [chi] | **Tempi:** [quando]

### Categoria 2 – Introduzione di facilitatori universali
(Interventi che migliorano l'inclusione per l'INTERA classe, non solo per lo studente.
Almeno 2 azioni di design universale per l'apprendimento.)
**Azione:** [facilitatore universale 1 — beneficia tutta la classe] | **Destinatari:** intera classe | **Tempi:** [quando]
**Azione:** [facilitatore universale 2] | **Destinatari:** intera classe | **Tempi:** [quando]

### Categoria 3 – Facilitatori personalizzati
(Supporti e adattamenti specifici per lo studente: ausili, accomodamenti individuali,
figure di supporto. Almeno 2 azioni basate su facilitatori F++ / F- della Sezione 6 (i facilitatori F- sono presenti ma da potenziare).)
**Azione:** [facilitatore personalizzato 1] | **Destinatari:** studente | **Tempi:** [quando]
**Azione:** [facilitatore personalizzato 2] | **Destinatari:** studente | **Tempi:** [quando]

---

${NOTE_NEL_JSON}

JSON ICF DA ANALIZZARE:
${jsonData}`;
}

// ── PARTE 4: Sezione 8 + Nota Metodologica ───────────────────────────────────
function buildPromptPart4({ eta, sesso, grado, istituto, jsonData, dettaglio82 = false, profilo82 = '' }) {
  const { term, sez8, std81, discipline } = getConfig(grado, istituto, eta);
  const discStr    = discipline.join('; ');
  const campoLabel = grado === 'infanzia' ? 'campi di esperienza' : 'discipline';
  const ctx        = buildContext({ eta, sesso, grado, istituto }, term, discStr, campoLabel);
  const bloccoSez8 = buildSez8Block(grado, sez8, std81, discStr, istituto, term, eta, discipline, dettaglio82, profilo82);

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
// Blocco 8.2 esteso (Linee guida PEI, D.I. 153/2023 All. B): contenuti, adattamenti, verifica e valutazione per disciplina.
function buildDisc82Block({ grado, istituto, eta, classe, refProgr, discStr, discipline, profilo82 }) {
  const nuclei = formattaNucleiPerPrompt(getNucleiPerDiscipline(grado, discipline, istituto, eta));
  const sec2 = grado === 'sec2';
  const termine = TERMINE_VALUTAZIONE[grado];
  const opzioni = sec2 ? 'A, B o C' : 'A o B';
  const regolaOpzioni = sec2
    ? `Opzione A: segue la progettazione della classe e gli stessi criteri di valutazione; per le verifiche valgono le personalizzazioni generali della riga VERGEN. Opzione B: personalizzazioni con verifiche identiche o equipollenti a quelle della classe (il percorso conserva la validità per il titolo di studio). NON proporre mai l'opzione C (percorso differenziato): è una scelta eccezionale del Consiglio di classe per impedimenti oggettivi, non per difficoltà di apprendimento; se il profilo sembra richiederla, scrivi B e segnala nella riga SPEC81 "valutare con il Consiglio di classe l'opzione C".`
    : `Opzione A: segue la progettazione della classe e gli stessi criteri di valutazione; per le verifiche valgono le personalizzazioni generali della riga VERGEN. Opzione B: personalizzazioni rispetto alla progettazione della classe. Non esiste l'opzione C.`;
  const campoProve = sec2
    ? `  PROVE: IDENTICHE oppure EQUIPOLLENTI (obbligatorio per ogni B: le prove sono identiche o equipollenti a quelle della classe; è una proposta, l'equipollenza la decide il Consiglio di classe)\n`
    : '';
  const regolaVerif = sec2
    ? `Distingui due casi. (a) Obiettivi analoghi a quelli della classe ma da valutare tenendo conto delle difficoltà aggiuntive (soprattutto nell'esposizione e nella produzione, scritta o orale): scrivi VERIF in modo dettagliato (formato della prova, supporti, tempi, cosa si valuta e cosa no). (b) Obiettivi nettamente diversi (solo con MODO: PROPRIA): VERIF può rinviare alla Sezione 5 ("metodi, criteri e strumenti di verifica indicati per la dimensione X"). Tieni conto della rilevanza della disciplina nell'indirizzo ${istituto || ''}.`
    : `Nel campo VERIF indica il formato delle prove e i supporti specifici della disciplina (consegne semplificate, tempi aggiuntivi, strumenti compensativi).`;
  return `Progettazione disciplinare (8.2) — segui le Linee guida ministeriali sul PEI: contenuti, adattamenti, verifica e criteri di valutazione devono discendere dal PROFILO FUNZIONALE di questo alunno.

${profilo82 || 'PROFILO FUNZIONALE PER LA PROGETTAZIONE DISCIPLINARE: profilo funzionale non disponibile — usa cautela: scegli A per le discipline senza evidenze e non inventare adattamenti.'}

${nuclei ? `NUCLEI TEMATICI NUMERATI per disciplina (riferimento: ${refProgr}). Per i contenuti puoi citare SOLO questi numeri, mai contenuti diversi, e solo i nuclei pertinenti alla classe frequentata (${classe}): salta quelli riferiti ad altri anni o cicli:\n${nuclei}\n` : ''}
⚑ OBBLIGATORIO — PRIMA delle righe DISC scrivi UNA riga che inizia con "VERGEN:" con le modalità di verifica personalizzate valide per TUTTE le discipline (max 40 parole), derivate dalle aree trasversali del profilo (attenzione, stress, scrittura, organizzazione): ad esempio tempi aggiuntivi, verifiche programmate, consegne scritte chiare. Nei campi VERIF delle singole discipline scrivi solo ciò che è specifico di quella disciplina.

Equità: le modalità di verifica non devono penalizzare per barriere legate a metodi e strumenti inadeguati; valuta l'esito rispetto agli obiettivi, non la forma (per esempio non abbassare il voto per errori di ortografia se l'obiettivo è il contenuto).

${regolaOpzioni}

Per ogni disciplina scrivi UNA riga che inizia con "DISC:" (OBBLIGATORIO). Campi separati da " | ", mai il carattere "|" dentro i testi. Ordine: nome disciplina | ${opzioni} | poi solo i campi etichettati pertinenti:
- Opzione A: scrivi solo "DISC: nome | A" (nessun altro campo).
- Opzione B, formula predefinita: "Segue la progettazione didattica della classe tranne questi adattamenti" (il sistema aggiunge la formula). Campi:
  MANT: numeri dei nuclei tematici mantenuti (es. 1,2,4)
  RID: numeri dei nuclei ridotti o semplificati
  ADATT: adattamenti a strategie e metodologie, coerenti con le aree di difficoltà del profilo (max 25 parole)
${campoProve}  VERIF: modalità di verifica specifiche della disciplina (max 25 parole). ${regolaVerif}
  VALUT: criteri di valutazione come prestazioni attese per i livelli (es. "sufficienza con i nuclei 1-2 e supporti; livello alto se autonomo sui nuclei 1-4"); la valutazione formale della ${classe} è espressa in: ${termine}
  SEZ5: dimensione/i della Sezione 5 collegate (A = Relazione, B = Comunicazione, C = Autonomia, D = Cognitiva/Apprendimento)
- Solo se il profilo mostra difficoltà marcate (P3-P4) in almeno due aree collegate alla disciplina: aggiungi "MODO: PROPRIA" e "OBIETT: obiettivi disciplinari previsti e risultati attesi" (progettazione molto diversa da quella della classe); in tutti gli altri casi NON scrivere MODO.

Per ogni B scrivi SEMPRE ADATT, ${sec2 ? 'PROVE, ' : ''}VERIF, VALUT e SEZ5: nessuno di questi campi può mancare, neppure nell'ultima disciplina dell'elenco.
Le difficoltà trasversali (attenzione, stress, comunicazione orale, relazione, organizzazione) NON giustificano da sole l'opzione B: si gestiscono con la riga VERGEN e con la didattica. Scegli B per una disciplina solo se un'area specifica (lettura, scrittura, calcolo, problemi, motricità fine) o una difficoltà trasversale marcata (P3-P4) con impatto diretto su quella disciplina rende necessario modificarne contenuti o prove.

Regole di scelta: scegli B solo per le discipline collegate ad aree con difficoltà nel profilo; non copiare gli stessi adattamenti su tutte le discipline; per le discipline non collegate scrivi A. Se una disciplina non ha nuclei numerati, ometti MANT e RID. Nessun contenuto disciplinare fuori dall'elenco numerato.

Esempio (nomi di discipline e numeri illustrativi):
VERGEN: tempi aggiuntivi nelle prove scritte, verifiche programmate e annunciate, consegne scritte brevi
DISC: Italiano | B | MANT: 1,2 | RID: 3 | ADATT: testi con lessico di base e schemi guida per la produzione | ${sec2 ? 'PROVE: EQUIPOLLENTI | ' : ''}VERIF: ${sec2 ? 'interrogazioni programmate con domande guidate e supporti visivi' : 'consegne brevi, prova suddivisa in parti'} | VALUT: sufficienza sui nuclei 1-2 con supporti | SEZ5: D
DISC: Educazione motoria | A

Discipline (usa ESATTAMENTE questi nomi): ${discStr}`;
}

function buildSez8Block(grado, sez8, std81, discStr, istituto, term, eta = '', discipline = [], dettaglio82 = false, profilo82 = '') {
  const classe   = calcolaClasse(eta, grado);
  const refProgr = labelProgrammi(grado, istituto, eta);
  const programmiBlock = getProgrammiPerDiscipline(grado, discipline, istituto, eta);
  const programmiSection = programmiBlock ? `${programmiBlock}\n\n` : '';
  const disc82 = dettaglio82 && grado !== 'infanzia'
    ? buildDisc82Block({ grado, istituto, eta, classe, refProgr, discStr, discipline, profilo82 })
    : null;
  // testo attuale (formato breve) dei tre gradi, invariato
  const discAttuale = {
    primaria: `Per ogni disciplina scrivi una riga che inizia con "DISC:" (OBBLIGATORIO — nessun altro formato):
DISC: [nome disciplina] | [personalizzazioni]

Per ogni disciplina con personalizzazioni scrivi, nello stesso campo e con queste etichette esatte, tre parti:
  Obiettivi: due modalità, secondo quanto la progettazione si discosta da quella della classe (programmi della ${classe}: ${refProgr}). (a) Se le differenze non sono rilevanti: inizia con "Segue la progettazione didattica della classe tranne questi adattamenti:" ed elenca solo riduzione dei contenuti, semplificazioni o facilitazioni, eventuali obiettivi ridotti. (b) Se la progettazione personalizzata è molto diversa da quella della classe: indica gli obiettivi disciplinari previsti con i risultati attesi, calibrati sul profilo e sulla Sezione 5. Se per quella disciplina gli obiettivi restano quelli della classe e cambiano solo strategie o verifiche, scrivi "comuni a quelli della classe"
  Modalità di verifica: tipo di prova (osservazione sistematica, prova pratica, prova orale guidata, domande chiuse o a scelta multipla, uso di immagini/simboli), supporti, tempi e frequenza
  Criteri di valutazione: riferiti agli obiettivi del PEI (livello di autonomia e di aiuto richiesto, progressi rispetto alla situazione di partenza); la valutazione è espressa con il ${TERMINE_VALUTAZIONE.primaria}
Per le discipline senza modifiche scrivi solo "Nessuna modifica al programma ordinario".
Non definire mai «differenziati» gli obiettivi (nella scuola primaria non esiste il percorso differenziato): usa «ridotti», «semplificati», «individualizzati».

Esempio corretto:
DISC: Italiano | Obiettivi: leggere e comprendere brevi testi di due-tre frasi con il supporto di immagini; Modalità di verifica: prove orali guidate e brevi prove scritte con supporto visivo, tempi estesi, una prova al mese; Criteri di valutazione: livello di autonomia e progressi rispetto agli obiettivi del PEI
DISC: Educazione motoria | Nessuna modifica al programma ordinario

Discipline: ${discStr}`,
    sec1: `Per ogni disciplina scrivi una riga che inizia con "DISC:" (OBBLIGATORIO — nessun altro formato):
DISC: [nome disciplina] | [A o B] | [personalizzazioni se B; vuoto se A]

Opzione A: Educazione Fisica e Religione. Opzione B: tutte le altre discipline.
Per ogni disciplina in opzione B scrivi, nello stesso campo e con queste etichette esatte, tre parti:
  Obiettivi: due modalità, secondo quanto la progettazione si discosta da quella della classe (programmi della ${classe}: ${refProgr}). (a) Se le differenze non sono rilevanti: inizia con "Segue la progettazione didattica della classe tranne questi adattamenti:" ed elenca solo riduzione dei contenuti, semplificazioni o facilitazioni, eventuali obiettivi ridotti. (b) Se la progettazione personalizzata è molto diversa da quella della classe: indica gli obiettivi disciplinari previsti con i risultati attesi, calibrati sul profilo e sulla Sezione 5. Se per quella disciplina gli obiettivi restano quelli della classe e cambiano solo strategie o verifiche, scrivi "comuni a quelli della classe"
  Modalità di verifica: tipo di prova (osservazione sistematica, prova pratica, prova orale guidata, domande chiuse o a scelta multipla, uso di immagini/simboli), supporti, tempi e frequenza
  Criteri di valutazione: riferiti agli obiettivi del PEI (livello di autonomia e di aiuto richiesto, progressi rispetto alla situazione di partenza); la valutazione è espressa con il ${TERMINE_VALUTAZIONE.sec1}
Non definire mai «differenziati» gli obiettivi (nella scuola secondaria di primo grado non esiste il percorso differenziato): usa «ridotti», «semplificati», «individualizzati».
Esempio corretto:
DISC: Italiano | B | Obiettivi: produrre brevi testi guidati su esperienze vissute; Modalità di verifica: verifiche scritte semplificate con tempi estesi e interrogazioni programmate con domande guida; Criteri di valutazione: autonomia e progressi rispetto agli obiettivi del PEI
DISC: Educazione Fisica | A |

Discipline: ${discStr}`,
    sec2: `Per ogni disciplina scrivi una riga che inizia con "DISC:" (OBBLIGATORIO — nessun altro formato):
DISC: [nome disciplina] | [A, B o C] | [personalizzazioni se B o C; vuoto se A]

Opzione A: Scienze Motorie e Sportive e Religione (di default). Opzione B: obiettivi differenziati. Opzione C: percorso differenziato (deliberato dal CdC).
Per l'opzione B specifica sempre, dentro le personalizzazioni, se le verifiche sono identiche o equipollenti rispetto a quelle della classe (obbligatorio).
Per ogni disciplina in opzione C le prove sono NON equipollenti e le personalizzazioni devono contenere, nello stesso campo e con queste etichette esatte, cinque parti:
  Obiettivi: obiettivi differenziati, concreti e osservabili, calibrati sul profilo e sulla Sezione 5 (non sui programmi della classe)
  Strategie e metodologie: strategie e metodologie didattiche adottate (es. tutoring tra pari, task analysis, modeling, apprendimento cooperativo, uso di immagini e simboli), strumenti e figure coinvolte
  Modalità di verifica: tipo di prova (osservazione sistematica, prova pratica, prova orale guidata, domande chiuse o a scelta multipla, uso di immagini/simboli), supporti, tempi, contesto (aula, laboratorio) e frequenza
  Criteri di valutazione: riferiti agli obiettivi del PEI e non ai programmi della classe (livello di autonomia e di aiuto richiesto, progressi rispetto alla situazione di partenza)
  Attività alternativa: l'attività svolta in quelle ore se la disciplina non viene svolta; se è svolta con obiettivi differenziati scrivi "nessuna, la disciplina è svolta con obiettivi differenziati"
Esempio corretto:
DISC: Italiano | B | Testi semplificati, verifiche scritte equipollenti con supporto visivo, meno temi
DISC: Matematica | B | Esercizi guidati passo-passo, calcolatrice, verifiche identiche con tempi estesi
DISC: Storia | C | Obiettivi: riconoscere eventi e personaggi della storia recente tramite immagini; Strategie e metodologie: linee del tempo illustrate, tutoring tra pari e modeling dell'insegnante di sostegno; Modalità di verifica: osservazione sistematica e prova orale guidata con immagini, in aula, con tempi doppi, una prova al quadrimestre; Criteri di valutazione: livello di autonomia raggiunto rispetto agli obiettivi del PEI; Attività alternativa: nessuna, la disciplina è svolta con obiettivi differenziati
DISC: Scienze Motorie e Sportive | A |

Discipline: ${discStr}`,
  };
  const bloccoDisc = programmiSection + (disc82 || discAttuale[grado] || '');

  if (grado === 'infanzia') {
    return `## Sezione 8 – Interventi sul percorso educativo nei Campi di Esperienza

**${sez8.titolo81}**
${std81}

${programmiSection}Per ciascuno dei 5 campi di esperienza scrivi:
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

${bloccoDisc}

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

${bloccoDisc}

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
SPEC81: [2-4 frasi specifiche per QUESTO studente: distribuzione ore sostegno nelle discipline${istituto ? ' di ' + istituto : ''}, raccordo con Sez.5, ruolo assistente scolastico, orientamento FSL]

**8.2 – Progettazione disciplinare**
${sez8.note82}

${bloccoDisc}

${sez8.percorsoDifferenziato}

**8.3 – FSL – Formazione Scuola-Lavoro**
Obbligatoria dalle classi III, IV e V (D.Lgs. 66/2017 art.7 c.2 lett.e; L. 145/2018 art.1 cc.784-787; Decreto Interm. n.153/2023 art.11; percorso rinominato FSL dalla L. 213/2023).

**Tipologia percorso:** □ A – Aziendale  □ B – Scolastico  □ C – Altra tipologia
**Ente / Azienda ospitante:** [tipologia di ente/azienda coerente con l'indirizzo, SENZA nome proprio; se non noto: "da definire"]
**Tutor scolastico (interno):** [solo il ruolo, senza nome e cognome; se non noto: "da definire"]
**Tutor aziendale (esterno):** [solo il ruolo, senza nome e cognome; se non noto: "da definire"]
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
