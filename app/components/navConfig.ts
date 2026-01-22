// Centralized nav configuration for scalability
// Each item can later include icon (team logo), description, etc.
export interface NavItem {
  key: string;
  label: string;
  href: string;
  // placeholder for future icon component or image path
  icon?: string; // could become a ReactNode later
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'headlines', label: 'Headlines', href: '/headlines' },
  { key: 'standings', label: 'NFL Standings', href: '/standings' },
  { key: 'schedule', label: 'Schedule', href: '/schedule' }
];
 