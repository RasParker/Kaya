import { storage } from './storage';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting database seed...');
  
  const saltRounds = 12;

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const admin = await storage.createUser({
      phone: null,
      email: 'admin@makolaconnect.com',
      name: 'System Administrator',
      userType: 'admin',
      password: adminPassword,
      profileImage: null,
      isVerified: true,
      isOnline: true,
    });
    console.log('✓ Created admin user');

    // Create buyer user
    const buyerPassword = await bcrypt.hash('password123', saltRounds);
    const buyer = await storage.createUser({
      phone: '+233244123456',
      email: 'buyer@test.com',
      name: 'John Mensah',
      userType: 'buyer',
      password: buyerPassword,
      profileImage: null,
      isVerified: true,
      isOnline: true,
    });
    console.log('✓ Created buyer user');

    // Create seller users
    const seller1Password = await bcrypt.hash('password123', saltRounds);
    const seller1 = await storage.createUser({
      phone: '+233244987654',
      email: 'seller1@test.com',
      name: 'Auntie Akosua',
      userType: 'seller',
      password: seller1Password,
      profileImage: null,
      isVerified: true,
      isOnline: true,
    });

    const seller2Password = await bcrypt.hash('password123', saltRounds);
    const seller2 = await storage.createUser({
      phone: '+233244777888',
      email: 'seller2@test.com',
      name: 'Uncle Kwame',
      userType: 'seller',
      password: seller2Password,
      profileImage: null,
      isVerified: true,
      isOnline: true,
    });

    const seller3Password = await bcrypt.hash('password123', saltRounds);
    const seller3 = await storage.createUser({
      phone: '+233244999000',
      email: 'seller3@test.com',
      name: 'Mama Ama',
      userType: 'seller',
      password: seller3Password,
      profileImage: null,
      isVerified: true,
      isOnline: true,
    });
    console.log('✓ Created 3 seller users');

    // Create seller profiles
    const sellerData1 = await storage.createSeller({
      userId: seller1.id,
      stallName: "Akosua's Fresh Vegetables",
      stallLocation: 'Section A, Row 5',
      market: 'Makola',
      specialties: ['Fresh tomatoes', 'onions', 'peppers'],
      openingHours: { start: '06:00', end: '18:00' },
      languages: ['English', 'Twi'],
      verificationBadge: true,
    });

    const sellerData2 = await storage.createSeller({
      userId: seller2.id,
      stallName: "Kwame's Roots & Tubers",
      stallLocation: 'Section B, Row 2',
      market: 'Makola',
      specialties: ['Yam', 'cassava', 'plantain'],
      openingHours: { start: '05:30', end: '17:30' },
      languages: ['English', 'Twi', 'Ga'],
      verificationBadge: true,
    });

    const sellerData3 = await storage.createSeller({
      userId: seller3.id,
      stallName: "Ama's Fish & Seafood",
      stallLocation: 'Section C, Row 1',
      market: 'Makola',
      specialties: ['Fresh tilapia', 'dried fish', 'shrimp'],
      openingHours: { start: '05:00', end: '16:00' },
      languages: ['English', 'Ga'],
      verificationBadge: true,
    });
    console.log('✓ Created 3 seller profiles');

    // Create products
    const products = [
      { sellerId: sellerData1.id, name: 'Fresh Tomatoes', category: 'vegetables', unit: 'per basket', price: '25.00', description: 'Fresh, ripe tomatoes from local farms' },
      { sellerId: sellerData1.id, name: 'Red Onions', category: 'vegetables', unit: 'per bag', price: '18.00', description: 'Sweet red onions, perfect for cooking' },
      { sellerId: sellerData1.id, name: 'Hot Peppers', category: 'spices', unit: 'per cup', price: '8.00', description: 'Spicy hot peppers for your dishes' },
      { sellerId: sellerData1.id, name: 'Garden Eggs', category: 'vegetables', unit: 'per bowl', price: '12.00', description: 'Fresh garden eggs, locally grown' },
      { sellerId: sellerData2.id, name: 'White Yam', category: 'roots', unit: 'per tuber', price: '15.00', description: 'Quality white yam, perfect for fufu' },
      { sellerId: sellerData2.id, name: 'Cassava', category: 'roots', unit: 'per tuber', price: '8.00', description: 'Fresh cassava for gari or cooking' },
      { sellerId: sellerData2.id, name: 'Ripe Plantain', category: 'roots', unit: 'per bunch', price: '20.00', description: 'Sweet ripe plantain ready to cook' },
      { sellerId: sellerData2.id, name: 'Green Plantain', category: 'roots', unit: 'per bunch', price: '18.00', description: 'Unripe plantain for kelewele or boiling' },
      { sellerId: sellerData3.id, name: 'Fresh Tilapia', category: 'fish', unit: 'per fish', price: '22.00', description: 'Fresh tilapia from Lake Volta' },
      { sellerId: sellerData3.id, name: 'Dried Herrings', category: 'fish', unit: 'per pack', price: '35.00', description: 'Smoked dried herrings for soup' },
      { sellerId: sellerData3.id, name: 'Fresh Shrimp', category: 'fish', unit: 'per cup', price: '45.00', description: 'Fresh shrimp from the coast' },
    ];

    for (const product of products) {
      await storage.createProduct({
        ...product,
        image: null,
        isAvailable: true,
        allowSubstitution: true,
      });
    }
    console.log('✓ Created 11 products');

    // Create kayayo users
    const kayayos = [
      { name: 'Adwoa', phone: '+233244555666', email: 'kayayo1@test.com' },
      { name: 'Akosua', phone: '+233244555777', email: 'kayayo2@test.com' },
      { name: 'Efua', phone: '+233244555888', email: 'kayayo3@test.com' },
    ];

    for (const kayayo of kayayos) {
      const kayayoPassword = await bcrypt.hash('password123', saltRounds);
      const kayayoUser = await storage.createUser({
        phone: kayayo.phone,
        email: kayayo.email,
        name: kayayo.name,
        userType: 'kayayo',
        password: kayayoPassword,
        profileImage: null,
        isVerified: true,
        isOnline: true,
      });

      await storage.createKayayoAvailability({
        kayayoId: kayayoUser.id,
        market: 'Makola',
        isAvailable: true,
        currentLocation: 'Market Entrance',
        maxOrders: 3,
        currentOrders: 0,
      });
    }
    console.log('✓ Created 3 kayayo users with availability');

    // Create rider users
    const riders = [
      { name: 'Kwaku', phone: '+233244666777', email: 'rider1@test.com' },
      { name: 'Kofi', phone: '+233244666888', email: 'rider2@test.com' },
    ];

    for (const rider of riders) {
      const riderPassword = await bcrypt.hash('password123', saltRounds);
      await storage.createUser({
        phone: rider.phone,
        email: rider.email,
        name: rider.name,
        userType: 'rider',
        password: riderPassword,
        profileImage: null,
        isVerified: true,
        isOnline: true,
      });
    }
    console.log('✓ Created 2 rider users');

    // Create a sample order
    const order = await storage.createOrder({
      buyerId: buyer.id,
      kayayoId: null,
      riderId: null,
      status: 'pending',
      totalAmount: '92.00',
      deliveryAddress: 'East Legon, Accra - Near Shell Station',
      deliveryFee: '8.00',
      kayayoFee: '5.00',
      platformFee: '2.00',
      estimatedDeliveryTime: 90,
      paymentMethod: 'momo',
    });
    console.log('✓ Created sample order');

    // Get products for order items
    const allProducts = await storage.getProductsBySeller(sellerData1.id);
    if (allProducts.length >= 3) {
      await storage.createOrderItem({
        orderId: order.id,
        productId: allProducts[0].id,
        sellerId: sellerData1.id,
        quantity: 2,
        unitPrice: allProducts[0].price,
        subtotal: String(2 * parseFloat(allProducts[0].price)),
        notes: null,
        isConfirmed: false,
        isPicked: false,
        substitutedWith: null,
      });

      await storage.createOrderItem({
        orderId: order.id,
        productId: allProducts[1].id,
        sellerId: sellerData1.id,
        quantity: 1,
        unitPrice: allProducts[1].price,
        subtotal: allProducts[1].price,
        notes: null,
        isConfirmed: false,
        isPicked: false,
        substitutedWith: null,
      });

      await storage.createOrderItem({
        orderId: order.id,
        productId: allProducts[2].id,
        sellerId: sellerData1.id,
        quantity: 3,
        unitPrice: allProducts[2].price,
        subtotal: String(3 * parseFloat(allProducts[2].price)),
        notes: null,
        isConfirmed: false,
        isPicked: false,
        substitutedWith: null,
      });
      console.log('✓ Created 3 order items');
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Test credentials:');
    console.log('Admin: admin@makolaconnect.com / admin123');
    console.log('Buyer: +233244123456 / password123');
    console.log('Seller: +233244987654 / password123');
    console.log('Kayayo: +233244555666 / password123');
    console.log('Rider: +233244666777 / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };
