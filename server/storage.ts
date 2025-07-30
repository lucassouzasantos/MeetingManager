import { users, rooms, bookings, type User, type InsertUser, type Room, type InsertRoom, type Booking, type InsertBooking, type BookingWithDetails } from "@shared/schema";
import { db } from "./db";
import { eq, ne, and, desc, count, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  
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
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
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
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
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
      .values(room)
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
      .values(booking)
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
    const conditions = [
      eq(bookings.roomId, roomId),
      eq(bookings.date, date),
      eq(bookings.status, "confirmed"),
      sql`(
        (${startTime} >= start_time AND ${startTime} < end_time) OR
        (${endTime} > start_time AND ${endTime} <= end_time) OR
        (${startTime} <= start_time AND ${endTime} >= end_time)
      )`
    ];

    if (excludeBookingId) {
      conditions.push(ne(bookings.id, excludeBookingId));
    }

    const conflicts = await db
      .select()
      .from(bookings)
      .where(and(...conditions));
      
    return conflicts.length > 0;
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
    
    const [todayBookingsResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.date, today));

    const [activeRoomsResult] = await db
      .select({ count: count() })
      .from(rooms)
      .where(eq(rooms.isActive, true));

    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(users);

    // Calculate occupancy rate (simplified - rooms with bookings today / total rooms)
    const [occupiedRoomsResult] = await db
      .select({ count: count(sql`DISTINCT ${bookings.roomId}`) })
      .from(bookings)
      .where(eq(bookings.date, today));

    const occupancyRate = activeRoomsResult.count > 0 
      ? Math.round((occupiedRoomsResult.count / activeRoomsResult.count) * 100)
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
