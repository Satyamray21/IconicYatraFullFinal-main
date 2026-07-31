import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URL;

if (!MONGODB_URI) {
  console.error("MONGODB_URL is not defined in .env file");
  process.exit(1);
}

async function migrateTenantIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const collections = await mongoose.connection.db.listCollections().toArray();
    let totalUpdated = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = mongoose.connection.db.collection(collectionName);
      
      const result = await collection.updateMany(
        { companyId: { $exists: true }, tenantId: { $exists: false } },
        [{ $set: { tenantId: "$companyId" } }]
      );

      if (result.modifiedCount > 0) {
        console.log(`Migrated ${result.modifiedCount} documents in collection: ${collectionName}`);
        totalUpdated += result.modifiedCount;
      }
    }
    
    console.log(`Migration complete! Total documents updated: ${totalUpdated}`);

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrateTenantIds();
