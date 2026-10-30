import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
const adminEmail = process.env.REALTYOS_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();

if (!connectionString || !adminEmail) {
  console.error("Set DATABASE_URL and REALTYOS_BOOTSTRAP_ADMIN_EMAIL before running this command.");
  process.exit(1);
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
const client = new Client({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: true },
});

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    const result = await client.query(
      "UPDATE user_profiles " +
      "SET platform_role = 'super_admin', updated_at = now() " +
      "WHERE lower(email) = $1 AND email_verified = true AND status = 'active' " +
      "RETURNING id",
      [adminEmail]
    );

    if (result.rowCount !== 1) {
      throw new Error("No single active, email-verified account matched the supplied email.");
    }

    await client.query("COMMIT");
    console.log("Super-admin role granted to the verified account.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("Super-admin bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
