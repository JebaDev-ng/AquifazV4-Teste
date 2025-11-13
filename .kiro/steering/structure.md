# Project Structure

## Directory Organization

### `/app` - Next.js App Router
- **`/admin`** - Admin panel routes (protected by middleware)
  - `/categories` - Category management
  - `/content` - Content section management
  - `/login` - Admin authentication
  - `/media` - Media library
  - `/products` - Product management
- **`/api`** - API routes (carrinho, checkout, etc.)
- **`/auth`** - Authentication pages
- **`/produtos`** - Product listing and detail pages
- `layout.tsx` - Root layout with Poppins font and Providers
- `page.tsx` - Homepage with dynamic sections
- `globals.css` - Global styles and Tailwind directives

### `/components`
- **`/admin`** - Admin-specific components
- **`/providers`** - React context providers (theme, etc.)
- **`/ui`** - Reusable UI components
  - `/carousel` - Product carousels
  - `/footer` - Footer component
  - `/header` - Navbar component
  - `/hero` - Hero section with carousel
  - `/icons` - Custom icon components
  - `/pricing` - Pricing section
  - Section components (categories, featured products, grid, banner)

### `/lib`
- **`/admin`** - Admin utility functions
- **`/animations`** - Framer Motion variants
- **`/supabase`** - Supabase client configurations
  - `client.ts` - Browser client
  - `server.ts` - Server component client
  - `service.ts` - Service role client
  - `env.ts` - Environment validation
- `types.ts` - TypeScript type definitions
- `database.ts` - Database type definitions
- `utils.ts` - Utility functions (cn, formatPrice, hasValidImage)
- `content.ts` - Default content constants
- `homepage-sections.ts` - Homepage section logic
- `homepage-settings.ts` - Homepage configuration
- `mock-data.ts` - Mock data for development
- `uploads.ts` - File upload utilities
- `auth-local.ts` - Local authentication helpers

### `/public`
Static assets (logos, icons, SVGs)

### `/supabase`
- `/migrations` - Database migration files

## Key Conventions

### File Naming
- React components: PascalCase (e.g., `ProductCard.tsx`)
- Utilities/libs: kebab-case (e.g., `homepage-settings.ts`)
- Routes: kebab-case folders with `page.tsx`

### Import Aliases
- `@/*` maps to project root
- Example: `import { Product } from '@/lib/types'`

### Component Patterns
- Server Components by default (no 'use client')
- Client Components marked with `'use client'` directive
- Async Server Components for data fetching
- Props interfaces defined inline or in types.ts

### Data Fetching
- Server Components fetch directly from Supabase
- Fallback to mock data when Supabase unavailable
- ISR with `export const revalidate = 3600` (1 hour)
- Service role client for admin operations
- Anonymous client for public data

### Styling
- Tailwind utility classes
- Custom design tokens in `tailwind.config.js`
- `cn()` utility for conditional classes
- Dark mode via `class` strategy with next-themes

### Authentication & Authorization
- Middleware protects `/admin` routes
- Role-based access (admin, editor, viewer)
- Supabase Auth with cookie-based sessions
- RLS policies on database tables

### Type Safety
- All database entities typed in `lib/types.ts`
- Strict TypeScript configuration
- Zod schemas for form validation
- Type-safe Supabase queries

## Admin Panel Structure
Protected routes under `/admin` with:
- Dashboard overview
- Product CRUD operations
- Category management
- Media library with upload
- Content section editing
- Homepage section configuration
