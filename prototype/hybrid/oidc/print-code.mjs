import { totp } from "./totp.mjs";
import { devUsers } from "./users.mjs";

const key = process.argv[2] || "ada";
const user = devUsers().find((row) => row.key === key || row.email.startsWith(key));
if (!user) {
  console.error("unknown user: ada, ben, or cara");
  process.exit(1);
}
console.log(totp(user.totpSecret));
