
import { storage } from "./storage";

async function clearOrders() {
  console.log('🗑️  Clearing all orders...');
  
  const allOrders = await storage.getAllOrders();
  let deletedCount = 0;
  
  for (const order of allOrders) {
    await storage.deleteOrder(order.id);
    console.log(`Deleted order: ${order.id}`);
    deletedCount++;
  }
  
  console.log(`\n✅ Total orders deleted: ${deletedCount}`);
  process.exit(0);
}

clearOrders().catch(console.error);
