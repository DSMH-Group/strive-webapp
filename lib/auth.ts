// src/lib/auth.ts
import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import {genericOAuth, keycloak} from "better-auth/plugins";
import {db} from "@/db/db";
import {eq} from "drizzle-orm";

async function sendResendEmail({
    to,
    subject,
    message,
    actionUrl,
    actionText,
}: {
    to: string;
    subject: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
}) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromSender = process.env.RESEND_FROM_EMAIL || "Strive <notifications@strive.gwinnovations.lk>";
    if (!apiKey) return;

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: uppercase; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff; opacity: 0.9; }
    .content { padding: 32px 28px; font-size: 15px; line-height: 1.6; color: #cbd5e1; }
    .btn-container { text-align: center; margin: 32px 0 24px 0; }
    .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
    .footer { background-color: #0f172a; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>STRIVE</h1>
      <p>Fitness Management & Performance Platform</p>
    </div>
    <div class="content">
      <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">${subject}</h2>
      <p>${message.replace(/\n/g, '<br>')}</p>
      ${actionUrl ? `
      <div class="btn-container">
        <a href="${actionUrl}" class="btn" target="_blank">${actionText || 'Continue'}</a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Strive Systems Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: fromSender,
                to: [to],
                subject: subject,
                html: htmlBody,
            }),
        });
    } catch (err) {
        console.error("Failed to send auth email via Resend:", err);
    }
}

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {...schema},
        camelCase: false
    }),

    // 1. Dynamic Host Routing Core
    baseURL: {
        allowedHosts: [
            "dsmhgroup.com",
            "www.dsmhgroup.com",
            "*.dsmhgroup.com",        // 🌟 Tells Better-Auth to actively accept and route subdomains!
            "localhost",
            "*.localhost"
        ],
        protocol: process.env.NODE_ENV === "development" ? "http" : "https",
        fallback: "https://dsmhgroup.com"
    },

    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    return {data: {...user, id: crypto.randomUUID()}};
                },
            },
        },
        session: {
            create: {
                before: async (session) => {
                    return {data: {...session, id: crypto.randomUUID()}};
                },
            },
        },
        account: {
            create: {
                before: async (account) => {
                    return {data: {...account, id: crypto.randomUUID()}};
                },
            },
        },
    },

    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        async sendResetPassword({ user, url }: { user: any; url: string }) {
            await sendResendEmail({
                to: user.email,
                subject: "Reset your Strive Password",
                message: `Hello ${user.name || 'Member'},\n\nWe received a request to reset your Strive account password. Click the button below to set a new password. If you did not request this, you can ignore this email.`,
                actionUrl: url,
                actionText: "Reset Password",
            });
        },
    },

    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        async sendVerificationEmail({ user, url }: { user: any; url: string }) {
            await sendResendEmail({
                to: user.email,
                subject: "Verify your Strive Email Address",
                message: `Hello ${user.name || 'Member'},\n\nThank you for signing up for Strive! Please click the button below to verify your email address and activate your account.`,
                actionUrl: url,
                actionText: "Verify Email Address",
            });
        },
    },

    socialProviders: {
        // Same treatment as Keycloak: only wire Google when credentials exist.
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? {
                  google: {
                      clientId: process.env.GOOGLE_CLIENT_ID,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                  },
              }
            : {}),
    },

    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        }
    },

    // 2. Cookie isolation policy.
    // Production locks cookies to the dsmhgroup.com apex so a session is shared
    // across tenant subdomains. Locally that breaks login: the browser drops
    // `secure` cookies and a `.dsmhgroup.com` domain on http://localhost, so we
    // relax to plain host cookies in development only.
    advanced:
        process.env.NODE_ENV === "development"
            ? {
                  useSecureCookies: false,
              }
            : {
                  useSecureCookies: true,
                  crossSubDomainCookies: {
                      enabled: true,
                      additionalCookies: ["better-auth.session_data"],
                      domain: "dsmhgroup.com",
                  },
                  defaultCookieAttributes: {
                      sameSite: "lax",
                      secure: true,
                      httpOnly: true,
                      domain: ".dsmhgroup.com",
                  },
              },

    trustedOrigins: [
        "https://dsmhgroup.com",
        "https://*.dsmhgroup.com",
        "http://localhost:3000",
        "http://*.localhost:3000"
    ],

    user: {
        changeEmail: {
            enabled: true,
            async sendChangeEmailVerification({ user, newEmail, url }: { user: any; newEmail: string; url: string }) {
                await sendResendEmail({
                    to: newEmail,
                    subject: "Confirm Email Address Change",
                    message: `Hello ${user.name || 'Member'},\n\nYou requested to change your account email to ${newEmail}. Please click the button below to confirm this change.`,
                    actionUrl: url,
                    actionText: "Confirm Email Change",
                });
            },
        },
        additionalFields: {
            keycloakId: {
                type: "string",
                required: false,
                input: false
            }
        }
    },

    plugins: [
        // Only register the Keycloak OAuth provider when its env vars are set.
        // Locally these are unset, so the plugin is skipped and email/password
        // auth still works without crashing on an undefined OIDC issuer.
        ...(process.env.KEYCLOAK_ISSUER &&
        process.env.KEYCLOAK_CLIENT_ID &&
        process.env.KEYCLOAK_CLIENT_SECRET
            ? [
                  genericOAuth({
                      config: [
                          keycloak({
                              issuer: process.env.KEYCLOAK_ISSUER,
                              clientId: process.env.KEYCLOAK_CLIENT_ID,
                              clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
                          }),
                      ],
                  }),
              ]
            : []),
    ],
    callbacks: {
        onSuccess: async ({account, user}: { account: any, user: any }) => {
            if (account.access_token) {
                await db.update(schema.account)
                    .set({accessToken: account.access_token})
                    .where(eq(schema.account.userId, user.id));
            }
        }
    }
});