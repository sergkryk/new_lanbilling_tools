import jwt, { Secret, JwtPayload } from "jsonwebtoken";

const SECRET_KEY: Secret | undefined = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error("Secret key not found");
}

const options = {
  expiresIn: "2 days",
};

export const signToken = function (personid: string) {
  const token = jwt.sign(
    {
      personid,
    },
    SECRET_KEY,
    options
  );
  return token;
};

export const verifyToken = function (token: string) {
  const decoded = jwt.verify(token, SECRET_KEY);
  return decoded;
};
