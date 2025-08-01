import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-center space-x-4 py-4">
      <Link
        href="/"
        className={`px-3 py-2 rounded-md ${
          pathname === "/"
            ? "bg-blue-500 text-white"
            : "text-gray-700 hover:bg-gray-200"
        }`}
      >
        翻訳
      </Link>
      <Link
        href="/vocabulary"
        className={`px-3 py-2 rounded-md ${
          pathname === "/vocabulary"
            ? "bg-blue-500 text-white"
            : "text-gray-700 hover:bg-gray-200"
        }`}
      >
        単語帳一覧
      </Link>
      <Link
        href="/talk"
        className={`px-3 py-2 rounded-md ${
          pathname === "/talk"
            ? "bg-blue-500 text-white"
            : "text-gray-700 hover:bg-gray-200"
        }`}
      >
        会話練習
      </Link>
    </nav>
  );
}
