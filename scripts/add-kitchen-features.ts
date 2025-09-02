import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function addKitchenFeatures() {
  console.log("🔧 Adding kitchen management features to SQLite database...");

  try {
    // Add isKitchen column to users table
    await db.run(sql`ALTER TABLE users ADD COLUMN is_kitchen INTEGER DEFAULT 0`);
    console.log("✅ Added is_kitchen column to users table");

    // Add kitchen staff column to rooms table  
    await db.run(sql`ALTER TABLE rooms ADD COLUMN kitchen_staff TEXT`);
    console.log("✅ Added kitchen_staff column to rooms table");

    // Add cafe-related columns to bookings table
    await db.run(sql`ALTER TABLE bookings ADD COLUMN cafe_requested INTEGER DEFAULT 0`);
    await db.run(sql`ALTER TABLE bookings ADD COLUMN people_count INTEGER`);
    await db.run(sql`ALTER TABLE bookings ADD COLUMN requested_meals TEXT`);
    await db.run(sql`ALTER TABLE bookings ADD COLUMN requested_drinks TEXT`);
    console.log("✅ Added cafe service columns to bookings table");

    // Create kitchen_orders table
    await db.run(sql`
      CREATE TABLE kitchen_orders (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL REFERENCES bookings(id),
        room_id TEXT NOT NULL REFERENCES rooms(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        people_count INTEGER NOT NULL,
        requested_meals TEXT NOT NULL,
        requested_drinks TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        order_date TEXT NOT NULL,
        order_time TEXT NOT NULL,
        completed_at TEXT,
        completed_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    console.log("✅ Created kitchen_orders table");

    // Give kitchen permissions to admin users
    await db.run(sql`UPDATE users SET is_kitchen = 1 WHERE is_admin = 1`);
    console.log("✅ Granted kitchen permissions to admin users");

    console.log("🎉 Kitchen management features added successfully!");

  } catch (error) {
    console.error("❌ Error adding kitchen features:", error);
    throw error;
  }
}

addKitchenFeatures().catch(console.error);