import type { Race } from '../types';
import { getRallyInfo } from '../rally-info';
import { RallyCard } from './RallyCard';

/** Ficha do rali da etapa do WRC; carregada sob demanda pela pagina da etapa (os mapas pesam). */
export default function RallySection({ race }: { race: Race }) {
  const info = getRallyInfo(race);
  return info ? <RallyCard info={info} /> : null;
}
