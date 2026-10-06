import { CarFront, Flag, Gauge, Mountain, Shield, Timer, Trophy, Zap, type LucideIcon } from 'lucide-react';

/** Icone de cada serie (lucide nao tem capacete; usamos formas que lembram a modalidade). */
const ICONS: Record<string, LucideIcon> = {
  f1: Gauge,
  f2: Gauge,
  f3: Gauge,
  'f1-academy': Trophy,
  indy: Flag,
  nascar: CarFront,
  imsa: Zap,
  wec: Timer,
  dtm: CarFront,
  'gtwc-europe': CarFront,
  'gtwc-america': CarFront,
  'gtwc-asia': CarFront,
  'endurance-brasil': Shield,
  wrc: Mountain,
};

export const iconOfCategory = (categoryId: string): LucideIcon => ICONS[categoryId] ?? Gauge;
