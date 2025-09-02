import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { insertRoomSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";

// Store WebSocket connections by user ID
const kitchenConnections = new Map<string, WebSocket[]>();

// Helper function to send notifications to kitchen users
export function notifyKitchenUsers(kitchenUserId: string, data: any) {
  const userConnections = kitchenConnections.get(kitchenUserId);
  if (userConnections) {
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // User management routes (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/admin", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { isAdmin } = req.body;
      const success = await storage.updateUserAdminStatus(req.params.id, isAdmin);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User admin status updated successfully" });
    } catch (error) {
      console.error("Error updating user admin status:", error);
      res.status(500).json({ message: "Failed to update user admin status" });
    }
  });

  app.patch("/api/users/:id/kitchen", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { isKitchen } = req.body;
      const success = await storage.updateUserKitchenStatus(req.params.id, isKitchen);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User kitchen status updated successfully" });
    } catch (error) {
      console.error("Error updating user kitchen status:", error);
      res.status(500).json({ message: "Failed to update user kitchen status" });
    }
  });

  app.put("/api/users/:id/password", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const hashedPassword = await hashPassword(password);
      const success = await storage.updateUserPassword(req.params.id, hashedPassword);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User password updated successfully" });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ message: "Failed to update user password" });
    }
  });

  app.patch("/api/users/:id/kitchen", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { isKitchen } = req.body;
      const success = await storage.updateUserKitchenStatus(req.params.id, isKitchen);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User kitchen status updated successfully" });
    } catch (error) {
      console.error("Error updating user kitchen status:", error);
      res.status(500).json({ message: "Failed to update user kitchen status" });
    }
  });

  // Room routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(400).json({ message: "Invalid room data" });
    }
  });

  app.patch("/api/rooms/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const roomData = insertRoomSchema.partial().parse(req.body);
      const room = await storage.updateRoom(req.params.id, roomData);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(400).json({ message: "Invalid room data" });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const success = await storage.deleteRoom(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // Booking routes
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Return only user's own bookings for regular users
      const bookings = await storage.getBookingsByUser(req.user.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get all bookings (for dashboard)
  app.get("/api/bookings/all", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Check for conflicts
      const hasConflict = await storage.checkBookingConflict(
        bookingData.roomId,
        bookingData.date,
        bookingData.startTime,
        bookingData.endTime
      );

      if (hasConflict) {
        return res.status(409).json({ message: "Room is already booked for this time slot" });
      }

      // Validate time range
      if (bookingData.startTime >= bookingData.endTime) {
        return res.status(400).json({ message: "End time must be after start time" });
      }

      const booking = await storage.createBooking({
        ...bookingData,
        userId: req.user!.id,
      });
      
      // Create kitchen order if cafe service was requested
      if (bookingData.cafeRequested && bookingData.peopleCount) {
        try {
          // Get room details to check for assigned kitchen user
          const room = await storage.getRoom(bookingData.roomId);
          
          if (!room?.assignedKitchenUserId) {
            console.log("⚠️  No kitchen user assigned to room:", room?.name || bookingData.roomId);
            // Don't create kitchen order if no kitchen user is assigned to this room
          } else {
            const kitchenOrder = await storage.createKitchenOrder({
              bookingId: booking.id,
              roomId: bookingData.roomId,
              userId: room.assignedKitchenUserId, // Use the assigned kitchen user instead of booking user
              peopleCount: bookingData.peopleCount,
              requestedMeals: bookingData.requestedMeals || "",
              requestedDrinks: bookingData.requestedDrinks || "",
              orderDate: bookingData.date,
              orderTime: bookingData.startTime,
            });
            
            // Send real-time notification to kitchen user
            notifyKitchenUsers(room.assignedKitchenUserId, {
              type: 'NEW_KITCHEN_ORDER',
              order: kitchenOrder,
              booking: {
                title: booking.title,
                date: bookingData.date,
                startTime: bookingData.startTime,
                endTime: bookingData.endTime,
                room: room.name
              },
              message: `Nuevo pedido de café para ${room.name}`
            });
            
            console.log("📧 Kitchen order created for assigned user:", room.assignedKitchenUserId, "for booking:", booking.id);
            console.log("🔔 Real-time notification sent to kitchen user:", room.assignedKitchenUserId);
          }
        } catch (kitchenError) {
          console.error("⚠️  Failed to create kitchen order:", kitchenError);
          // Don't fail the booking if kitchen order creation fails
        }
      }
      
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create booking" });
      }
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const existingBooking = await storage.getBooking(req.params.id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user owns booking or is admin
      if (existingBooking.userId !== req.user!.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const bookingData = insertBookingSchema.partial().parse(req.body);
      
      // If updating time/date/room, check for conflicts
      if (bookingData.roomId || bookingData.date || bookingData.startTime || bookingData.endTime) {
        const roomId = bookingData.roomId || existingBooking.roomId;
        const date = bookingData.date || existingBooking.date;
        const startTime = bookingData.startTime || existingBooking.startTime;
        const endTime = bookingData.endTime || existingBooking.endTime;

        if (startTime >= endTime) {
          return res.status(400).json({ message: "End time must be after start time" });
        }

        const hasConflict = await storage.checkBookingConflict(
          roomId,
          date,
          startTime,
          endTime,
          req.params.id
        );

        if (hasConflict) {
          return res.status(409).json({ message: "Room is already booked for this time slot" });
        }
      }

      const booking = await storage.updateBooking(req.params.id, bookingData);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const existingBooking = await storage.getBooking(req.params.id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user owns booking or is admin
      if (existingBooking.userId !== req.user!.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteBooking(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Dashboard stats - Available to all authenticated users
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/room-stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const roomStats = await storage.getRoomStats();
      res.json(roomStats);
    } catch (error) {
      console.error("Error fetching room stats:", error);
      res.status(500).json({ message: "Failed to fetch room stats" });
    }
  });

  // Kitchen order routes
  app.get("/api/kitchen/orders", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isKitchen) {
      return res.status(403).json({ message: "Kitchen access required" });
    }

    try {
      // Get orders only for rooms where this user is assigned as kitchen responsible
      const orders = await storage.getKitchenOrdersByUser(req.user!.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching kitchen orders:", error);
      res.status(500).json({ message: "Failed to fetch kitchen orders" });
    }
  });

  app.get("/api/kitchen/orders/room/:roomId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isKitchen) {
      return res.status(403).json({ message: "Kitchen access required" });
    }

    try {
      const orders = await storage.getKitchenOrdersByRoom(req.params.roomId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching kitchen orders for room:", error);
      res.status(500).json({ message: "Failed to fetch kitchen orders" });
    }
  });

  app.post("/api/kitchen/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // This will be called automatically when a booking with cafe service is created
      const orderData = {
        ...req.body,
        userId: req.user!.id,
      };
      const order = await storage.createKitchenOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating kitchen order:", error);
      res.status(500).json({ message: "Failed to create kitchen order" });
    }
  });

  app.patch("/api/kitchen/orders/:id/complete", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isKitchen) {
      return res.status(403).json({ message: "Kitchen access required" });
    }

    try {
      const order = await storage.updateKitchenOrderStatus(req.params.id, 'completed', req.user!.id);
      if (!order) {
        return res.status(404).json({ message: "Kitchen order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error completing kitchen order:", error);
      res.status(500).json({ message: "Failed to complete kitchen order" });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('📡 WebSocket connection established');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'KITCHEN_USER_CONNECT' && data.userId) {
          // Store this connection for the kitchen user
          if (!kitchenConnections.has(data.userId)) {
            kitchenConnections.set(data.userId, []);
          }
          kitchenConnections.get(data.userId)!.push(ws);
          
          console.log(`🍽️ Kitchen user ${data.userId} connected to WebSocket`);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'CONNECTION_CONFIRMED',
            message: 'Connected to kitchen notifications'
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove this connection from all kitchen user connections
      for (const [userId, connections] of Array.from(kitchenConnections.entries())) {
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
          if (connections.length === 0) {
            kitchenConnections.delete(userId);
          }
          console.log(`🔌 Kitchen user ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  return httpServer;
}
