// Centralized design tokens and styles for Taash
// This file provides consistent styling across all components

export const colors = {
  // Primary colors
  primaryDark: '#0f172a',
  primaryBlue: '#3b82f6',
  primaryBlueHover: '#2563eb',

  // Background colors
  white: '#ffffff',
  lightBlue: '#dbeafe',
  lighterBlue: '#eff6ff',
  lightestBlue: '#f0f9ff',
  yellowAccent: '#fef9c3',

  // Text colors
  textDark: '#1e293b',
  textGray: '#64748b',
  textLightGray: '#94a3b8',

  // Utility colors
  green: '#22c55e',
  greenLight: '#dcfce7',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
} as const;

// Gradient presets
export const gradients = {
  heroBackground: 'from-[#a7f3d0] via-[#fde68a] to-[#dbeafe]',
  heroCircle: 'from-[#86efac] via-[#fde047] to-[#93c5fd]',
  blueWave: 'from-[#93c5fd] via-[#60a5fa] to-[#3b82f6]',
} as const;

// Common component styles as className strings
export const styles = {
  // Container
  container: 'max-w-7xl mx-auto px-6',

  // Section
  section: 'py-20',
  sectionLight: 'py-20 bg-white',
  sectionBlue: 'py-20 bg-lighter-blue',

  // Typography
  heading1: 'text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-primary-dark leading-tight',
  heading2: 'text-3xl md:text-4xl font-bold text-primary-dark',
  heading3: 'text-xl font-semibold text-primary-dark',
  bodyText: 'text-text-gray text-lg',
  bodyTextSmall: 'text-text-gray text-sm',

  // Badges
  badge: 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
  badgeLight: 'bg-lighter-blue text-primary-dark',
  badgeWhite: 'bg-white border border-border text-primary-dark',
  badgeBlue: 'bg-lighter-blue text-primary-blue',

  // Buttons
  buttonPrimary:
    'bg-primary-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-blue/90 transition-colors',
  buttonPrimaryDark:
    'bg-primary-dark text-white px-6 py-3 rounded-lg font-medium hover:bg-text-dark transition-colors',
  buttonSecondary:
    'bg-white text-primary-dark px-6 py-3 rounded-lg font-medium border border-border hover:bg-border-light transition-colors',
  buttonNav:
    'bg-primary-dark text-white px-5 py-2.5 rounded-full font-medium flex items-center gap-2 hover:bg-text-dark transition-colors',

  // Cards
  card: 'bg-white rounded-2xl p-6 border border-border-light hover:shadow-lg transition-shadow',
  cardWithImage:
    'bg-white border border-border-light rounded-2xl overflow-hidden hover:shadow-lg transition-shadow',

  // Links
  navLink: 'text-primary-dark hover:text-primary-blue transition-colors font-medium',

  // Form elements
  input:
    'w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all',
  label: 'block text-sm font-medium text-primary-dark mb-2',

  // Icons containers
  iconCircle: 'w-14 h-14 flex items-center justify-center',
} as const;

// Reusable icon components data
export const iconPaths = {
  arrowUpRight: 'M4 12L12 4M12 4H6M12 4V10',
  arrowRight: 'M3 8H13M13 8L9 4M13 8L9 12',
  check: 'M5 13L9 17L19 7',
  star: 'M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z',
} as const;
