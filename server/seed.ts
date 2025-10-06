import { storage } from './storage';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Checking database seed status...');
  
  const saltRounds = 12;

  try {
    const existingAdmin = await storage.getUserByEmail('admin@makolaconnect.com');
    if (existingAdmin) {
      console.log('✓ Database already seeded, skipping...');
      return;
    }

    console.log('🌱 Starting database seed...');

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

    // Create sample products across diverse categories
    const products = [
      // Vegetables
      { sellerId: sellerData.id, name: 'Fresh Tomatoes', category: 'vegetables', unit: 'per basket', price: '25.00', description: 'Fresh, ripe tomatoes from local farms' },
      { sellerId: sellerData.id, name: 'Red Onions', category: 'vegetables', unit: 'per bag', price: '18.00', description: 'Sweet red onions, perfect for cooking' },
      { sellerId: sellerData.id, name: 'Garden Eggs', category: 'vegetables', unit: 'per bowl', price: '12.00', description: 'Fresh garden eggs' },
      { sellerId: sellerData.id, name: 'Cabbage', category: 'vegetables', unit: 'per head', price: '15.00', description: 'Fresh green cabbage' },
      { sellerId: sellerData.id, name: 'Lettuce', category: 'vegetables', unit: 'per head', price: '10.00', description: 'Crisp lettuce leaves' },
      
      // Roots & Tubers
      { sellerId: sellerData.id, name: 'Yam', category: 'roots', unit: 'per tuber', price: '35.00', description: 'Fresh white yam' },
      { sellerId: sellerData.id, name: 'Cassava', category: 'roots', unit: 'per tuber', price: '20.00', description: 'Fresh cassava' },
      { sellerId: sellerData.id, name: 'Sweet Potato', category: 'roots', unit: 'per bowl', price: '22.00', description: 'Sweet potatoes' },
      { sellerId: sellerData.id, name: 'Cocoyam', category: 'roots', unit: 'per bowl', price: '28.00', description: 'Fresh cocoyam' },
      
      // Fruits
      { sellerId: sellerData.id, name: 'Pineapple', category: 'fruits', unit: 'each', price: '8.00', description: 'Sweet ripe pineapple' },
      { sellerId: sellerData.id, name: 'Watermelon', category: 'fruits', unit: 'each', price: '30.00', description: 'Large watermelon' },
      { sellerId: sellerData.id, name: 'Oranges', category: 'fruits', unit: 'per dozen', price: '15.00', description: 'Juicy oranges' },
      { sellerId: sellerData.id, name: 'Bananas', category: 'fruits', unit: 'per bunch', price: '20.00', description: 'Ripe bananas' },
      { sellerId: sellerData.id, name: 'Papaya', category: 'fruits', unit: 'each', price: '12.00', description: 'Sweet papaya' },
      { sellerId: sellerData.id, name: 'Mangoes', category: 'fruits', unit: 'per dozen', price: '25.00', description: 'Fresh mangoes' },
      
      // Fish & Seafood
      { sellerId: sellerData.id, name: 'Tilapia', category: 'fish', unit: 'per fish', price: '18.00', description: 'Fresh tilapia fish' },
      { sellerId: sellerData.id, name: 'Mackerel', category: 'fish', unit: 'per fish', price: '15.00', description: 'Smoked mackerel' },
      { sellerId: sellerData.id, name: 'Shrimps', category: 'fish', unit: 'per cup', price: '35.00', description: 'Fresh shrimps' },
      { sellerId: sellerData.id, name: 'Crab', category: 'fish', unit: 'per piece', price: '40.00', description: 'Fresh crab' },
      
      // Grains & Cereals
      { sellerId: sellerData.id, name: 'Rice', category: 'grains', unit: 'per bag (5kg)', price: '60.00', description: 'Local rice' },
      { sellerId: sellerData.id, name: 'Maize', category: 'grains', unit: 'per bowl', price: '12.00', description: 'Dry maize' },
      { sellerId: sellerData.id, name: 'Beans', category: 'grains', unit: 'per bowl', price: '15.00', description: 'Red beans' },
      { sellerId: sellerData.id, name: 'Millet', category: 'grains', unit: 'per bowl', price: '18.00', description: 'Fresh millet' },
      
      // Spices
      { sellerId: sellerData.id, name: 'Hot Peppers', category: 'spices', unit: 'per cup', price: '8.00', description: 'Spicy hot peppers' },
      { sellerId: sellerData.id, name: 'Ginger', category: 'spices', unit: 'per bowl', price: '10.00', description: 'Fresh ginger root' },
      { sellerId: sellerData.id, name: 'Garlic', category: 'spices', unit: 'per bowl', price: '12.00', description: 'Fresh garlic' },
      
      // Household Items
      { sellerId: sellerData.id, name: 'Palm Oil', category: 'household', unit: 'per bottle (1L)', price: '35.00', description: 'Pure palm oil' },
      { sellerId: sellerData.id, name: 'Groundnut Oil', category: 'household', unit: 'per bottle (1L)', price: '40.00', description: 'Groundnut cooking oil' },
      { sellerId: sellerData.id, name: 'Salt', category: 'household', unit: 'per pack', price: '5.00', description: 'Table salt' },
      { sellerId: sellerData.id, name: 'Maggi Cubes', category: 'household', unit: 'per pack', price: '8.00', description: 'Seasoning cubes' },
    ];

    for (const product of products) {
      await storage.createProduct({
        ...product,
        image: null,
        isAvailable: true,
        allowSubstitution: true,
      });
    }
    console.log(`✓ Created ${products.length} products across 7 categories`);

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
