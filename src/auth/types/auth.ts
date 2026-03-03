import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignInData = z.infer<typeof signInSchema>;

export type AuthFlow = "signIn" | "signUp";

export type AuthStep = "signIn" | { email: string } | "forgot";
