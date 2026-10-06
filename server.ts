import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("scholarship.db");

// Initialize Database
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const idColumn = tableInfo.find(col => col.name === "id");
  if (idColumn && idColumn.type === "INTEGER") {
    console.log("Migrating users and activity_logs tables to support Firebase UID strings...");
    db.exec(`
      DROP TABLE IF EXISTS activity_logs;
      DROP TABLE IF EXISTS users;
    `);
  }
} catch (e) {
  // Ignore database or table info error
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT DEFAULT 'user',
      profile TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO users (id, email, password, name, role) VALUES ('admin', 'admin@gmail.com', 'Admin@420', 'Admin', 'admin');

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS scholarships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scholarshipName TEXT,
      university TEXT,
      country TEXT,
      degreeLevel TEXT,
      fundingCoverage TEXT,
      eligibility TEXT,
      requiredDocuments TEXT, -- Stored as JSON string
      ieltsRequirement TEXT,
      ieltsWaiverInfo TEXT,
      applicationLink TEXT,
      openingDate TEXT,
      closingDate TEXT,
      competitivenessLevel TEXT,
      status TEXT DEFAULT 'Active',
      isAnnual INTEGER DEFAULT 0,
      rankingReason TEXT,
      tags TEXT, -- Stored as JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visa_guidance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country TEXT,
      visaType TEXT,
      requirements TEXT,
      processingTime TEXT,
      fees TEXT,
      applicationLink TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS country_comparisons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country TEXT,
      visaDifficulty TEXT,
      costOfLiving TEXT,
      prOptions TEXT,
      acceptanceRate TEXT,
      partTimeWorkAllowance TEXT,
      postStudyWorkDuration TEXT,
      languageRequirements TEXT,
      englishProficiencyRequirements TEXT,
      averageTuitionFees TEXT,
      visaSuccessProbability INTEGER,
      pros TEXT,
      cons TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch (e) {
  console.error("Error initializing database:", e);
}

try {
  db.exec("ALTER TABLE users ADD COLUMN profile TEXT;");
} catch (e) {
  // Ignore error if column already exists
}

try {
  db.exec("ALTER TABLE scholarships ADD COLUMN status TEXT DEFAULT 'Active';");
} catch (e) {}
try {
  db.exec("ALTER TABLE scholarships ADD COLUMN isAnnual INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE scholarships ADD COLUMN rankingReason TEXT;");
} catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Auth Endpoints
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)");
      const result = stmt.run(email, password, name);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "User already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      // For the default admin, ensure the role is 'admin'
      if (user.email === 'admin@gmail.com' && user.password === 'Admin@420') {
        user.role = 'admin';
      }
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Profile Endpoints
  app.get("/api/user/profile", (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const user = db.prepare("SELECT profile FROM users WHERE id = ?").get(userId) as any;
    res.json({ profile: user?.profile ? JSON.parse(user.profile) : null });
  });

  app.post("/api/user/profile", (req, res) => {
    const { userId, profile } = req.body;
    if (!userId || !profile) return res.status(400).json({ error: "User ID and profile required" });
    db.prepare("UPDATE users SET profile = ? WHERE id = ?").run(JSON.stringify(profile), userId);
    res.json({ success: true });
  });

  app.post("/api/user/sync", (req, res) => {
    const { userId, email, name, role } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    try {
      db.prepare(`
        INSERT INTO users (id, email, name, role)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          email = COALESCE(excluded.email, users.email),
          name = COALESCE(excluded.name, users.name),
          role = COALESCE(excluded.role, users.role)
      `).run(userId, email || null, name || null, role || 'user');
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error syncing user:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Admin Endpoints
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
    res.json(users);
  });

  app.get("/api/admin/logs", (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, u.email 
      FROM activity_logs l 
      JOIN users u ON l.user_id = u.id 
      ORDER BY l.timestamp DESC
    `).all();
    res.json(logs);
  });

  app.post("/api/logs", (req, res) => {
    const { userId, action, details } = req.body;
    db.prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)").run(userId, action, details);
    res.json({ success: true });
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM activity_logs WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/admin/users/bulk-delete", (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No user IDs provided for bulk deletion." });
    }
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM activity_logs WHERE user_id IN (${placeholders})`).run(...ids);
    const stmt = db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`);
    stmt.run(...ids);
    res.json({ success: true });
  });

  app.put("/api/admin/users/:id/role", (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || (role !== 'user' && role !== 'admin')) {
      return res.status(400).json({ error: "Invalid role provided." });
    }
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
    res.json({ success: true });
  });

  // Scholarship Endpoints
  app.get("/api/admin/scholarships", (req, res) => {
    const scholarships = db.prepare("SELECT * FROM scholarships ORDER BY created_at DESC").all();
    res.json(scholarships);
  });

  app.post("/api/admin/scholarships", (req, res) => {
    const { scholarshipName, university, country, degreeLevel, fundingCoverage, eligibility, requiredDocuments, ieltsRequirement, ieltsWaiverInfo, applicationLink, openingDate, closingDate, competitivenessLevel, status, isAnnual, rankingReason, tags } = req.body;
    const stmt = db.prepare(
      "INSERT INTO scholarships (scholarshipName, university, country, degreeLevel, fundingCoverage, eligibility, requiredDocuments, ieltsRequirement, ieltsWaiverInfo, applicationLink, openingDate, closingDate, competitivenessLevel, status, isAnnual, rankingReason, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const result = stmt.run(scholarshipName, university, country, degreeLevel, fundingCoverage, eligibility, JSON.stringify(requiredDocuments), ieltsRequirement, ieltsWaiverInfo, applicationLink, openingDate, closingDate, competitivenessLevel, status || 'Active', isAnnual ? 1 : 0, rankingReason, JSON.stringify(tags));
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.put("/api/admin/scholarships/:id", (req, res) => {
    const { id } = req.params;
    const { scholarshipName, university, country, degreeLevel, fundingCoverage, eligibility, requiredDocuments, ieltsRequirement, ieltsWaiverInfo, applicationLink, openingDate, closingDate, competitivenessLevel, status, isAnnual, rankingReason, tags } = req.body;
    const stmt = db.prepare(
      "UPDATE scholarships SET scholarshipName=?, university=?, country=?, degreeLevel=?, fundingCoverage=?, eligibility=?, requiredDocuments=?, ieltsRequirement=?, ieltsWaiverInfo=?, applicationLink=?, openingDate=?, closingDate=?, competitivenessLevel=?, status=?, isAnnual=?, rankingReason=?, tags=? WHERE id=?"
    );
    stmt.run(scholarshipName, university, country, degreeLevel, fundingCoverage, eligibility, JSON.stringify(requiredDocuments), ieltsRequirement, ieltsWaiverInfo, applicationLink, openingDate, closingDate, competitivenessLevel, status, isAnnual ? 1 : 0, rankingReason, JSON.stringify(tags), id);
    res.json({ success: true });
  });

  app.delete("/api/admin/scholarships/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM scholarships WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Visa Guidance Endpoints
  app.get("/api/admin/visa-guidance", (req, res) => {
    const visaGuidance = db.prepare("SELECT * FROM visa_guidance ORDER BY country ASC").all();
    res.json(visaGuidance);
  });

  app.post("/api/admin/visa-guidance", (req, res) => {
    const { country, visaType, requirements, processingTime, fees, applicationLink, notes } = req.body;
    const stmt = db.prepare(
      "INSERT INTO visa_guidance (country, visaType, requirements, processingTime, fees, applicationLink, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const result = stmt.run(country, visaType, requirements, processingTime, fees, applicationLink, notes);
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.put("/api/admin/visa-guidance/:id", (req, res) => {
    const { id } = req.params;
    const { country, visaType, requirements, processingTime, fees, applicationLink, notes } = req.body;
    const stmt = db.prepare(
      "UPDATE visa_guidance SET country=?, visaType=?, requirements=?, processingTime=?, fees=?, applicationLink=?, notes=? WHERE id=?"
    );
    stmt.run(country, visaType, requirements, processingTime, fees, applicationLink, notes, id);
    res.json({ success: true });
  });

  app.delete("/api/admin/visa-guidance/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM visa_guidance WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Country Comparisons Endpoints
  app.get("/api/admin/country-comparisons", (req, res) => {
    const comparisons = db.prepare("SELECT * FROM country_comparisons ORDER BY country ASC").all();
    res.json(comparisons);
  });

  app.post("/api/admin/country-comparisons", (req, res) => {
    const { country, visaDifficulty, costOfLiving, prOptions, acceptanceRate, partTimeWorkAllowance, postStudyWorkDuration, languageRequirements, englishProficiencyRequirements, averageTuitionFees, visaSuccessProbability, pros, cons } = req.body;
    const stmt = db.prepare(
      "INSERT INTO country_comparisons (country, visaDifficulty, costOfLiving, prOptions, acceptanceRate, partTimeWorkAllowance, postStudyWorkDuration, languageRequirements, englishProficiencyRequirements, averageTuitionFees, visaSuccessProbability, pros, cons) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const result = stmt.run(country, visaDifficulty, costOfLiving, prOptions, acceptanceRate, partTimeWorkAllowance, postStudyWorkDuration, languageRequirements, englishProficiencyRequirements, averageTuitionFees, visaSuccessProbability, JSON.stringify(pros || []), JSON.stringify(cons || []));
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.put("/api/admin/country-comparisons/:id", (req, res) => {
    const { id } = req.params;
    const { country, visaDifficulty, costOfLiving, prOptions, acceptanceRate, partTimeWorkAllowance, postStudyWorkDuration, languageRequirements, englishProficiencyRequirements, averageTuitionFees, visaSuccessProbability, pros, cons } = req.body;
    const stmt = db.prepare(
      "UPDATE country_comparisons SET country=?, visaDifficulty=?, costOfLiving=?, prOptions=?, acceptanceRate=?, partTimeWorkAllowance=?, postStudyWorkDuration=?, languageRequirements=?, englishProficiencyRequirements=?, averageTuitionFees=?, visaSuccessProbability=?, pros=?, cons=? WHERE id=?"
    );
    stmt.run(country, visaDifficulty, costOfLiving, prOptions, acceptanceRate, partTimeWorkAllowance, postStudyWorkDuration, languageRequirements, englishProficiencyRequirements, averageTuitionFees, visaSuccessProbability, JSON.stringify(pros || []), JSON.stringify(cons || []), id);
    res.json({ success: true });
  });

  app.delete("/api/admin/country-comparisons/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM country_comparisons WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
