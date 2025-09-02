import { users, rooms, bookings, type User, type InsertUser, type Room, type InsertRoom, type Booking, type InsertBooking, type BookingWithDetails } from "@shared/schema";
import { db } from "./db";
import { eq, ne, and, desc, count, sql } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";
import { nanoid } from "nanoid";

// Use MemoryStore for sessions with SQLite
const MemorySessionStore = MemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  updateUserAdminStatus(id: string, isAdmin: boolean): Promise<boolean>;
  
  getRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<boolean>;
  
  getBookings(): Promise<BookingWithDetails[]>;
  getBookingsByUser(userId: string): Promise<BookingWithDetails[]>;
  getBooking(id: string): Promise<BookingWithDetails | undefined>;
  createBooking(booking: InsertBooking & { userId: string }): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;
  checkBookingConflict(roomId: string, date: string, startTime: string, endTime: string, excludeBookingId?: string): Promise<boolean>;
  
  getRoomStats(): Promise<{ roomId: string; roomName: string; bookingCount: number; location: string }[]>;
  getDashboardStats(): Promise<{
    todayBookings: number;
    activeRooms: number;
    occupancyRate: number;
    activeUsers: number;
  }>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000 // 24h
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        id: nanoid()
      })
      .returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<boolean> {
    try {
      const result = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error updating user password:", error);
      return false;
    }
  }



  async getAllUsers(): Promise<User[]> {
    return await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      position: users.position,
      email: users.email,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      password: sql`''`.mapWith(String).as('password') // Don't return password
    }).from(users).orderBy(users.fullName);
  }

  async updateUserAdminStatus(id: string, isAdmin: boolean): Promise<boolean> {
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin: isAdmin })
      .where(eq(users.id, id))
      .returning();
    return !!updatedUser;
  }

  // Room methods
  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.isActive, true)).orderBy(rooms.name);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db
      .insert(rooms)
      .values({
        ...room,
        id: nanoid()
      })
      .returning();
    return newRoom;
  }

  async updateRoom(id: string, room: Partial<InsertRoom>): Promise<Room | undefined> {
    const [updatedRoom] = await db
      .update(rooms)
      .set(room)
      .where(eq(rooms.id, id))
      .returning();
    return updatedRoom || undefined;
  }

  async deleteRoom(id: string): Promise<boolean> {
    const [deletedRoom] = await db
      .update(rooms)
      .set({ isActive: false })
      .where(eq(rooms.id, id))
      .returning();
    return !!deletedRoom;
  }

  // Booking methods
  async getBookings(): Promise<BookingWithDetails[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .orderBy(desc(bookings.date), desc(bookings.startTime))
      .then(results => 
        results.map(result => ({
          ...result.bookings,
          user: result.users!,
          room: result.rooms!,
        }))
      );
  }

  async getBookingsByUser(userId: string): Promise<BookingWithDetails[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.date), desc(bookings.startTime))
      .then(results => 
        results.map(result => ({
          ...result.bookings,
          user: result.users!,
          room: result.rooms!,
        }))
      );
  }

  async getBooking(id: string): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(eq(bookings.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.bookings,
      user: result.users!,
      room: result.rooms!,
    };
  }

  async createBooking(booking: InsertBooking & { userId: string }): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values({
        ...booking,
        id: nanoid()
      })
      .returning();
    return newBooking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(booking)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking || undefined;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const [deletedBooking] = await db
      .delete(bookings)
      .where(eq(bookings.id, id))
      .returning();
    return !!deletedBooking;
  }

  async checkBookingConflict(roomId: string, date: string, startTime: string, endTime: string, excludeBookingId?: string): Promise<boolean> {
    // Buscar todos os agendamentos confirmados para a mesma sala e data
    let query = db
      .select()
      .from(bookings)
      .where(and(
        eq(bookings.roomId, roomId),
        eq(bookings.date, date),
        eq(bookings.status, "confirmed")
      ));

    // Se há um ID para excluir (edição), adicionar a condição
    if (excludeBookingId) {
      query = query.where(ne(bookings.id, excludeBookingId));
    }

    const existingBookings = await query;
    
    console.log(`🔍 Verificando conflitos para sala ${roomId} em ${date} de ${startTime} às ${endTime}`);
    console.log(`   Agendamentos existentes: ${existingBookings.length}`);
    
    // Verificar conflito manualmente para cada agendamento existente
    for (const existing of existingBookings) {
      const hasConflict = this.timeRangesOverlap(
        startTime, endTime,
        existing.startTime, existing.endTime
      );
      
      if (hasConflict) {
        console.log(`   ❌ CONFLITO encontrado com: "${existing.title}" (${existing.startTime}-${existing.endTime})`);
        return true;
      }
    }
    
    console.log(`   ✅ Sem conflitos encontrados`);
    return false;
  }

  // Função auxiliar para verificar se dois períodos de tempo se sobrepõem
  private timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    // Converte strings de tempo para minutos desde meia-noite para comparação mais fácil
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);
    
    // Verifica se há sobreposição:
    // Novo agendamento começa antes do existente terminar E
    // Novo agendamento termina depois do existente começar
    const overlaps = start1Min < end2Min && end1Min > start2Min;
    
    console.log(`     Comparando ${start1}-${end1} (${start1Min}-${end1Min}) com ${start2}-${end2} (${start2Min}-${end2Min}): ${overlaps ? 'CONFLITO' : 'OK'}`);
    
    return overlaps;
  }

  async getRoomStats(): Promise<{ roomId: string; roomName: string; bookingCount: number; location: string }[]> {
    return await db
      .select({
        roomId: rooms.id,
        roomName: rooms.name,
        location: rooms.location,
        bookingCount: count(bookings.id),
      })
      .from(rooms)
      .leftJoin(bookings, eq(rooms.id, bookings.roomId))
      .where(eq(rooms.isActive, true))
      .groupBy(rooms.id, rooms.name, rooms.location)
      .orderBy(desc(count(bookings.id)));
  }

  async getDashboardStats(): Promise<{
    todayBookings: number;
    activeRooms: number;
    occupancyRate: number;
    activeUsers: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Agendamentos confirmados para hoje
    const [todayBookingsResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(
        eq(bookings.date, today),
        eq(bookings.status, "confirmed")
      ));

    // Salas ativas
    const [activeRoomsResult] = await db
      .select({ count: count() })
      .from(rooms)
      .where(eq(rooms.isActive, true));

    // Usuários que fizeram pelo menos um agendamento (considerados ativos)
    const [activeUsersResult] = await db
      .select({ count: count(sql`DISTINCT ${bookings.userId}`) })
      .from(bookings)
      .where(eq(bookings.status, "confirmed"));

    // Taxa de ocupação: tempo total reservado / tempo total disponível de todas as salas
    // Horário de funcionamento: 7:00 - 18:00 = 11 horas = 660 minutos por sala
    const workingMinutesPerRoom = 660; // 11 horas * 60 minutos
    const totalAvailableMinutes = activeRoomsResult.count * workingMinutesPerRoom;

    // Calcular tempo total reservado hoje
    const todayBookingsWithTime = await db
      .select({
        startTime: bookings.startTime,
        endTime: bookings.endTime
      })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(and(
        eq(bookings.date, today),
        eq(bookings.status, "confirmed"),
        eq(rooms.isActive, true)
      ));

    let totalReservedMinutes = 0;
    for (const booking of todayBookingsWithTime) {
      // Converter horários para minutos para facilitar o cálculo
      const [startHour, startMin] = booking.startTime.split(':').map(Number);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      // Somar duração da reserva ao total
      totalReservedMinutes += (endMinutes - startMinutes);
    }

    // Taxa de ocupação = (tempo reservado / tempo total disponível) * 100
    const occupancyRate = totalAvailableMinutes > 0 
      ? Math.round((totalReservedMinutes / totalAvailableMinutes) * 100)
      : 0;

    return {
      todayBookings: todayBookingsResult.count,
      activeRooms: activeRoomsResult.count,
      occupancyRate,
      activeUsers: activeUsersResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
