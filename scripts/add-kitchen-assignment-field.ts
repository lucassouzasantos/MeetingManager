import { db } from "../server/db";

async function addKitchenAssignmentField() {
  try {
    console.log('🔧 Adding assignedKitchenUserId field to rooms table...');
    
    // Add the new column to the rooms table
    await db.run(`
      ALTER TABLE rooms 
      ADD COLUMN assigned_kitchen_user_id TEXT 
      REFERENCES users(id)
    `);
    
    console.log('✅ Kitchen assignment field added successfully');
    
  } catch (error) {
    // If the column already exists, that's fine
    if (error.message.includes('duplicate column name')) {
      console.log('📝 Kitchen assignment field already exists');
    } else {
      console.error('❌ Error adding kitchen assignment field:', error);
    }
  }
}

addKitchenAssignmentField().then(() => {
  console.log('🔧 Migration completed');
  process.exit(0);
});