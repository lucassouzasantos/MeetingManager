import { db } from '../server/db-sqlite.js';
import { rooms, users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function assignKitchenUsers() {
  console.log('🔧 Asignando usuarios de cocina a salas...\n');
  
  // Get all rooms and kitchen users
  const roomsData = await db.select().from(rooms).where(eq(rooms.isActive, true));
  const kitchenUsers = await db.select().from(users).where(eq(users.isKitchen, 1));
  
  console.log(`📍 Salas encontradas: ${roomsData.length}`);
  console.log(`👥 Usuarios de cocina encontrados: ${kitchenUsers.length}\n`);
  
  // Assign kitchen users to rooms
  const assignments = [
    { roomName: 'Sala de Reunião Principal', userId: kitchenUsers[0]?.id }, // Miriam
    { roomName: 'Sala de Videoconferência', userId: kitchenUsers[1]?.id }, // Lucas
    { roomName: 'Auditório', userId: kitchenUsers[2]?.id }, // lucas souza santos (ya asignado)
    { roomName: 'Sala de Brainstorm', userId: kitchenUsers[0]?.id }, // Miriam
  ];
  
  for (const assignment of assignments) {
    const room = roomsData.find(r => r.name === assignment.roomName);
    if (room && assignment.userId) {
      const kitchenUser = kitchenUsers.find(u => u.id === assignment.userId);
      
      await db.update(rooms)
        .set({ assignedKitchenUserId: assignment.userId })
        .where(eq(rooms.id, room.id));
      
      console.log(`✅ ${room.name} → ${kitchenUser?.fullName} (${kitchenUser?.username})`);
    } else {
      console.log(`❌ No se pudo asignar: ${assignment.roomName}`);
    }
  }
  
  console.log('\n🎉 Asignaciones completadas!');
}

assignKitchenUsers().catch(console.error);