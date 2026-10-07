import { describe, expect, it } from 'vitest';
import { splitBio } from './bio';

const HAMILTON =
  'Lewis Hamilton estreou na Fórmula 1 pela McLaren em 2007 e conquistou sete títulos mundiais (2008, 2014, 2015, 2017, 2018, 2019 e 2020), o maior número da história da categoria. Somando 106 vitórias, 207 pódios e 104 poles na carreira, mudou-se para a Ferrari em 2025. Após um início difícil na nova equipe, voltou a subir ao pódio em 2026 na China, no Canadá e em Mônaco, e conquistou sua primeira vitória pela Ferrari na primeira edição do GP de Barcelona-Catalunya. Até a etapa da Hungria de 2026, terminou em 5º lugar na corrida mais recente após uma penalidade de cinco segundos por excesso de velocidade no pit lane.';

describe('splitBio', () => {
  it('a primeira frase vira destaque e o resto vai em parágrafos curtos', () => {
    const bio = splitBio(HAMILTON);
    expect(bio.lead.startsWith('Lewis Hamilton estreou')).toBe(true);
    expect(bio.lead.endsWith('da categoria.')).toBe(true);
    expect(bio.paragraphs.length).toBeGreaterThanOrEqual(2);
    // nada se perde: destaque + parágrafos reconstroem o texto original
    expect([bio.lead, ...bio.paragraphs].join(' ')).toBe(HAMILTON);
  });

  it('abreviações e números não quebram a frase', () => {
    const bio = splitBio('O Dr. Silva correu em 1.5 mil voltas pela Lotus. Depois foi para a Ferrari.');
    expect(bio.lead).toBe('O Dr. Silva correu em 1.5 mil voltas pela Lotus.');
    expect(bio.paragraphs).toEqual(['Depois foi para a Ferrari.']);
  });

  it('uma frase só fica sem parágrafos, e texto vazio não quebra', () => {
    expect(splitBio('  Uma frase só.  ')).toEqual({ lead: 'Uma frase só.', paragraphs: [] });
    expect(splitBio('   ')).toEqual({ lead: '', paragraphs: [] });
  });
});
