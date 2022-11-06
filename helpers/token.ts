import jwt from "jsonwebtoken";

export const signToken = (
  data: any,
  secret?: string,
  options?: jwt.SignOptions
) => {
  const tokenExpireTime =
    Date.now() + parseInt(process.env.TOKEN_EXPIRE_TIME as string);

  return jwt.sign({ ...data, tokenExpireTime }, secret || process.env.ACCESS_SECRET!, {
    expiresIn: parseInt(process.env.TOKEN_EXPIRE_TIME as string) || 3600000,
    ...options,
  });
};
