import { getToken } from "../(actions)/getToken";
import { Client } from "./client";

export default async function ConversationPage() {
  const token = await getToken();
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">会話練習</h1>
      <Client token={token.token} />
    </div>
  );
}
