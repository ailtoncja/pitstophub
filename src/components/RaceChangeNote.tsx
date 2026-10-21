import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '../app/paths';
import { racePlace, raceTitle, type Lang } from '../lib/format';
import { useT, type TParams } from '../lib/i18n';
import { joinNames, type RaceChange } from '../lib/race-changes';
import type { Race } from '../types';

type T = (key: string, params?: TParams) => string;

const MARK = '\u0000';

function templateKey(change: Exclude<RaceChange, { kind: 'noReplacement' }>): string {
  if (change.kind === 'replacedBy') return change.relocated ? 'cir.movedTo' : 'cir.replacedBy';
  if (change.relocated) return 'cir.movedFrom';
  return change.races.length > 1 ? 'cir.replacesMany' : 'cir.replaces';
}

// Etapa transferida mantem o nome do evento: o que muda e o lugar, entao o link mostra o lugar.
const labelOf = (race: Race, relocated: boolean, lang: Lang) => (relocated ? racePlace(race, lang) : raceTitle(race, lang));

/** Texto corrido (sem links), para as linhas do calendario: "substituída por A e B", "sem substituta"... */
export function raceChangeText(change: RaceChange, t: T, lang: Lang): string {
  if (change.kind === 'noReplacement') return t('cir.noReplacement');
  const names = joinNames(change.races.map((race) => labelOf(race, change.relocated, lang)), t('common.and'));
  return t(templateKey(change), { names });
}

/**
 * A mesma frase com cada etapa citada virando link para a pagina dela (id do catalogo; a pagina redireciona para o
 * id ao vivo). Na etapa cancelada termina com "→", que aponta para a substituta.
 */
export function RaceChangeNote({ change, categoryId }: { change: RaceChange; categoryId: string }) {
  const { t, lang } = useT();
  if (change.kind === 'noReplacement') return <>{t('cir.noReplacement')}</>;
  const [before, after = ''] = t(templateKey(change), { names: MARK }).split(MARK);
  const and = t('common.and');
  const links: ReactNode[] = change.races.map((race, index) => {
    const separator = index === 0 ? '' : index === change.races.length - 1 ? ` ${and} ` : ', ';
    return (
      <Fragment key={race.id}>
        {separator}
        <Link
          to={paths.race(categoryId, race.id)}
          className="text-white font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors"
        >
          {labelOf(race, change.relocated, lang)}
        </Link>
      </Fragment>
    );
  });
  return (
    <>
      {before}
      {links}
      {after}
      {change.kind === 'replacedBy' && <span aria-hidden> →</span>}
    </>
  );
}
