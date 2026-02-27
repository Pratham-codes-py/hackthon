"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Chrome, Leaf } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Save local email session so the rest of the application still flows.
      if (result.user && result.user.email) {
        localStorage.setItem("userEmail", result.user.email);
        localStorage.setItem("userName", result.user.displayName || "User");
      }

      onOpenChange(false);
      router.push("/input");
    } catch (error: any) {
      console.error(error);
      setAuthError(error.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
        {/* Top decoration */}
        <div className="h-2 bg-gradient-to-r from-[#0B3B2A] via-[#6BAA75] to-[#4CD964]" />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#6BAA75] dark:bg-[#4CD964] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white dark:text-[#0A1F18]" />
              </div>
              <DialogTitle className="text-xl font-bold">EcoTrack AI</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">Your personal carbon reduction journey starts here</p>
          </DialogHeader>

          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 mb-6 w-full">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <div className="space-y-4 pt-4">
                {/* Google OAuth Button */}
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-3 h-14 rounded-xl border-2 hover:border-[#6BAA75] transition-colors"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Chrome className="w-6 h-6 text-[#4285F4]" />
                  <span className="font-semibold text-lg">{loading ? "Connecting..." : "Continue with Google"}</span>
                </Button>

                {authError && (
                  <div className="p-3 mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                    {authError}
                  </div>
                )}

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Only Google authentication is supported during this hackathon.
                </p>
              </div>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <div className="space-y-4 pt-4">
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-3 h-14 rounded-xl border-2 hover:border-[#6BAA75] transition-colors"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Chrome className="w-6 h-6 text-[#4285F4]" />
                  <span className="font-semibold text-lg">{loading ? "Connecting..." : "Sign up with Google"}</span>
                </Button>

                {authError && (
                  <div className="p-3 mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                    {authError}
                  </div>
                )}

                <p className="text-center text-sm text-muted-foreground mt-4">
                  We use Google to quickly and securely create your account.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
