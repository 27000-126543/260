import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'agriculture.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'farmer',
      avatar TEXT,
      id_card_verified INTEGER DEFAULT 0,
      credit_score INTEGER DEFAULT 650,
      member_level TEXT DEFAULT 'normal',
      total_trade_amount REAL DEFAULT 0,
      total_plant_area REAL DEFAULT 0,
      points INTEGER DEFAULT 0,
      province TEXT,
      city TEXT,
      district TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lands (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      area REAL NOT NULL,
      province TEXT,
      city TEXT,
      district TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      soil_type TEXT,
      ph_value REAL,
      organic_matter REAL,
      nitrogen REAL,
      phosphorus REAL,
      potassium REAL,
      current_crop TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS planting_records (
      id TEXT PRIMARY KEY,
      land_id TEXT NOT NULL,
      crop TEXT NOT NULL,
      variety TEXT,
      sowing_date TEXT,
      harvest_date TEXT,
      yield REAL,
      income REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      manager TEXT,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      warehouse_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT DEFAULT 'store',
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      province TEXT,
      city TEXT,
      district TEXT,
      address TEXT,
      receiver_name TEXT,
      receiver_phone TEXT,
      warehouse_id TEXT,
      logistics_id TEXT,
      logistics_company TEXT,
      tracking_no TEXT,
      temperature REAL,
      humidity REAL,
      created_at TEXT DEFAULT (datetime('now')),
      paid_at TEXT,
      shipped_at TEXT,
      delivered_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      spec TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logistics_tracks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      location TEXT,
      description TEXT,
      temperature REAL,
      humidity REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pest_detections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      disease_name TEXT,
      severity TEXT,
      confidence REAL,
      description TEXT,
      suggestions TEXT,
      expert_assigned INTEGER DEFAULT 0,
      expert_id TEXT,
      expert_report TEXT,
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS market_products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      images TEXT,
      price REAL NOT NULL,
      suggested_price REAL,
      stock INTEGER DEFAULT 0,
      unit TEXT,
      origin TEXT,
      harvest_date TEXT,
      description TEXT,
      trace_code TEXT UNIQUE,
      status TEXT DEFAULT 'onsale',
      sales INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trace_records (
      id TEXT PRIMARY KEY,
      trace_code TEXT NOT NULL,
      product_id TEXT,
      stage TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      operator TEXT,
      location TEXT,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loan_applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      amount REAL NOT NULL,
      term INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      approved_amount REAL,
      start_date TEXT,
      end_date TEXT,
      remaining_amount REAL,
      credit_score_used INTEGER,
      risk_level TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weather_data (
      id TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      date TEXT NOT NULL,
      temperature REAL,
      humidity REAL,
      wind_level INTEGER,
      condition TEXT,
      forecast_data TEXT,
      warnings TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS system_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const warehouseCount = db.prepare('SELECT COUNT(*) as count FROM warehouses').get() as { count: number };
  if (warehouseCount.count === 0) {
    const insertWarehouse = db.prepare(`
      INSERT INTO warehouses (id, name, province, city, district, address, latitude, longitude, manager, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const warehouses = [
      ['wh001', '华北中心仓库', '北京', '北京市', '朝阳区', '朝阳区建国路88号', 39.9042, 116.4074, '张经理', '13800138001'],
      ['wh002', '华东中心仓库', '上海', '上海市', '浦东新区', '浦东新区张江高科技园区', 31.2304, 121.4737, '李经理', '13800138002'],
      ['wh003', '华南中心仓库', '广东', '广州市', '天河区', '天河区珠江新城', 23.1291, 113.2644, '王经理', '13800138003'],
      ['wh004', '华中中心仓库', '湖北', '武汉市', '洪山区', '洪山区光谷广场', 30.5928, 114.3055, '赵经理', '13800138004'],
      ['wh005', '西南中心仓库', '四川', '成都市', '武侯区', '武侯区天府大道', 30.5728, 104.0668, '孙经理', '13800138005'],
    ];
    
    warehouses.forEach(w => insertWarehouse.run(...w));
  }
}

initDatabase();

export default db;
