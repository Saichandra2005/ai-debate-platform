import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",  
        },
      },
    }),
    
    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const data = await response.json()

          if (response.ok && data.access_token) {
            return {
              id: data.user_id || credentials.email,
              email: credentials.email,
              name: data.name || credentials.email.split('@')[0],
              accessToken: data.access_token,
            } as any
          }

          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      
      if (account?.provider === "google") {
        try {
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

          if (!response.ok) {
            console.error("Failed to create/login Google user")
            return false
          }

          const data = await response.json()
          
          ;(user as any).accessToken = data.access_token
          ;(user as any).name = data.name
          
          return true
        } catch (error) {
          console.error("Google sign-in error:", error)
          return false
        }
      }
      
      return true
    },
    
    async jwt({ token, user }) {
      
      if (user) {
        token.accessToken = (user as any).accessToken
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    
    async session({ session, token }) {
      
      const s = session as any
      s.accessToken = token.accessToken
      s.user.email = token.email
      s.user.name = token.name
      s.user.image = token.picture
      return s
    }
  },
  
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  
  session: {
    strategy: "jwt",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }