# Technology Stack

## Core Framework
- **Next.js 16.0.1** with App Router
- **React 19.2.0** with Server Components
- **TypeScript 5** for type safety

## Backend & Database
- **Supabase** for:
  - PostgreSQL database
  - Authentication (auth)
  - File storage
  - Row Level Security (RLS)
- Service role and anonymous key authentication patterns

## Styling & UI
- **TailwindCSS 3.4** with custom design tokens
- **Framer Motion 12** for animations
- **Radix UI** components (Dialog, Dropdown, Select, Tabs, Toast)
- **Lucide React** for icons
- **next-themes** for dark/light mode
- Custom color system based on Apple's design hierarchy

## Forms & Validation
- **React Hook Form 7** with **Zod 4** validation
- **@hookform/resolvers** for schema integration

## Utilities
- **clsx** + **tailwind-merge** for className management
- **date-fns** for date formatting
- **uuid** for ID generation
- **sharp** for image optimization

## Development Tools
- **ESLint 9** with Next.js config
- **Autoprefixer** + **PostCSS**
- React Compiler (babel-plugin-react-compiler)

## Common Commands

### Development
```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Setup
Required environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Database
Supabase migrations are in `supabase/migrations/`
Apply via Supabase CLI or SQL Editor

## Performance Features
- Incremental Static Regeneration (ISR) with 1-hour revalidation
- React Server Components for reduced client bundle
- Automatic code splitting
- Next.js Image optimization
- Remote image patterns configured for Supabase storage
