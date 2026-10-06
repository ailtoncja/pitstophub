import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, BellRing, CalendarDays, ChevronDown, Crown, ListOrdered, Check, Plus } from 'lucide-react';
import { paths } from '../app/paths';
import { useShell } from '../app/shell-context';
import { DriverRow, TeamCard } from '../components/cards';
import { useToast } from '../components/Toast';
import { EmptyState, ListGroup, PillStrip, SectionTitle, StatTile } from '../components/ui';
import { completedRounds, groupOf, totalRounds } from '../lib/categories-meta';
import { driversOfTeam } from '../lib/entities';
import { raceTitle, raceWhen } from '../lib/format';
import { useT } from '../lib/i18n';
import { nextRace, roundNumber } from '../lib/season';
import { cn } from '../lib/utils';
import { useCategory } from '../state/live-data';
import { useSettings } from '../state/settings';
import { useScrollTopOn } from '../lib/hooks';

const DRIVERS_PREVIEW = 12;

export default function CategoryPage() {
  const { categoryId } = useParams();
  useScrollTopOn(categoryId ?? '');
  const { t, lang } = useT();
  const toast = useToast();
  const shell = useShell();
  const settings = useSettings();
  const category = useCategory(categoryId);
  const [classFilter, setClassFilter] = useState('all');
  const [showAllDrivers, setShowAllDrivers] = useState(false);
  const [openRule, setOpenRule] = useState<number | null>(null);

  const classes = useMemo(() => Array.from(new Set((category?.teams ?? []).map((team) => team.class).filter((c): c is string => Boolean(c)))), [category]);

  if (!category) {
    return (
      <div className="px-margin pt-6">
        <EmptyState title={t('cat.notFound')} action={<Link to={paths.categories} className="px-4 py-1.5 rounded-lg bg-surface-raised text-text-primary type-label-badge uppercase tracking-wider">{t('cats.seeAll')}</Link>} />
      </div>
    );
  }

  const group = groupOf(category.id);
  const following = settings.isFollowingCategory(category.id);
  const next = nextRace(category.calendar);
  const teams = category.teams.filter((team) => classFilter === 'all' || team.class === classFilter);
  const drivers = showAllDrivers ? category.drivers : category.drivers.slice(0, DRIVERS_PREVIEW);
  const description = lang === 'en' ? category.enLongDescription ?? category.longDescription : category.longDescription;
  const short = lang === 'en' ? category.enDescription ?? category.description : category.description;
  const rules = category.rulesFormat ?? [];

  const toggleFollow = () => {
    if (settings.toggleCategory(category.id)) {
      toast.show(following ? t('toast.unfollowed', { name: category.name }) : t('toast.followed', { name: category.name }), { kind: 'ok' });
    }
  };

  return (
    <div className="flex flex-col w-full px-margin pb-10 gap-space-lg page-in">
      <div className="flex items-center justify-between pt-space-sm">
        <Link to={paths.categories} className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary py-1">
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="type-label-telemetry uppercase tracking-wider">{t('nav.categories')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={shell.openAlerts} aria-label={t('app.notifications')} className={cn('w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center active:scale-95 transition-all', following ? 'text-racing-red' : 'text-text-secondary')}>
            {following ? <BellRing className="w-[18px] h-[18px]" /> : <Bell className="w-[18px] h-[18px]" />}
          </button>
          <button type="button" onClick={toggleFollow} aria-pressed={following} className={cn('px-3 h-9 rounded-xl type-label-badge uppercase flex items-center gap-1.5 active:scale-95 transition-all', following ? 'bg-surface-overlay text-racing-red' : 'bg-racing-red text-white')}>
            {following ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {following ? t('common.following') : t('common.follow')}
          </button>
        </div>
      </div>

      <header className="flex flex-col gap-1">
        <span className="type-label-telemetry uppercase tracking-widest text-racing-red font-semibold">{group?.label[lang] ?? t('nav.categories')}</span>
        <h1 className="type-display-hero uppercase text-text-primary">{category.name}</h1>
        <p className="type-body-lg text-text-secondary">{lang === 'en' ? category.enFullName ?? category.fullName : category.fullName}</p>
        {short && <p className="type-body-md text-text-muted mt-1 max-w-2xl">{short}</p>}
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-gutter">
        <div className="rounded-xl bg-surface-container-low p-3"><StatTile label={t('cat.teams')} value={category.teams.length || '—'} /></div>
        <div className="rounded-xl bg-surface-container-low p-3"><StatTile label={t('cat.drivers')} value={category.drivers.length || '—'} /></div>
        <div className="rounded-xl bg-surface-container-low p-3"><StatTile label={t('cat.rounds')} value={totalRounds(category) || '—'} /></div>
        <div className="rounded-xl bg-surface-container-low p-3"><StatTile label={t('cat.completed')} value={completedRounds(category)} accent /></div>
      </div>

      <div className="grid grid-cols-2 gap-space-sm">
        <Link to={paths.calendarOf(category.id)} className="h-11 flex items-center justify-center gap-2 rounded-lg bg-surface-container text-text-primary type-label-badge uppercase tracking-wider hover:bg-surface-variant transition-all">
          <CalendarDays className="w-4 h-4" /> {t('nav.calendar')}
        </Link>
        <Link to={paths.standingsOf(category.id)} className="h-11 flex items-center justify-center gap-2 rounded-lg bg-surface-container text-text-primary type-label-badge uppercase tracking-wider hover:bg-surface-variant transition-all">
          <ListOrdered className="w-4 h-4" /> {t('nav.standings')}
        </Link>
        {category.id === 'f1' && (
          <Link to={paths.champions} className="col-span-2 h-11 flex items-center justify-center gap-2 rounded-lg bg-racing-red text-white type-headline-sm uppercase tracking-wide active:scale-[0.98] transition-all">
            <Crown className="w-4 h-4" /> {t('cat.champions')}
          </Link>
        )}
      </div>

      {next && (
        <section>
          <SectionTitle bar>{t('home.nextStart')}</SectionTitle>
          <Link to={paths.race(category.id, next.id)} className="mt-2 block rounded-xl bg-surface-overlay border border-racing-red/60 glow-red p-space-md hover:bg-surface-raised transition-colors">
            <p className="type-label-telemetry uppercase text-racing-red font-semibold">{t('home.round', { n: roundNumber(category.calendar, next) })}</p>
            <h3 className="type-headline-md uppercase text-text-primary mt-1">{raceTitle(next, lang)}</h3>
            <p className="type-body-sm text-text-muted mt-0.5">{[next.circuit, raceWhen(next, lang)].filter(Boolean).join(' • ')}</p>
          </Link>
        </section>
      )}

      <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg space-y-space-lg lg:space-y-0">
        <section className="lg:col-span-7">
          <SectionTitle bar right={t('cat.count', { n: teams.length })}>{t('cat.teams')}</SectionTitle>
          {classes.length > 1 && (
            <PillStrip
              className="mt-1"
              tone="quiet"
              options={[{ value: 'all', label: t('home.all') }, ...classes.map((c) => ({ value: c, label: c }))]}
              value={classFilter}
              onChange={setClassFilter}
            />
          )}
          {teams.length === 0 ? (
            <p className="type-body-sm text-text-muted py-4">{t('cat.noTeams')}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 mt-2">
              {teams.map((team) => (
                <TeamCard key={team.id} category={category} team={team} drivers={driversOfTeam(category, team)} />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5">
          <SectionTitle bar right={t('cat.count', { n: category.drivers.length })}>{t('cat.drivers')}</SectionTitle>
          {category.drivers.length === 0 ? (
            <p className="type-body-sm text-text-muted py-4">{t('cat.noDrivers')}</p>
          ) : (
            <>
              <ListGroup className="mt-2">
                {drivers.map((driver) => (
                  <DriverRow key={driver.id} category={category} driver={driver} team={category.teams.find((team) => team.id === driver.teamId)} />
                ))}
              </ListGroup>
              {category.drivers.length > DRIVERS_PREVIEW && (
                <button type="button" onClick={() => setShowAllDrivers((v) => !v)} className="w-full mt-2 py-2.5 rounded-lg text-text-muted hover:text-text-primary type-label-badge uppercase tracking-wider transition-all">
                  {showAllDrivers ? t('common.showLess') : t('st.showAll', { n: category.drivers.length })}
                </button>
              )}
            </>
          )}
        </section>
      </div>

      {(description || rules.length > 0) && (
        <section className="space-y-space-sm">
          <SectionTitle bar>{t('cat.about')}</SectionTitle>
          {description && <p className="type-body-md text-text-secondary max-w-3xl">{description}</p>}
          {rules.length > 0 && (
            <div className="rounded-xl bg-surface-container-low divide-y divide-surface-container-high overflow-hidden max-w-3xl">
              {rules.map((rule, index) => {
                const open = openRule === index;
                return (
                  <div key={rule.title}>
                    <button type="button" onClick={() => setOpenRule(open ? null : index)} aria-expanded={open} className="w-full flex items-center justify-between gap-3 px-space-md py-3.5 text-left">
                      <span className="type-headline-sm uppercase text-text-primary">{lang === 'en' ? rule.enTitle ?? rule.title : rule.title}</span>
                      <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform shrink-0', open && 'rotate-180')} />
                    </button>
                    {open && <p className="px-space-md pb-4 type-body-md text-text-secondary">{lang === 'en' ? rule.enBody ?? rule.body : rule.body}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
