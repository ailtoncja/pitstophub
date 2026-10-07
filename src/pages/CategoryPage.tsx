import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Crown, Heart, ListOrdered } from 'lucide-react';
import { paths } from '../app/paths';
import { DriverRow, TeamCard } from '../components/cards';
import { BioCard, CutButton, HowItWorksCard } from '../components/pit';
import { useToast } from '../components/Toast';
import { EmptyState, ListGroup, PillStrip, SectionTitle, StatTile } from '../components/ui';
import { accentOf, completedRounds, groupOf, totalRounds } from '../lib/categories-meta';
import { iconOfCategory } from '../lib/category-icons';
import { driversOfTeam } from '../lib/entities';
import { raceTitle, raceWhen } from '../lib/format';
import { useT } from '../lib/i18n';
import { nextRace, roundNumber } from '../lib/season';
import { cn } from '../lib/utils';
import { useCategory } from '../state/live-data';
import { useSelectedCategory } from '../state/selected-category';
import { useSettings } from '../state/settings';
import { useScrollTopOn } from '../lib/hooks';

const DRIVERS_PREVIEW = 12;

export default function CategoryPage() {
  const { categoryId } = useParams();
  useScrollTopOn(categoryId ?? '');
  const { t, lang } = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const { select } = useSelectedCategory();
  const settings = useSettings();
  const category = useCategory(categoryId);
  const [classFilter, setClassFilter] = useState('all');
  const [showAllDrivers, setShowAllDrivers] = useState(false);

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

  const accent = accentOf(category.id);
  const Icon = iconOfCategory(category.id);
  const open = (to: string) => {
    select(category.id);
    navigate(to);
  };

  return (
    <div className="flex flex-col w-full px-margin pb-10 gap-space-lg page-in">
      <div className="pt-space-sm">
        <Link to={paths.categories} className="inline-flex items-center gap-2 text-primary hover:text-white py-1">
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="type-label-badge uppercase tracking-wider">{t('nav.categories')}</span>
        </Link>
      </div>

      {/* HERO */}
      <header className="relative overflow-hidden rounded-lg border border-hairline" style={{ background: `linear-gradient(135deg, ${accent}73 0%, #15151e 55%, #000 100%)` }}>
        <div className="absolute inset-0 carbon-lines" aria-hidden />
        <div className="relative p-5 space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="type-label-badge uppercase tracking-widest" style={{ color: accent }}>{group?.label[lang] ?? t('nav.categories')}</p>
              <h1 className="type-headline-lg text-[34px] leading-9 uppercase text-white">{category.name}</h1>
              <p className="type-body-md text-on-surface-variant">{lang === 'en' ? category.enFullName ?? category.fullName : category.fullName}</p>
            </div>
            <span className="w-14 h-14 rounded-sm flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${accent}33`, borderColor: `${accent}80` }}>
              <Icon className="w-[30px] h-[30px]" style={{ color: accent }} />
            </span>
          </div>
          {short && <p className="type-body-sm text-on-surface max-w-2xl">{short}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={toggleFollow}
              aria-pressed={following}
              aria-label={following ? t('common.following') : t('common.follow')}
              className={cn('w-10 h-10 rounded-sm flex items-center justify-center border active:scale-95 transition-all', following ? 'bg-primary-container/20 border-primary-container/60 text-primary' : 'bg-surface-container-high border-hairline text-on-surface-variant hover:text-white')}
            >
              <Heart className={cn('w-5 h-5', following && 'fill-current')} />
            </button>
            <span className="type-label-badge uppercase text-on-surface-variant">{following ? t('hub.following') : t('hub.followHint')}</span>
          </div>
        </div>
      </header>

      {rules.length > 0 && <HowItWorksCard to={paths.rules(category.id)} title={t('rules.entryTitle')} subtitle={t('rules.entrySubtitle', { name: category.name })} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={t('cat.teams')} value={category.teams.length || '—'} />
        <StatTile label={t('cat.drivers')} value={category.drivers.length || '—'} />
        <StatTile label={t('cat.rounds')} value={totalRounds(category) || '—'} />
        <StatTile label={t('cat.completed')} value={completedRounds(category)} accent />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => open(paths.calendar)} className="h-12 flex items-center justify-center gap-2 rounded-sm bg-surface-container-high border border-hairline text-on-surface type-label-badge uppercase tracking-wider hover:bg-surface-container-highest transition-colors">
          <CalendarDays className="w-5 h-5 text-primary" /> {t('nav.calendar')}
        </button>
        <button type="button" onClick={() => open(paths.standings)} className="h-12 flex items-center justify-center gap-2 rounded-sm bg-surface-container-high border border-hairline text-on-surface type-label-badge uppercase tracking-wider hover:bg-surface-container-highest transition-colors">
          <ListOrdered className="w-5 h-5 text-primary" /> {t('nav.standings')}
        </button>
        {category.id === 'f1' && (
          <CutButton to={paths.champions} className="col-span-2 w-full">
            <Crown className="w-4 h-4" /> {t('cat.champions')}
          </CutButton>
        )}
      </div>

      {next && (
        <section className="space-y-3">
          <SectionTitle>{t('home.nextRace')}</SectionTitle>
          <Link to={paths.race(category.id, next.id)} className="block rounded-lg bg-asphalt border border-primary/40 p-4 hover:bg-asphalt-alt transition-colors">
            <p className="type-label-badge uppercase text-primary">{t('home.round', { n: roundNumber(category.calendar, next) })}</p>
            <h3 className="type-headline-md uppercase text-white mt-1 line-clamp-2">{raceTitle(next, lang)}</h3>
            <p className="type-label-badge text-on-surface-variant mt-1">{[next.circuit, raceWhen(next, lang)].filter(Boolean).join(' • ')}</p>
          </Link>
        </section>
      )}

      <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg space-y-space-lg lg:space-y-0">
        <section className="lg:col-span-7 space-y-3">
          <SectionTitle right={t('cat.count', { n: teams.length })}>{t('cat.teams')}</SectionTitle>
          {classes.length > 1 && (
            <PillStrip
              tone="quiet"
              options={[{ value: 'all', label: t('home.all') }, ...classes.map((c) => ({ value: c, label: c }))]}
              value={classFilter}
              onChange={setClassFilter}
            />
          )}
          {teams.length === 0 ? (
            <p className="type-body-sm text-on-surface-variant py-4">{t('cat.noTeams')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 items-start">
              {teams.map((team) => (
                <TeamCard key={team.id} category={category} team={team} drivers={driversOfTeam(category, team)} />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 space-y-3">
          <SectionTitle right={t('cat.count', { n: category.drivers.length })}>{t('cat.drivers')}</SectionTitle>
          {category.drivers.length === 0 ? (
            <p className="type-body-sm text-on-surface-variant py-4">{t('cat.noDrivers')}</p>
          ) : (
            <>
              <ListGroup>
                {drivers.map((driver) => (
                  <DriverRow key={driver.id} category={category} driver={driver} team={category.teams.find((team) => team.id === driver.teamId)} />
                ))}
              </ListGroup>
              {category.drivers.length > DRIVERS_PREVIEW && (
                <button type="button" onClick={() => setShowAllDrivers((v) => !v)} className="w-full py-3 rounded-sm border border-outline-variant text-on-surface-variant hover:text-white type-label-badge uppercase tracking-wider transition-colors">
                  {showAllDrivers ? t('common.showLess') : t('hub.showAllDrivers', { n: category.drivers.length })}
                </button>
              )}
            </>
          )}
        </section>
      </div>

      {description && (
        <section className="space-y-3 max-w-3xl">
          <SectionTitle>{t('cat.about')}</SectionTitle>
          <BioCard text={description} />
        </section>
      )}
    </div>
  );
}
