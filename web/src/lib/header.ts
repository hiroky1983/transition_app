import axios from "axios";

export const headers = async () => {
  const token = await axios.get("http://localhost:6001/api/get-access-token");

  const header = {
    headers: {
      Authorization: `Bearer ${token.data.token}`, // アクセストークンをヘッダーに追加
    },
  };

  return header;
};
