import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

try {
  const sa = JSON.parse(readFileSync("./firebase-service-account.json", "utf8"));
  const app = initializeApp({
    credential: cert(sa),
    projectId: sa.project_id,
  });

  const db = getFirestore(app, "default");
  console.log(`✓ Firebase Admin initialized successfully with project: ${sa.project_id}`);
  
  // Write and read test
  await db.collection("system_status").doc("connection_test").set({
    connected: true,
    platform: "Easy Ride",
    testedAt: new Date().toISOString(),
  });
  console.log("✓ Successfully wrote live document to Firestore 'default' database!");

  const doc = await db.collection("system_status").doc("connection_test").get();
  console.log("✓ Read verified:", doc.data());
  
  process.exit(0);
} catch (err) {
  console.error("Firebase test error:", err);
  process.exit(1);
}
