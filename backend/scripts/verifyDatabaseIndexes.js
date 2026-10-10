
import assert from "node:assert/strict";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(currentDir, "../.env"),
});

const collectionName =
  `spendwise_index_test_${Date.now()}_${process.pid}`;

async function expectDuplicate(label, operation) {
  await assert.rejects(
    operation,
    (error) => error?.code === 11000,
    `${label}: expected MongoDB duplicate-key error (11000)`
  );

  console.log(`PASS: ${label}`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from backend/.env");
  }

  let collectionCreated = false;

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;

    await db.createCollection(collectionName);
    collectionCreated = true;

    const collection = db.collection(collectionName);

    await collection.createIndex(
      { userId: 1, periodStart: 1 },
      {
        unique: true,
        partialFilterExpression: { categoryId: null },
        name: "test_unique_overall_budget_per_period",
      }
    );

    await collection.createIndex(
      { userId: 1, categoryId: 1, periodStart: 1 },
      {
        unique: true,
        partialFilterExpression: {
          categoryId: { $type: "objectId" },
        },
        name: "test_unique_category_budget_per_period",
      }
    );

    console.log("PASS: Both partial unique indexes were created");

    const userId = new mongoose.Types.ObjectId();
    const categoryA = new mongoose.Types.ObjectId();
    const categoryB = new mongoose.Types.ObjectId();
    const periodStart = new Date("2026-10-01T00:00:00.000Z");

    // One overall budget is allowed.
    await collection.insertOne({
      userId,
      categoryId: null,
      periodStart,
      marker: "overall-1",
    });

    // A second overall budget for the same user and period must fail.
    await expectDuplicate(
      "Duplicate overall budget is rejected",
      () =>
        collection.insertOne({
          userId,
          categoryId: null,
          periodStart,
          marker: "overall-2",
        })
    );

    // One budget for category A is allowed.
    await collection.insertOne({
      userId,
      categoryId: categoryA,
      periodStart,
      marker: "category-a-1",
    });

    // A second budget for category A in the same period must fail.
    await expectDuplicate(
      "Duplicate category budget is rejected",
      () =>
        collection.insertOne({
          userId,
          categoryId: categoryA,
          periodStart,
          marker: "category-a-2",
        })
    );

    // A different category can have its own budget in that period.
    await collection.insertOne({
      userId,
      categoryId: categoryB,
      periodStart,
      marker: "category-b-1",
    });

    console.log("PASS: Different categories can have separate budgets");
    console.log("All database index checks passed.");
  } finally {
    try {
      if (collectionCreated) {
        await mongoose.connection.db
          .collection(collectionName)
          .drop();

        console.log("Temporary test collection removed.");
      }
    } finally {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  }
}

main().catch((error) => {
  console.error("Database index verification failed:", error.message);
  process.exitCode = 1;
});
