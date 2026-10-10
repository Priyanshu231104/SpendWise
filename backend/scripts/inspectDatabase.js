
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(currentDir, "../.env"),
});

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.command({ buildInfo: 1 });

    console.log("MongoDB server version:", info.version);

    const collections = await mongoose.connection.db
      .listCollections({}, { nameOnly: true })
      .toArray();

    const existingNames = new Set(
      collections.map((collection) => collection.name)
    );

    const financeCollections = [
      "categories",
      "transactions",
      "budgets",
      "financialgoals",
      "recurringtransactions",
    ];

    for (const name of financeCollections) {
      console.log(`\nCollection: ${name}`);

      if (!existingNames.has(name)) {
        console.log("Not present yet; no indexes to inspect.");
        continue;
      }

      const indexes = await mongoose.connection.db
        .collection(name)
        .listIndexes()
        .toArray();

      console.log(JSON.stringify(indexes, null, 2));
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Inspection failed:", error.message);
  process.exitCode = 1;
});
