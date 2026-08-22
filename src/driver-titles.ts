export type DriverTitle = {
  years: number[];
  pt: string;
  en: string;
};

function t(years: number | number[], pt: string, en: string): DriverTitle {
  return { years: Array.isArray(years) ? years : [years], pt, en };
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function untitled(pt: string, en: string): DriverTitle {
  return { years: [], pt, en };
}

export function formatDriverTitleYears(years: number[]): string {
  if (years.length === 0) return '';
  const sorted = [...years].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const next = sorted[i];
    if (i < sorted.length && next === prev + 1) {
      prev = next;
      continue;
    }
    parts.push(start === prev ? String(start) : `${start}–${prev}`);
    start = next;
    prev = next;
  }
  return parts.join(', ');
}

export function countDriverTitles(titles: DriverTitle[]): number {
  return titles.reduce((sum, title) => sum + (title.years.length || 1), 0);
}

const DRIVER_TITLES: Record<string, DriverTitle[]> = {
  'f1:norris': [t(2025, 'Fórmula 1', 'Formula 1')],
  'f1:piastri': [
    t(2021, 'Fórmula 2', 'Formula 2'),
    t(2020, 'Fórmula 3', 'Formula 3'),
  ],
  'f1:verstappen': [t(range(2021, 2024), 'Fórmula 1', 'Formula 1')],
  'f1:leclerc': [
    t(2017, 'Fórmula 2', 'Formula 2'),
    t(2016, 'GP3', 'GP3'),
  ],
  'f1:hamilton': [
    t([2008, 2014, 2015, 2017, 2018, 2019, 2020], 'Fórmula 1', 'Formula 1'),
    t(2006, 'GP2', 'GP2'),
  ],
  'f1:russell': [
    t(2018, 'Fórmula 2', 'Formula 2'),
    t(2017, 'GP3', 'GP3'),
  ],
  'f1:antonelli': [
    t(2023, 'Fórmula Regional Europeia', 'Formula Regional European'),
    t(2022, 'Fórmula 4 Italiana', 'Italian Formula 4'),
    t(2022, 'Fórmula 4 ADAC', 'ADAC Formula 4'),
  ],
  'f1:alonso': [
    t([2005, 2006], 'Fórmula 1', 'Formula 1'),
    t([2018, 2019], 'Mundial de Endurance da FIA', 'FIA World Endurance Championship'),
    t([2018, 2019], '24 Horas de Le Mans', '24 Hours of Le Mans'),
  ],
  'f1:stroll': [t(2016, 'Fórmula 3 Europeia', 'European Formula 3')],
  'f1:gasly': [
    t(2016, 'GP2', 'GP2'),
    t(2013, 'Fórmula Renault Eurocup', 'Formula Renault Eurocup'),
  ],
  'f1:ocon': [
    t(2015, 'GP3', 'GP3'),
    t(2014, 'Fórmula 3 Europeia', 'European Formula 3'),
  ],
  'f1:lindblad': [t(2025, 'Fórmula Regional da Oceania', 'Formula Regional Oceania')],
  'f1:sainz': [t(2014, 'Fórmula Renault 3.5', 'Formula Renault 3.5')],
  'f1:hulkenberg': [
    t(2009, 'GP2', 'GP2'),
    t(2008, 'Fórmula 3 Euro Series', 'Formula 3 Euro Series'),
  ],
  'f1:bortoleto': [
    t(2024, 'Fórmula 2', 'Formula 2'),
    t(2023, 'Fórmula 3', 'Formula 3'),
  ],
  'f1:fittipaldi': [
    t([1972, 1974], 'Fórmula 1', 'Formula 1'),
    t([1989, 1993], '500 Milhas de Indianápolis', 'Indianapolis 500'),
    t(1989, 'CART', 'CART'),
  ],
  'f1:piquet': [
    t([1981, 1983, 1987], 'Fórmula 1', 'Formula 1'),
  ],
  'f1:senna': [
    t([1988, 1990, 1991], 'Fórmula 1', 'Formula 1'),
    t(1983, 'Fórmula 3 Britânica', 'British Formula 3'),
  ],

  'wrc:neuville': [t(2024, 'WRC', 'WRC')],
  'wrc:ogier': [t([2013, 2014, 2015, 2016, 2017, 2018, 2020, 2021, 2025], 'WRC', 'WRC')],
  'wrc:lappi': [
    untitled('WRC2', 'WRC2'),
    untitled('Campeonato Europeu de Rali', 'European Rally Championship'),
    untitled('Campeonato Finlandês de Rali', 'Finnish Rally Championship'),
  ],
  'wrc:sordo': [t(2025, 'Campeonato de Rali de Portugal', 'Portuguese Rally Championship')],
  'wrc:paddon': [t(2025, 'Campeonato Europeu de Rali', 'European Rally Championship')],
  'wrc:pajari': [t(2024, 'WRC2', 'WRC2')],
  'wrc:solberg': [untitled('WRC2', 'WRC2')],
  'wrc:sesks': [t(2023, 'WRC2', 'WRC2')],

  'f1-academy:gademan': [t(2020, 'Karting Slalom Cup (FIA Motorsport Games)', 'Karting Slalom Cup (FIA Motorsport Games)')],

  'dtm:thiim': [
    untitled('WEC GT', 'WEC GT'),
    t(2014, '24 Horas de Le Mans (LM GTE-Am)', '24 Hours of Le Mans (LM GTE-Am)'),
  ],
  'dtm:vanderlinde': [t([2014, 2019], 'ADAC GT Masters', 'ADAC GT Masters')],
  'dtm:wittmann': [t([2014, 2016], 'DTM', 'DTM')],
  'dtm:cairoli': [
    t(2021, '24 Horas de Nürburgring', '24 Hours of Nürburgring'),
    t(2014, 'Porsche Carrera Cup Itália', 'Porsche Carrera Cup Italia'),
  ],
  'dtm:bortolotti': [
    t(2024, 'DTM', 'DTM'),
    untitled('GT World Challenge Europe', 'GT World Challenge Europe'),
  ],
  'dtm:kalender': [t(2024, 'ADAC GT Masters', 'ADAC GT Masters')],
  'dtm:gounon': [
    t([2017, 2022], '24 Horas de Spa', '24 Hours of Spa'),
    t([2020, 2022, 2023], '12 Horas de Bathurst', 'Bathurst 12 Hour'),
    t(2023, '24 Horas de Daytona (GTD Pro)', '24 Hours of Daytona (GTD Pro)'),
  ],
  'dtm:preining': [t(2023, 'DTM', 'DTM')],

  'f2:camara': [t(2025, 'Fórmula 3', 'Formula 3')],
  'f2:miyata': [
    t(2023, 'Super Formula', 'Super Formula'),
    t(2023, 'Super GT', 'Super GT'),
    t(2020, 'Super Formula Lights', 'Super Formula Lights'),
    t([2016, 2017], 'Fórmula 4 Japonesa', 'Japanese Formula 4'),
  ],
  'f2:bilinski': [t(2024, 'Fórmula Regional da Oceania', 'Formula Regional Oceania')],

  'f3:slater-f3': [t(2025, 'Fórmula Regional Europeia', 'Formula Regional European')],
  'f3:colnaghi-f3': [
    t(2025, 'Eurocup-3', 'Eurocup-3'),
    t(2024, 'Fórmula 4 Espanhola', 'Spanish Formula 4'),
  ],
  'f3:taponen-f3': [
    t(2024, 'Fórmula Regional do Oriente Médio', 'Formula Regional Middle East'),
    t(2021, 'Kart mundial OK sênior', 'Karting World Championship (OK Senior)'),
  ],
  'f3:giusti-f3': [t(2022, 'Fórmula 4 Francesa', 'French Formula 4')],
  'f3:kato-f3': [t(2024, 'Fórmula 4 Francesa', 'French Formula 4')],
  'f3:gladysz-f3': [t(2025, 'Eurocup-3 Winter Series', 'Eurocup-3 Winter Series')],
  'f3:deligny-f3': [t(2023, 'Fórmula 4 Espanhola (estreante)', 'Spanish Formula 4 (rookie)')],
  'f3:clerot-f3': [
    t(2022, 'Fórmula 4 Brasileira', 'Brazilian Formula 4'),
    t([2020, 2021], 'Brazil Open Cup (kart)', 'Brazil Open Cup (kart)'),
    t([2018, 2019, 2021], 'Kart Brasília', 'Brasília karting'),
  ],
  'f3:ho-f3': [t(2024, 'Eurocup-3', 'Eurocup-3')],
  'f3:sharp': [
    t(2024, 'GB3', 'GB3'),
    t(2023, 'Fórmula 4 Britânica', 'British Formula 4'),
  ],
  'f3:mclaughlin-f3': [t(2025, 'Fórmula 4 Britânica', 'British Formula 4')],
  'f3:gerrard-xie-f3': [
    t(2022, 'Fórmula 4 Chinesa', 'Chinese Formula 4'),
    t(2022, 'Formula Renault Super Challenge', 'Formula Renault Super Challenge'),
  ],

  'indy:power': [
    t(2022, 'IndyCar', 'IndyCar'),
    t(2018, 'Indy 500', 'Indy 500'),
  ],
  'indy:kirkwood': [
    t(2021, 'Indy Lights', 'Indy Lights'),
    t(2019, 'Indy Pro 2000', 'Indy Pro 2000'),
    t(2018, 'USF2000', 'USF2000'),
  ],
  'indy:ericsson': [t(2022, 'Indy 500', 'Indy 500')],
  'indy:hunterreay': [
    t(2012, 'IndyCar', 'IndyCar'),
    t(2014, 'Indy 500', 'Indy 500'),
  ],
  'indy:dixon-indy': [
    t([2003, 2008, 2013, 2015, 2018, 2020], 'IndyCar', 'IndyCar'),
    t(2008, 'Indy 500', 'Indy 500'),
  ],
  'indy:palou-indy': [t([2021, 2023, 2024], 'IndyCar', 'IndyCar')],
  'indy:hauger': [t(2025, 'Indy NXT', 'Indy NXT')],
  'indy:rossi': [t(2016, 'Indy 500', 'Indy 500')],
  'indy:rasmussen': [t(2023, 'Indy NXT', 'Indy NXT')],
  'indy:castroneves-indy': [t([2001, 2002, 2009, 2021], 'Indy 500', 'Indy 500')],
  'indy:sato': [t([2017, 2020], 'Indy 500', 'Indy 500')],
  'indy:newgarden': [
    t([2017, 2019], 'IndyCar', 'IndyCar'),
    t([2023, 2024], 'Indy 500', 'Indy 500'),
  ],
  'indy:mclaughlin': [t([2018, 2019, 2020], 'Supercars', 'Supercars')],

  'nascar:cindric': [t(2022, 'Daytona 500', 'Daytona 500')],
  'nascar:blaney': [t(2023, 'NASCAR Cup Series', 'NASCAR Cup Series')],
  'nascar:logano': [
    t([2018, 2022], 'NASCAR Cup Series', 'NASCAR Cup Series'),
    t(2015, 'Daytona 500', 'Daytona 500'),
  ],
  'nascar:hamlin': [t([2016, 2019, 2020], 'Daytona 500', 'Daytona 500')],
  'nascar:gibbs': [t(2022, 'NASCAR Xfinity Series', 'NASCAR Xfinity Series')],
  'nascar:larson': [t(2021, 'NASCAR Cup Series', 'NASCAR Cup Series')],
  'nascar:elliott': [t(2020, 'NASCAR Cup Series', 'NASCAR Cup Series')],
  'nascar:keselowski': [t(2012, 'NASCAR Cup Series', 'NASCAR Cup Series')],
  'nascar:svg': [t([2016, 2021, 2022], 'Supercars', 'Supercars')],
  'nascar:mcdowell': [t(2021, 'Daytona 500', 'Daytona 500')],
  'nascar:zanesmith': [t(2022, 'NASCAR Truck Series', 'NASCAR Truck Series')],
  'nascar:adillon': [t(2018, 'Daytona 500', 'Daytona 500')],
  'nascar:austinhill': [t(2023, 'NASCAR Xfinity Series (temporada regular)', 'NASCAR Xfinity Series (regular season)')],
};

export function getDriverTitles(categoryId: string, driverId: string): DriverTitle[] {
  const titles = DRIVER_TITLES[`${categoryId}:${driverId}`] ?? [];
  return [...titles].sort((a, b) => {
    const aYear = a.years.length ? Math.max(...a.years) : 0;
    const bYear = b.years.length ? Math.max(...b.years) : 0;
    return bYear - aYear;
  });
}
