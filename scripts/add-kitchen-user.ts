import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const KITCHEN_USER = {
  username: "chef",
  email: "chef@pindo.com.py", 
  fullName: "Maria González",
  position: "Chef Principal",
  isAdmin: false,
  isKitchen: true,
  password: "cocina123"
};

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, 'salt', 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
}

async function addKitchenUser() {
  try {
    console.log('👨‍🍳 Creating kitchen user...');
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, KITCHEN_USER.username))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log('👨‍🍳 Kitchen user already exists, updating to kitchen role...');
      
      // Update existing user to have kitchen permissions
      await db
        .update(users)
        .set({ 
          isKitchen: 1,
          fullName: KITCHEN_USER.fullName,
          position: KITCHEN_USER.position 
        })
        .where(eq(users.username, KITCHEN_USER.username));
      
      console.log('✅ Kitchen user updated successfully');
      return;
    }
    
    // Hash password
    const hashedPassword = await hashPassword(KITCHEN_USER.password);
    
    // Create new kitchen user
    await db.insert(users).values({
      username: KITCHEN_USER.username,
      email: KITCHEN_USER.email,
      fullName: KITCHEN_USER.fullName,
      position: KITCHEN_USER.position,
      isAdmin: KITCHEN_USER.isAdmin ? 1 : 0,
      isKitchen: KITCHEN_USER.isKitchen ? 1 : 0,
      password: hashedPassword, // Use 'password' field instead of 'passwordHash'
    });
    
    console.log('✅ Kitchen user created successfully');
    console.log(`📧 Username: ${KITCHEN_USER.username}`);
    console.log(`🔑 Password: ${KITCHEN_USER.password}`);
    
  } catch (error) {
    console.error('❌ Error creating kitchen user:', error);
  }
}

addKitchenUser().then(() => {
  console.log('👨‍🍳 Kitchen user setup completed');
  process.exit(0);
});