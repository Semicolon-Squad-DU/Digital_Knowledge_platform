# Development Roadmap & Task Assignments

<style>
  /* This style block helps modern PDF generators */
  @media print {
    h2 { page-break-after: avoid; break-after: avoid; }
    ul { page-break-before: avoid; break-before: avoid; }
    li { page-break-inside: avoid; break-inside: avoid; }
    .page-break { 
      page-break-after: always; 
      break-after: always; 
      height: 0; 
      display: block; 
      visibility: hidden; 
    }
  }
</style>

## 👤 Hasibul Islam Sifat
**Branch:** `feature/archive-search` (42)  
*Lighter load — foundation credit.*

* **Write `seed.ts` — Full Seed Script**
    * Create a full script: 16 users (all 7 roles), 20 tags, 30 archive items with tags, 3 labs + lab members, 25 research outputs, 20 student projects, 40 catalog items, 15 lending transactions (some overdue), 10 fines, 10 hold requests, 20 notifications, 5 announcements. 
    * All users get `Test@123456` bcrypt hash. 
    * Named accounts: `admin@dkp.edu.bd`, `librarian@dkp.edu.bd`, `archivist@dkp.edu.bd`, etc.
    * **Files:** `seed.ts`
* **PATCH `/api/archive/:id` Metadata Edit**
    * Implement endpoint to edit archive item metadata (title, description, authors, tags, category, access_tier). Archivist/admin only. 
    * Add `useUpdateArchiveItem` hook on frontend.
    * **Files:** `archive.routes.ts`, `useArchive.ts`
* **MinIO Fallback in `s3.service.ts`**
    * Wrap `uploadToS3` with try/catch; on failure, save file to local `/tmp/dkp-queue/` with metadata JSON.
    * Return a `local://` prefixed key and implement `retryQueuedUploads()` for the scheduler.
    * **Files:** `s3.service.ts`
* **GitHub Actions CI Pipeline**
    * Create `ci.yml`: On push/PR to any branch, run `npm ci`, `npm run lint`, `npm run build`. 
    * Check that the DB seed file is not empty.
    * **Files:** `ci.yml`

<div class="page-break"></div>

## 👤 Faria Yasmin
**Branch:** `feature/auth-profile` (21)

* **PATCH `/api/auth/profile` Endpoint**
    * Update name, bio, department, `avatar_url`. Validate inputs and return updated user.
    * **Files:** `auth.routes.ts`
* **PATCH `/api/auth/password` Endpoint**
    * Change password: requires `current_password` + `new_password` with full validation.
    * **Files:** `auth.routes.ts`
* **Editable Profile Page**
    * Rewrite `page.tsx` as an editable form with toggle, fields for name/bio/department, and avatar upload. 
    * Include password change section and toast feedback.
    * **Files:** `page.tsx` (Profile)
* **Auth Store Mutations**
    * Add `updateProfile` and `changePassword` to `auth.store.ts` for frontend state management.
    * **Files:** `auth.store.ts`
* **Enhanced Borrowing History**
    * Add status filter (all/active/returned/overdue), date range filter, pagination, and a fines summary row.
    * **Files:** `page.tsx` (History)
* **Enhanced Notifications**
    * Add filter tabs (All / Unread / by type), pagination for older notifications, and type icon mapping.
    * **Files:** `page.tsx` (Notifications)

<div class="page-break"></div>

## 👤 Md. Nuruzzaman
**Branch:** `feature/library-catalog` (56)

* **Per-User Upload Quotas**
    * Update `upload.middleware.ts`: Limit to 50 files/day and 200 MB/day per user.
    * **Files:** `upload.middleware.ts`
* **GET `/api/library/overdue` Endpoint**
    * Returns all overdue transactions with member name, book title, days overdue, and fine amount. (Librarian/Admin only).
    * **Files:** `library.routes.ts`
* **PATCH `/api/library/fines/:fine_id/adjust` Endpoint**
    * Allow librarians to set custom fine amounts with a recorded reason.
    * **Files:** `library.routes.ts`
* **Librarian Overdue Management UI**
    * Add "Overdue & Fines" tab to `page.tsx` with a table showing overdue details and waive/adjust buttons.
    * **Files:** `page.tsx` (Librarian)
* **Member Dashboard Fines Section**
    * Add a fines card calling `useMemberFines` showing pending fines and totals.
    * **Files:** `page.tsx` (Member Dashboard)
* **Catalog Management Hooks**
    * Implement `useCreateCatalogItem`, `useUpdateCatalogItem`, and `useDeleteCatalogItem` for the frontend.
    * **Files:** `useLibrary.ts`

<div class="page-break"></div>

## 👤 Yuki Bhuiyan
**Branch:** `feature/research-showcase` (64)

* **Scheduler Retry & Recovery**
    * Wrap cron jobs with a retry wrapper (3 attempts, exponential backoff). 
    * Implement `failed_jobs` log and a 9 AM retry cron for failed night jobs.
    * **Files:** `scheduler.ts`
* **Database Constraint Fixes**
    * Update `init.sql`: Add `UNIQUE(transaction_id)` on fines, `CHECK(version_number > 0)` on archive_versions, and `CHECK(amount > 0)` on fines.
    * **Files:** `init.sql`
* **Citation Tools**
    * Add copy-to-clipboard and `.bib` download buttons for citations in `research/[id]/page.tsx`.
    * **Files:** `apps/frontend/src/app/research/[id]/page.tsx`
* **Student Project Submission**
    * Build new `page.tsx` form: title, abstract, dynamic team members, advisor selector, tech tags, and PDF upload.
    * **Files:** `page.tsx` (New - Student Submission)
* **PATCH `/api/research/:id` Metadata Edit**
    * Allow researchers to edit their own research output metadata (title, abstract, keywords, journal, DOI).
    * **Files:** `research.routes.ts`
* **Research & Showcase Hooks**
    * Implement `useSubmitProject` and `useUpdateResearchOutput` hooks.
    * **Files:** `useLibrary.ts`