import { JwtPayload } from "jsonwebtoken";

export interface DecodedToken extends JwtPayload {
  userId: string;
  username?: string;
}

export interface AccessTokenPayload {
  userId: string;
  username?: string;
  name?: string;
  email?: string;
  profileSrc?: string;
}