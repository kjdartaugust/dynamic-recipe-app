import { NextResponse } from "next/server";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  return NextResponse.json({
    configured: !!publicKey && !!privateKey && !!subject,
    hasPublicKey: !!publicKey,
    hasPrivateKey: !!privateKey,
    hasSubject: !!subject,
    publicKeyFirstChars: publicKey ? publicKey.slice(0, 10) + "..." : null,
  });
}
