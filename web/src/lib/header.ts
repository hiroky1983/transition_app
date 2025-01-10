export const headers = (token: string) => {
  const header = {
    headers: {
      Authorization: `Bearer ${token}`, // アクセストークンをヘッダーに追加
    },
  };

  return header;
};
