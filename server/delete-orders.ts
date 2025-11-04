
import { storage } from "./storage";

async function deleteOrders() {
  const orderPrefixes = ['b2500527', '76b79879', 'a5fe354a'];
  
  const allOrders = await storage.getAllOrders();
  let deletedCount = 0;
  
  for (const order of allOrders) {
    const orderPrefix = order.id.substring(0, 8);
    if (orderPrefixes.includes(orderPrefix)) {
      await storage.deleteOrder(order.id);
      console.log(`Deleted order: ${order.id} (${orderPrefix})`);
      deletedCount++;
    }
  }
  
  console.log(`\nTotal orders deleted: ${deletedCount}`);
  process.exit(0);
}

deleteOrders().catch(console.error);
