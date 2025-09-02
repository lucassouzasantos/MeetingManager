import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  position: text("position").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: integer("is_admin", { mode: 'boolean' }).notNull().default(false),
  isKitchen: integer("is_kitchen", { mode: 'boolean' }).notNull().default(false), // Nuevo rol de cocina
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  assignedKitchenUserId: text("assigned_kitchen_user_id").references(() => users.id), // Usuario de cocina asignado para recibir notificaciones
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  responsavel: text("responsavel"), // Campo opcional para responsável pela reunião
  date: text("date").notNull(), // Format: YYYY-MM-DD
  startTime: text("start_time").notNull(), // Format: HH:MM
  endTime: text("end_time").notNull(), // Format: HH:MM
  userId: text("user_id").notNull().references(() => users.id),
  roomId: text("room_id").notNull().references(() => rooms.id),
  status: text("status").notNull().default("confirmed"), // confirmed, pending, cancelled
  // Campos para servicio de café
  cafeRequested: integer("cafe_requested", { mode: 'boolean' }).notNull().default(false),
  peopleCount: integer("people_count"),
  requestedMeals: text("requested_meals"),
  requestedDrinks: text("requested_drinks"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// Nueva tabla para pedidos de cocina
export const kitchenOrders = sqliteTable("kitchen_orders", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  roomId: text("room_id").notNull().references(() => rooms.id),
  userId: text("user_id").notNull().references(() => users.id),
  peopleCount: integer("people_count").notNull(),
  requestedMeals: text("requested_meals").notNull(),
  requestedDrinks: text("requested_drinks").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed
  orderDate: text("order_date").notNull(),
  orderTime: text("order_time").notNull(),
  completedAt: text("completed_at"),
  completedBy: text("completed_by"), // ID del usuario de cocina que completó el pedido
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  kitchenOrders: many(kitchenOrders),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  bookings: many(bookings),
  kitchenOrders: many(kitchenOrders),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [bookings.roomId],
    references: [rooms.id],
  }),
  kitchenOrders: many(kitchenOrders),
}));

export const kitchenOrdersRelations = relations(kitchenOrders, ({ one }) => ({
  booking: one(bookings, {
    fields: [kitchenOrders.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [kitchenOrders.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [kitchenOrders.roomId],
    references: [rooms.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  position: true,
  email: true,
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  location: true,
  capacity: true,
  assignedKitchenUserId: true,
}).extend({
  assignedKitchenUserId: z.string().optional(),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  title: true,
  description: true,
  responsavel: true,
  date: true,
  startTime: true,
  endTime: true,
  roomId: true,
  cafeRequested: true,
  peopleCount: true,
  requestedMeals: true,
  requestedDrinks: true,
});

export const insertKitchenOrderSchema = createInsertSchema(kitchenOrders).pick({
  bookingId: true,
  roomId: true,
  userId: true,
  peopleCount: true,
  requestedMeals: true,
  requestedDrinks: true,
  orderDate: true,
  orderTime: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertKitchenOrder = z.infer<typeof insertKitchenOrderSchema>;
export type KitchenOrder = typeof kitchenOrders.$inferSelect;

// Extended types with relations
export type BookingWithDetails = Booking & {
  user: User;
  room: Room;
};

export type KitchenOrderWithDetails = KitchenOrder & {
  booking: Booking;
  user: User;
  room: Room;
};

// Form validation schemas
export const roomFormSchema = insertRoomSchema.extend({
  capacity: z.number().min(1, "La capacidad debe ser al menos 1").max(500, "La capacidad no puede exceder 500 personas"),
});

export const editRoomFormSchema = roomFormSchema;

export const bookingFormSchema = insertBookingSchema.extend({
  date: z.string().min(1, "La fecha es obligatoria"),
  startTime: z.string().min(1, "La hora de inicio es obligatoria"),
  endTime: z.string().min(1, "La hora de fin es obligatoria"),
  title: z.string().min(1, "El título es obligatorio").max(100, "Título demasiado largo"),
  roomId: z.string().min(1, "La sala es obligatoria"),
  responsavel: z.string().optional(), // Campo opcional
  cafeRequested: z.boolean().default(false).optional(),
  peopleCount: z.number().min(1, "Debe indicar al menos 1 persona").optional(),
  requestedMeals: z.string().optional(),
  requestedDrinks: z.string().optional(),
});

export type RoomForm = z.infer<typeof roomFormSchema>;
export type EditRoomForm = z.infer<typeof editRoomFormSchema>;
export type BookingForm = z.infer<typeof bookingFormSchema>;
export type KitchenOrderForm = z.infer<typeof insertKitchenOrderSchema>;
