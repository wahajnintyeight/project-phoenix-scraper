# Phoenix Scraper - Implementation Plan

## Current State
- **Dashboard** (`/`) — Key discovery stats, filtered key cards, pagination, visits, provider/status filtering
- **Key Tester** (`/key-tester`) — Validate API keys + curl replay
- **Scraper Queries** (`/scraper`) — CRUD for search queries (already complete: create form, list, delete with confirm, stats cards, loading/empty/error states)

## Gaps
1. **No Blocked Content page** — API endpoints exist (`GET/POST/DELETE /config/blocked`) but no UI
2. **Navigation** — No links to scraper or blocked pages from desktop header / mobile bottom nav
3. **No Search/Filter on scraper page** — Scraper query list lacks search/filter by provider

## Phase 1: Blocked Content Page (`app/blocked/page.tsx`) — NEW

### API integration (`lib/api.ts`)
Already exists: `fetchBlockedContent()`, `createBlockedContent(pattern, type, description)`, `deleteBlockedContent(id)`. Types: `BlockedContent`, `BlockedContentResponse`.

### Page structure (~500 lines)
```
BlockedPage
├── LoadingState (spinner card, same pattern as scraper page)
├── ErrorState (connection error card with retry)
├── Gradient background div (same radial-gradient as other pages)
├── Sticky header
│   ├── Back button (link to /)
│   ├── Title + subtitle "Blocked Content"
│   ├── "New rule" button + ThemeToggle
├── Hero stats row (3 cards)
│   ├── Total rules, Rules by type count, Unique patterns
├── Create rule form (AnimatePresence collapsible)
│   ├── Pattern input (mono font)
│   ├── Type selector (badge chips: file_path, repo_url, key_prefix, provider, domain)
│   ├── Description input (optional)
│   ├── Submit/Cancel buttons
├── Rules list section
│   ├── Loading: 3 skeleton pulse rows
│   ├── Empty: "No rules yet" + CTA button
│   ├── AnimatePresence map of rule cards
│       ├── Color-coded type icon (FileCode/Globe/Key/Fingerprint/ShieldOff per type)
│       ├── Pattern text (mono font, truncate)
│       ├── Type badge + description
│       ├── Delete button (confirm-then-delete: check/x pattern matching scraper page)
├── Toaster
```

### State
```typescript
const [rules, setRules] = useState<BlockedContent[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isInitializing, setIsInitializing] = useState(true);
const [initError, setInitError] = useState<string | null>(null);
const [showCreateForm, setShowCreateForm] = useState(false);
const [pattern, setPattern] = useState("");
const [type, setType] = useState<"file_path" | "repo_url" | "key_prefix" | "provider" | "domain">("file_path");
const [description, setDescription] = useState("");
const [isCreating, setIsCreating] = useState(false);
const [deletingId, setDeletingId] = useState<string | null>(null);
const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
```

### Type color coding
| Type | Icon | Accent |
|------|------|--------|
| `file_path` | FileCode | sky/blue |
| `repo_url` | Globe | violet |
| `key_prefix` | Key | amber |
| `provider` | Fingerprint | fuchsia |
| `domain` | ShieldOff | rose |

### Key patterns to follow (verbatim from existing pages)
- Session init with `useEffect` → `createSession()` → `getSessionId()`
- Data loading with `useCallback` + `useEffect` dependency
- Same `rounded-[32px]`, `rounded-[28px]`, `rounded-2xl` card hierarchy
- Same gradient background div
- Same confirm-before-delete UX (check/x toggle pattern)
- Same loading spinner and error state components
- Same `formatDate` helper
- Same `cn()` utility for class merging

## Phase 2: Scraper Page Search/Filter (`app/scraper/page.tsx`) — ENHANCE

Add client-side filtering to existing scraper query list:
- **Search input** — filter queries by text match (query, provider name)
- **Provider filter** — dropdown/chips to filter by provider
- **Status filter** — Active/Inactive toggle

State additions:
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [filterProvider, setFilterProvider] = useState<string | null>(null);
```

Filtered list computed via `useMemo`:
```typescript
const filteredQueries = useMemo(() => {
  return queries.filter(q => {
    if (searchQuery && !q.query.toLowerCase().includes(searchQuery.toLowerCase()) && !q.provider.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterProvider && q.provider !== filterProvider) return false;
    return true;
  });
}, [queries, searchQuery, filterProvider]);
```

## Phase 3: Navigation Updates

### Desktop header — add to `app/page.tsx` (around line 356-375)
```tsx
<Link href="/scraper" className="hidden md:inline-flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80">
  <Search className="h-4 w-4 text-cyan-500" />
  Scraper
</Link>
<Link href="/blocked" className="hidden md:inline-flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80">
  <ShieldOff className="h-4 w-4 text-rose-500" />
  Blocked
</Link>
```

Also add "Blocked" link to `app/scraper/page.tsx` header (adjacent to "New query" button).

### Mobile bottom nav — update `app/page.tsx` (around line 850-885)
Add "Scraper" and "Blocked" items. Current is 4 columns; expand to accommodate.

## Phase 4: Verification

1. `npm run dev` — app should start without errors
2. Navigate to `/blocked` — should load, show empty state, allow creating rules
3. Rule CRUD works end-to-end (create, appears in list, delete removes it)
4. Scraper page search/filter works correctly client-side
5. All navigation links work (header + mobile)
6. Dark/light theme consistent on new page
7. Toggle mobile viewport — bottom nav items render correctly

## File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| **Create** | `app/blocked/page.tsx` | ~500 lines — blocked content management page |
| **Edit** | `app/page.tsx` | Add Scraper + Blocked nav links in header + mobile nav |
| **Edit** | `app/scraper/page.tsx` | Add search/filter + Blocked nav link in header |
