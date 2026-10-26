import type { RiskLevel, ScreeningStatus } from "@/features/screenings/types"

export type ProjectStatus = "Active" | "Review"
export type DocumentStatus = "processing" | "ready"

export interface ProjectDocument {
  id: string
  name: string
  size: string
  uploadedAt: string
  status: DocumentStatus
  /** AI-generated summary, produced once the document has been parsed. */
  description?: string
  /** Markdown extraction stored alongside the original file. */
  markdown?: string
  /** Object URL for the original file — only set for documents uploaded this session. */
  fileUrl?: string
}

export interface ProjectScreening {
  id: string
  template: string
  status: ScreeningStatus
  risk: RiskLevel
  score: number
  screenedAt: string
}

export type ActivityType = "created" | "upload" | "parsed" | "screening" | "comment"

export interface ActivityItem {
  id: string
  type: ActivityType
  actor: string
  message: string
  timestamp: string
  /** Comment body — only set for type "comment". */
  body?: string
}

export interface ProjectDetail {
  id: string
  name: string
  status: ProjectStatus
  createdAt: string
  documents: ProjectDocument[]
  screenings: ProjectScreening[]
  activity: ActivityItem[]
}

export interface ProjectSummary {
  id: string
  name: string
}

export interface ProjectDocumentSummary {
  id: string
  name: string
  status: DocumentStatus
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const PROJECT_DETAILS: Record<string, ProjectDetail> = {
  "1": {
    id: "1",
    name: "Strommen 3A",
    status: "Review",
    createdAt: "25 Apr 2026, 16:56",
    documents: [
      {
        id: "d-0", name: "Udbudsprogram_Strommen_3A.pdf", size: "3.4 MB", uploadedAt: "20 Feb 2025", status: "ready",
        description: "Udbudsprogram fra Københavns Kommune for salg af ejendommen — vision, planmæssige og tekniske vilkår samt tidsplan for udbuddet.",
        markdown: "# Udbudsprogram – Strømmen 3A, 2450 København SV\n\n## Introduktion\nKøbenhavns Kommune udbyder ejendommen Strømmen 3A til salg via et pris- og projektudbud. Tilbudsevalueringen lægger vægt på både pris og projektkvalitet. Ejendommen kan bebygges med et samlet etageareal på 35.000-40.000 m² bolig- og erhvervsbyggeri.\n\n## Det sydlige Valby\nEjendommen ligger ved det kommende trafikale knudepunkt København Syd Station, som forventes at betjene ca. 33.000 daglige passagerer fra 2025 og over 44.000 i 2035. Valby er en af Københavns hurtigst voksende bydele med 43 % befolkningstilvækst 2005-2024.\n\n## Vision for projektområdet\nFire visionstemaer skal indarbejdes i tilbudsgivers projekt:\n- Trygt og livligt\n- En del af byen\n- Mangfoldigt\n- Grønt med et lavt CO2-aftryk\n\n## Planmæssige vilkår\nBebyggelsesprocent ca. 185 %. Fordeling: 8.000-16.000 m² bolig (heraf 50 % almene boliger), 12.000 m² plejehjem (ca. 130 plejeboliger), 12.000-16.000 m² erhverv. Bygningshøjde op til 40 m ét sted, ellers maks. 24 m.\n\n## Anlægsforpligtelser\nKøber skal bl.a. anlægge Forplads E mod København Syd Station, byrum mod vejen Strømmen, omlægning af vejen Strømmen, forskønnelse af stitunnel samt krydsombygning ved Ellebjergvej.\n\n## Tidsplan\n- 17. februar 2025: Annoncering af udbud\n- 12. maj 2025: Frist for købstilbud\n- 4. kvartal 2025: Accept af købstilbud\n- Ultimo 2027: Politisk godkendelse af lokalplan\n- 2028-2031: Realisering\n\n## Tilbudsevaluering\nEvalueringen lægger vægt på pris og projektkvalitet, herunder hvor godt projektet realiserer Københavns Kommunes vision og håndterer de tekniske og planmæssige vilkår.",
      },
      {
        id: "d-1", name: "Strommen_3A_miljorapport.pdf", size: "4.2 MB", uploadedAt: "25 Apr 2026", status: "ready",
        description: "Miljørapport der kortlægger jordforurening. Forhøjede værdier af PAH og tungmetaller i det øvre jordlag på tværs af 12 prøvepunkter.",
        markdown: "# Strømmen 3A – Miljørapport\n\n## Forureningsstatus\nPrøvetagning i 12 punkter viser forhøjede værdier af PAH og tungmetaller i det øvre jordlag (0–0,5 m). Koncentrationen overskrider Miljøstyrelsens klasse 4-grænser.\n\n## Anbefaling\nOprensning eller afværgeforanstaltninger bør igangsættes før byggestart.",
      },
      {
        id: "d-2", name: "Geoteknisk_rapport_2024.pdf", size: "2.8 MB", uploadedAt: "25 Apr 2026", status: "ready",
        description: "Geoteknisk rapport med grundforhold, bæreevne og sætningsberegninger for byggegrunden.",
        markdown: "# Geoteknisk rapport 2024\n\n## Grundforhold\nBæredygtige lermasser ned til ca. 12 m. Grundvandsstand registreret på 4,5 m.\n\n## Sætningsberegning\nBeregnet totalsætning estimeret til 25–40 mm — lav risiko ved jævn fundering.",
      },
      {
        id: "d-3", name: "Lokalplan_udkast.pdf", size: "1.1 MB", uploadedAt: "12 May 2026", status: "ready",
        description: "Udkast til ny lokalplan med planformål og bebyggelsesprocent for området.",
        markdown: "# Lokalplan – udkast\n\nDen gældende lokalplan er fra 1997 og er under revision. Dispensation fra bebyggelsesprocenten forventes nødvendig.",
      },
    ],
    screenings: [
      { id: "1", template: "Miljø Screener", status: "Review", risk: "High", score: 38, screenedAt: "2 Jun 2026, 09:45" },
      { id: "2", template: "NCC Standard", status: "Completed", risk: "Medium", score: 61, screenedAt: "28 May 2026, 14:20" },
    ],
    activity: [
      { id: "a-1", type: "created", actor: "Alfred Steensen", message: "created the project", timestamp: "25 Apr 2026, 16:56" },
      { id: "a-2", type: "upload", actor: "Alfred Steensen", message: "uploaded Udbudsprogram_Strommen_3A.pdf, Strommen_3A_miljorapport.pdf and Geoteknisk_rapport_2024.pdf", timestamp: "25 Apr 2026, 17:10" },
      { id: "a-3", type: "parsed", actor: "Riskbase AI", message: "parsed the uploaded documents to Markdown and generated descriptions", timestamp: "25 Apr 2026, 17:14" },
      { id: "a-4", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "28 Apr 2026, 09:20", body: "Har kigget dokumenterne igennem — jordforureningen ser ud til at være den store showstopper her." },
      { id: "a-5", type: "upload", actor: "Alfred Steensen", message: "uploaded Lokalplan_udkast.pdf", timestamp: "12 May 2026, 11:05" },
      { id: "a-6", type: "screening", actor: "Alfred Steensen", message: "ran a screening with NCC Standard — completed, score 0.61", timestamp: "28 May 2026, 14:20" },
      { id: "a-7", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "29 May 2026, 08:40", body: "NCC-skabelonen ser fornuftig ud. Afventer resultatet af miljøscreeningen før vi går videre." },
      { id: "a-8", type: "screening", actor: "Alfred Steensen", message: "ran a screening with Miljø Screener — in review, score 0.38", timestamp: "2 Jun 2026, 09:45" },
      { id: "a-9", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "3 Jun 2026, 10:15", body: "3 dealbreakers på miljøscreeningen. Skal drøftes med teamet, inden vi kan gå videre med projektet." },
    ],
  },
  "2": {
    id: "2",
    name: "Gartnerbyen – Rødovre",
    status: "Active",
    createdAt: "15 Jan 2025, 10:00",
    documents: [
      {
        id: "d-1", name: "Gartnerbyen_VVM_2025.pdf", size: "6.5 MB", uploadedAt: "15 Jan 2025", status: "ready",
        description: "VVM-redegørelse for Gartnerbyen med vurdering af trafik-, støj- og klimaforhold.",
        markdown: "# Gartnerbyen – VVM 2025\n\nVVM-redegørelsen dækker trafikale konsekvenser, støjbelastning og klimatilpasning for det samlede byggefelt.",
      },
      {
        id: "d-2", name: "Byggetilladelse.pdf", size: "0.6 MB", uploadedAt: "18 Jan 2025", status: "ready",
        description: "Byggetilladelse udstedt af kommunen med tilhørende vilkår.",
        markdown: "# Byggetilladelse\n\nKommunen har udstedt byggetilladelse med standardvilkår om støjafskærmning i anlægsfasen.",
      },
      {
        id: "d-3", name: "Trafikanalyse.pdf", size: "3.3 MB", uploadedAt: "22 Jan 2025", status: "ready",
        description: "Trafikanalyse med belastningstal for vejnettet omkring projektet.",
        markdown: "# Trafikanalyse\n\nAnalysen viser moderat stigning i trafikbelastning, inden for vejnettets nuværende kapacitet.",
      },
      {
        id: "d-4", name: "Støjrapport.pdf", size: "2.1 MB", uploadedAt: "25 Jan 2025", status: "ready",
        description: "Støjrapport der dokumenterer overholdelse af grænseværdier for naboejendomme.",
        markdown: "# Støjrapport\n\nStøjredegørelsen viser, at tiltaget overholder Miljøstyrelsens vejledende grænseværdier for alle naboejendomme.",
      },
      {
        id: "d-5", name: "Lokalplan_2024.pdf", size: "1.9 MB", uploadedAt: "27 Jan 2025", status: "ready",
        description: "Gældende lokalplan for området med bestemmelser om anvendelse og bebyggelse.",
        markdown: "# Lokalplan 2024\n\nLokalplanen fastlægger anvendelse til boligformål samt krav til grønne tage og friarealer.",
      },
    ],
    screenings: [
      { id: "3", template: "Miljø Screener", status: "In progress", risk: "Medium", score: 54, screenedAt: "28 Jan 2025, 10:00" },
      { id: "4", template: "NCC Standard", status: "Completed", risk: "Low", score: 78, screenedAt: "15 Jan 2025, 09:30" },
    ],
    activity: [
      { id: "a-1", type: "created", actor: "Alfred Steensen", message: "created the project", timestamp: "15 Jan 2025, 10:00" },
      { id: "a-2", type: "upload", actor: "Alfred Steensen", message: "uploaded Gartnerbyen_VVM_2025.pdf", timestamp: "15 Jan 2025, 10:05" },
      { id: "a-3", type: "parsed", actor: "Riskbase AI", message: "parsed Gartnerbyen_VVM_2025.pdf to Markdown", timestamp: "15 Jan 2025, 10:20" },
      { id: "a-4", type: "screening", actor: "Alfred Steensen", message: "ran a screening with NCC Standard — completed, score 0.78", timestamp: "15 Jan 2025, 14:00" },
      { id: "a-5", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "16 Jan 2025, 09:10", body: "Lav risiko på NCC-skabelonen, ser fornuftigt ud. Afventer miljøscreeningen." },
      { id: "a-6", type: "upload", actor: "Alfred Steensen", message: "uploaded Byggetilladelse.pdf, Trafikanalyse.pdf, Støjrapport.pdf and Lokalplan_2024.pdf", timestamp: "27 Jan 2025, 13:30" },
      { id: "a-7", type: "screening", actor: "Alfred Steensen", message: "ran a screening with Miljø Screener — in progress, score 0.54", timestamp: "28 Jan 2025, 10:00" },
      { id: "a-8", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "29 Jan 2025, 08:15", body: "Trafikanalysen ser fin ud. Afventer resten af miljøscreeningen." },
    ],
  },
  "3": {
    id: "3",
    name: "Christiansvej – Glostrup",
    status: "Active",
    createdAt: "3 Feb 2025, 11:30",
    documents: [
      {
        id: "d-1", name: "Christiansvej_miljoredegoerelse.pdf", size: "3.7 MB", uploadedAt: "3 Feb 2025", status: "ready",
        description: "Miljøredegørelse der konkluderer ren grund uden behov for oprensning.",
        markdown: "# Christiansvej – Miljøredegørelse\n\nV0-kortlægning viser ingen historisk industriaktivitet. Grunden vurderes ren.",
      },
      {
        id: "d-2", name: "Notat_geoteknik_2025.pdf", size: "1.4 MB", uploadedAt: "5 Feb 2025", status: "ready",
        description: "Geoteknisk notat med stabile grundforhold egnet til direkte fundering.",
        markdown: "# Notat – geoteknik 2025\n\nStabilt sandslet ler til 15 m dybde. Egnet til direkte fundering uden pælefundering.",
      },
      {
        id: "d-3", name: "LAR_rapport.pdf", size: "2.0 MB", uploadedAt: "10 Feb 2025", status: "ready",
        description: "LAR-rapport med dimensionering af regnvandshåndtering til skybrudshændelser.",
        markdown: "# LAR-rapport\n\nLAR-løsning med grøft og nedsivning fuldt dimensioneret til 100-årsregn. Kommunegodkendt.",
      },
    ],
    screenings: [
      { id: "5", template: "NCC Standard", status: "Completed", risk: "Low", score: 82, screenedAt: "15 Feb 2025, 11:00" },
      { id: "6", template: "Miljø Screener", status: "Completed", risk: "Medium", score: 65, screenedAt: "3 Feb 2025, 11:30" },
    ],
    activity: [
      { id: "a-1", type: "created", actor: "Alfred Steensen", message: "created the project", timestamp: "3 Feb 2025, 11:30" },
      { id: "a-2", type: "screening", actor: "Alfred Steensen", message: "ran a screening with Miljø Screener — completed, score 0.65", timestamp: "3 Feb 2025, 11:30" },
      { id: "a-3", type: "upload", actor: "Alfred Steensen", message: "uploaded Notat_geoteknik_2025.pdf", timestamp: "5 Feb 2025, 09:00" },
      { id: "a-4", type: "upload", actor: "Alfred Steensen", message: "uploaded LAR_rapport.pdf", timestamp: "10 Feb 2025, 13:20" },
      { id: "a-5", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "11 Feb 2025, 08:45", body: "God nyhed — ingen historisk forurening, og LAR-løsningen er allerede kommunegodkendt." },
      { id: "a-6", type: "screening", actor: "Alfred Steensen", message: "ran a screening with NCC Standard — completed, score 0.82", timestamp: "15 Feb 2025, 11:00" },
      { id: "a-7", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "16 Feb 2025, 09:30", body: "Begge screeninger ser solide ud. Klar til næste fase." },
    ],
  },
  "4": {
    id: "4",
    name: "Kærmindevej – Glostrup",
    status: "Review",
    createdAt: "10 Mar 2025, 09:15",
    documents: [
      {
        id: "d-1", name: "Kaermindevej_foreloebig_vurdering.pdf", size: "2.9 MB", uploadedAt: "10 Mar 2025", status: "ready",
        description: "Foreløbig vurdering der flager kraftig forurening og bløde jordlag som kritiske risici.",
        markdown: "# Kærmindevej – foreløbig vurdering\n\nKraftig V2-forurening med chlorerede opløsningsmidler. Blød tørveholdig aflejring kræver pælefundering.",
      },
      {
        id: "d-2", name: "Miljoehistorik.pdf", size: "1.2 MB", uploadedAt: "12 Mar 2025", status: "ready",
        description: "Historisk gennemgang af tidligere industriel brug af grunden.",
        markdown: "# Miljøhistorik\n\nGrunden har tidligere huset et renseri. Historikken understøtter mistanke om opløsningsmiddelforurening.",
      },
      {
        id: "d-3", name: "NIRAS_forureningsrapport.pdf", size: "5.4 MB", uploadedAt: "14 Mar 2025", status: "ready",
        description: "NIRAS' forureningsrapport med prøveresultater og afværgeestimat.",
        markdown: "# NIRAS – forureningsrapport\n\n8 ud af 10 prøver overskrider grænseværdien for TCE. Oprensningsbudget estimeret til kr. 78–120 mio.",
      },
      {
        id: "d-4", name: "Stoejmaaling.pdf", size: "0.9 MB", uploadedAt: "18 Mar 2025", status: "ready",
        description: "Støjmåling der viser overskridelse af grænseværdier fra både jernbane og vej.",
        markdown: "# Støjmåling\n\nJernbanestøj på 71 dB(A) og vejstøj på 69 dB(A) ved facade — begge overskrider gældende grænseværdier.",
      },
    ],
    screenings: [
      { id: "7", template: "Miljø Screener", status: "Draft", risk: "Critical", score: 21, screenedAt: "25 Feb 2025, 10:00" },
      { id: "8", template: "NCC Standard", status: "Review", risk: "High", score: 44, screenedAt: "10 Mar 2025, 09:15" },
    ],
    activity: [
      { id: "a-1", type: "created", actor: "Alfred Steensen", message: "created the project", timestamp: "10 Mar 2025, 09:15" },
      { id: "a-2", type: "screening", actor: "Alfred Steensen", message: "ran a screening with NCC Standard — in review, score 0.44", timestamp: "10 Mar 2025, 09:15" },
      { id: "a-3", type: "upload", actor: "Alfred Steensen", message: "uploaded Kaermindevej_foreloebig_vurdering.pdf", timestamp: "10 Mar 2025, 09:40" },
      { id: "a-4", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "11 Mar 2025, 08:20", body: "Foreløbig vurdering ser alvorlig ud — kraftig forurening. Skal undersøges nærmere før vi går videre." },
      { id: "a-5", type: "upload", actor: "Alfred Steensen", message: "uploaded Miljoehistorik.pdf and NIRAS_forureningsrapport.pdf", timestamp: "14 Mar 2025, 12:00" },
      { id: "a-6", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "15 Mar 2025, 09:10", body: "NIRAS bekræfter det værste — TCE over grænseværdi i 8 ud af 10 prøver. Dette bliver en dealbreaker-diskussion." },
      { id: "a-7", type: "upload", actor: "Alfred Steensen", message: "uploaded Stoejmaaling.pdf", timestamp: "18 Mar 2025, 10:30" },
      { id: "a-8", type: "comment", actor: "Alfred Steensen", message: "commented", timestamp: "19 Mar 2025, 08:50", body: "Støj også over grænseværdien begge steder. Kræver en beslutning fra ledelsen, før vi fortsætter." },
    ],
  },
}

export const PROJECTS: ProjectSummary[] = Object.values(PROJECT_DETAILS).map(({ id, name }) => ({ id, name }))

export const PROJECT_DOCUMENTS: Record<string, ProjectDocumentSummary[]> = Object.fromEntries(
  Object.values(PROJECT_DETAILS).map((p) => [
    p.id,
    p.documents.map(({ id, name, status }) => ({ id, name, status })),
  ])
)
