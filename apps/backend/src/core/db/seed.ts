import bcrypt from "bcryptjs";
import { pool } from "./pool";
import { logger } from "../config/logger";

const passwordHash = bcrypt.hashSync("Test@123456", 10);

// ─── Users (16, all 7 roles) ────────────────────────────────────────────────
const users = [
  { user_id: "11111111-1111-1111-1111-111111111101", name: "Admin User",        email: "admin@dkp.edu.bd",       role: "admin",          department: "ICT",              bio: "Platform administrator" },
  { user_id: "11111111-1111-1111-1111-111111111102", name: "Librarian Karim",   email: "librarian@dkp.edu.bd",   role: "librarian",      department: "Library",          bio: "Head librarian" },
  { user_id: "11111111-1111-1111-1111-111111111103", name: "Archivist Rina",    email: "archivist@dkp.edu.bd",   role: "archivist",      department: "Archive",          bio: "Digital archivist" },
  { user_id: "11111111-1111-1111-1111-111111111104", name: "Researcher Hasan",  email: "researcher@dkp.edu.bd",  role: "researcher",     department: "Computer Science", bio: "Senior researcher" },
  { user_id: "11111111-1111-1111-1111-111111111105", name: "Student Mitu",      email: "student@dkp.edu.bd",     role: "student_author", department: "Computer Science", bio: "Final year student" },
  { user_id: "11111111-1111-1111-1111-111111111106", name: "Member Rafiq",      email: "member@dkp.edu.bd",      role: "member",         department: "Business",         bio: "Regular member" },
  { user_id: "11111111-1111-1111-1111-111111111107", name: "Admin Nadia",       email: "admin2@dkp.edu.bd",      role: "admin",          department: "ICT",              bio: "Secondary admin" },
  { user_id: "11111111-1111-1111-1111-111111111108", name: "Librarian Sumon",   email: "librarian2@dkp.edu.bd",  role: "librarian",      department: "Library",          bio: "Assistant librarian" },
  { user_id: "11111111-1111-1111-1111-111111111109", name: "Archivist Tania",   email: "archivist2@dkp.edu.bd",  role: "archivist",      department: "Archive",          bio: "Junior archivist" },
  { user_id: "11111111-1111-1111-1111-111111111110", name: "Researcher Farhan", email: "researcher2@dkp.edu.bd", role: "researcher",     department: "EEE",              bio: "Lab researcher" },
  { user_id: "11111111-1111-1111-1111-111111111111", name: "Student Rafi",      email: "student2@dkp.edu.bd",    role: "student_author", department: "CSE",              bio: "3rd year student" },
  { user_id: "11111111-1111-1111-1111-111111111112", name: "Student Priya",     email: "student3@dkp.edu.bd",    role: "student_author", department: "EEE",              bio: "2nd year student" },
  { user_id: "11111111-1111-1111-1111-111111111113", name: "Member Jahid",      email: "member2@dkp.edu.bd",     role: "member",         department: "BBA",              bio: "Faculty member" },
  { user_id: "11111111-1111-1111-1111-111111111114", name: "Member Sadia",      email: "member3@dkp.edu.bd",     role: "member",         department: "English",          bio: "Staff member" },
  { user_id: "11111111-1111-1111-1111-111111111115", name: "Researcher Lina",   email: "researcher3@dkp.edu.bd", role: "researcher",     department: "Physics",          bio: "Physics researcher" },
  { user_id: "11111111-1111-1111-1111-111111111116", name: "Student Tanvir",    email: "student4@dkp.edu.bd",    role: "student_author", department: "CSE",              bio: "Final year CSE" },
];

// ─── Tags (20) ───────────────────────────────────────────────────────────────
const tags = [
  { tag_id: "22222222-2222-2222-2222-222222222201", name_en: "thesis",          name_bn: "থিসিস" },
  { tag_id: "22222222-2222-2222-2222-222222222202", name_en: "research",        name_bn: "গবেষণা" },
  { tag_id: "22222222-2222-2222-2222-222222222203", name_en: "archive",         name_bn: "আর্কাইভ" },
  { tag_id: "22222222-2222-2222-2222-222222222204", name_en: "machine-learning",name_bn: "মেশিন লার্নিং" },
  { tag_id: "22222222-2222-2222-2222-222222222205", name_en: "database",        name_bn: "ডেটাবেস" },
  { tag_id: "22222222-2222-2222-2222-222222222206", name_en: "networking",      name_bn: "নেটওয়ার্কিং" },
  { tag_id: "22222222-2222-2222-2222-222222222207", name_en: "web-development", name_bn: "ওয়েব ডেভেলপমেন্ট" },
  { tag_id: "22222222-2222-2222-2222-222222222208", name_en: "iot",             name_bn: "আইওটি" },
  { tag_id: "22222222-2222-2222-2222-222222222209", name_en: "cybersecurity",   name_bn: "সাইবার নিরাপত্তা" },
  { tag_id: "22222222-2222-2222-2222-222222222210", name_en: "data-science",    name_bn: "ডেটা বিজ্ঞান" },
  { tag_id: "22222222-2222-2222-2222-222222222211", name_en: "algorithms",      name_bn: "অ্যালগরিদম" },
  { tag_id: "22222222-2222-2222-2222-222222222212", name_en: "cloud-computing", name_bn: "ক্লাউড কম্পিউটিং" },
  { tag_id: "22222222-2222-2222-2222-222222222213", name_en: "embedded-systems",name_bn: "এমবেডেড সিস্টেম" },
  { tag_id: "22222222-2222-2222-2222-222222222214", name_en: "nlp",             name_bn: "এনএলপি" },
  { tag_id: "22222222-2222-2222-2222-222222222215", name_en: "computer-vision", name_bn: "কম্পিউটার ভিশন" },
  { tag_id: "22222222-2222-2222-2222-222222222216", name_en: "robotics",        name_bn: "রোবোটিক্স" },
  { tag_id: "22222222-2222-2222-2222-222222222217", name_en: "blockchain",      name_bn: "ব্লকচেইন" },
  { tag_id: "22222222-2222-2222-2222-222222222218", name_en: "mobile-app",      name_bn: "মোবাইল অ্যাপ" },
  { tag_id: "22222222-2222-2222-2222-222222222219", name_en: "signal-processing",name_bn: "সিগন্যাল প্রসেসিং" },
  { tag_id: "22222222-2222-2222-2222-222222222220", name_en: "bioinformatics",  name_bn: "বায়োইনফরমেটিক্স" },
];

// ─── Labs (3) ────────────────────────────────────────────────────────────────
const labs = [
  { lab_id: "33333333-3333-3333-3333-333333333301", name: "CSE Research Lab",     description: "Core CS research lab",          head: users[3].user_id },
  { lab_id: "33333333-3333-3333-3333-333333333302", name: "EEE Innovation Lab",   description: "Electronics and embedded systems", head: users[9].user_id },
  { lab_id: "33333333-3333-3333-3333-333333333303", name: "Data Science Lab",     description: "ML and data analytics research", head: users[14].user_id },
];

// ─── Archive items (30) ──────────────────────────────────────────────────────
const archiveItems = Array.from({ length: 30 }, (_, i) => ({
  item_id: `44444444-4444-4444-4444-${String(i + 1).padStart(12, "0")}`,
  title_en: `Archive Document ${i + 1}`,
  title_bn: `আর্কাইভ ডকুমেন্ট ${i + 1}`,
  description: `This is the description for archive document number ${i + 1}.`,
  authors: [users[(i % 5) + 3].name],
  category: ["Thesis", "Report", "Journal", "Conference", "General"][i % 5],
  language: i % 4 === 0 ? "bn" : "en",
  access_tier: ["public", "member", "staff", "public", "member"][i % 5],
  status: "published",
  file_url: `archive/sample-doc-${i + 1}.pdf`,
  file_type: "application/pdf",
  file_size: 512000 + i * 10000,
  version: 1,
  uploaded_by: users[2].user_id,
  tag_ids: [tags[i % 20].tag_id, tags[(i + 3) % 20].tag_id],
}));

// ─── Catalog items (40) ──────────────────────────────────────────────────────
const catalogItems = Array.from({ length: 40 }, (_, i) => ({
  catalog_id: `55555555-5555-5555-5555-${String(i + 1).padStart(12, "0")}`,
  title: `Book Title ${i + 1}`,
  isbn: `978000000${String(i + 1).padStart(4, "0")}`,
  authors: [`Author ${String.fromCharCode(65 + (i % 26))}`],
  publisher: ["Academic Press", "University Press", "Springer", "Elsevier", "Wiley"][i % 5],
  edition: `${(i % 5) + 1}th`,
  year: 2018 + (i % 7),
  category: ["Textbook", "Reference", "Novel", "Journal", "Magazine"][i % 5],
  total_copies: 5 + (i % 6),
  available_copies: 2 + (i % 4),
  shelf_location: `${String.fromCharCode(65 + (i % 6))}-${String(i + 1).padStart(2, "0")}`,
  barcode: `DKP-BOOK-${String(i + 1).padStart(4, "0")}`,
  description: `Description for book ${i + 1}.`,
}));

// ─── Research outputs (25) ───────────────────────────────────────────────────
const researchOutputs = Array.from({ length: 25 }, (_, i) => ({
  output_id: `66666666-6666-6666-6666-${String(i + 1).padStart(12, "0")}`,
  title: `Research Output ${i + 1}: A Study on ${tags[i % 20].name_en}`,
  abstract: `This paper presents findings on ${tags[i % 20].name_en} with practical applications.`,
  authors: JSON.stringify([{ name: users[(i % 4) + 3].name }]),
  keywords: [tags[i % 20].name_en, tags[(i + 2) % 20].name_en],
  doi: `10.1234/dkp.2026.${String(i + 1).padStart(3, "0")}`,
  dkp_identifier: `DKP-RES-2026-${String(i + 1).padStart(3, "0")}`,
  file_url: `research/output-${i + 1}.pdf`,
  output_type: ["journal_article", "conference_paper", "technical_report", "book_chapter", "preprint"][i % 5],
  lab_id: labs[i % 3].lab_id,
  published_date: `2025-${String((i % 12) + 1).padStart(2, "0")}-15`,
  journal_name: `Journal of ${tags[i % 20].name_en}`,
  volume: String((i % 10) + 1),
  issue: String((i % 4) + 1),
  pages: `${i * 10 + 1}-${i * 10 + 12}`,
  uploaded_by: users[(i % 4) + 3].user_id,
}));

// ─── Student projects (20) ───────────────────────────────────────────────────
const studentProjects = Array.from({ length: 20 }, (_, i) => ({
  project_id: `77777777-7777-7777-7777-${String(i + 1).padStart(12, "0")}`,
  title: `Student Project ${i + 1}: ${tags[i % 20].name_en} Application`,
  abstract: `A project implementing ${tags[i % 20].name_en} concepts for real-world use.`,
  team_members: JSON.stringify([
    { name: users[(i % 4) + 4].name, role: "Lead Developer" },
    { name: users[((i + 1) % 4) + 4].name, role: "Backend Developer" },
  ]),
  advisor_id: users[(i % 4) + 3].user_id,
  semester: ["Spring 2025", "Fall 2025", "Spring 2026"][i % 3],
  department: ["CSE", "EEE", "BBA", "Physics"][i % 4],
  technologies: [tags[i % 20].name_en, "Node.js", "PostgreSQL"],
  report_url: `showcase/project-${i + 1}-report.pdf`,
  video_url: null,
  source_code_url: `https://github.com/dkp/project-${i + 1}`,
  thumbnail_url: null,
  status: ["published", "approved", "pending", "published", "approved"][i % 5],
  advisor_comments: i % 3 === 0 ? "Excellent work, well documented." : null,
  submitted_by: users[(i % 4) + 4].user_id,
}));

// ─── Lending transactions (15) ───────────────────────────────────────────────
const lendingTransactions = Array.from({ length: 15 }, (_, i) => {
  const isOverdue = i < 3;
  const isReturned = i >= 10;
  const dueDate = isOverdue
    ? new Date(Date.now() - (i + 1) * 86400000).toISOString().split("T")[0]
    : new Date(Date.now() + (i + 3) * 86400000).toISOString().split("T")[0];
  return {
    transaction_id: `88888888-8888-8888-8888-${String(i + 1).padStart(12, "0")}`,
    member_id: users[(i % 6) + 5].user_id,
    catalog_id: catalogItems[i % 40].catalog_id,
    due_date: dueDate,
    returned_date: isReturned ? new Date().toISOString().split("T")[0] : null,
    status: isReturned ? "returned" : isOverdue ? "overdue" : "active",
    renewed_count: i % 3,
  };
});

// ─── Fines (10) ──────────────────────────────────────────────────────────────
const fines = Array.from({ length: 10 }, (_, i) => ({
  fine_id: `99999999-9999-9999-9999-${String(i + 1).padStart(12, "0")}`,
  member_id: lendingTransactions[i % 15].member_id,
  transaction_id: lendingTransactions[i % 15].transaction_id,
  amount: (i + 1) * 10,
  reason: `Overdue fine for book ${i + 1}`,
  status: i < 4 ? "paid" : "pending",
}));

// ─── Hold requests (10) ──────────────────────────────────────────────────────
const holdRequests = Array.from({ length: 10 }, (_, i) => ({
  hold_id: `aaaaaaaa-aaaa-aaaa-aaaa-${String(i + 1).padStart(12, "0")}`,
  member_id: users[(i % 6) + 5].user_id,
  catalog_id: catalogItems[(i + 5) % 40].catalog_id,
  status: ["pending", "ready", "fulfilled", "cancelled"][i % 4],
  expires_at: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
}));

// ─── Notifications (20) ──────────────────────────────────────────────────────
const notifications = Array.from({ length: 20 }, (_, i) => ({
  notification_id: `bbbbbbbb-bbbb-bbbb-bbbb-${String(i + 1).padStart(12, "0")}`,
  user_id: users[i % 16].user_id,
  type: ["announcement", "new_upload", "due_date_reminder", "access_granted", "fine_issued"][i % 5],
  title: `Notification ${i + 1}`,
  message: `This is notification message number ${i + 1} for the user.`,
  read: i % 3 === 0,
  action_url: ["/dashboard", "/archive", "/library", "/research", "/notifications"][i % 5],
}));

// ─── Announcements (5) ───────────────────────────────────────────────────────
const announcements = [
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc01", title: "Welcome to DKP",              body: "The Digital Knowledge Platform is now live. Explore the archive, library, and research sections.", target_role: null },
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc02", title: "Library Hours Updated",       body: "The library is now open from 8 AM to 10 PM on weekdays.", target_role: "member" },
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc03", title: "New Research Submissions",    body: "Researchers can now submit outputs directly through the platform.", target_role: "researcher" },
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc04", title: "Showcase Deadline Reminder",  body: "Student project submissions close on May 15, 2026.", target_role: "student_author" },
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc05", title: "System Maintenance Notice",   body: "Scheduled maintenance on Sunday 2 AM - 4 AM. Services may be unavailable.", target_role: null },
];

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Users
    for (const u of users) {
      await client.query(
        `INSERT INTO users (user_id, name, email, password_hash, role, department, bio, membership_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
         ON CONFLICT (user_id) DO NOTHING`,
        [u.user_id, u.name, u.email, passwordHash, u.role, u.department, u.bio]
      );
    }

    // Tags
    for (const t of tags) {
      await client.query(
        `INSERT INTO tags (tag_id, name_en, name_bn) VALUES ($1,$2,$3) ON CONFLICT (tag_id) DO NOTHING`,
        [t.tag_id, t.name_en, t.name_bn]
      );
    }

    // Labs
    for (const l of labs) {
      await client.query(
        `INSERT INTO labs (lab_id, name, description, head_researcher_id)
         VALUES ($1,$2,$3,$4) ON CONFLICT (lab_id) DO NOTHING`,
        [l.lab_id, l.name, l.description, l.head]
      );
    }

    // Lab members
    for (let i = 0; i < labs.length; i++) {
      const memberIds = [users[3 + i].user_id, users[4 + i].user_id];
      for (const mid of memberIds) {
        await client.query(
          `INSERT INTO lab_members (lab_id, user_id, role) VALUES ($1,$2,'member') ON CONFLICT DO NOTHING`,
          [labs[i].lab_id, mid]
        );
      }
    }

    // Archive items + tags + versions
    for (const item of archiveItems) {
      await client.query(
        `INSERT INTO archive_items
           (item_id, title_en, title_bn, description, authors, category, language,
            access_tier, status, file_url, file_type, file_size, version, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (item_id) DO NOTHING`,
        [item.item_id, item.title_en, item.title_bn, item.description,
         item.authors, item.category, item.language, item.access_tier,
         item.status, item.file_url, item.file_type, item.file_size,
         item.version, item.uploaded_by]
      );
      for (const tag_id of item.tag_ids) {
        await client.query(
          `INSERT INTO archive_item_tags (item_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [item.item_id, tag_id]
        );
      }
      await client.query(
        `INSERT INTO archive_versions (item_id, version_number, file_url, metadata_snapshot, changed_by)
         VALUES ($1,1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [item.item_id, item.file_url, JSON.stringify({ note: "Initial upload" }), item.uploaded_by]
      );
    }

    // Catalog items
    for (const c of catalogItems) {
      await client.query(
        `INSERT INTO catalog_items
           (catalog_id, title, isbn, authors, publisher, edition, year,
            category, total_copies, available_copies, shelf_location, barcode, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (catalog_id) DO NOTHING`,
        [c.catalog_id, c.title, c.isbn, c.authors, c.publisher, c.edition,
         c.year, c.category, c.total_copies, c.available_copies,
         c.shelf_location, c.barcode, c.description]
      );
    }

    // Research outputs
    for (const r of researchOutputs) {
      await client.query(
        `INSERT INTO research_outputs
           (output_id, title, abstract, authors, keywords, doi, dkp_identifier,
            file_url, output_type, lab_id, published_date, journal_name,
            volume, issue, pages, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (output_id) DO NOTHING`,
        [r.output_id, r.title, r.abstract, r.authors, r.keywords, r.doi,
         r.dkp_identifier, r.file_url, r.output_type, r.lab_id,
         r.published_date, r.journal_name, r.volume, r.issue, r.pages, r.uploaded_by]
      );
    }

    // Student projects
    for (const p of studentProjects) {
      await client.query(
        `INSERT INTO student_projects
           (project_id, title, abstract, team_members, advisor_id, semester,
            department, technologies, report_url, video_url, source_code_url,
            thumbnail_url, status, advisor_comments, submitted_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (project_id) DO NOTHING`,
        [p.project_id, p.title, p.abstract, p.team_members, p.advisor_id,
         p.semester, p.department, p.technologies, p.report_url, p.video_url,
         p.source_code_url, p.thumbnail_url, p.status, p.advisor_comments, p.submitted_by]
      );
    }

    // Lending transactions
    for (const lt of lendingTransactions) {
      await client.query(
        `INSERT INTO lending_transactions
           (transaction_id, member_id, catalog_id, due_date, returned_date, status, renewed_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (transaction_id) DO NOTHING`,
        [lt.transaction_id, lt.member_id, lt.catalog_id, lt.due_date,
         lt.returned_date, lt.status, lt.renewed_count]
      );
    }

    // Fines
    for (const f of fines) {
      await client.query(
        `INSERT INTO fines (fine_id, member_id, transaction_id, amount, reason, status)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (fine_id) DO NOTHING`,
        [f.fine_id, f.member_id, f.transaction_id, f.amount, f.reason, f.status]
      );
    }

    // Hold requests
    for (const h of holdRequests) {
      await client.query(
        `INSERT INTO hold_requests (hold_id, member_id, catalog_id, status, expires_at)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (hold_id) DO NOTHING`,
        [h.hold_id, h.member_id, h.catalog_id, h.status, h.expires_at]
      );
    }

    // Notifications
    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (notification_id, user_id, type, title, message, read, action_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (notification_id) DO NOTHING`,
        [n.notification_id, n.user_id, n.type, n.title, n.message, n.read, n.action_url]
      );
    }

    // Announcements
    for (const a of announcements) {
      await client.query(
        `INSERT INTO announcements (announcement_id, created_by, title, body, target_role)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (announcement_id) DO NOTHING`,
        [a.announcement_id, users[0].user_id, a.title, a.body, a.target_role]
      );
    }

    await client.query("COMMIT");
    logger.info("Full seed completed", {
      users: users.length, tags: tags.length, labs: labs.length,
      archiveItems: archiveItems.length, catalogItems: catalogItems.length,
      researchOutputs: researchOutputs.length, studentProjects: studentProjects.length,
      lendingTransactions: lendingTransactions.length, fines: fines.length,
      holdRequests: holdRequests.length, notifications: notifications.length,
      announcements: announcements.length,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Seed failed", { error: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  logger.error("Unexpected seed failure", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
