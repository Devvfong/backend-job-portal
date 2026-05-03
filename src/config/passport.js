import "dotenv/config";
import { randomUUID } from "crypto";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

const resolveGitHubEmail = async (profile, accessToken) => {
  const strategyEmail = profile.emails?.[0]?.value?.toLowerCase();
  if (strategyEmail) return strategyEmail;

  const profileEmail = profile._json?.email?.toLowerCase();
  if (profileEmail) return profileEmail;

  try {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "job-portal-backend",
      },
    });

    if (response.ok) {
      const emails = await response.json();
      if (Array.isArray(emails) && emails.length > 0) {
        const primaryVerified = emails.find(
          (item) => item.primary && item.verified,
        );
        const verified = emails.find((item) => item.verified);
        const candidate = primaryVerified || verified || emails[0];
        if (candidate?.email) return candidate.email.toLowerCase();
      }
    }
  } catch (error) {
    // Ignore network errors and continue to deterministic fallback.
  }

  const identifier = profile.username || profile.id;
  return `${identifier}@users.noreply.github.com`.toLowerCase();
};

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  throw new Error(
    "Missing GitHub OAuth env vars: GITHUB_CLIENT_ID and/or GITHUB_CLIENT_SECRET",
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    });
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = await resolveGitHubEmail(profile, accessToken);

        const displayName =
          profile.displayName || profile.username || "GitHub User";
        const avatarUrl = profile.photos?.[0]?.value || null;

        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        let user;
        if (existingUser) {
          user = await prisma.user.update({
            where: { email },
            data: {
              name: displayName,
              avatar: avatarUrl,
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          });
        } else {
          const randomPassword = randomUUID();
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          user = await prisma.user.create({
            data: {
              name: displayName,
              email,
              password: hashedPassword,
              avatar: avatarUrl,
              role: "job_seeker",
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

if (LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET) {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: LINKEDIN_CLIENT_ID,
        clientSecret: LINKEDIN_CLIENT_SECRET,
        callbackURL: "/auth/linkedin/callback",
        scope: ["r_emailaddress", "r_liteprofile"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error("No email found from LinkedIn"));
          }

          const displayName = profile.displayName || "LinkedIn User";
          const avatarUrl = profile.photos?.[0]?.value || null;

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          let user;
          if (existingUser) {
            user = await prisma.user.update({
              where: { email },
              data: {
                name: displayName,
                avatar: avatarUrl,
              },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            });
          } else {
            const randomPassword = randomUUID();
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            user = await prisma.user.create({
              data: {
                name: displayName,
                email,
                password: hashedPassword,
                avatar: avatarUrl,
                role: "job_seeker",
              },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
} else {
  console.warn("Missing LinkedIn OAuth env vars. LinkedIn login disabled.");
}

export default passport;
