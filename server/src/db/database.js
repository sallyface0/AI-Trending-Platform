const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../projects.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Helper: run migrations sequentially with proper callback chaining
function runMigrationsSequentially(migrations, callback) {
    let index = 0;
    function next() {
        if (index >= migrations.length) {
            return callback(null);
        }
        const [col, type] = migrations[index++];
        db.run(`ALTER TABLE Projects ADD COLUMN ${col} ${type}`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error(`Migration error (${col}):`, err.message);
            }
            next();
        });
    }
    next();
}

const initPromise = new Promise((resolve, reject) => {
    db.serialize(() => {
        // ====== Projects 表 ======
        db.run(`
            CREATE TABLE IF NOT EXISTS Projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repo_full_name TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                owner TEXT NOT NULL,
                description_en TEXT,
                description_cn TEXT,
                star_count INTEGER DEFAULT 0,
                forks_count INTEGER DEFAULT 0,
                open_issues_count INTEGER DEFAULT 0,
                language TEXT,
                topics TEXT DEFAULT '[]',
                url TEXT,
                avatar_url TEXT,
                homepage TEXT,
                created_at DATETIME,
                updated_at DATETIME,
                fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `, (err) => {
            if (err) console.error('Error creating Projects table:', err.message);
            else console.log('Projects table initialized.');
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_star_count ON Projects (star_count DESC);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_fetched_at ON Projects (fetched_at DESC);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_forks_count ON Projects (forks_count DESC);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_updated_at ON Projects (updated_at DESC);`);

        // ====== Skills 表 ======
        db.run(`
            CREATE TABLE IF NOT EXISTS Skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repo_full_name TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                owner TEXT NOT NULL,
                description_en TEXT,
                description_cn TEXT,
                star_count INTEGER DEFAULT 0,
                forks_count INTEGER DEFAULT 0,
                language TEXT,
                skill_type TEXT DEFAULT 'skill',
                compatible_tools TEXT DEFAULT '[]',
                category TEXT DEFAULT 'other',
                tags TEXT DEFAULT '[]',
                install_command TEXT,
                is_new INTEGER DEFAULT 0,
                popularity_score REAL DEFAULT 0,
                url TEXT,
                avatar_url TEXT,
                created_at DATETIME,
                updated_at DATETIME,
                fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `, (err) => {
            if (err) console.error('Error creating Skills table:', err.message);
            else console.log('Skills table initialized.');
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_skills_type ON Skills (skill_type);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_skills_category ON Skills (category);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_skills_stars ON Skills (star_count DESC);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_skills_new ON Skills (is_new, created_at DESC);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_skills_popularity ON Skills (popularity_score DESC);`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_skills_fetched ON Skills (fetched_at DESC);`);

        // ====== Projects 表 Migration（串行执行，确保全部完成）=====
        const projectMigrations = [
            ['forks_count', 'INTEGER DEFAULT 0'],
            ['open_issues_count', 'INTEGER DEFAULT 0'],
            ['topics', "TEXT DEFAULT '[]'"],
            ['avatar_url', 'TEXT'],
            ['homepage', 'TEXT'],
            ['created_at', 'DATETIME'],
            ['updated_at', 'DATETIME'],
            ['star_delta', 'INTEGER DEFAULT 0'],
            ['trending_stars', 'INTEGER DEFAULT 0'],
            ['trending_range', "TEXT DEFAULT 'all'"],
        ];

        // Wait for serialize to queue all the above, then run migrations
        db.run('SELECT 1', () => {
            runMigrationsSequentially(projectMigrations, (err) => {
                if (err) console.error('Migration error:', err);
                // Create index AFTER migration is done
                db.run(`CREATE INDEX IF NOT EXISTS idx_trending_range ON Projects (trending_range);`, () => {
                    console.log('Database migration complete.');
                    resolve();
                });
            });
        });
    });
});

db.waitForInit = () => initPromise;

module.exports = db;
