import {
  ArrowDownToLine,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  FileText,
  Globe,
  HandHeart,
  Home,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  LockKeyhole,
  LogOut,
  Mail,
  MessageSquare,
  Pencil,
  Printer,
  RefreshCw,
  Rocket,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  StickyNote,
  Trash2,
  TriangleAlert,
  UserRound,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { TipoSugerencia } from '../types';

const icons = {
  areas: Building2,
  arrowDown: ArrowDownToLine,
  arrowRight: ArrowRight,
  calendar: CalendarDays,
  check: Check,
  checkCircle: CheckCircle2,
  chevronRight: ChevronRight,
  clock: Clock3,
  copy: Copy,
  dashboard: LayoutDashboard,
  eye: Eye,
  file: FileText,
  globe: Globe,
  heart: HandHeart,
  home: Home,
  inbox: Inbox,
  idea: Lightbulb,
  lock: LockKeyhole,
  logout: LogOut,
  mail: Mail,
  message: MessageSquare,
  edit: Pencil,
  print: Printer,
  refresh: RefreshCw,
  rocket: Rocket,
  save: Save,
  search: Search,
  send: Send,
  settings: Settings,
  shield: ShieldCheck,
  note: StickyNote,
  trash: Trash2,
  warning: TriangleAlert,
  user: UserRound,
  users: Users,
  wrench: Wrench,
  close: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.9,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Component = icons[name];
  return <Component aria-hidden="true" size={size} strokeWidth={strokeWidth} className={className} />;
}

const suggestionIcons: Record<TipoSugerencia, IconName> = {
  sugerencia: 'idea',
  mejora: 'wrench',
  idea: 'rocket',
  reconocimiento: 'heart',
  queja: 'warning',
};

export function SuggestionIcon({ type, size = 17 }: { type: TipoSugerencia; size?: number }) {
  return <Icon name={suggestionIcons[type]} size={size} />;
}
