import { auth } from "@/lib/auth"; // Point to your Better Auth instance
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Senior Note: This handler captures all requests to /api/auth/*
 * including the /api/auth/sign-in/social request that is currently 404ing.
 */
export const { GET, POST } = toNextJsHandler(auth);