import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DRAWN_CIRCUITS } from './circuit-drawings';
import { getRaceCircuitInfo } from './circuit-info';
import { MOTORSPORT_DATA, type Race } from './types';

const race = (over: Partial<Race>): Race => ({ id: 'r', name: '', location: '', circuit: '', date: '2026-06-01', status: 'upcoming', ...over });
const image = (r: Race, categoryId?: string) => getRaceCircuitInfo(r, categoryId)?.trackImage;
const staticRace = (categoryId: string, raceId: string): Race => {
  const found = MOTORSPORT_DATA.find((c) => c.id === categoryId)?.calendar.find((r) => r.id === raceId);
  if (!found) throw new Error(`etapa ${categoryId}/${raceId} nao encontrada`);
  return found;
};

describe('desenhos do OpenStreetMap', () => {
  it('todo desenho publicado existe, passou na verificacao e tem os dados da volta', () => {
    for (const [key, drawn] of Object.entries(DRAWN_CIRCUITS)) {
      expect(drawn.trackImage, key).toBe(`/circuits/${key}.png`);
      expect(existsSync(`public${drawn.trackImage}`), key).toBe(true);
      const verification = JSON.parse(readFileSync(`scripts/circuits/verification/${key}.json`, 'utf-8'));
      expect(verification.pass, key).toBe(true);
      expect(existsSync(`scripts/circuits/data/${key}.json`), key).toBe(true);
      expect(drawn.sources.map, key).toMatch(/^https:\/\//);
      if (drawn.lengthKm != null) expect(drawn.sources.length, key).toMatch(/^https?:\/\//);
      if (drawn.corners != null) expect(drawn.sources.corners, key).toMatch(/^https?:\/\//);
      if (drawn.direction != null) expect(drawn.sources.direction, key).toMatch(/^https?:\/\//);
    }
  });

  it('todo desenho publicado passou em todas as verificacoes (forma <= 2%, extensao <= 3%)', () => {
    for (const key of Object.keys(DRAWN_CIRCUITS)) {
      const v = JSON.parse(readFileSync(`scripts/circuits/verification/${key}.json`, 'utf-8'));
      for (const [check, ok] of Object.entries(v.checks)) expect(ok, `${key} ${check}`).toBe(true);
      expect(v.osm_chamfer_pct, key).toBeLessThanOrEqual(2);
      expect(v.png_chamfer_pct, key).toBeLessThanOrEqual(2);
      expect(Math.abs(v.length_error_pct), key).toBeLessThanOrEqual(3);
    }
  });

  it('os 7 tracados que so ficaram de fora pela regra de 2% estao publicados', () => {
    for (const key of ['charlotte-oval', 'new-hampshire', 'chicagoland', 'markham', 'washington-dc', 'sebring', 'atlanta']) {
      expect(DRAWN_CIRCUITS[key]?.trackImage, key).toBe(`/circuits/${key}.png`);
      const v = JSON.parse(readFileSync(`scripts/circuits/verification/${key}.json`, 'utf-8'));
      expect(Math.abs(v.length_error_pct), key).toBeGreaterThan(2);
      expect(v.pass, key).toBe(true);
    }
  });

  it('todo mapa de qualquer etapa do catalogo existe em public/circuits', () => {
    for (const category of MOTORSPORT_DATA) {
      for (const r of category.calendar) {
        const img = image(r, category.id);
        if (img) expect(existsSync(`public${img}`), `${category.id}/${r.id} ${img}`).toBe(true);
      }
    }
  });

  it('os desenhos do OpenStreetMap levam o credito', () => {
    for (const category of MOTORSPORT_DATA) {
      for (const r of category.calendar) {
        const info = getRaceCircuitInfo(r, category.id);
        if (info?.trackImage && info.trackImage.slice(10, -4) in DRAWN_CIRCUITS) expect(info.osm, r.id).toBe(true);
      }
    }
  });
});

describe('dados do GP so na F1', () => {
  it('a WEC em Spa usa o mapa de Spa, sem voltas nem recorde da F1', () => {
    const info = getRaceCircuitInfo(staticRace('wec', 'spa'), 'wec');
    expect(info?.trackImage).toBe('/circuits/spa.png');
    expect(info?.lengthKm).toBe(7.004);
    expect(info?.laps).toBeUndefined();
    expect(info?.lapRecord).toBeUndefined();
    expect(info?.brakingZones).toBeUndefined();
    expect(getRaceCircuitInfo(staticRace('f1', 'belgium'), 'f1')?.laps).toBe(44);
  });

  it('o WRC nao tem ficha de circuito (Monte-Carlo e rali, nao o circuito de Monaco)', () => {
    expect(getRaceCircuitInfo(staticRace('wrc', 'montecarlo'), 'wrc')).toBeNull();
  });
});

describe('GT World Challenge', () => {
  it('Spa e Monza da GTWC Europe usam os mapas de Spa e Monza', () => {
    expect(image(race({ name: 'CrowdStrike 24 Hours of Spa', circuit: 'CrowdStrike 24 Hours of Spa', location: 'Bélgica', enLocation: 'Belgium' }), 'gtwc-europe')).toBe('/circuits/spa.png');
    expect(image(race({ name: 'Monza', circuit: 'Monza', location: 'Itália', enLocation: 'Italy' }), 'gtwc-europe')).toBe('/circuits/italy.png');
  });
});

describe('lugares com nome parecido', () => {
  it('Homestead-Miami Speedway nao e o autodromo de Miami da F1', () => {
    expect(image(staticRace('nascar', 'homestead'), 'nascar')).not.toBe('/circuits/miami.png');
  });

  it('Petit Le Mans e Lone Star Le Mans nao sao em Le Mans', () => {
    expect(image(staticRace('imsa', 'roadatlanta'), 'imsa')).not.toBe('/circuits/le-mans.png');
    expect(image(staticRace('wec', 'cota'), 'wec')).toBe('/circuits/usa.png');
  });

  it('so o circuito de rua de Washington, D.C. usa o desenho de Washington', () => {
    const kent = race({ name: 'Pacific Raceways', circuit: 'Pacific Raceways', location: 'Kent, Washington' });
    expect(image(kent, 'gtwc-america')).not.toBe('/circuits/washington-dc.png');
  });

  it('a F1 em Las Vegas usa o circuito de rua, a NASCAR nao', () => {
    expect(image(staticRace('f1', 'vegas'), 'f1')).toBe('/circuits/vegas.png');
    expect(image(staticRace('nascar', 'vegas1'), 'nascar')).not.toBe('/circuits/vegas.png');
  });
});

// Amostras de cada categoria, como o catalogo (types.ts) e as fontes ao vivo (synced_races,
// api-motorsports) descrevem as etapas de 2026.
describe('tracado certo por categoria', () => {
  const live = (name: string, circuit: string, location = '', date = '2026-06-01') => race({ name, circuit, location, date });
  const cases: [string, string, Race, string | null][] = [
    // NASCAR
    ['nascar', 'Daytona 500', staticRace('nascar', 'daytona500'), 'daytona-oval'],
    ['nascar', 'Daytona (ao vivo)', live('Daytona', 'Daytona International Speedway', '', '2026-08-29'), 'daytona-oval'],
    ['nascar', 'Brickyard 400', staticRace('nascar', 'indy-brickyard'), 'indianapolis-oval'],
    ['nascar', 'Watkins Glen', staticRace('nascar', 'watkinsglen'), 'watkins-glen-nascar'],
    ['nascar', 'Phoenix', staticRace('nascar', 'phoenix2'), 'phoenix'],
    ['nascar', 'Talladega', live('Talladega', 'Talladega Superspeedway'), 'talladega'],
    ['nascar', 'Texas', staticRace('nascar', 'texas'), 'texas'],
    ['nascar', 'Pocono', staticRace('nascar', 'pocono'), 'pocono'],
    ['nascar', 'Michigan', live('Michigan', 'Michigan International Speedway'), 'michigan'],
    ['nascar', 'Iowa', staticRace('nascar', 'iowa'), 'iowa'],
    ['nascar', 'Nashville', staticRace('nascar', 'nashville-nascar'), 'nashville-superspeedway'],
    ['nascar', 'Homestead', staticRace('nascar', 'homestead'), 'homestead'],
    // NASCAR em COTA usa o National Course (sem desenho verificado): nenhum mapa, nao o da F1.
    ['nascar', 'COTA', staticRace('nascar', 'cota-nascar'), null],
    // Tolerancia de extensao de 3% (antes 2%): Charlotte, New Hampshire, Chicagoland e Atlanta.
    ['nascar', 'Coca-Cola 600', staticRace('nascar', 'charlotte600'), 'charlotte-oval'],
    ['nascar', 'Coca-Cola 600 (ao vivo)', live('Coca-Cola 600', 'Charlotte Motor Speedway', '', '2026-05-24'), 'charlotte-oval'],
    ['nascar', 'Charlotte (outubro, oval em 2026)', staticRace('nascar', 'charlotte-roval'), 'charlotte-oval'],
    ['nascar', 'Bank of America 400 (ao vivo)', live('Bank of America 400', 'Charlotte Motor Speedway', '', '2026-10-11'), 'charlotte-oval'],
    ['nascar', 'Charlotte 2026-10-11 com nome antigo "Roval"', live('Bank of America ROVAL 400', 'Charlotte Motor Speedway ROVAL', '', '2026-10-11'), 'charlotte-oval'],
    ['nascar', 'New Hampshire', staticRace('nascar', 'newhampshire'), 'new-hampshire'],
    ['nascar', 'Dollar Tree 301 (ao vivo)', live('Dollar Tree 301', 'New Hampshire Motor Speedway', '', '2026-08-23'), 'new-hampshire'],
    ['nascar', 'Chicagoland', staticRace('nascar', 'chicagoland'), 'chicagoland'],
    ['nascar', 'eero 400 (ao vivo)', live('eero 400', 'Chicagoland Speedway', '', '2026-07-05'), 'chicagoland'],
    ['nascar', 'Atlanta 1', staticRace('nascar', 'atlanta1'), 'atlanta'],
    ['nascar', 'Atlanta 2', staticRace('nascar', 'atlanta2'), 'atlanta'],
    ['nascar', 'Quaker State 400 (ao vivo)', live('Quaker State 400 Available at Walmart', 'Atlanta Motor Speedway', '', '2026-07-12'), 'atlanta'],
    // IndyCar
    ['indy', 'Indy 500', staticRace('indy', 'indy-500'), 'indianapolis-oval'],
    ['indy', 'GP de Indianapolis (misto)', staticRace('indy', 'indy-road'), 'indianapolis-road'],
    ['indy', 'Indianapolis (misto, ao vivo)', live('Indianapolis (misto)', 'IMS Road Course', 'Indianapolis, Indiana'), 'indianapolis-road'],
    ['indy', 'Indy 500 (ao vivo)', live('Indy 500', 'Indianapolis Motor Speedway', 'Indianapolis, Indiana'), 'indianapolis-oval'],
    ['indy', 'St. Petersburg', live('St. Petersburg', 'Streets of St. Petersburg', 'St. Petersburg, Florida'), 'st-petersburg'],
    ['indy', 'Phoenix', staticRace('indy', 'phoenix'), 'phoenix'],
    ['indy', 'Barber', staticRace('indy', 'barber'), 'barber'],
    ['indy', 'Detroit', staticRace('indy', 'detroit-indy'), 'detroit'],
    ['indy', 'Road America', staticRace('indy', 'road-america-indy'), 'road-america'],
    ['indy', 'Mid-Ohio', live('Mid-Ohio', 'Mid-Ohio Sports Car Course', 'Lexington, Ohio'), 'mid-ohio'],
    ['indy', 'Nashville', staticRace('indy', 'nashville'), 'nashville-superspeedway'],
    ['indy', 'Milwaukee 2', staticRace('indy', 'milwaukee-2'), 'milwaukee'],
    ['indy', 'Long Beach (sem desenho verificado)', staticRace('indy', 'long-beach-indy'), null],
    ['indy', 'Markham', staticRace('indy', 'markham'), 'markham'],
    ['indy', 'Markham (ao vivo)', live('Ontario Honda Dealers Indy at Markham', 'Streets of Markham', '', '2026-08-16'), 'markham'],
    ['indy', 'Washington, D.C.', staticRace('indy', 'washington'), 'washington-dc'],
    ['indy', 'Washington, D.C. (ao vivo)', live('Freedom 250 Grand Prix of Washington DC', 'Streets of Washington', '', '2026-08-23'), 'washington-dc'],
    // IMSA
    ['imsa', 'Rolex 24 (misto, sem desenho verificado)', staticRace('imsa', 'daytona'), null],
    ['imsa', 'Indianapolis', staticRace('imsa', 'indianapolis'), 'indianapolis-road'],
    ['imsa', 'Indianapolis RC (ao vivo)', live('Indianapolis', 'Indianapolis Motor Speedway RC'), 'indianapolis-road'],
    ['imsa', 'Detroit', staticRace('imsa', 'detroit'), 'detroit'],
    ['imsa', 'Road America', staticRace('imsa', 'roadamerica'), 'road-america'],
    ['imsa', 'VIR', live('VIR', 'VIRginia International Raceway'), 'vir'],
    ['imsa', 'Six Hours of The Glen (com o Boot, sem desenho verificado)', staticRace('imsa', 'watkins'), null],
    ['imsa', '12 Horas de Sebring', staticRace('imsa', 'sebring'), 'sebring'],
    ['imsa', 'Twelve Hours of Sebring (ao vivo)', live('74th Annual Mobil 1 Twelve Hours of Sebring', 'Sebring International Raceway', '', '2026-03-21'), 'sebring'],
    // DTM
    ['dtm', 'Lausitzring', live('Lausitzring', 'DEKRA Lausitzring Sprint', 'Alemanha'), 'lausitzring'],
    ['dtm', 'Oschersleben', staticRace('dtm', 'oschersleben'), 'oschersleben'],
    ['dtm', 'Nurburgring (Sprint)', staticRace('dtm', 'nurburgring'), 'nurburgring-sprint'],
    ['dtm', 'Sachsenring', staticRace('dtm', 'sachsenring'), 'sachsenring'],
    ['dtm', 'Hockenheim', staticRace('dtm', 'hockenheimring'), 'hockenheim'],
    ['dtm', 'Norisring (sem desenho verificado)', staticRace('dtm', 'norisring'), null],
    // WEC
    ['wec', 'Le Mans', staticRace('wec', 'lemans'), 'le-mans'],
    ['wec', 'Fuji', staticRace('wec', 'fuji'), 'fuji'],
    // GT World Challenge
    ['gtwc-europe', 'Brands Hatch', live('Brands Hatch', 'Brands Hatch', 'Grã-Bretanha'), 'brands-hatch'],
    ['gtwc-europe', 'Misano', live('Misano', 'Misano', 'Itália'), 'misano'],
    ['gtwc-europe', 'Nurburgring (GP)', live('Nürburgring', 'Nürburgring', 'Alemanha'), 'nurburgring-gp'],
    ['gtwc-europe', 'Portimao', live('Portimao', 'Portimao', 'Portugal'), 'portimao'],
    ['gtwc-america', 'Indianapolis 8 Hour', live('Indianapolis Motor Speedway', 'Indianapolis Motor Speedway', 'Estados Unidos'), 'indianapolis-road'],
    ['gtwc-america', 'Road America', live('Road America', 'Road America'), 'road-america'],
    ['gtwc-america', 'Barber', live('Barber Motorsports Park', 'Barber Motorsports Park'), 'barber'],
    ['gtwc-america', 'Sebring (tracado completo)', live('Sebring International Raceway', 'Sebring International Raceway', '', '2026-05-09'), 'sebring'],
    ['gtwc-asia', 'Fuji', live('Fuji International Speedway (SRO GT PowerTour)', 'Fuji International Speedway (SRO GT PowerTour)', 'Japão'), 'fuji'],
    ['gtwc-asia', 'Okayama', live('Okayama International Circuit (SRO GT PowerTour)', 'Okayama International Circuit (SRO GT PowerTour)', 'Japão'), 'okayama'],
    // Brasil (Endurance Brasil ao vivo; NASCAR Brasil e Porsche Cup em synced_races)
    ['endurance-brasil', 'Goiania', live('Etapa 8 - Três Horas de Goiânia', 'Autódromo Internacional de Goiânia', 'Autódromo Internacional de Goiânia'), 'goiania'],
    ['endurance-brasil', 'etapa 5 (nome Goiania, local Santa Cruz)', live('Etapa 5 - Três Horas de Goiânia', 'Autódromo Internacional de Santa Cruz do Sul', 'Autódromo Internacional de Santa Cruz do Sul'), null],
    ['nascar-brasil', 'Londrina', live('Londrina', '', 'Londrina'), 'londrina'],
    ['porsche-cup', 'Le Mans', live('Le Mans', '', 'Le Mans'), 'le-mans'],
    ['porsche-cup', 'Algarve (Endurance)', live('Algarve (Endurance)', '', 'Algarve'), 'portimao'],
  ];
  it.each(cases)('%s: %s', (categoryId, _label, r, key) => {
    const img = image(r, categoryId);
    if (key === null) expect(img ?? null).toBeNull();
    else expect(img).toBe(`/circuits/${key}.png`);
  });

  it('a F1 em Jeddah tem a ficha do GP; a F2 so o circuito', () => {
    const f1 = getRaceCircuitInfo(staticRace('f1', 'saudi'), 'f1');
    expect(f1?.trackImage).toBe('/circuits/jeddah.png');
    expect(f1?.laps).toBe(50);
    expect(f1?.osm).toBe(true);
    const f2 = getRaceCircuitInfo(staticRace('f2', 'jeddah-f2'), 'f2');
    expect(f2?.trackImage).toBe('/circuits/jeddah.png');
    expect(f2?.laps).toBeUndefined();
  });

  it('GTWC America em COTA usa o tracado completo (o da F1)', () => {
    expect(image(live('Circuit of the Americas', 'Circuit of the Americas'), 'gtwc-america')).toBe('/circuits/usa.png');
  });
});
