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
          console.log("Google sign-in callback triggered")
          
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
          console.log("Backend response:", data)

          if (response.ok && data.access_token) {
            // Store token in user object (will be passed to JWT callback)
            user.accessToken = data.access_token
            user.userId = data.user_id
            console.log("Token stored:", data.access_token.substring(0, 20) + "...")
            return true
          } else {
            console.error("Backend auth failed:", data)
            return false
          }
        } catch (error) {
          console.error("Google sign-in backend error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // First time JWT callback is invoked, user object is available
      if (user) {
        token.accessToken = user.accessToken
        token.userId = user.userId
        token.email = user.email
        token.name = user.name
        console.log("JWT token created with accessToken")
      }
      return token
    },
    async session({ session, token }) {
      // Make token available to client
      if (token.accessToken) {
        session.accessToken = token.accessToken
        session.userId = token.userId
        console.log("Session created with accessToken")
      }
      
      // Ensure user info is present
      session.user = {
        ...session.user,
        email: token.email,
        name: token.name,
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
  debug: true, // Enable debug mode
})

export { handler as GET, handler as POST }
