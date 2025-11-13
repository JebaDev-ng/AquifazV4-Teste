# AquifazV3 – AI Coding Guide

## Architecture Snapshot
- Next.js 16 app router project with public storefront under `app/` and authenticated admin at `app/admin/**`; APIs live beside pages in the same tree.
- Supabase is the single backend: use helpers in `lib/supabase/{client,server}.ts` plus domain utilities in `lib/admin/**` and `lib/**` for all DB/storage access.
- Stateful resources (homepage sections, products) follow the pattern: API handler → `lib/admin/*` repository → Supabase tables defined in `supabase/migrations/**`.

## Key Patterns
- Forms in the admin use React Hook Form + Zod (`components/admin/products/product-form.tsx` is the reference). Extend schemas in `productSchema`, expose UI through `<Controller>` with components from `components/admin/ui`.
- Admin pages prefer optimistic UI backed by hook wrappers like `useHomepageSections`; mutate via SWR-style `mutate`/`refresh` instead of manual fetch unless a helper already exists.
- API routes require role enforcement with `requireEditor()` (see `app/api/admin/content/homepage-sections/[sectionId]/items/route.ts`). Always reuse validation schemas (`addItemSchema`, etc.) from `lib/admin`.
- When ordering section items, always go through `saveSectionItemOrder` to keep Supabase triggers consistent; never write `sort_order` manually.
- UI uses Tailwind classes but sticks to the palette defined across admin components (primary blue hex 007AFF, base text 1D1D1F). Reuse existing components (`Button`, `Input`, `Modal`) instead of raw HTML.

## Data & Storage
- Product/category metadata lives in Supabase tables populated via migrations; check `supabase/migrations/**` before introducing new fields and mirror them in `lib/types.ts`.
- Media uploads run through `components/admin/products/image-uploader.tsx`, which expects Supabase storage buckets declared in `20241108142000_storage_buckets_and_columns.sql`.

## Workflows
- Local dev: `npm install` then `npm run dev`; lint with `npm run lint`. No automated tests yet—QA relies on targeted manual checks listed in `docs/**` planning files.
- Database: apply migrations with the Supabase CLI (`supabase migration up`) or manual SQL import as described in `README.md`. Keep docs in sync when schema changes.
- Authentication is Supabase-driven; server components use `lib/auth-local.ts` or `lib/admin/auth.ts` helpers for session access.

## Conventions & Tips
- Prefer server actions/API routes for mutations; client components should just call fetchers that hit `/api/admin/**` endpoints.
- Keep slugs and links sanitized using helpers in `app/admin/content/sections/[sectionId]/page.tsx` (`normalizeSlug`, `generateAutoViewHref`).
- Log meaningful admin changes with `logActivity` to feed audit needs; mirror existing payload shapes.
- When adding copy or UX in admin flows, consult `docs/admin-*/**` for vetted messages, badge behavior, and toast patterns.

Let me know if any area needs deeper coverage or if workflows are missing. 

Sempre responda em portugues

## For React/Next.js applications:

- Use functional components and TypeScript interfaces.

- Use declarative JSX.

- Use function, not const, for components.

- Use Shadcn UI, Radix, and Tailwind Aria for components and styling.

- Implement responsive design with Tailwind CSS.

- Use mobile-first approach for responsive design.

- Place static content and interfaces at file end.

- Use content variables for static content outside render functions.

- Minimize 'use client', 'useEffect', and 'setState'. Favor RSC.

- Use Zod for form validation.

- Wrap client components in Suspense with fallback.

- Use dynamic loading for non-critical components.

- Optimize images: WebP format, size data, lazy loading.

- Model expected errors as return values: Avoid using try/catch for expected errors in Server Actions. Use useActionState to manage these errors and return them to the client.

- Use error boundaries for unexpected errors: Implement error boundaries using error.tsx and global-error.tsx files to handle unexpected errors and provide a fallback UI.

- Use useActionState with react-hook-form for form validation.

- Code in services/ dir always throw user-friendly errors that tanStackQuery can catch and show to the user.

- Use next-safe-action for all server actions:

- Implement type-safe server actions with proper validation.

- Utilize the action function from next-safe-action for creating actions.

- Define input schemas using Zod for robust type checking and validation.

- Handle errors gracefully and return appropriate responses.

- Use import type { ActionResponse } from '@/types/actions'

- Ensure all server actions return the ActionResponse type

- Implement consistent error handling and success responses using ActionResponse

- Example:

```typescript

'use server'

import { createSafeActionClient } from 'next-safe-action'

import { z } from 'zod'

import type { ActionResponse } from '@/app/actions/actions'

const schema = z.object({

value: z.string()

})

export const someAction = createSafeActionClient()

.schema(schema)

.action(async (input): Promise => {

try {

// Action logic here

return { success: true, data: /* result */ }

} catch (error) {

return { success: false, error: error instanceof AppError ? error : appErrors.UNEXPECTED_ERROR, }

}

})

```

Key Conventions:

1. Rely on Next.js App Router for state changes.

2. Prioritize Web Vitals (LCP, CLS, FID).

3. Minimize 'use client' usage:

- Prefer server components and Next.js SSR features.

- Use 'use client' only for Web API access in small components.

- Avoid using 'use client' for data fetching or state management.

Refer to Next.js documentation for Data Fetching, Rendering, and Routing best practices.

## For React Components whitout Next

## Whenever you need a React component

1. Carefully consider the component's purpose, functionality, and design

2. Think slowly, step by step, and outline your reasoning

3. Check if a similar component already exists in any of the following locations

1. packages/ui/src/components

2. apps/spa/src/components

4. If it doesn't exist, generate a detailed prompt for the component, including:

- Component name and purpose

- Desired props and their types

- Any specific styling or behavior requirements

- Mention of using Tailwind CSS for styling

- Request for TypeScript usage

5. URL encode the prompt.

6. Create a clickable link in this format:

[ComponentName](https://v0.dev/chat?q={encoded_prompt})

7. After generating, adapt the component to fit our project structure:

- Import

- common shadcn/ui components from <ui_package_alias>@repo/ui/components/ui/</ui_package_alias>

- app specific components from <app_package_alias>@/components</app_package_alias>

- Ensure it follows our existing component patterns

- Add any necessary custom logic or state management

## For React Query state manegement

Qdo for implementar estado de aplicacoes React, enxt use sempre o react query baseado nessas regras

// Prefer functional components with hooks

const preferFunctionalComponents = true;

// React Query best practices

const reactQueryBestPractices = [

"Use QueryClient and QueryClientProvider at the root of your app",

"Implement custom hooks for queries and mutations",

"Utilize query keys for effective caching",

"Use prefetching for improved performance",

"Implement proper error and loading states",

];

// Folder structure

const folderStructure = `

src/

components/

hooks/

useQueries/

useMutations/

pages/

utils/

api/

`;

// Additional instructions

const additionalInstructions = `

1. Use TypeScript for type safety with React Query

2. Implement proper error boundaries for query errors

3. Utilize React Query DevTools for debugging

4. Use stale-while-revalidate strategy for data freshness

5. Implement optimistic updates for mutations

6. Use query invalidation for data refetching

7. Follow React Query naming conventions for consistency

`;

## For Commit Messages

Quando você terminar de aplicar as alterações, a última linha da mensagem deve conter "Don't forget to commit" e fornecer um texto de sugestao de commit também.

Sempre prefixar as mensagens de Commit da seguinte forma. Sem exceções!

"Feat(component): add new component"

"Fix(api): fix api error"

"Docs(readme): update readme"

"Refactor(utils): refactor utils"

"Style(tailwind): add new tailwind class"

"Test(unit): add unit test"

"Chore(deps): update dependencies"

## Para Instalação do shadcn

The command "npx shadcn-ui" (CLI) is going to be deprecated soon use "npx install shadcn@latest"

## Regras Gerais

- Follow the user’s requirements carefully & to the letter.

- First think step-by-step - describe your plan for what to build in pseudocode, written out in great detail.

- Confirm, then write code!

Focus on easy and readability code, over being performant.

- Fully implement all requested functionality.

- Leave NO todo’s, placeholders or missing pieces.

- Ensure code is complete! Verify thoroughly finalised.

- Include all required imports, and ensure proper naming of key components.

- Be concise Minimize any other prose.

- If you think there might not be a correct answer, you say so.

- If you do not know the answer, say so, instead of guessing.

- Use early returns whenever possible to make the code more readable.

- Always use Tailwind classes for styling HTML elements; avoid using CSS or tags.

- Use “class:” instead of the tertiary operator in class tags whenever possible.

- Use descriptive variable and function/const names. Also, event functions should be named with a “handle” prefix, like “handleClick” for onClick and “handleKeyDown” for onKeyDown.

- Implement accessibility features on elements. For example, a tag should have a tabindex=“0”, aria-label, on:click, and on:keydown, and similar attributes.

- Use consts instead of functions, for example, “const toggle = () =>”. Also, define a type if possible.

1. Verify Information: Always verify information before presenting it. Do not make assumptions or speculate without clear evidence.

2. File-by-File Changes: Make changes file by file and give me a chance to spot mistakes.

3. No Apologies: Never use apologies.

4. No Understanding Feedback: Avoid giving feedback about understanding in comments or documentation.

5. No Whitespace Suggestions: Don't suggest whitespace changes.

6. No Summaries: Don't summarize changes made.

7. No Inventions: Don't invent changes other than what's explicitly requested.

8. No Unnecessary Confirmations: Don't ask for confirmation of information already provided in the context.

9. Preserve Existing Code: Don't remove unrelated code or functionalities. Pay attention to preserving existing structures.

10. Single Chunk Edits: Provide all edits in a single chunk instead of multiple-step instructions or explanations for the same file.

11. No Implementation Checks: Don't ask the user to verify implementations that are visible in the provided context.

12. No Unnecessary Updates: Don't suggest updates or changes to files when there are no actual modifications needed.

13. Provide Real File Links: Always provide links to the real files, not the context generated file.

14. No Current Implementation: Don't show or discuss the current implementation unless specifically requested.

15. Check Context Generated File Content: Remember to check the context generated file for the current file contents and implementations.

16. Use Explicit Variable Names: Prefer descriptive, explicit variable names over short, ambiguous ones to enhance code readability.

17. Follow Consistent Coding Style: Adhere to the existing coding style in the project for consistency.

18. Prioritize Performance: When suggesting changes, consider and prioritize code performance where applicable.

19. Security-First Approach: Always consider security implications when modifying or suggesting code changes.

20. Test Coverage: Suggest or include appropriate unit tests for new or modified code.

21. Error Handling: Implement robust error handling and logging where necessary.

22. Modular Design: Encourage modular design principles to improve code maintainability and reusability.

23. Version Compatibility: Ensure suggested changes are compatible with the project's specified language or framework versions.

24. Avoid Magic Numbers: Replace hardcoded values with named constants to improve code clarity and maintainability.

25. Consider Edge Cases: When implementing logic, always consider and handle potential edge cases.

26. Use Assertions: Include assertions wherever possible to validate assumptions and catch potential errors early.

- Follow the user's requirements carefully & to the letter.

- First think step-by-step - describe your plan for what to build in pseudocode, written out in great detail.

- Confirm, then write code!

- Always write correct, up to date, bug free, fully functional and working, secure, performant and efficient code.

- Focus on readability over being performant.

- Fully implement all requested functionality.

- Leave NO todo's, placeholders or missing pieces.

- Be sure to reference file names.

- Be concise. Minimize any other prose.

- If you think there might not be a correct answer, you say so. If you do not know the answer, say so instead of guessing.

- Only write code that is neccessary to complete the task.

- Rewrite the complete code only if necessary.

- Prioritize error handling and edge cases:

- Handle errors and edge cases at the beginning of functions.

- Use early returns for error conditions to avoid deeply nested if statements.

- Place the happy path last in the function for improved readability.

- Avoid unnecessary else statements; use if-return pattern instead.

- Use guard clauses to handle preconditions and invalid states early.

- Implement proper error logging and user-friendly error messages.

- Consider using custom error types or error factories for consistent error handling.

## AI SDK

- Use the Vercel AI SDK UI for implementing streaming chat UI.

- Use the Vercel AI SDK Core to interact with language models.

- Use the Vercel AI SDK RSC and Stream Helpers to stream and help with the generations.

- Implement proper error handling for AI responses and model switching.

- Implement fallback mechanisms for when an AI model is unavailable.

- Handle rate limiting and quota exceeded scenarios gracefully.

- Provide clear error messages to users when AI interactions fail.

- Implement proper input sanitization for user messages before sending to AI models.

- Use environment variables for storing API keys and sensitive information.

## Key Conventions

1. Rely on Next.js App Router for state changes and routing.

2. Prioritize Web Vitals (LCP, CLS, FID).

3. Minimize 'use client' usage:

- Prefer server components and Next.js SSR features.

- Use 'use client' only for Web API access in small components.

- Avoid using 'use client' for data fetching or state management.

4. Follow the monorepo structure:

- Place shared code in the 'packages' directory.

- Keep app-specific code in the 'apps' directory.

5. Use Taskfile commands for development and deployment tasks.

6. Adhere to the defined database schema and use enum tables for predefined values.

## Naming Conventions

- Booleans: Use auxiliary verbs such as 'does', 'has', 'is', and 'should' (e.g., isDisabled, hasError).

- Filenames: Use lowercase with dash separators (e.g., auth-wizard.tsx).

- File extensions: Use .config.ts, .test.ts, .context.tsx, .type.ts, .hook.ts as appropriate.

## Component Structure

- Break down components into smaller parts with minimal props.

- Suggest micro folder structure for components.

- Use composition to build complex components.

- Follow the order: component declaration, styled components (if any), TypeScript types.

## Data Fetching and State Management

- Use React Server Components for data fetching when possible.

- Implement the preload pattern to prevent waterfalls.

- Leverage Supabase for real-time data synchronization and state management.

- Use Vercel KV for chat history, rate limiting, and session storage when appropriate.

## Accessibility

- Ensure interfaces are keyboard navigable.

- Implement proper ARIA labels and roles for components.

- Ensure color contrast ratios meet WCAG standards for readability.

## Documentation

- Provide clear and concise comments for complex logic.

- Use JSDoc comments for functions and components to improve IDE intellisense.

- Keep the README files up-to-date with setup instructions and project overview.

- Document Supabase schema, RLS policies, and Edge Functions when used.