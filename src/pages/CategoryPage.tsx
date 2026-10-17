import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { paths } from '../app/paths';
import { DriverRow, TeamCard } from '../components/cards';
import { CategoryHeader } from '../components/CategoryHeader';
import { BioCard, HowItWorksCard } from '../components/pit';
import { RaceSpotlight } from '../components/RaceSpotlight';
import { Button, EmptyState, FactList, ListGroup, PillStrip, SectionTitle } from '../components/ui';
import { completedRounds, totalRounds } from '../lib/categories-meta';
import { driversOfTeam } from '../lib/entities';
import { useT } from '../lib/i18n';
import { completedRacesDesc, nextRace } from '../lib/season';
import { useNow } from '../lib/useNow';
import { useCategory } from '../state/live-data';
import { useScrollTopOn } from '../lib/hooks';

const DRIVERS_PREVIEW = 12;

export default function CategoryPage() {
  const { categoryId } = useParams();
  useScrollTopOn(categoryId ?? '');
  const { t, lang } = useT();
  const category = useCategory(categoryId);
  const now = useNow(30_000);
  const [classFilter, setClassFilter] = useState('all');
  const [showAllDrivers, setShowAllDrivers] = useState(false);

  const classes = useMemo(() => Array.from(new Set((category?.teams ?? []).map((team) => team.class).filter((c): c is string => Boolean(c)))), [category]);

  if (!category) {
    return (
      <div className="px-margin lg:px-0 pt-6">
        <EmptyState title={t('cat.notFound')} action={<Button to={paths.categories}>{t('cats.seeAll')}</Button>} />
      </div>
    );
  }

  const race = nextRace(category.calendar, now) ?? completedRacesDesc(category.calendar)[0];
  const teams = category.teams.filter((team) => classFilter === 'all' || team.class === classFilter);
  const drivers = showAllDrivers ? category.drivers : category.drivers.slice(0, DRIVERS_PREVIEW);
  const description = lang === 'en' ? category.enLongDescription ?? category.longDescription : category.longDescription;
  const short = lang === 'en' ? category.enDescription ?? category.description : category.description;
  const rules = category.rulesFormat ?? [];

  return (
    <div className="px-margin lg:px-0 pb-12 page-in">
      <CategoryHeader category={category} current="overview" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] items-start mt-6">
        <div className="space-y-4 min-w-0">
          {race && (
            <Link to={paths.race(category.id, race.id)} className="block group" aria-label={race.name}>
              <RaceSpotlight race={race} categoryId={category.id} now={now} className="group-hover:border-white/35 transition-colors" />
            </Link>
          )}
          {short && <p className="type-body-lg text-silver max-w-[68ch]">{short}</p>}
        </div>

        <div className="space-y-4">
          <FactList
            items={[
              { label: t('cat.teams'), value: category.teams.length || '—' },
              { label: t('cat.drivers'), value: category.drivers.length || '—' },
              { label: t('cat.rounds'), value: totalRounds(category) || '—' },
              { label: t('cat.completed'), value: completedRounds(category) },
            ]}
          />
          {rules.length > 0 && <HowItWorksCard to={paths.rules(category.id)} title={t('rules.entryTitle')} subtitle={t('rules.entrySubtitle', { name: category.name })} />}
          {category.id === 'f1' && (
            <Button to={paths.champions} variant="secondary" className="w-full">
              <Crown className="w-4 h-4" /> {t('cat.champions')}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-8 space-y-10 lg:space-y-0">
        <section className="lg:col-span-7 space-y-4">
          <SectionTitle right={t('cat.count', { n: teams.length })}>{t('cat.teams')}</SectionTitle>
          {classes.length > 1 && (
            <PillStrip
              options={[{ value: 'all', label: t('home.all') }, ...classes.map((c) => ({ value: c, label: c }))]}
              value={classFilter}
              onChange={setClassFilter}
            />
          )}
          {teams.length === 0 ? (
            <p className="type-body-md text-silver py-4">{t('cat.noTeams')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 items-start">
              {teams.map((team) => (
                <TeamCard key={team.id} category={category} team={team} drivers={driversOfTeam(category, team)} />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 space-y-4">
          <SectionTitle right={t('cat.count', { n: category.drivers.length })}>{t('cat.drivers')}</SectionTitle>
          {category.drivers.length === 0 ? (
            <p className="type-body-md text-silver py-4">{t('cat.noDrivers')}</p>
          ) : (
            <>
              <ListGroup>
                {drivers.map((driver) => (
                  <DriverRow key={driver.id} category={category} driver={driver} team={category.teams.find((team) => team.id === driver.teamId)} />
                ))}
              </ListGroup>
              {category.drivers.length > DRIVERS_PREVIEW && (
                <Button variant="secondary" className="w-full" onClick={() => setShowAllDrivers((v) => !v)}>
                  {showAllDrivers ? t('common.showLess') : t('hub.showAllDrivers', { n: category.drivers.length })}
                </Button>
              )}
            </>
          )}
        </section>
      </div>

      {description && (
        <section className="mt-12 space-y-4">
          <SectionTitle>{t('cat.about')}</SectionTitle>
          <BioCard text={description} />
        </section>
      )}
    </div>
  );
}
