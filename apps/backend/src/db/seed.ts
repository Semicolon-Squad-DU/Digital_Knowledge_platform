import bcrypt from "bcryptjs";
import { pool } from "./pool";
import { logger } from "../config/logger";

const demoPassword = bcrypt.hashSync("password123", 10);

const users = [
	{
		user_id: "11111111-1111-1111-1111-111111111111",
		name: "Admin User",
		email: "admin@dkp.edu.bd",
		password_hash: demoPassword,
		role: "admin",
		department: "ICT",
		bio: "Platform administrator",
		membership_status: "active",
	},
	{
		user_id: "22222222-2222-2222-2222-222222222222",
		name: "Librarian User",
		email: "librarian@dkp.edu.bd",
		password_hash: demoPassword,
		role: "librarian",
		department: "Library",
		bio: "Manages the digital knowledge platform",
		membership_status: "active",
	},
	{
		user_id: "33333333-3333-3333-3333-333333333333",
		name: "Researcher User",
		email: "researcher@dkp.edu.bd",
		password_hash: demoPassword,
		role: "researcher",
		department: "Computer Science",
		bio: "Research supervisor",
		membership_status: "active",
	},
	{
		user_id: "44444444-4444-4444-4444-444444444444",
		name: "Student User",
		email: "student@dkp.edu.bd",
		password_hash: demoPassword,
		role: "student_author",
		department: "Computer Science",
		bio: "Example student account",
		membership_status: "active",
	},
] as const;

const tags = [
	{ tag_id: "55555555-5555-5555-5555-555555555551", name_en: "thesis", name_bn: "থিসিস" },
	{ tag_id: "55555555-5555-5555-5555-555555555552", name_en: "research", name_bn: "গবেষণা" },
	{ tag_id: "55555555-5555-5555-5555-555555555553", name_en: "archive", name_bn: "আর্কাইভ" },
] as const;

const catalogItems = [
	{
		catalog_id: "66666666-6666-6666-6666-666666666661",
		title: "Introduction to Databases",
		isbn: "9780135953212",
		authors: ["K. A. Smith"],
		publisher: "Academic Press",
		edition: "2nd",
		year: 2024,
		category: "Textbook",
		total_copies: 10,
		available_copies: 9,
		shelf_location: "A-12",
		barcode: "DKP-BOOK-0001",
		description: "A demo catalog record for the library page.",
	},
	{
		catalog_id: "66666666-6666-6666-6666-666666666662",
		title: "Research Methods in Computing",
		isbn: "9780123456789",
		authors: ["J. Doe", "R. Khan"],
		publisher: "University Press",
		edition: "1st",
		year: 2023,
		category: "Reference",
		total_copies: 6,
		available_copies: 6,
		shelf_location: "B-04",
		barcode: "DKP-BOOK-0002",
		description: "A second demo catalog record.",
	},
] as const;

const labId = "77777777-7777-7777-7777-777777777771";
const archiveItemId = "88888888-8888-8888-8888-888888888881";
const archiveVersionId = "88888888-8888-8888-8888-888888888882";
const researchOutputId = "99999999-9999-9999-9999-999999999991";
const projectId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1";
const announcementId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1";
const notificationId1 = "cccccccc-cccc-cccc-cccc-ccccccccccc1";
const notificationId2 = "cccccccc-cccc-cccc-cccc-ccccccccccc2";

async function main() {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		for (const user of users) {
			await client.query(
				`
				INSERT INTO users (user_id, name, email, password_hash, role, department, bio, membership_status)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				ON CONFLICT (user_id) DO NOTHING
				`,
				[
					user.user_id,
					user.name,
					user.email,
					user.password_hash,
					user.role,
					user.department,
					user.bio,
					user.membership_status,
				]
			);
		}

		for (const tag of tags) {
			await client.query(
				`
				INSERT INTO tags (tag_id, name_en, name_bn)
				VALUES ($1, $2, $3)
				ON CONFLICT (tag_id) DO NOTHING
				`,
				[tag.tag_id, tag.name_en, tag.name_bn]
			);
		}

		for (const item of catalogItems) {
			await client.query(
				`
				INSERT INTO catalog_items (
					catalog_id, title, isbn, authors, publisher, edition, year,
					category, total_copies, available_copies, shelf_location, barcode, description
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
				ON CONFLICT (catalog_id) DO NOTHING
				`,
				[
					item.catalog_id,
					item.title,
					item.isbn,
					item.authors,
					item.publisher,
					item.edition,
					item.year,
					item.category,
					item.total_copies,
					item.available_copies,
					item.shelf_location,
					item.barcode,
					item.description,
				]
			);
		}

		await client.query(
			`
			INSERT INTO labs (lab_id, name, description, head_researcher_id)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (lab_id) DO NOTHING
			`,
			[labId, "CSE Research Lab", "Demo research lab for showcase content", users[2].user_id]
		);

		await client.query(
			`
			INSERT INTO archive_items (
				item_id, title_en, title_bn, description, authors, category, language,
				access_tier, status, file_url, file_type, file_size, version, uploaded_by
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
			ON CONFLICT (item_id) DO NOTHING
			`,
			[
				archiveItemId,
				"Sample Thesis Report",
				"নমুনা থিসিস রিপোর্ট",
				"Demo archive item used to verify Supabase data visibility.",
				["Student User", "Researcher User"],
				"Thesis",
				"en",
				"member",
				"published",
				"https://example.com/files/sample-thesis-report.pdf",
				"application/pdf",
				1048576,
				1,
				users[1].user_id,
			]
		);

		await client.query(
			`
			INSERT INTO archive_item_tags (item_id, tag_id)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
			`,
			[archiveItemId, tags[0].tag_id]
		);

		await client.query(
			`
			INSERT INTO archive_versions (version_id, item_id, version_number, file_url, metadata_snapshot, changed_by)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (version_id) DO NOTHING
			`,
			[
				archiveVersionId,
				archiveItemId,
				1,
				"https://example.com/files/sample-thesis-report-v1.pdf",
				JSON.stringify({ note: "Initial upload" }),
				users[1].user_id,
			]
		);

		await client.query(
			`
			INSERT INTO research_outputs (
				output_id, title, abstract, authors, keywords, doi, dkp_identifier,
				file_url, output_type, lab_id, published_date, journal_name, volume,
				issue, pages, uploaded_by
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
			ON CONFLICT (output_id) DO NOTHING
			`,
			[
				researchOutputId,
				"A Sample Research Output",
				"Demo research output so the research page has visible content.",
				JSON.stringify([{ name: "Researcher User" }]),
				["database", "supabase", "demo"],
				"10.1234/dkp.demo.2026",
				"DKP-2026-001",
				"https://example.com/files/sample-research-paper.pdf",
				"journal_article",
				labId,
				"2026-04-24",
				"Journal of Demo Data",
				"12",
				"1",
				"1-12",
				users[2].user_id,
			]
		);

		await client.query(
			`
			INSERT INTO student_projects (
				project_id, title, abstract, team_members, advisor_id, semester,
				department, technologies, report_url, video_url, source_code_url,
				thumbnail_url, status, advisor_comments, submitted_by
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
			ON CONFLICT (project_id) DO NOTHING
			`,
			[
				projectId,
				"Smart Library Portal",
				"A sample student project for the showcase section.",
				JSON.stringify([
					{ name: "Student User", role: "Frontend" },
					{ name: "Researcher User", role: "Advisor" },
				]),
				users[2].user_id,
				"Spring 2026",
				"Computer Science",
				["Next.js", "Node.js", "PostgreSQL"],
				"https://example.com/files/smart-library-portal.pdf",
				"https://example.com/videos/smart-library-portal.mp4",
				"https://github.com/example/smart-library-portal",
				"https://example.com/images/smart-library-portal.png",
				"published",
				"Well documented and ready for review.",
				users[3].user_id,
			]
		);

		await client.query(
			`
			INSERT INTO announcements (announcement_id, created_by, title, body, target_role)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (announcement_id) DO NOTHING
			`,
			[
				announcementId,
				users[0].user_id,
				"Welcome to DKP",
				"This is a demo announcement seeded to verify the shared Supabase database.",
				null,
			]
		);

		await client.query(
			`
			INSERT INTO notifications (notification_id, user_id, type, title, message, read, action_url)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (notification_id) DO NOTHING
			`,
			[
				notificationId1,
				users[3].user_id,
				"announcement",
				"Welcome to DKP",
				"Your demo database is now live on Supabase.",
				false,
				"/dashboard",
			]
		);

		await client.query(
			`
			INSERT INTO notifications (notification_id, user_id, type, title, message, read, action_url)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (notification_id) DO NOTHING
			`,
			[
				notificationId2,
				users[2].user_id,
				"new_upload",
				"New research output uploaded",
				"A sample research output is available for review.",
				false,
				"/research",
			]
		);

		await client.query("COMMIT");
		logger.info("Demo seed data inserted successfully");
	} catch (error) {
		await client.query("ROLLBACK");
		logger.error("Failed to seed demo data", {
			error: error instanceof Error ? error.message : String(error),
		});
		process.exitCode = 1;
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((error) => {
	logger.error("Unexpected seed failure", {
		error: error instanceof Error ? error.message : String(error),
	});
	process.exit(1);
});
