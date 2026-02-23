import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        return {
          id: credentials.email,
          email: credentials.email,
          name: credentials.email.split("@")[0],
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Call your backend to register/login with Google
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              google_id: account.providerAccountId,
              image: user.image,
            }),
          })

          const data = await response.json()

          if (response.ok && data.access_token) {
            // Store token in user object (will be available in session)
            user.accessToken = data.access_token
            user.userId = data.user_id
            return true
          }
        } catch (error) {
          console.error("Google sign-in backend error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      // Add access token to JWT
      if (user?.accessToken) {
        token.accessToken = user.accessToken
        token.userId = user.userId
      }
      return token
    },
    async session({ session, token }) {
      // Add access token to session (accessible on client)
      if (token.accessToken) {
        session.accessToken = token.accessToken
        session.userId = token.userId
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
