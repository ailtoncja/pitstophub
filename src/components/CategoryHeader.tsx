import { Link } from 'react-router-dom';
import { Bell, BellRing, ChevronsUpDown } from 'lucide-react';
import { paths } from '../app/paths';
import { useShell } from '../app/shell-context';
import { useT } from '../lib/i18n';
import { cn } from '../lib/utils';
import { useSettings } from '../state/settings';
import type { Category } from '../types';
import { useToast } from './Toast';
import { Button, CategoryDataState } from './ui';

export type CategorySection = 'overview' | 'calendar' | 'standings' | 'grid' | 'rules';

/**
 * Cabecalho comum das paginas de uma categoria: nome, estado do dado, seguir e as abas Resumo, Calendario,
 * Classificacao, Grid e Como funciona. A categoria deixa de ser um estado escondido: esta sempre na tela.
 */
export function CategoryHeader({ category, current }: { category: Category; current: CategorySection }) {
  const { t, lang } = useT();
  const toast = useToast();
  const shell = useShell();
  const settings = useSettings();
  const following = settings.isFollowingCategory(category.id);
  const hasRules = (category.rulesFormat?.length ?? 0) > 0;

  const tabs: { key: CategorySection; to: string; label: string }[] = [
    ...(hasRules ? [{ key: 'rules' as const, to: paths.rules(category.id), label: t('cat.tabRules') }] : []),
    { key: 'overview', to: paths.category(category.id), label: t('cat.tabOverview') },
    { key: 'calendar', to: paths.calendarOf(category.id), label: t('nav.calendar') },
    { key: 'standings', to: paths.standingsOf(category.id), label: t('nav.standings') },
    { key: 'grid', to: paths.gridOf(category.id), label: t('nav.grid') },
  ];

  const toggleFollow = () => {
    if (settings.toggleCategory(category.id)) {
      toast.show(following ? t('toast.alertsOff', { name: category.name }) : t('toast.alertsOn', { name: category.name }), { kind: 'alert' });
    }
  };

  return (
    <header className="pt-5 lg:pt-10 space-y-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="type-headline-lg lg:text-[2.25rem] text-white">{lang === 'en' ? category.enFullName ?? category.fullName : category.fullName}</h1>
          <CategoryDataState categoryId={category.id} className="mt-1.5" />
        </div>
        <Button
          variant={following ? 'primary' : 'secondary'}
          onClick={toggleFollow}
          aria-pressed={following}
          aria-label={following ? t('common.following') : t('common.follow')}
          className={cn('shrink-0', following && 'bg-racing-red text-white hover:bg-racing-red/90')}
        >
          {following ? <BellRing className="w-[18px] h-[18px]" /> : <Bell className="w-[18px] h-[18px]" />}
          <span className="hidden sm:inline">{following ? t('common.following') : t('common.follow')}</span>
        </Button>
        <button
          type="button"
          onClick={shell.openMenu}
          aria-label={t('drawer.title')}
          className="lg:hidden w-11 h-11 shrink-0 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10"
        >
          <ChevronsUpDown className="w-[18px] h-[18px]" />
        </button>
      </div>

      <nav aria-label={category.name} className="-mx-margin px-margin lg:mx-0 lg:px-0 flex gap-1 overflow-x-auto no-scrollbar border-b border-hairline">
        {tabs.map((tab) => {
          const active = tab.key === current;
          return (
            <Link
              key={tab.key}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'h-11 px-4 inline-flex items-center shrink-0 type-label-badge text-[0.875rem] border-b-2 -mb-px transition-colors duration-200',
                active ? 'text-white border-white' : 'text-silver border-transparent hover:text-white',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
