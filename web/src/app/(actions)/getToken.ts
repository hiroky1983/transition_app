"use server";

export const getToken = async () => {
  const token = await fetch("http://localhost:6001/api/get-access-token", {
    next: { revalidate: 3600 },
  });
  return token.json();
};
