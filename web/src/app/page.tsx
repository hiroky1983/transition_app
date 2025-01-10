import { Suspense } from "react";
import Client from "./Client";

export default async function VocabularyPage() {
  const res = await fetch("http://localhost:6001/");
  const data = await res.json();

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">単語帳</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <p>Health: {data.status}</p>
      </Suspense>
      <Client />
    </div>
  );
}
