// pei-gradi.js
// Porting ESM di server/gradi.js (progetto "Generatore PEI", G:\Il mio Drive\ICF_Scuola\PEI con Claude)
// Nessuna modifica di logica — solo require/module.exports -> import/export.

/**
 * Configurazione per grado scolastico.
 * Determina: terminologia, struttura sezione 8, campi di esperienza/discipline.
 */

// ── Terminologia per grado ────────────────────────────────────────────────────
const TERMINOLOGIA = {
  infanzia: {
    soggetto:    "bambino/a",
    soggetto_m:  "bambino",
    soggetto_f:  "bambina",
    sezione:     "sezione",
    docenti:     "docenti della sezione",
    organo:      "tutti i docenti della sezione",
    intestazione: "SCUOLA DELL'INFANZIA",
    grado:       "infanzia",
  },
  primaria: {
    soggetto:    "alunno/a",
    soggetto_m:  "alunno",
    soggetto_f:  "alunna",
    sezione:     "classe",
    docenti:     "team dei docenti",
    organo:      "tutto il Team dei docenti",
    intestazione: "SCUOLA PRIMARIA",
    grado:       "primaria",
  },
  sec1: {
    soggetto:    "alunno/a",
    soggetto_m:  "alunno",
    soggetto_f:  "alunna",
    sezione:     "classe",
    docenti:     "consiglio di classe",
    organo:      "tutto il Consiglio di classe",
    intestazione: "SCUOLA SECONDARIA DI PRIMO GRADO",
    grado:       "sec1",
  },
  sec2: {
    soggetto:    "studente/essa",
    soggetto_m:  "studente",
    soggetto_f:  "studentessa",
    sezione:     "classe",
    docenti:     "consiglio di classe",
    organo:      "il Consiglio di classe",
    intestazione: "SCUOLA SECONDARIA DI SECONDO GRADO",
    grado:       "sec2",
  },
};

// ── Testo standard 8.1 (comune a tutti i gradi, adattato) ────────────────────
function testoStandard81(term) {
  if (term.grado === 'infanzia') {
    return `Il docente per il sostegno, in quanto docente della ${term.sezione} e contitolare, può assumere la conduzione educativo-didattica in alcune attività. In sua assenza i colleghi/e (ed eventuali altre figure di assistenza) assicurano il supporto necessario al/alla ${term.soggetto} con disabilità affinché possa partecipare nel miglior modo possibile alle attività proposte, anche avvalendosi della collaborazione dei compagni.
Per tutti i campi di esperienza sarà posta attenzione per un apprendimento significativo e lo sviluppo di competenze spendibili nei contesti di vita, prediligendo, quando possibile, situazioni di gioco e attività laboratoriali.`;
  }
  return `Il docente per il sostegno, in quanto docente della ${term.sezione} e contitolare, può assumere la conduzione didattica in alcune unità di apprendimento. In sua assenza i colleghi/e (ed eventuali altre figure di assistenza) assicurano il supporto necessario all'${term.soggetto} con disabilità affinché possa partecipare nel miglior modo possibile alle attività proposte, anche avvalendosi della collaborazione dei compagni.
Per tutte le aree disciplinari sarà posta attenzione per un apprendimento significativo e lo sviluppo di competenze spendibili nei contesti di vita, prediligendo, quando possibile, compiti di realtà e la didattica laboratoriale.`;
}

// ── Struttura sezione 8 per grado ────────────────────────────────────────────
const STRUTTURA_SEZ8 = {

  infanzia: {
    haProgettazioneDisciplinare: false,
    haASL: false,
    haPercorsoDifferenziato: false,
    haCertificazioneCompetenze: false,
    haValutazioneComportamento: false,
    titolo81: "8.1 – Interventi educativo-didattici, strategie, strumenti nei diversi campi di esperienza",
    desc81: "Modalità di sostegno educativo-didattico e ulteriori interventi di inclusione nei campi di esperienza delle Indicazioni Nazionali per il Curricolo (Il sé e l'altro; Il corpo e il movimento; Immagini, suoni, colori; I discorsi e le parole; La conoscenza del mondo).",
    note82: null,
    noteValutazione: "La valutazione dei traguardi di sviluppo delle competenze previste nei campi di esperienza delle Indicazioni Nazionali è effettuata da tutti i docenti della sezione.",
  },

  primaria: {
    haProgettazioneDisciplinare: true,
    haASL: false,
    haPercorsoDifferenziato: false,
    haCertificazioneCompetenze: true,
    haValutazioneComportamento: true,
    titolo81: "8.1 – Modalità di sostegno didattico e ulteriori interventi di inclusione",
    desc81: "Interventi educativo-didattici, strategie, strumenti nelle diverse discipline/aree disciplinari.",
    opzioni82: ["A – Personalizzazioni rispetto alla progettazione della classe"],
    note82: "Compilare soltanto per le discipline/aree disciplinari per le quali è prevista una progettazione personalizzata. Nella scuola primaria non è previsto il percorso differenziato (opzione C).",
    noteValutazione: "La valutazione finale degli apprendimenti è di competenza di tutto il Team dei docenti.",
    certCompetenze: "Solo per alunni/e in uscita dalle classi quinte (D.M. 742/2017) – Competenze chiave europee e Competenze dal Profilo dello studente al termine del primo ciclo di istruzione.",
  },

  sec1: {
    haProgettazioneDisciplinare: true,
    haASL: false,
    haPercorsoDifferenziato: false,
    haCertificazioneCompetenze: true,
    haValutazioneComportamento: true,
    titolo81: "8.1 – Modalità di sostegno didattico e ulteriori interventi di inclusione",
    desc81: "Interventi educativo-didattici, strategie, strumenti nelle diverse discipline/aree disciplinari. Include indicazioni di orientamento scolastico.",
    opzioni82: [
      "A – Segue la progettazione didattica della classe (stessi criteri di valutazione)",
      "B – Personalizzazioni rispetto alla progettazione della classe",
    ],
    note82: "Compilare soltanto per le discipline/aree disciplinari per le quali è prevista una progettazione personalizzata. Nella scuola secondaria di primo grado non è previsto il percorso differenziato (opzione C).",
    noteValutazione: "La valutazione finale degli apprendimenti è di competenza di tutto il Consiglio di classe.",
    certCompetenze: "Solo per alunni/e in uscita dalle classi terze (D.M. 742/2017) – Competenze chiave europee e Competenze dal Profilo dello studente al termine del primo ciclo di istruzione.",
  },

  sec2: {
    haProgettazioneDisciplinare: true,
    haASL: true,
    haPercorsoDifferenziato: true,
    haCertificazioneCompetenze: true,
    haValutazioneComportamento: true,
    titolo81: "8.1 – Modalità di sostegno didattico e ulteriori interventi di inclusione",
    desc81: "Include indicazioni di orientamento scolastico e raccordo con l'ASL (Alternanza Scuola-Lavoro).",
    opzioni82: [
      "A – Segue la progettazione didattica della classe (stessi criteri di valutazione)",
      "B – Personalizzazioni rispetto alla progettazione della classe (verifiche identiche o equipollenti)",
      "C – Percorso didattico differenziato con verifiche non equipollenti",
    ],
    note82: "Per ogni disciplina indicare l'opzione scelta e, per la B, le personalizzazioni adottate. Il percorso C (differenziato) va esplicitamente deliberato dal Consiglio di classe.",
    noteValutazione: "La valutazione finale degli apprendimenti è di competenza del Consiglio di classe.",
    certCompetenze: "Solo per classi seconde – Certificazione delle competenze relative all'assolvimento dell'obbligo d'istruzione (D.M. 139/2007 e D.M. 9/2010).",
    percorsoDifferenziato: "Lo/a studente/essa segue un percorso didattico di tipo: □ A. ordinario  □ B. personalizzato (con prove equipollenti)  □ C. differenziato",
  },
};

// ── Campi di esperienza (Infanzia) ────────────────────────────────────────────
const CAMPI_ESPERIENZA = [
  "Il sé e l'altro",
  "Il corpo e il movimento",
  "Immagini, suoni, colori",
  "I discorsi e le parole",
  "La conoscenza del mondo",
];

// ── Discipline per grado (Primaria e Sec. 1°) ─────────────────────────────────
const DISCIPLINE_PRIMARIA = [
  "Italiano",
  "Matematica",
  "Storia",
  "Geografia",
  "Scienze",
  "Tecnologia",
  "Musica",
  "Arte e Immagine",
  "Educazione Fisica",
  "Inglese",
  "Religione / Attività alternativa",
];

const DISCIPLINE_SEC1 = [
  "Italiano",
  "Storia",
  "Geografia",
  "Matematica",
  "Scienze",
  "Tecnologia",
  "Musica",
  "Arte e Immagine",
  "Educazione Fisica",
  "Prima Lingua Straniera (Inglese)",
  "Seconda Lingua Straniera",
  "Religione / Attività alternativa",
];

// ── Istituti Sec. 2° grado con discipline ─────────────────────────────────────
const ISTITUTI_SEC2 = {
  "Liceo Classico": [
    "Italiano","Latino","Greco","Geostoria / Storia / Filosofia",
    "Matematica e Fisica","Scienze Naturali","Storia dell'Arte",
    "Lingua Straniera (Inglese)","Educazione Fisica","Religione / Attività alternativa",
  ],
  "Liceo Scientifico": [
    "Italiano","Latino","Storia e Filosofia","Matematica","Fisica",
    "Scienze Naturali","Disegno e Storia dell'Arte","Lingua Straniera (Inglese)",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "Liceo Scientifico – opzione Scienze Applicate": [
    "Italiano","Storia e Filosofia","Matematica","Fisica","Scienze Naturali",
    "Informatica","Disegno e Storia dell'Arte","Lingua Straniera (Inglese)",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "Liceo Scientifico – sezione a indirizzo sportivo": [
    "Italiano","Latino","Storia e Filosofia","Matematica","Fisica",
    "Scienze Naturali","Lingua Straniera (Inglese)",
    "Diritto ed Economia dello Sport","Discipline Sportive",
    "Scienze Motorie e Sportive","Religione / Attività alternativa",
  ],
  "Liceo Linguistico": [
    "Italiano","Prima Lingua Straniera (Inglese)","Seconda Lingua Straniera",
    "Terza Lingua Straniera","Storia e Filosofia","Matematica e Fisica",
    "Scienze Naturali","Storia dell'Arte","Educazione Fisica","Religione / Attività alternativa",
  ],
  "Liceo delle Scienze Umane": [
    "Italiano","Latino","Scienze Umane","Storia e Filosofia",
    "Matematica e Fisica","Scienze Naturali","Storia dell'Arte",
    "Lingua Straniera (Inglese)","Educazione Fisica","Religione / Attività alternativa",
  ],
  "Liceo delle Scienze Umane – opzione economico-sociale": [
    "Italiano","Storia e Filosofia","Scienze Umane (Sociologia e Metodologia della Ricerca)",
    "Matematica","Fisica","Lingua Straniera (Inglese)","Seconda Lingua Straniera",
    "Diritto ed Economia Politica","Educazione Fisica","Religione / Attività alternativa",
  ],
  "Liceo Artistico": [
    "Italiano","Storia e Filosofia","Matematica e Fisica","Scienze Naturali",
    "Lingua Straniera (Inglese)","Storia dell'Arte",
    "Discipline Pittoriche / Plastiche / Geometriche","Laboratorio Artistico",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "Liceo del Made in Italy": [
    "Italiano","Storia e Filosofia","Matematica","Lingua Straniera (Inglese)",
    "Seconda Lingua Straniera","Economia e Diritto",
    "Storia dell'Arte e del Design","Design e Progettazione",
    "Scienze Naturali","Educazione Fisica","Religione / Attività alternativa",
  ],
  "Liceo Musicale e Coreutico": [
    "Italiano","Storia e Filosofia","Matematica e Fisica","Lingua Straniera (Inglese)",
    "Storia della Musica / della Danza",
    "Teoria, Analisi e Composizione / Tecniche della Danza",
    "Esecuzione e Interpretazione / Laboratorio Coreutico",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Amministrazione, finanza e marketing": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Seconda Lingua Straniera","Economia Aziendale",
    "Diritto","Economia Politica","Informatica",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Turismo": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Seconda Lingua Straniera","Terza Lingua Straniera",
    "Discipline Turistiche e Aziendali",
    "Diritto e Legislazione Turistica","Arte e Territorio",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Meccanica, meccatronica ed energia": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Meccanica, Macchine ed Energia","Sistemi e Automazione",
    "Tecnologie Meccaniche di Processo e di Prodotto",
    "Disegno, Progettazione e Organizzazione Industriale",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Trasporti e logistica": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze della Navigazione, Struttura e Costruzione del Mezzo",
    "Meccanica e Macchine","Logistica",
    "Diritto e Legislazione Nautica",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Elettronica ed elettrotecnica": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Elettrotecnica ed Elettronica","Sistemi Automatici",
    "Tecnologie e Progettazione di Sistemi Elettrici ed Elettronici",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Informatica e telecomunicazioni": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Informatica","Sistemi e Reti","Telecomunicazioni",
    "Tecnologie e Progettazione di Sistemi Informatici e di Telecomunicazioni",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Grafica e comunicazione": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Progettazione Multimediale",
    "Tecnologie dei Processi di Produzione",
    "Organizzazione e Gestione dei Processi Produttivi",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Chimica, materiali e biotecnologie": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Chimica Analitica e Strumentale","Chimica Organica e Biochimica",
    "Biologia, Microbiologia e Tecnologie di Controllo Ambientale",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Sistema moda": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Progettazione Tessile-Abbigliamento, Moda e Costume",
    "Tecnologie Applicate ai Materiali e ai Processi Produttivi Tessili",
    "Economia e Marketing nel Sistema Moda",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Agraria, agroalimentare e agroindustria": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Produzioni Vegetali","Produzioni Animali",
    "Trasformazione dei Prodotti","Gestione dell'Ambiente e del Territorio",
    "Economia Agraria e dello Sviluppo Rurale",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IT – Costruzioni, ambiente e territorio": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Progettazione, Costruzioni e Impianti","Topografia",
    "Geopedologia, Economia ed Estimo",
    "Gestione del Cantiere e Sicurezza dell'Ambiente di Lavoro",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Agricoltura, sviluppo rurale, valorizzazione dei prodotti del territorio e gestione delle risorse forestali e montane": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze Integrate","Diritto ed Economia",
    "Scienze e Tecnologie Agrarie","Produzioni Vegetali e Animali",
    "Laboratori Tecnologici ed Esercitazioni",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Pesca commerciale e produzioni ittiche": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze Integrate","Diritto ed Economia",
    "Biologia Marina e Acquacoltura","Tecnologie della Pesca",
    "Laboratori Tecnologici ed Esercitazioni",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Industria e artigianato per il Made in Italy": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze Integrate","Diritto ed Economia",
    "Tecnologie Applicate ai Materiali e ai Processi Produttivi",
    "Progettazione e Rappresentazione Grafica",
    "Laboratori Tecnologici ed Esercitazioni",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Manutenzione e assistenza tecnica": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze Integrate","Diritto ed Economia",
    "Tecnologie Meccaniche, Elettriche ed Elettroniche",
    "Manutenzione di Impianti e Apparati",
    "Laboratori Tecnologici ed Esercitazioni",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Gestione delle acque e risanamento ambientale": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze Integrate","Diritto ed Economia",
    "Tecnologie Ambientali","Gestione e Trattamento delle Acque",
    "Laboratori Tecnologici ed Esercitazioni",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Servizi commerciali": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Seconda Lingua Straniera","Diritto ed Economia",
    "Economia Aziendale","Tecniche di Comunicazione",
    "Informatica e Laboratorio",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Enogastronomia e ospitalità alberghiera": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Seconda Lingua Straniera","Diritto e Tecniche Amministrative",
    "Scienze e Culture dell'Alimentazione",
    "Laboratorio di Cucina / Sala e Vendita / Accoglienza Turistica",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Servizi culturali e dello spettacolo": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze Integrate","Diritto ed Economia",
    "Storia dell'Arte e del Territorio",
    "Tecniche di Comunicazione e Promozione Culturale",
    "Laboratori Tecnologici ed Esercitazioni",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Servizi per la sanità e l'assistenza sociale": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze Integrate","Diritto ed Economia",
    "Psicologia Generale ed Applicata",
    "Igiene e Cultura Medico-Sanitaria",
    "Metodologie Operative","Tecnica Amministrativa ed Economia Sociale",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Arti ausiliarie delle professioni sanitarie: odontotecnico": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze Integrate","Diritto ed Economia",
    "Scienze dei Materiali Dentali","Gnatologia",
    "Rappresentazione e Modellazione Odontotecnica",
    "Esercitazioni di Laboratorio Odontotecnico",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
  "IP – Arti ausiliarie delle professioni sanitarie: ottico": [
    "Italiano","Storia","Matematica","Lingua Straniera (Inglese)",
    "Scienze Integrate","Diritto ed Economia",
    "Fisica Applicata (Ottica)","Optometria",
    "Contattologia","Esercitazioni di Laboratorio di Optometria",
    "Educazione Fisica","Religione / Attività alternativa",
  ],
};

/**
 * Ritorna la configurazione completa per un grado scolastico dato.
 * @param {string} grado  "infanzia" | "primaria" | "sec1" | "sec2"
 * @param {string} [istituto]  solo per sec2
 */
function getConfig(grado, istituto = null) {
  const term   = TERMINOLOGIA[grado];
  const sez8   = STRUTTURA_SEZ8[grado];
  const std81  = testoStandard81(term);

  let discipline = [];
  if (grado === 'infanzia') discipline = CAMPI_ESPERIENZA;
  else if (grado === 'primaria') discipline = DISCIPLINE_PRIMARIA;
  else if (grado === 'sec1') discipline = DISCIPLINE_SEC1;
  else if (grado === 'sec2' && istituto) discipline = ISTITUTI_SEC2[istituto] || [];

  return { term, sez8, std81, discipline, istituti: grado === 'sec2' ? ISTITUTI_SEC2 : null };
}

export {
  TERMINOLOGIA,
  STRUTTURA_SEZ8,
  CAMPI_ESPERIENZA,
  DISCIPLINE_PRIMARIA,
  DISCIPLINE_SEC1,
  ISTITUTI_SEC2,
  testoStandard81,
  getConfig,
};
