/**
 * Full database seed script.
 *
 * Run with: npm run db:seed
 *
 * Creates:
 *  - 16 users (all 7 roles), password hash for Test@123456
 *  - 20 tags
 *  - 30 archive items with tags
 *  - 3 labs + lab members
 *  - 25 research outputs
 *  - 20 student projects
 *  - 40 catalog items
 *  - 15 lending transactions
 *  - 10 fines
 *  - 10 hold requests
 *  - 20 notifications
 *  - 5 announcements
 */

import { pool } from "./pool";

// bcrypt hash for "Test@123456" (cost 12)
const PASSWORD_HASH =
  "$2b$12$7hnu5/5jFI2.78qrHy9ud.9o5BHNJIouD05H.Cd7EZKh/pV9hMbIS";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ------------------------------------------------------------------
    // 1. USERS – 16 users across all 7 roles
    // ------------------------------------------------------------------
    const userRows = await client.query<{ user_id: string; role: string; name: string }>(
      `INSERT INTO users (name, email, password_hash, role, department, bio, membership_status) VALUES
        ('Admin User',          'admin@dkp.edu.bd',         $1, 'admin',          'IT',          'Platform administrator',              'active'),
        ('Librarian User',      'librarian@dkp.edu.bd',     $1, 'librarian',      'Library',     'Head librarian',                      'active'),
        ('Archivist User',      'archivist@dkp.edu.bd',     $1, 'archivist',      'Archive',     'Digital archivist',                   'active'),
        ('Researcher One',      'researcher1@dkp.edu.bd',   $1, 'researcher',     'CSE',         'AI and ML researcher',                'active'),
        ('Researcher Two',      'researcher2@dkp.edu.bd',   $1, 'researcher',     'EEE',         'Signal processing researcher',        'active'),
        ('Student Author One',  'student1@dkp.edu.bd',      $1, 'student_author', 'CSE',         'Final-year student',                  'active'),
        ('Student Author Two',  'student2@dkp.edu.bd',      $1, 'student_author', 'ME',          'Mechanical engineering student',      'active'),
        ('Student Author Three','student3@dkp.edu.bd',      $1, 'student_author', 'EEE',         'Electronics student',                 'active'),
        ('Member One',          'member1@dkp.edu.bd',       $1, 'member',         'BBA',         'Library member',                      'active'),
        ('Member Two',          'member2@dkp.edu.bd',       $1, 'member',         'English',     'Regular member',                      'active'),
        ('Member Three',        'member3@dkp.edu.bd',       $1, 'member',         'Physics',     'Physics department member',           'active'),
        ('Member Four',         'member4@dkp.edu.bd',       $1, 'member',         'CSE',         'CSE department member',               'active'),
        ('Guest User One',      'guest1@dkp.edu.bd',        $1, 'guest',          NULL,          NULL,                                  'active'),
        ('Guest User Two',      'guest2@dkp.edu.bd',        $1, 'guest',          NULL,          NULL,                                  'active'),
        ('Researcher Three',    'researcher3@dkp.edu.bd',   $1, 'researcher',     'Physics',     'Quantum computing researcher',        'active'),
        ('Student Author Four', 'student4@dkp.edu.bd',      $1, 'student_author', 'CE',          'Civil engineering student',           'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING user_id, role, name`,
      [PASSWORD_HASH]
    );

    const users = userRows.rows;
    const byRole = (role: string) => users.filter((u) => u.role === role);
    const admins       = byRole("admin");
    const archivists   = byRole("archivist");
    const researchers  = byRole("researcher");
    const students     = byRole("student_author");
    const members      = byRole("member");
    const librarians   = byRole("librarian");

    const uploaderIds  = [...archivists, ...admins].map((u) => u.user_id);
    const researcherIds = researchers.map((u) => u.user_id);
    const studentIds   = students.map((u) => u.user_id);
    const memberIds    = members.map((u) => u.user_id);
    const _librarianId  = librarians[0]?.user_id ?? admins[0].user_id;

    console.log(`✓ Inserted ${users.length} users`);

    // ------------------------------------------------------------------
    // 2. TAGS – 20 tags
    // ------------------------------------------------------------------
    const tagNames = [
      ["History",         "ইতিহাস"],
      ["Science",         "বিজ্ঞান"],
      ["Technology",      "প্রযুক্তি"],
      ["Literature",      "সাহিত্য"],
      ["Economics",       "অর্থনীতি"],
      ["Mathematics",     "গণিত"],
      ["Physics",         "পদার্থবিজ্ঞান"],
      ["Chemistry",       "রসায়ন"],
      ["Biology",         "জীববিজ্ঞান"],
      ["Computer Science","কম্পিউটার বিজ্ঞান"],
      ["Engineering",     "প্রকৌশল"],
      ["Medicine",        "চিকিৎসা"],
      ["Law",             "আইন"],
      ["Arts",            "কলা"],
      ["Social Science",  "সমাজবিজ্ঞান"],
      ["Environment",     "পরিবেশ"],
      ["Education",       "শিক্ষা"],
      ["Agriculture",     "কৃষি"],
      ["Philosophy",      "দর্শন"],
      ["Culture",         "সংস্কৃতি"],
    ];

    const tagIds: string[] = [];
    for (const [name_en, name_bn] of tagNames) {
      const r = await client.query<{ tag_id: string }>(
        `INSERT INTO tags (name_en, name_bn) VALUES ($1, $2)
         ON CONFLICT (name_en) DO UPDATE SET name_bn = EXCLUDED.name_bn
         RETURNING tag_id`,
        [name_en, name_bn]
      );
      tagIds.push(r.rows[0].tag_id);
    }
    console.log(`✓ Inserted ${tagIds.length} tags`);

    // ------------------------------------------------------------------
    // 3. ARCHIVE ITEMS – 30 items with tags
    // ------------------------------------------------------------------
    const archiveCategories = ["Thesis", "Report", "Manuscript", "Photograph", "Map", "General"];
    const accessTiers       = ["public", "member", "staff", "restricted"];
    const archiveStatuses   = ["published", "draft", "review"];

    const archiveItemIds: string[] = [];
    for (let i = 1; i <= 30; i++) {
      const r = await client.query<{ item_id: string }>(
        `INSERT INTO archive_items
           (title_en, title_bn, description, authors, category, language, access_tier, status,
            file_url, file_type, file_size, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING item_id`,
        [
          `Archive Item ${i}: ${pick(["Early Records", "Historical Document", "Research Paper", "Survey Data", "Field Notes"])} ${i}`,
          `আর্কাইভ আইটেম ${i}`,
          `Description for archive item ${i}. Contains historical and academic content.`,
          JSON.stringify([{ name: `Author ${i}` }, { name: `Co-Author ${i}` }]),
          pick(archiveCategories),
          pick(["en", "bn"]),
          pick(accessTiers),
          pick(archiveStatuses),
          `archive/seed-item-${i}.pdf`,
          "application/pdf",
          Math.floor(Math.random() * 5_000_000) + 10_000,
          pick(uploaderIds),
        ]
      );
      archiveItemIds.push(r.rows[0].item_id);

      // Attach 2–4 tags per item
      const itemTagCount = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...tagIds].sort(() => Math.random() - 0.5).slice(0, itemTagCount);
      for (const tag_id of shuffled) {
        await client.query(
          `INSERT INTO archive_item_tags (item_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [r.rows[0].item_id, tag_id]
        );
      }
    }
    console.log(`✓ Inserted ${archiveItemIds.length} archive items`);

    // ------------------------------------------------------------------
    // 4. LABS – 3 labs with members
    // ------------------------------------------------------------------
    const labData = [
      { name: "AI & Machine Learning Lab", description: "Artificial intelligence and ML research" },
      { name: "Signal Processing Lab",     description: "Digital signal and communications research" },
      { name: "Quantum Computing Lab",     description: "Quantum algorithms and cryptography" },
    ];

    const labIds: string[] = [];
    for (let i = 0; i < labData.length; i++) {
      const headId = researcherIds[i % researcherIds.length];
      const r = await client.query<{ lab_id: string }>(
        `INSERT INTO labs (name, description, head_researcher_id) VALUES ($1,$2,$3)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING lab_id`,
        [labData[i].name, labData[i].description, headId]
      );
      labIds.push(r.rows[0].lab_id);

      // Head is always a member
      await client.query(
        `INSERT INTO lab_members (lab_id, user_id, role) VALUES ($1,$2,'lead')
         ON CONFLICT DO NOTHING`,
        [r.rows[0].lab_id, headId]
      );
      // Add 2 more members from researcher pool
      for (const resId of researcherIds.filter((id) => id !== headId).slice(0, 2)) {
        await client.query(
          `INSERT INTO lab_members (lab_id, user_id, role) VALUES ($1,$2,'member')
           ON CONFLICT DO NOTHING`,
          [r.rows[0].lab_id, resId]
        );
      }
    }
    console.log(`✓ Inserted ${labIds.length} labs`);

    // ------------------------------------------------------------------
    // 5. RESEARCH OUTPUTS – 25 outputs
    // ------------------------------------------------------------------
    const outputTypes = ["journal_article", "conference_paper", "thesis", "dataset", "technical_report"];
    const journals    = [
      "Journal of Computer Science", "IEEE Transactions", "Nature",
      "ACM Computing Surveys", "Elsevier Science", "DKP Academic Review",
    ];

    for (let i = 1; i <= 25; i++) {
      const year = 2019 + Math.floor(Math.random() * 6);
      await client.query(
        `INSERT INTO research_outputs
           (title, abstract, authors, keywords, doi, dkp_identifier, file_url,
            output_type, lab_id, published_date, journal_name, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (dkp_identifier) DO NOTHING`,
        [
          `Research Output ${i}: ${pick(["Deep Learning", "Signal Analysis", "Quantum Circuits", "Data Mining", "Network Security"])} Study`,
          `Abstract for research output ${i}. This paper presents findings on ${pick(["AI applications", "signal processing", "quantum mechanics", "data analysis"])}.`,
          JSON.stringify([{ name: pick(researchers).name ?? "Researcher" }, { name: `Co-author ${i}` }]),
          JSON.stringify([pick(["machine learning", "deep learning", "signal processing", "quantum", "security"])]),
          `10.1234/dkp.${year}.${i.toString().padStart(4, "0")}`,
          `DKP-${year}-${(10000 + i).toString()}`,
          `research/seed-output-${i}.pdf`,
          pick(outputTypes),
          pick(labIds),
          `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-01`,
          pick(journals),
          pick(researcherIds),
        ]
      );
    }
    console.log("✓ Inserted 25 research outputs");

    // ------------------------------------------------------------------
    // 6. STUDENT PROJECTS – 20 projects
    // ------------------------------------------------------------------
    const departments  = ["CSE", "EEE", "ME", "CE", "BBA"];
    const semesters    = ["Spring 2023", "Fall 2023", "Spring 2024", "Fall 2024"];
    const projectStatuses = ["published", "pending_review", "draft", "archived"];
    const techStacks   = [
      ["React", "Node.js", "PostgreSQL"],
      ["Python", "Django", "Redis"],
      ["Flutter", "Firebase"],
      ["Arduino", "C++"],
      ["Java", "Spring Boot", "MySQL"],
    ];

    for (let i = 1; i <= 20; i++) {
      const advisorId = pick(researcherIds);
      const submitterId = pick(studentIds);
      await client.query(
        `INSERT INTO student_projects
           (title, abstract, team_members, advisor_id, semester, department,
            technologies, report_url, status, submitted_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          `Student Project ${i}: ${pick(["Smart Campus", "Library System", "Health Monitor", "E-Commerce", "IoT Hub"])} ${i}`,
          `Abstract for student project ${i}. This project demonstrates ${pick(["web development", "IoT implementation", "mobile app development", "machine learning application"])}.`,
          JSON.stringify([
            { name: `Student ${i}A`, id: pick(studentIds) },
            { name: `Student ${i}B`, id: pick(studentIds) },
          ]),
          advisorId,
          pick(semesters),
          pick(departments),
          pick(techStacks),
          `showcase/seed-project-${i}.pdf`,
          pick(projectStatuses),
          submitterId,
        ]
      );
    }
    console.log("✓ Inserted 20 student projects");

    // ------------------------------------------------------------------
    // 7. CATALOG ITEMS – 40 items
    // ------------------------------------------------------------------
    const catalogCats    = ["Computer Science", "Mathematics", "Physics", "Literature", "Engineering", "History", "Economics"];
    const publishers     = ["Pearson", "McGraw-Hill", "O'Reilly", "Cambridge University Press", "Oxford University Press", "MIT Press"];
    const catalogItemIds: string[] = [];

    for (let i = 1; i <= 40; i++) {
      const totalCopies = Math.floor(Math.random() * 5) + 2;
      const availCopies = Math.floor(Math.random() * (totalCopies + 1));
      const r = await client.query<{ catalog_id: string }>(
        `INSERT INTO catalog_items
           (title, isbn, authors, publisher, edition, year, category, total_copies, available_copies, shelf_location, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING catalog_id`,
        [
          `${pick(["Introduction to", "Advanced", "Fundamentals of", "Modern", "Practical"])} ${pick(["Algorithms", "Data Structures", "Machine Learning", "Calculus", "Physics", "Literature", "Economics"])} Vol.${i}`,
          `978-0-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}-${String(10000 + i)}`,
          [`Author ${i}`, `Co-Author ${i}`],
          pick(publishers),
          `${Math.floor(Math.random() * 5) + 1}th`,
          2015 + Math.floor(Math.random() * 10),
          pick(catalogCats),
          totalCopies,
          availCopies,
          `Shelf-${String.fromCharCode(65 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 20) + 1}`,
          `Comprehensive textbook on the subject. ISBN ${i}.`,
        ]
      );
      catalogItemIds.push(r.rows[0].catalog_id);
    }
    console.log(`✓ Inserted ${catalogItemIds.length} catalog items`);

    // ------------------------------------------------------------------
    // 8. LENDING TRANSACTIONS – 15 transactions
    // ------------------------------------------------------------------
    const transactionIds: string[] = [];
    const usedCatalogMemberPairs = new Set<string>();

    for (let i = 0; i < 15; i++) {
      const memberId  = pick(memberIds);
      const catalogId = catalogItemIds[i % catalogItemIds.length];
      const pairKey   = `${catalogId}:${memberId}`;
      if (usedCatalogMemberPairs.has(pairKey)) continue;
      usedCatalogMemberPairs.add(pairKey);

      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 30));
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14);
      const isReturned = Math.random() > 0.6;
      const isOverdue  = !isReturned && dueDate < new Date();
      const status     = isReturned ? "returned" : isOverdue ? "overdue" : "active";

      const r = await client.query<{ transaction_id: string }>(
        `INSERT INTO lending_transactions
           (catalog_id, member_id, issue_date, due_date, return_date, fine_amount, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING transaction_id`,
        [
          catalogId,
          memberId,
          issueDate.toISOString().split("T")[0],
          dueDate.toISOString().split("T")[0],
          isReturned ? issueDate.toISOString().split("T")[0] : null,
          0,
          status,
        ]
      );
      transactionIds.push(r.rows[0].transaction_id);
    }
    console.log(`✓ Inserted ${transactionIds.length} lending transactions`);

    // ------------------------------------------------------------------
    // 9. FINES – 10 fines
    // ------------------------------------------------------------------
    const fineTransactions = transactionIds.slice(0, Math.min(10, transactionIds.length));
    for (let i = 0; i < fineTransactions.length; i++) {
      const txId    = fineTransactions[i];
      const txRes   = await client.query<{ member_id: string }>(
        "SELECT member_id FROM lending_transactions WHERE transaction_id = $1",
        [txId]
      );
      if (!txRes.rows[0]) continue;
      const memberId = txRes.rows[0].member_id;

      await client.query(
        `INSERT INTO fines (member_id, transaction_id, amount, reason, status)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (transaction_id) DO NOTHING`,
        [
          memberId,
          txId,
          (Math.floor(Math.random() * 10) + 1) * 5,
          `Overdue fine for transaction ${i + 1}`,
          pick(["pending", "paid", "waived"]),
        ]
      );
    }
    console.log("✓ Inserted up to 10 fines");

    // ------------------------------------------------------------------
    // 10. HOLD REQUESTS – 10 hold requests
    // ------------------------------------------------------------------
    for (let i = 0; i < 10; i++) {
      const memberId  = pick(memberIds);
      const catalogId = catalogItemIds[(i + 20) % catalogItemIds.length];
      await client.query(
        `INSERT INTO hold_requests (catalog_id, member_id, status)
         VALUES ($1,$2,$3)
         ON CONFLICT (catalog_id, member_id, status) DO NOTHING`,
        [catalogId, memberId, pick(["pending", "available", "fulfilled"])]
      );
    }
    console.log("✓ Inserted up to 10 hold requests");

    // ------------------------------------------------------------------
    // 11. NOTIFICATIONS – 20 notifications
    // ------------------------------------------------------------------
    const notifTypes = [
      "due_date_reminder", "overdue_alert", "hold_available",
      "project_approved", "access_request_approved", "announcement", "system",
    ] as const;

    const allUserIds = users.map((u) => u.user_id);
    for (let i = 1; i <= 20; i++) {
      const nType = pick(notifTypes as unknown as string[]);
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          pick(allUserIds),
          nType,
          `Notification ${i}: ${nType.replace(/_/g, " ")}`,
          `This is a system notification #${i} of type ${nType}.`,
          "/dashboard",
        ]
      );
    }
    console.log("✓ Inserted 20 notifications");

    // ------------------------------------------------------------------
    // 12. ANNOUNCEMENTS – 5 announcements
    // ------------------------------------------------------------------
    const targetRoles = ["member", "student_author", "researcher", null, null];
    for (let i = 1; i <= 5; i++) {
      await client.query(
        `INSERT INTO announcements (created_by, title, body, target_role)
         VALUES ($1,$2,$3,$4)`,
        [
          admins[0].user_id,
          `Announcement ${i}: ${pick(["Library Hours Update", "System Maintenance", "New Resources Available", "Policy Change", "Event Reminder"])}`,
          `Body of announcement ${i}. This is an important notice for all users. Please read carefully.`,
          targetRoles[i - 1],
        ]
      );
    }
    console.log("✓ Inserted 5 announcements");

    await client.query("COMMIT");
    console.log("\n🌱 Seed completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
