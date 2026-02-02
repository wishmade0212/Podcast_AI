// Clean old podcasts with fake URLs from the database
const mongoose = require('mongoose');
const Podcast = require('./models/Podcast');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/podcast-generator';

async function cleanOldPodcasts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find podcasts with old fake URLs
    console.log('\n🔍 Looking for podcasts with old URLs...');
    const oldPodcasts = await Podcast.find({
      audioUrl: { $regex: 'example.com' }
    });

    console.log(`📊 Found ${oldPodcasts.length} podcasts with old URLs`);

    if (oldPodcasts.length > 0) {
      console.log('\n🗑️  Deleting old podcasts...');
      const result = await Podcast.deleteMany({
        audioUrl: { $regex: 'example.com' }
      });
      console.log(`✅ Deleted ${result.deletedCount} old podcasts`);
    } else {
      console.log('✅ No old podcasts found. Database is clean!');
    }

    // Show remaining podcasts
    const remainingPodcasts = await Podcast.countDocuments();
    console.log(`\n📈 Remaining podcasts in database: ${remainingPodcasts}`);

    if (remainingPodcasts > 0) {
      console.log('\n📋 Current podcasts:');
      const allPodcasts = await Podcast.find().select('title audioUrl createdAt');
      allPodcasts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title}`);
        console.log(`      URL: ${p.audioUrl}`);
        console.log(`      Created: ${p.createdAt.toLocaleDateString()}`);
      });
    }

    console.log('\n✅ Database cleanup complete!');
    console.log('💡 You can now create new podcasts with working audio files.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the cleanup
cleanOldPodcasts();
