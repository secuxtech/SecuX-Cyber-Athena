// TODO: for demo use (remove further)
export async function generateNewUTXOBlocks() {
  console.log("⛏ Generating coinbase blocks...");
  await fetch(process.env.BTC_RPC_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(process.env.TEST_RPC_AUTH!).toString("base64")}`,
    },
    body: JSON.stringify({
      method: "generatetoaddress",
      params: [1, "bcrt1qafyhjtqtr5nf4f8smskgaryw9u5d2496tnqjcrxeses37n2jarps9qfu6h"],
    }),
  });
}
