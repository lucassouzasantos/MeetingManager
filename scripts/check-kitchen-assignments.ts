import { db } from '../server/db-sqlite.js';
import { rooms, users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function checkKitchenAssignments() {
  console.log('🔍 Verificando asignaciones de cocina...\n');
  
  // Get all rooms with their assigned kitchen users
  const roomsData = await db.select({
    id: rooms.id,
    name: rooms.name,
    assignedKitchenUserId: rooms.assignedKitchenUserId,
    isActive: rooms.isActive
  }).from(rooms).where(eq(rooms.isActive, true));
  
  console.log('📋 Salas activas:');
  for (const room of roomsData) {
    console.log(`- ${room.name} (ID: ${room.id})`);
    if (room.assignedKitchenUserId) {
      const kitchenUser = await db.select({
        fullName: users.fullName,
        username: users.username,
        isKitchen: users.isKitchen
      }).from(users).where(eq(users.id, room.assignedKitchenUserId));
      
      if (kitchenUser.length > 0) {
        console.log(`  ✅ Usuario de cocina asignado: ${kitchenUser[0].fullName} (${kitchenUser[0].username}) - isKitchen: ${kitchenUser[0].isKitchen}`);
      } else {
        console.log(`  ❌ Usuario de cocina asignado no encontrado: ${room.assignedKitchenUserId}`);
      }
    } else {
      console.log(`  ⚠️  Sin usuario de cocina asignado`);
    }
    console.log('');
  }
  
  // Get all kitchen users
  const kitchenUsers = await db.select({
    id: users.id,
    fullName: users.fullName,
    username: users.username,
    isKitchen: users.isKitchen
  }).from(users).where(eq(users.isKitchen, 1));
  
  console.log('👥 Usuarios de cocina disponibles:');
  for (const user of kitchenUsers) {
    console.log(`- ${user.fullName} (${user.username}) - ID: ${user.id}`);
  }
}

checkKitchenAssignments().catch(console.error);