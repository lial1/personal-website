/**
 * One-off: print a scrypt hash to paste into SAVINGS_PASSWORD_HASH.
 *   npx tsx scripts/hash-password.ts 'your password here'
 * The password is read from argv so it never lands in a file.
 */
import { hashPassword } from "../src/lib/savings/password";

const pw = process.argv[2];
if (!pw) {
  console.error("usage: npx tsx scripts/hash-password.ts '<password>'");
  process.exit(1);
}
console.log(hashPassword(pw));
