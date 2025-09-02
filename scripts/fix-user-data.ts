import { db } from '../server/db-sqlite.js';
import { users } from '../shared/schema.js';
import { isNull } from 'drizzle-orm';

async function fixUserData() {
  console.log('🔧 Limpiando datos de usuarios problemáticos...\n');
  
  // Remove users with null IDs
  const deletedUsers = await db
    .delete(users)
    .where(isNull(users.id))
    .returning();
  
  console.log(`🗑️  Usuarios con ID null eliminados: ${deletedUsers.length}`);
  
  // Check remaining users
  const allUsers = await db.select().from(users);
  console.log(`👥 Usuarios restantes: ${allUsers.length}`);
  
  for (const user of allUsers) {
    console.log(`- ${user.fullName} (${user.username}) - ID: ${user.id} - Kitchen: ${user.isKitchen}`);
  }
  
  console.log('\n✅ Limpieza completada!');
}

fixUserData().catch(console.error);