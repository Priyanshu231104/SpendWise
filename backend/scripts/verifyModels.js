
import assert from "node:assert/strict";
import mongoose from "mongoose";

import Category from "../src/models/Category.js";
import Transaction from "../src/models/Transaction.js";
import Budget from "../src/models/Budget.js";
import FinancialGoal from "../src/models/FinancialGoal.js";
import RecurringTransaction from "../src/models/RecurringTransaction.js";

const userId = new mongoose.Types.ObjectId();
const startDate = new Date("2026-10-01T00:00:00.000Z");
const endDate = new Date("2026-11-01T00:00:00.000Z");

const validDocuments = [
  {
    name: "Category",
    document: new Category({
      userId,
      name: "Food",
      nameKey: "food",
      type: "EXPENSE",
    }),
  },
  {
    name: "Transaction",
    document: new Transaction({
      userId,
      type: "EXPENSE",
      amountMinor: 12550,
      currency: "INR",
      date: startDate,
    }),
  },
  {
    name: "Budget",
    document: new Budget({
      userId,
      amountMinor: 1000000,
      currency: "INR",
      periodStart: startDate,
      periodEnd: endDate,
      categoryId: null,
    }),
  },
  {
    name: "FinancialGoal",
    document: new FinancialGoal({
      userId,
      name: "Emergency Fund",
      targetAmountMinor: 500000,
      savedAmountMinor: 0,
      currency: "INR",
    }),
  },
  {
    name: "RecurringTransaction",
    document: new RecurringTransaction({
      userId,
      type: "EXPENSE",
      amountMinor: 150000,
      currency: "INR",
      frequency: "MONTHLY",
      startDate,
      nextRunAt: startDate,
    }),
  },
];

async function expectInvalid(name, document) {
  await assert.rejects(
    document.validate(),
    mongoose.Error.ValidationError
  );

  console.log(`PASS: ${name} rejects invalid data`);
}

async function main() {
  for (const { name, document } of validDocuments) {
    await document.validate();
    console.log(`PASS: ${name} accepts valid data`);
  }

  await expectInvalid(
    "Transaction amount",
    new Transaction({
      userId,
      type: "EXPENSE",
      amountMinor: -100,
      currency: "INR",
      date: startDate,
    })
  );

  await expectInvalid(
    "Budget date range",
    new Budget({
      userId,
      amountMinor: 10000,
      currency: "INR",
      periodStart: endDate,
      periodEnd: startDate,
    })
  );

  await expectInvalid(
    "Financial goal progress",
    new FinancialGoal({
      userId,
      name: "Emergency Fund",
      targetAmountMinor: 10000,
      savedAmountMinor: 20000,
      currency: "INR",
    })
  );

  await expectInvalid(
    "Recurring schedule dates",
    new RecurringTransaction({
      userId,
      type: "EXPENSE",
      amountMinor: 10000,
      currency: "INR",
      frequency: "MONTHLY",
      startDate: endDate,
      nextRunAt: startDate,
    })
  );

  console.log("\nDeclared model indexes:");
  for (const { name, document } of validDocuments) {
    console.log(`\n${name}:`);
    console.log(JSON.stringify(document.constructor.schema.indexes(), null, 2));
  }

  console.log("\nAll model verification checks passed.");
}

main().catch((error) => {
  console.error("Model verification failed:", error);
  process.exitCode = 1;
});
