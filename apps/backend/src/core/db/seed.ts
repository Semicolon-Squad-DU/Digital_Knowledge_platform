import bcrypt from "bcryptjs";
import { pool } from "./pool";
import { logger } from "../config/logger";

const passwordHash = bcrypt.hashSync("Test@123456", 10);

// ─── Users (16, all 7 roles) ────────────────────────────────────────────────
const users = [
  { user_id: "11111111-1111-1111-1111-111111111101", name: "Admin User", email: "admin@dkp.edu.bd", role: "admin", department: "ICT", bio: "Platform administrator" },
  { user_id: "11111111-1111-1111-1111-111111111102", name: "Librarian Karim", email: "librarian@dkp.edu.bd", role: "librarian", department: "Library", bio: "Head librarian" },
  { user_id: "11111111-1111-1111-1111-111111111103", name: "Archivist Rina", email: "archivist@dkp.edu.bd", role: "archivist", department: "Archive", bio: "Digital archivist" },
  { user_id: "11111111-1111-1111-1111-111111111104", name: "Researcher Hasan", email: "researcher@dkp.edu.bd", role: "researcher", department: "Computer Science", bio: "Senior researcher" },
  { user_id: "11111111-1111-1111-1111-111111111105", name: "Student Mitu", email: "student@dkp.edu.bd", role: "student_author", department: "Computer Science", bio: "Final year student" },
  { user_id: "11111111-1111-1111-1111-111111111106", name: "Member Rafiq", email: "member@dkp.edu.bd", role: "member", department: "Business", bio: "Regular member" },
  { user_id: "11111111-1111-1111-1111-111111111107", name: "Admin Nadia", email: "admin2@dkp.edu.bd", role: "admin", department: "ICT", bio: "Secondary admin" },
  { user_id: "11111111-1111-1111-1111-111111111108", name: "Librarian Sumon", email: "librarian2@dkp.edu.bd", role: "librarian", department: "Library", bio: "Assistant librarian" },
  { user_id: "11111111-1111-1111-1111-111111111109", name: "Archivist Tania", email: "archivist2@dkp.edu.bd", role: "archivist", department: "Archive", bio: "Junior archivist" },
  { user_id: "11111111-1111-1111-1111-111111111110", name: "Researcher Farhan", email: "researcher2@dkp.edu.bd", role: "researcher", department: "EEE", bio: "Lab researcher" },
  { user_id: "11111111-1111-1111-1111-111111111111", name: "Student Rafi", email: "student2@dkp.edu.bd", role: "student_author", department: "CSE", bio: "3rd year student" },
  { user_id: "11111111-1111-1111-1111-111111111112", name: "Student Priya", email: "student3@dkp.edu.bd", role: "student_author", department: "EEE", bio: "2nd year student" },
  { user_id: "11111111-1111-1111-1111-111111111113", name: "Member Jahid", email: "member2@dkp.edu.bd", role: "member", department: "BBA", bio: "Faculty member" },
  { user_id: "11111111-1111-1111-1111-111111111114", name: "Member Sadia", email: "member3@dkp.edu.bd", role: "member", department: "English", bio: "Staff member" },
  { user_id: "11111111-1111-1111-1111-111111111115", name: "Researcher Lina", email: "researcher3@dkp.edu.bd", role: "researcher", department: "Physics", bio: "Physics researcher" },
  { user_id: "11111111-1111-1111-1111-111111111116", name: "Student Tanvir", email: "student4@dkp.edu.bd", role: "student_author", department: "CSE", bio: "Final year CSE" },
];

// ─── Real DU CSE faculty (advisors) ─────────────────────────────────────────
// Sourced from https://www.du.ac.bd/body/FacultyMembers/CSE — used to populate
// the Showcase submission form's Advisor dropdown with real names instead of
// synthetic ones. No email was listed on the page; addresses below are
// constructed placeholders (firstname.lastname@cse.du.ac.bd), not verified
// real contact info.
const DU_CSE_FACULTY: { name: string; designation: string }[] = [
  { name: "Dr. Md. Abdur Razzaque", designation: "Professor & Chairman" },
  { name: "Dr. Suraiya Pervin", designation: "Professor" },
  { name: "Dr. Md. Haider Ali", designation: "Professor" },
  { name: "Dr. Hafiz Md. Hasan Babu", designation: "Professor" },
  { name: "Dr. Md. Rezaul Karim", designation: "Professor" },
  { name: "Dr. Md. Hasanuzzaman", designation: "Professor (Leave)" },
  { name: "Dr. Shabbir Ahmed", designation: "Professor" },
  { name: "Dr. Md. Mustafizur Rahman", designation: "Professor" },
  { name: "Dr. Saifuddin Md. Tareeq", designation: "Professor" },
  { name: "Dr. Chowdhury Farhan Ahmed", designation: "Professor" },
  { name: "Dr. Md. Mamun-Or-Rashid", designation: "Professor" },
  { name: "Dr. Mosaddek Hossain Kamal", designation: "Professor" },
  { name: "Dr. Muhammad Asif Hossain Khan", designation: "Professor" },
  { name: "Dr. Upama Kabir", designation: "Professor" },
  { name: "Dr. Moinul Islam Zaber", designation: "Professor (Leave)" },
  { name: "Abu Ahmed Ferdaus", designation: "Associate Professor" },
  { name: "Dr. Mosarrat Jahan", designation: "Associate Professor" },
  { name: "Dr. Ismat Rahman", designation: "Associate Professor" },
  { name: "Dr. Sarker Tanveer Ahmed Rumee", designation: "Associate Professor" },
  { name: "Dr. Md. Mosaddek Khan", designation: "Associate Professor" },
  { name: "Dr. Muhammad Ibrahim", designation: "Associate Professor" },
  { name: "Hasnain Heickal", designation: "Assistant Professor (Study Leave)" },
  { name: "Md. Mahmudur Rahman", designation: "Assistant Professor" },
  { name: "Md. Ashraful Islam", designation: "Assistant Professor (Study Leave)" },
  { name: "Md. Fahim Arefin", designation: "Lecturer" },
  { name: "Redwan Ahmed Rizvee", designation: "Lecturer (Leave)" },
  { name: "Md. Tanvir Alam", designation: "Lecturer" },
  { name: "Jargis Ahmed", designation: "Lecturer" },
  { name: "Palash Roy", designation: "Lecturer" },
  { name: "Md. Ahasanul Alam", designation: "Lecturer" },
  { name: "Md. Aminul Kader Bulbul", designation: "Lecturer" },
  { name: "Shabab Murshed", designation: "Lecturer" },
];

const usedFacultyEmails = new Set<string>();
function facultyEmail(name: string): string {
  const parts = name.replace(/^Dr\.\s*/, "").split(/\s+/).filter(Boolean);
  const first = parts[0].replace(/[^a-zA-Z]/g, "").toLowerCase();
  const last = parts[parts.length - 1].replace(/[^a-zA-Z]/g, "").toLowerCase();
  let slug = `${first}.${last}`;
  let email = `${slug}@cse.du.ac.bd`;
  let n = 2;
  while (usedFacultyEmails.has(email)) { email = `${slug}${n}@cse.du.ac.bd`; n += 1; }
  usedFacultyEmails.add(email);
  return email;
}

const duCseFacultyUsers = DU_CSE_FACULTY.map((f, i) => ({
  user_id: `11111111-1111-1111-1111-1111111121${String(i + 1).padStart(2, "0")}`,
  name: f.name,
  email: facultyEmail(f.name),
  role: "researcher",
  department: "CSE",
  bio: `${f.designation}, Department of Computer Science and Engineering, University of Dhaka`,
}));

users.push(...duCseFacultyUsers);

// ─── Tags (20) ───────────────────────────────────────────────────────────────
const tags = [
  { tag_id: "22222222-2222-2222-2222-222222222201", name_en: "thesis", name_bn: "থিসিস" },
  { tag_id: "22222222-2222-2222-2222-222222222202", name_en: "research", name_bn: "গবেষণা" },
  { tag_id: "22222222-2222-2222-2222-222222222203", name_en: "archive", name_bn: "আর্কাইভ" },
  { tag_id: "22222222-2222-2222-2222-222222222204", name_en: "machine-learning", name_bn: "মেশিন লার্নিং" },
  { tag_id: "22222222-2222-2222-2222-222222222205", name_en: "database", name_bn: "ডেটাবেস" },
  { tag_id: "22222222-2222-2222-2222-222222222206", name_en: "networking", name_bn: "নেটওয়ার্কিং" },
  { tag_id: "22222222-2222-2222-2222-222222222207", name_en: "web-development", name_bn: "ওয়েব ডেভেলপমেন্ট" },
  { tag_id: "22222222-2222-2222-2222-222222222208", name_en: "iot", name_bn: "আইওটি" },
  { tag_id: "22222222-2222-2222-2222-222222222209", name_en: "cybersecurity", name_bn: "সাইবার নিরাপত্তা" },
  { tag_id: "22222222-2222-2222-2222-222222222210", name_en: "data-science", name_bn: "ডেটা বিজ্ঞান" },
  { tag_id: "22222222-2222-2222-2222-222222222211", name_en: "algorithms", name_bn: "অ্যালগরিদম" },
  { tag_id: "22222222-2222-2222-2222-222222222212", name_en: "cloud-computing", name_bn: "ক্লাউড কম্পিউটিং" },
  { tag_id: "22222222-2222-2222-2222-222222222213", name_en: "embedded-systems", name_bn: "এমবেডেড সিস্টেম" },
  { tag_id: "22222222-2222-2222-2222-222222222214", name_en: "nlp", name_bn: "এনএলপি" },
  { tag_id: "22222222-2222-2222-2222-222222222215", name_en: "computer-vision", name_bn: "কম্পিউটার ভিশন" },
  { tag_id: "22222222-2222-2222-2222-222222222216", name_en: "robotics", name_bn: "রোবোটিক্স" },
  { tag_id: "22222222-2222-2222-2222-222222222217", name_en: "blockchain", name_bn: "ব্লকচেইন" },
  { tag_id: "22222222-2222-2222-2222-222222222218", name_en: "mobile-app", name_bn: "মোবাইল অ্যাপ" },
  { tag_id: "22222222-2222-2222-2222-222222222219", name_en: "signal-processing", name_bn: "সিগন্যাল প্রসেসিং" },
  { tag_id: "22222222-2222-2222-2222-222222222220", name_en: "bioinformatics", name_bn: "বায়োইনফরমেটিক্স" },
];

// ─── Labs (3) ────────────────────────────────────────────────────────────────
const labs = [
  { lab_id: "33333333-3333-3333-3333-333333333301", name: "CSE Research Lab", description: "Core CS research lab", head: users[3].user_id },
  { lab_id: "33333333-3333-3333-3333-333333333302", name: "EEE Innovation Lab", description: "Electronics and embedded systems", head: users[9].user_id },
  { lab_id: "33333333-3333-3333-3333-333333333303", name: "Data Science Lab", description: "ML and data analytics research", head: users[14].user_id },
];

// ─── Archive items (30) ──────────────────────────────────────────────────────
const archiveContent: { title_en: string; title_bn: string; description: string; category: string; tier: "public" | "member" | "staff" | "restricted" }[] = [
  { title_en: "Design and Fabrication of a Low-Cost Solar Water Pump for Rural Irrigation", title_bn: "গ্রামীণ বাংলাদেশের জন্য স্বল্প ব্যয়ের সৌরচালিত সেচ পাম্পের নকশা ও নির্মাণ", description: "A thesis proposing an affordable solar-powered irrigation solution designed for smallholder farms in rural Bangladesh.", category: "Thesis", tier: "member" },
  { title_en: "Annual Research and Development Report 2025", title_bn: "বার্ষিক গবেষণা ও উন্নয়ন প্রতিবেদন ২০২৫", description: "Summary of departmental research and development activities and outcomes for the 2025 academic year.", category: "Report", tier: "public" },
  { title_en: "Introduction to Digital Signal Processing — Lecture Notes", title_bn: "ডিজিটাল সিগন্যাল প্রসেসিং ভূমিকা — লেকচার নোট", description: "Lecture notes covering sampling, filtering, and transformation techniques in digital signal processing.", category: "Lecture Notes", tier: "public" },
  { title_en: "Microcontroller Programming Lab Manual (8051 & AVR)", title_bn: "মাইক্রোকন্ট্রোলার প্রোগ্রামিং ল্যাব ম্যানুয়াল (৮০৫১ ও এভিআর)", description: "Step-by-step lab exercises for programming 8051 and AVR microcontrollers.", category: "Lab Manual", tier: "member" },
  { title_en: "Data Retention and Digital Archiving Policy", title_bn: "তথ্য সংরক্ষণ ও ডিজিটাল আর্কাইভিং নীতিমালা", description: "Institutional policy governing retention periods and digitization standards for archived records.", category: "Policy", tier: "staff" },
  { title_en: "A Survey of Renewable Energy Adoption in Coastal Bangladesh", title_bn: "উপকূলীয় বাংলাদেশে নবায়নযোগ্য শক্তি গ্রহণের একটি জরিপ", description: "A survey examining the adoption rate and barriers to renewable energy technologies along the coastal belt.", category: "Research", tier: "public" },
  { title_en: "Departmental Handbook for New Faculty Members", title_bn: "নতুন শিক্ষকদের জন্য বিভাগীয় হ্যান্ডবুক", description: "Orientation handbook covering policies, benefits, and expectations for incoming faculty.", category: "General", tier: "public" },
  { title_en: "Miscellaneous Conference Proceedings Compilation 2024", title_bn: "বিবিধ সম্মেলন কার্যবিবরণী সংকলন ২০২৪", description: "A compiled collection of abstracts and proceedings from various conferences attended in 2024.", category: "Other", tier: "public" },
  { title_en: "Machine Learning Techniques for Bengali Handwritten Digit Recognition", title_bn: "বাংলা হস্তলিখিত সংখ্যা শনাক্তকরণে মেশিন লার্নিং কৌশল", description: "Thesis exploring convolutional neural network architectures for recognizing handwritten Bengali digits.", category: "Thesis", tier: "member" },
  { title_en: "Institutional Self-Assessment Report for Accreditation", title_bn: "স্বীকৃতির জন্য প্রাতিষ্ঠানিক স্ব-মূল্যায়ন প্রতিবেদন", description: "Self-assessment report prepared in support of the institution's accreditation renewal application.", category: "Report", tier: "staff" },
  { title_en: "Fundamentals of Database Management Systems — Lecture Notes", title_bn: "ডেটাবেস ম্যানেজমেন্ট সিস্টেমের মৌলিক বিষয় — লেকচার নোট", description: "Lecture notes covering relational models, normalization, and query optimization in DBMS.", category: "Lecture Notes", tier: "public" },
  { title_en: "Electronics Workshop Lab Manual: Circuits and Measurements", title_bn: "ইলেকট্রনিক্স ওয়ার্কশপ ল্যাব ম্যানুয়াল: বর্তনী ও পরিমাপ", description: "Hands-on lab manual for building and measuring basic analog and digital circuits.", category: "Lab Manual", tier: "member" },
  { title_en: "Research Data Sharing and Open Access Policy", title_bn: "গবেষণা তথ্য শেয়ারিং ও উন্মুক্ত প্রবেশাধিকার নীতিমালা", description: "Policy outlining requirements for sharing research datasets under an open-access framework.", category: "Policy", tier: "staff" },
  { title_en: "Flood Forecasting Using Satellite Imagery and Deep Learning", title_bn: "স্যাটেলাইট চিত্র ও ডিপ লার্নিং ব্যবহার করে বন্যা পূর্বাভাস", description: "Research applying deep learning to satellite imagery for early flood warning systems.", category: "Research", tier: "member" },
  { title_en: "Student Orientation Handbook 2025-26", title_bn: "শিক্ষার্থী ওরিয়েন্টেশন হ্যান্ডবুক ২০২৫-২৬", description: "Handbook distributed to incoming students covering campus resources, rules, and support services.", category: "General", tier: "public" },
  { title_en: "Compiled Notes from the National Robotics Symposium", title_bn: "জাতীয় রোবোটিক্স সিম্পোজিয়ামের সংকলিত নোট", description: "Notes and summaries compiled from presentations at the national robotics symposium.", category: "Other", tier: "public" },
  { title_en: "Design of a Low-Power IoT Sensor Network for Smart Agriculture", title_bn: "স্মার্ট কৃষির জন্য স্বল্প-বিদ্যুৎ আইওটি সেন্সর নেটওয়ার্কের নকশা", description: "Thesis on designing a low-power wireless sensor network for real-time soil and crop monitoring.", category: "Thesis", tier: "restricted" },
  { title_en: "Library Modernization Project Completion Report", title_bn: "লাইব্রেরি আধুনিকীকরণ প্রকল্প সমাপ্তি প্রতিবেদন", description: "Final report detailing outcomes of the multi-year library digitization and modernization project.", category: "Report", tier: "public" },
  { title_en: "Object-Oriented Programming with Java — Lecture Notes", title_bn: "জাভা দিয়ে অবজেক্ট-ওরিয়েন্টেড প্রোগ্রামিং — লেকচার নোট", description: "Lecture notes covering classes, inheritance, and design principles in Java programming.", category: "Lecture Notes", tier: "public" },
  { title_en: "Networking Lab Manual: Routing, Switching, and Security", title_bn: "নেটওয়ার্কিং ল্যাব ম্যানুয়াল: রাউটিং, সুইচিং ও নিরাপত্তা", description: "Practical exercises covering router configuration, VLANs, and basic network security.", category: "Lab Manual", tier: "member" },
  { title_en: "Academic Integrity and Plagiarism Prevention Policy", title_bn: "একাডেমিক সততা ও চৌর্যবৃত্তি প্রতিরোধ নীতিমালা", description: "Policy defining academic integrity standards and procedures for handling plagiarism cases.", category: "Policy", tier: "staff" },
  { title_en: "Groundwater Contamination Assessment in Industrial Zones", title_bn: "শিল্পাঞ্চলে ভূগর্ভস্থ পানি দূষণ মূল্যায়ন", description: "Study assessing heavy metal and chemical contamination levels near industrial zones.", category: "Research", tier: "member" },
  { title_en: "Faculty Recruitment and Promotion Guidelines", title_bn: "শিক্ষক নিয়োগ ও পদোন্নতি নির্দেশিকা", description: "Guidelines outlining criteria and procedures for hiring and promoting faculty members.", category: "General", tier: "public" },
  { title_en: "Archived Newsletters of the Alumni Association (2018-2023)", title_bn: "প্রাক্তন শিক্ষার্থী সমিতির আর্কাইভকৃত নিউজলেটার (২০১৮-২০২৩)", description: "Digitized collection of alumni association newsletters spanning five years.", category: "Other", tier: "public" },
  { title_en: "Blockchain-Based Land Registry System for Bangladesh", title_bn: "বাংলাদেশের জন্য ব্লকচেইন-ভিত্তিক ভূমি নিবন্ধন ব্যবস্থা", description: "Thesis proposing a blockchain-based framework to improve transparency in land registration.", category: "Thesis", tier: "restricted" },
  { title_en: "Annual Financial Audit Report FY2025", title_bn: "বার্ষিক আর্থিক নিরীক্ষা প্রতিবেদন অর্থবছর ২০২৫", description: "Independent audit report reviewing the institution's financial statements for FY2025.", category: "Report", tier: "staff" },
  { title_en: "Computer Networks — Lecture Notes and Slides", title_bn: "কম্পিউটার নেটওয়ার্ক — লেকচার নোট ও স্লাইড", description: "Slide decks and notes covering the OSI model, TCP/IP, and routing fundamentals.", category: "Lecture Notes", tier: "public" },
  { title_en: "Structural Engineering Lab Manual: Concrete Testing Procedures", title_bn: "স্ট্রাকচারাল ইঞ্জিনিয়ারিং ল্যাব ম্যানুয়াল: কংক্রিট টেস্টিং পদ্ধতি", description: "Manual detailing standard procedures for testing concrete strength and durability.", category: "Lab Manual", tier: "member" },
  { title_en: "Remote Work and Digital Resource Access Policy", title_bn: "দূরবর্তী কাজ ও ডিজিটাল সম্পদ প্রবেশাধিকার নীতিমালা", description: "Policy governing secure remote access to institutional digital resources and systems.", category: "Policy", tier: "staff" },
  { title_en: "Air Quality Monitoring Using Low-Cost Sensor Arrays in Dhaka", title_bn: "ঢাকায় স্বল্প ব্যয়ের সেন্সর অ্যারে ব্যবহার করে বায়ুর গুণমান পর্যবেক্ষণ", description: "Study deploying low-cost sensor arrays to monitor particulate matter levels across Dhaka.", category: "Research", tier: "public" },
];

const archiveItems = archiveContent.map((c, i) => ({
  item_id: `44444444-4444-4444-4444-${String(i + 1).padStart(12, "0")}`,
  title_en: c.title_en,
  title_bn: c.title_bn,
  description: c.description,
  authors: [users[(i % 5) + 3].name],
  category: c.category,
  language: i % 4 === 0 ? "bn" : "en",
  access_tier: c.tier,
  status: "published",
  file_url: `archive/sample-doc-${i + 1}.pdf`,
  file_type: "application/pdf",
  file_size: 512000 + i * 10000,
  version: 1,
  uploaded_by: users[2].user_id,
  tag_ids: [tags[i % 20].tag_id, tags[(i + 3) % 20].tag_id],
}));

// ─── Catalog items (40) ──────────────────────────────────────────────────────
const catalogContent: { title: string; authors: string[]; publisher: string; category: string; year: number; description: string }[] = [
  { title: "Introduction to Algorithms", authors: ["Thomas H. Cormen", "Charles E. Leiserson", "Ronald L. Rivest", "Clifford Stein"], publisher: "MIT Press", category: "Textbook", year: 2022, description: "Comprehensive reference on algorithm design, analysis, and complexity." },
  { title: "Computer Networks", authors: ["Andrew S. Tanenbaum"], publisher: "Pearson", category: "Textbook", year: 2021, description: "Foundational textbook covering network architecture and protocols." },
  { title: "Operating System Concepts", authors: ["Abraham Silberschatz", "Peter B. Galvin", "Greg Gagne"], publisher: "Wiley", category: "Textbook", year: 2020, description: "Core concepts of process management, memory, and file systems." },
  { title: "Database System Concepts", authors: ["Abraham Silberschatz", "Henry F. Korth", "S. Sudarshan"], publisher: "McGraw-Hill", category: "Textbook", year: 2019, description: "Comprehensive coverage of relational database design and theory." },
  { title: "Artificial Intelligence: A Modern Approach", authors: ["Stuart Russell", "Peter Norvig"], publisher: "Pearson", category: "Textbook", year: 2020, description: "Standard reference on AI algorithms, search, and machine learning." },
  { title: "Clean Code", authors: ["Robert C. Martin"], publisher: "Prentice Hall", category: "Reference", year: 2008, description: "A handbook of agile software craftsmanship and coding practices." },
  { title: "Design Patterns: Elements of Reusable Object-Oriented Software", authors: ["Erich Gamma", "Richard Helm", "Ralph Johnson", "John Vlissides"], publisher: "Addison-Wesley", category: "Reference", year: 1994, description: "The classic catalog of object-oriented design patterns." },
  { title: "The Pragmatic Programmer", authors: ["Andrew Hunt", "David Thomas"], publisher: "Addison-Wesley", category: "Reference", year: 2019, description: "Practical tips and philosophy for effective software development." },
  { title: "Digital Design and Computer Architecture", authors: ["Sarah L. Harris", "David Money Harris"], publisher: "Morgan Kaufmann", category: "Textbook", year: 2021, description: "Covers digital logic design through to processor architecture." },
  { title: "Signals and Systems", authors: ["Alan V. Oppenheim", "Alan S. Willsky"], publisher: "Pearson", category: "Textbook", year: 2015, description: "Core textbook on continuous and discrete-time signal analysis." },
  { title: "Microelectronic Circuits", authors: ["Adel S. Sedra", "Kenneth C. Smith"], publisher: "Oxford University Press", category: "Textbook", year: 2020, description: "Analog and digital circuit design fundamentals for electrical engineers." },
  { title: "Power System Analysis and Design", authors: ["J. Duncan Glover", "Mulukutla S. Sarma", "Thomas Overbye"], publisher: "Cengage", category: "Textbook", year: 2016, description: "Covers power flow, fault analysis, and system stability." },
  { title: "Fundamentals of Electric Circuits", authors: ["Charles K. Alexander", "Matthew N. O. Sadiku"], publisher: "McGraw-Hill", category: "Textbook", year: 2016, description: "Introductory textbook on circuit theory and analysis techniques." },
  { title: "Linear Algebra and Its Applications", authors: ["Gilbert Strang"], publisher: "Cengage", category: "Textbook", year: 2016, description: "Widely used textbook on vector spaces, matrices, and eigenvalues." },
  { title: "Calculus: Early Transcendentals", authors: ["James Stewart"], publisher: "Cengage", category: "Textbook", year: 2020, description: "Standard undergraduate calculus textbook with applied examples." },
  { title: "Padma Nadir Majhi", authors: ["Manik Bandopadhyay"], publisher: "Ananda Publishers", category: "Novel", year: 1936, description: "A classic Bengali novel depicting the lives of fishermen on the Padma river." },
  { title: "Pather Panchali", authors: ["Bibhutibhushan Bandyopadhyay"], publisher: "Mitra o Ghosh", category: "Novel", year: 1929, description: "Coming-of-age Bengali novel following a rural family's struggles and hopes." },
  { title: "Lal Salu", authors: ["Syed Waliullah"], publisher: "University Press Limited", category: "Novel", year: 1948, description: "A landmark Bengali novel exploring religion and rural power dynamics." },
  { title: "Sonar Tori", authors: ["Rabindranath Tagore"], publisher: "Visva-Bharati", category: "Novel", year: 1894, description: "A celebrated collection of poetry by Rabindranath Tagore." },
  { title: "Kabor", authors: ["Munier Chowdhury"], publisher: "Bangla Academy", category: "Novel", year: 1953, description: "A one-act play written in a Pakistani prison, commemorating the Language Movement." },
  { title: "The Discovery of India", authors: ["Jawaharlal Nehru"], publisher: "Penguin", category: "Reference", year: 2004, description: "Nehru's reflections on Indian history and civilization." },
  { title: "A Brief History of Time", authors: ["Stephen Hawking"], publisher: "Bantam Books", category: "Reference", year: 1998, description: "An accessible introduction to cosmology and the nature of the universe." },
  { title: "Sapiens: A Brief History of Humankind", authors: ["Yuval Noah Harari"], publisher: "Harper", category: "Reference", year: 2015, description: "A sweeping account of human history from the Stone Age to the present." },
  { title: "The Elements of Style", authors: ["William Strunk Jr.", "E. B. White"], publisher: "Pearson", category: "Reference", year: 1999, description: "A concise guide to clear and effective English writing." },
  { title: "IEEE Transactions on Software Engineering — Vol. 48", authors: ["IEEE"], publisher: "IEEE Press", category: "Journal", year: 2022, description: "Peer-reviewed research on software engineering methods and tools." },
  { title: "ACM Transactions on Computer Systems — Vol. 40", authors: ["ACM"], publisher: "ACM Press", category: "Journal", year: 2022, description: "Peer-reviewed research on operating systems and distributed computing." },
  { title: "Journal of Renewable and Sustainable Energy — Vol. 15", authors: ["AIP Publishing"], publisher: "AIP Publishing", category: "Journal", year: 2023, description: "Research on renewable energy generation, storage, and policy." },
  { title: "Bangladesh Journal of Scientific Research — Vol. 30", authors: ["Bangladesh Academy of Sciences"], publisher: "Bangladesh Academy of Sciences", category: "Journal", year: 2023, description: "Multidisciplinary scientific research from Bangladeshi institutions." },
  { title: "IEEE Spectrum Magazine — March 2025", authors: ["IEEE"], publisher: "IEEE", category: "Magazine", year: 2025, description: "Monthly magazine covering trends in engineering and technology." },
  { title: "Scientific American — April 2025", authors: ["Springer Nature"], publisher: "Springer Nature", category: "Magazine", year: 2025, description: "Popular science magazine covering recent scientific discoveries." },
  { title: "National Geographic — May 2025", authors: ["National Geographic Society"], publisher: "National Geographic Society", category: "Magazine", year: 2025, description: "Magazine featuring exploration, geography, and natural history." },
  { title: "The Economist — June 2025", authors: ["The Economist Group"], publisher: "The Economist Group", category: "Magazine", year: 2025, description: "Weekly magazine covering global economics, politics, and business." },
  { title: "Networks: An Introduction", authors: ["Mark Newman"], publisher: "Oxford University Press", category: "Textbook", year: 2018, description: "Introductory textbook on graph theory and network science." },
  { title: "Deep Learning", authors: ["Ian Goodfellow", "Yoshua Bengio", "Aaron Courville"], publisher: "MIT Press", category: "Textbook", year: 2016, description: "The definitive textbook on deep neural networks and their theory." },
  { title: "Computer Organization and Design", authors: ["David A. Patterson", "John L. Hennessy"], publisher: "Morgan Kaufmann", category: "Textbook", year: 2020, description: "Covers computer architecture from a hardware/software perspective." },
  { title: "Software Engineering: A Practitioner's Approach", authors: ["Roger S. Pressman"], publisher: "McGraw-Hill", category: "Textbook", year: 2019, description: "Practical guide to software engineering processes and methodologies." },
  { title: "Cryptography and Network Security", authors: ["William Stallings"], publisher: "Pearson", category: "Textbook", year: 2020, description: "Principles and practices of modern cryptography and network defense." },
  { title: "Embedded Systems Design", authors: ["Steve Heath"], publisher: "Newnes", category: "Textbook", year: 2002, description: "Introduction to designing and programming embedded microcontroller systems." },
  { title: "The Bengal Partition Stories", authors: ["Various Authors"], publisher: "University Press Limited", category: "Novel", year: 2001, description: "An anthology of short fiction depicting the 1947 partition of Bengal." },
  { title: "Nirbashito Kobi", authors: ["Taslima Nasrin"], publisher: "Ananda Publishers", category: "Novel", year: 1994, description: "A memoir and poetry collection from an exiled Bangladeshi writer." },
];

const catalogItems = catalogContent.map((c, i) => ({
  catalog_id: `55555555-5555-5555-5555-${String(i + 1).padStart(12, "0")}`,
  title: c.title,
  isbn: `978${String(1000000000 + i).slice(0, 10)}`,
  authors: c.authors,
  publisher: c.publisher,
  edition: `${(i % 5) + 1}th`,
  year: c.year,
  category: c.category,
  total_copies: 5 + (i % 6),
  available_copies: 2 + (i % 4),
  shelf_location: `${String.fromCharCode(65 + (i % 6))}-${String(i + 1).padStart(2, "0")}`,
  barcode: `DKP-BOOK-${String(i + 1).padStart(4, "0")}`,
  description: c.description,
}));

// ─── Research outputs (25) ───────────────────────────────────────────────────
const researchContent: { title: string; abstract: string; keywords: string[] }[] = [
  { title: "Deep Learning-Based Bengali Speech Recognition for Low-Resource Settings", abstract: "Proposes a deep neural network architecture that improves Bengali speech recognition accuracy under limited training data.", keywords: ["nlp", "machine-learning"] },
  { title: "Design of a Compact Microstrip Antenna for 5G Applications", abstract: "Presents a compact microstrip patch antenna design optimized for 5G sub-6GHz frequency bands.", keywords: ["signal-processing", "embedded-systems"] },
  { title: "Predictive Maintenance of Industrial Machinery Using IoT Sensor Data", abstract: "Uses vibration and temperature sensor data with machine learning to predict equipment failures before they occur.", keywords: ["iot", "machine-learning"] },
  { title: "Blockchain-Enabled Supply Chain Transparency for the Garment Industry", abstract: "Proposes a blockchain framework to track garment production stages and improve supply chain accountability.", keywords: ["blockchain", "data-science"] },
  { title: "Solar Photovoltaic Performance Analysis Under Tropical Climate Conditions", abstract: "Analyzes the efficiency degradation of solar panels under high humidity and temperature conditions typical of Bangladesh.", keywords: ["embedded-systems", "data-science"] },
  { title: "A Comparative Study of Load Balancing Algorithms in Cloud Computing", abstract: "Compares round-robin, least-connection, and predictive load balancing strategies across cloud workloads.", keywords: ["cloud-computing", "algorithms"] },
  { title: "Sentiment Analysis of Bengali Social Media Text Using Transformer Models", abstract: "Applies transformer-based models to classify sentiment in Bengali social media posts.", keywords: ["nlp", "data-science"] },
  { title: "Groundwater Arsenic Contamination Mapping Using GIS in Southern Bangladesh", abstract: "Maps arsenic concentration levels in groundwater across southern districts using geographic information systems.", keywords: ["data-science", "algorithms"] },
  { title: "Low-Cost Water Quality Monitoring System Using Arduino and IoT", abstract: "Describes an affordable sensor-based system for real-time monitoring of pH, turbidity, and dissolved oxygen.", keywords: ["iot", "embedded-systems"] },
  { title: "Optimizing Traffic Signal Control Using Reinforcement Learning in Dhaka City", abstract: "Applies reinforcement learning to adaptively control traffic signals and reduce congestion in urban intersections.", keywords: ["machine-learning", "algorithms"] },
  { title: "Structural Health Monitoring of Bridges Using Wireless Sensor Networks", abstract: "Deploys wireless sensor networks to continuously monitor strain and vibration in bridge structures.", keywords: ["iot", "embedded-systems"] },
  { title: "Federated Learning for Privacy-Preserving Healthcare Analytics", abstract: "Proposes a federated learning approach that trains predictive models across hospitals without sharing patient data.", keywords: ["machine-learning", "cybersecurity"] },
  { title: "Energy-Efficient Routing Protocols for Wireless Sensor Networks", abstract: "Introduces a routing protocol that extends network lifetime by minimizing redundant transmissions.", keywords: ["networking", "algorithms"] },
  { title: "Crop Yield Prediction Using Satellite Imagery and Machine Learning", abstract: "Combines multispectral satellite imagery with regression models to forecast seasonal crop yields.", keywords: ["machine-learning", "data-science"] },
  { title: "Cybersecurity Threat Detection Using Deep Neural Networks", abstract: "Evaluates deep learning models for detecting network intrusions and malware in real time.", keywords: ["cybersecurity", "machine-learning"] },
  { title: "Design and Analysis of a Hybrid Solar-Wind Power Generation System", abstract: "Models a hybrid renewable energy system combining solar and wind sources for off-grid rural electrification.", keywords: ["embedded-systems", "signal-processing"] },
  { title: "Natural Language Processing Techniques for Bengali Text Summarization", abstract: "Develops an extractive summarization pipeline tailored to the syntactic structure of Bengali text.", keywords: ["nlp", "algorithms"] },
  { title: "Flood Risk Assessment of the Brahmaputra Basin Using Remote Sensing", abstract: "Uses remote sensing and hydrological modeling to assess flood risk zones along the Brahmaputra basin.", keywords: ["data-science", "algorithms"] },
  { title: "Development of a Low-Cost Prosthetic Hand Using 3D Printing", abstract: "Presents a 3D-printed prosthetic hand design that reduces manufacturing cost while retaining functional grip.", keywords: ["robotics", "embedded-systems"] },
  { title: "Performance Evaluation of 5G Network Slicing for IoT Applications", abstract: "Evaluates latency and throughput performance of network slicing configurations for IoT use cases.", keywords: ["networking", "iot"] },
  { title: "Machine Learning Models for Early Detection of Diabetic Retinopathy", abstract: "Trains convolutional neural networks on retinal images to detect early signs of diabetic retinopathy.", keywords: ["machine-learning", "computer-vision"] },
  { title: "Analysis of Air Pollution Trends in Dhaka Using Time Series Models", abstract: "Applies time series forecasting to historical air quality data to identify pollution trends in Dhaka.", keywords: ["data-science", "algorithms"] },
  { title: "Smart Grid Load Forecasting Using LSTM Neural Networks", abstract: "Uses LSTM networks to forecast short-term electricity demand for smart grid load balancing.", keywords: ["machine-learning", "data-science"] },
  { title: "Usability Evaluation of Mobile Banking Applications in Bangladesh", abstract: "Conducts a usability study of leading mobile banking apps used by Bangladeshi consumers.", keywords: ["mobile-app", "data-science"] },
  { title: "Autonomous Navigation of Unmanned Ground Vehicles Using LiDAR", abstract: "Develops a LiDAR-based obstacle avoidance and path planning system for autonomous ground vehicles.", keywords: ["robotics", "computer-vision"] },
];

const RESEARCH_JOURNALS = ["IEEE Access", "Renewable Energy", "Journal of Cleaner Production", "Sensors (MDPI)", "International Journal of Computer Applications"];

const researchOutputs = researchContent.map((r, i) => ({
  output_id: `66666666-6666-6666-6666-${String(i + 1).padStart(12, "0")}`,
  title: r.title,
  abstract: r.abstract,
  authors: JSON.stringify([{ name: users[(i % 4) + 3].name }]),
  keywords: r.keywords,
  doi: `10.1234/dkp.2026.${String(i + 1).padStart(3, "0")}`,
  dkp_identifier: `DKP-RES-2026-${String(i + 1).padStart(3, "0")}`,
  file_url: `research/output-${i + 1}.pdf`,
  output_type: ["journal", "conference", "thesis", "dataset", "report"][i % 5],
  lab_id: labs[i % 3].lab_id,
  published_date: `2025-${String((i % 12) + 1).padStart(2, "0")}-15`,
  journal_name: RESEARCH_JOURNALS[i % 5],
  volume: String((i % 10) + 1),
  issue: String((i % 4) + 1),
  pages: `${i * 10 + 1}-${i * 10 + 12}`,
  uploaded_by: users[(i % 4) + 3].user_id,
}));

// ─── Student projects (20) ───────────────────────────────────────────────────
const showcaseContent: { title: string; abstract: string; technologies: string[] }[] = [
  { title: "Smart Attendance System Using Face Recognition", abstract: "Automates classroom attendance using real-time facial recognition integrated with a web dashboard.", technologies: ["Python", "OpenCV", "React"] },
  { title: "AI-Powered Chatbot for University Student Support", abstract: "A chatbot that answers common student queries about admissions, registration, and campus services.", technologies: ["Node.js", "Dialogflow", "MongoDB"] },
  { title: "IoT-Based Smart Home Automation System", abstract: "Controls lighting, temperature, and appliances remotely using ESP32 microcontrollers and a mobile app.", technologies: ["ESP32", "IoT", "Flutter"] },
  { title: "E-Commerce Platform for Local Handicraft Sellers", abstract: "A marketplace web app connecting rural artisans directly with buyers, cutting out middlemen.", technologies: ["Next.js", "Stripe", "PostgreSQL"] },
  { title: "Real-Time Traffic Sign Recognition Using CNN", abstract: "Detects and classifies traffic signs from a live video feed using a convolutional neural network.", technologies: ["TensorFlow", "Python", "OpenCV"] },
  { title: "Blood Donation Management Mobile Application", abstract: "Matches blood donors with recipients nearby based on blood type and urgency.", technologies: ["React Native", "Firebase", "Node.js"] },
  { title: "Autonomous Line-Following Robot for Warehouse Navigation", abstract: "A robot that follows floor markings to transport items between warehouse zones.", technologies: ["Arduino", "C++", "Embedded Systems"] },
  { title: "Bengali Fake News Detection Using NLP", abstract: "Classifies Bengali news articles as credible or fake using a fine-tuned transformer model.", technologies: ["Python", "Transformers", "Flask"] },
  { title: "Smart Parking System Using Ultrasonic Sensors", abstract: "Detects available parking slots in real time and displays them on a mobile app.", technologies: ["Arduino", "Ultrasonic Sensors", "Android"] },
  { title: "Online Examination and Proctoring System", abstract: "A web platform for conducting timed exams with webcam-based proctoring and plagiarism checks.", technologies: ["React", "Node.js", "WebRTC"] },
  { title: "Crop Disease Detection Using Deep Learning", abstract: "Identifies common crop diseases from leaf images captured via a smartphone camera.", technologies: ["TensorFlow", "Python", "Flutter"] },
  { title: "Campus Navigation App with Indoor Positioning", abstract: "Helps new students and visitors navigate campus buildings using Bluetooth beacon positioning.", technologies: ["Bluetooth Beacons", "React Native", "Node.js"] },
  { title: "Digital Wallet and Payment Gateway Integration", abstract: "A mobile wallet supporting peer-to-peer transfers and merchant payments with QR codes.", technologies: ["Node.js", "QR Code API", "PostgreSQL"] },
  { title: "Weather Monitoring Station Using IoT Sensors", abstract: "Collects and visualizes temperature, humidity, and rainfall data from a campus-based sensor station.", technologies: ["Raspberry Pi", "IoT", "Grafana"] },
  { title: "Sign Language Recognition Using Computer Vision", abstract: "Translates Bangla sign language gestures into text using a webcam and gesture classification model.", technologies: ["Python", "OpenCV", "Mediapipe"] },
  { title: "University Course Recommendation System", abstract: "Recommends elective courses to students based on their academic history and interests.", technologies: ["Python", "scikit-learn", "Django"] },
  { title: "Smart Waste Management System for Urban Areas", abstract: "Uses fill-level sensors in waste bins to optimize collection routes for municipal trucks.", technologies: ["IoT", "Arduino", "Node.js"] },
  { title: "Voice-Controlled Home Assistant Device", abstract: "A Raspberry Pi-based assistant that controls home appliances through Bengali and English voice commands.", technologies: ["Raspberry Pi", "Python", "Speech Recognition"] },
  { title: "Ride-Sharing Application for University Students", abstract: "Connects students traveling similar routes to share ride costs safely within the campus community.", technologies: ["React Native", "Firebase", "Google Maps API"] },
  { title: "Automated Irrigation System Using Soil Moisture Sensors", abstract: "Waters crops automatically when soil moisture drops below a configurable threshold.", technologies: ["Arduino", "Soil Sensors", "Node.js"] },
];

const studentProjects = showcaseContent.map((p, i) => ({
  project_id: `77777777-7777-7777-7777-${String(i + 1).padStart(12, "0")}`,
  title: p.title,
  abstract: p.abstract,
  team_members: JSON.stringify([
    { name: users[(i % 4) + 4].name, role: "Lead Developer" },
    { name: users[((i + 1) % 4) + 4].name, role: "Backend Developer" },
  ]),
  advisor_id: users[(i % 4) + 3].user_id,
  semester: ["Spring 2025", "Fall 2025", "Spring 2026"][i % 3],
  department: ["CSE", "EEE", "BBA", "Physics"][i % 4],
  technologies: p.technologies,
  report_url: `showcase/project-${i + 1}-report.pdf`,
  video_url: null,
  source_code_url: `https://github.com/dkp/project-${i + 1}`,
  thumbnail_url: null,
  status: ["published", "published", "pending_review", "published", "published"][i % 5],
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
  const issueDate = new Date(new Date(dueDate).getTime() - 14 * 86400000).toISOString().split("T")[0];
  return {
    transaction_id: `88888888-8888-8888-8888-${String(i + 1).padStart(12, "0")}`,
    member_id: users[(i % 6) + 5].user_id,
    catalog_id: catalogItems[i % 40].catalog_id,
    issue_date: issueDate,
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
  status: ["pending", "available", "fulfilled", "cancelled"][i % 4],
}));

// ─── Notifications (20) ──────────────────────────────────────────────────────
const notifications = Array.from({ length: 20 }, (_, i) => ({
  notification_id: `bbbbbbbb-bbbb-bbbb-bbbb-${String(i + 1).padStart(12, "0")}`,
  user_id: users[i % 16].user_id,
  type: ["announcement", "new_upload", "due_date_reminder", "access_request_approved", "system"][i % 5],
  title: `Notification ${i + 1}`,
  message: `This is notification message number ${i + 1} for the user.`,
  read: i % 3 === 0,
  action_url: ["/dashboard", "/archive", "/library", "/research", "/notifications"][i % 5],
}));

// ─── Announcements (5) ───────────────────────────────────────────────────────
const announcements = [
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc01", title: "Welcome to DKP", body: "The Digital Knowledge Platform is now live. Explore the archive, library, and research sections.", target_role: null },
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc02", title: "Library Hours Updated", body: "The library is now open from 8 AM to 10 PM on weekdays.", target_role: "member" },
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc03", title: "New Research Submissions", body: "Researchers can now submit outputs directly through the platform.", target_role: "researcher" },
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc04", title: "Showcase Deadline Reminder", body: "Student project submissions close on May 15, 2026.", target_role: "student_author" },
  { announcement_id: "cccccccc-cccc-cccc-cccc-cccccccccc05", title: "System Maintenance Notice", body: "Scheduled maintenance on Sunday 2 AM - 4 AM. Services may be unavailable.", target_role: null },
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
           (transaction_id, member_id, catalog_id, issue_date, due_date, return_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (transaction_id) DO NOTHING`,
        [lt.transaction_id, lt.member_id, lt.catalog_id, lt.issue_date, lt.due_date,
        lt.returned_date, lt.status]
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
        `INSERT INTO hold_requests (hold_id, member_id, catalog_id, status)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (hold_id) DO NOTHING`,
        [h.hold_id, h.member_id, h.catalog_id, h.status]
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
