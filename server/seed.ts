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

    // Create seller user
    const sellerPassword = await bcrypt.hash('password123', saltRounds);
    const seller = await storage.createUser({
      phone: '+233244987654',
      email: 'seller@test.com',
      name: 'Auntie Akosua',
      userType: 'seller',
      password: sellerPassword,
      profileImage: null,
      isVerified: true,
      isOnline: true,
    });
    console.log('✓ Created seller user');

    // Create seller profile
    const sellerData = await storage.createSeller({
      userId: seller.id,
      stallName: "Akosua's Fresh Vegetables",
      stallLocation: 'Section A, Row 5',
      market: 'Makola',
      specialties: ['Fresh tomatoes', 'onions', 'peppers'],
      openingHours: { start: '06:00', end: '18:00' },
      languages: ['English', 'Twi'],
      verificationBadge: true,
    });
    console.log('✓ Created seller profile');

    // Create sample products
    const products = [
      { sellerId: sellerData.id, name: 'Fresh Tomatoes', category: 'vegetables', unit: 'per basket', price: '25.00', description: 'Fresh, ripe tomatoes from local farms' },
      { sellerId: sellerData.id, name: 'Red Onions', category: 'vegetables', unit: 'per bag', price: '18.00', description: 'Sweet red onions, perfect for cooking' },
      { sellerId: sellerData.id, name: 'Hot Peppers', category: 'spices', unit: 'per cup', price: '8.00', description: 'Spicy hot peppers for your dishes' },
    ];

    for (const product of products) {
      await storage.createProduct({
        ...product,
        image: null,
        isAvailable: true,
        allowSubstitution: true,
      });
    }
    console.log('✓ Created 3 products');

    // Create kayayo user
    const kayayoPassword = await bcrypt.hash('password123', saltRounds);
    const kayayoUser = await storage.createUser({
      phone: '+233244555666',
      email: 'kayayo@test.com',
      name: 'Adwoa',
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
    console.log('✓ Created kayayo user with availability');

    // Create rider user
    const riderPassword = await bcrypt.hash('password123', saltRounds);
    const riderUser = await storage.createUser({
      phone: '+233244666777',
      email: 'rider@test.com',
      name: 'Kwaku',
      userType: 'rider',
      password: riderPassword,
      profileImage: null,
      isVerified: true,
      isOnline: true,
    });
    console.log('✓ Created rider user');

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
