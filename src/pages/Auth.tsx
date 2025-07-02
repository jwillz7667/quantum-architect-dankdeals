import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cannabis Background */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/60" />
        <div className="absolute top-0 right-0 w-96 h-96 opacity-30">
          <div className="w-full h-full bg-[url('/src/assets/blue-dream.jpg')] bg-cover bg-center rounded-full blur-sm" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl">🌿</span>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Login and find great weed near you
          </h1>
        </div>
      </div>

      {/* Auth Form */}
      <div className="bg-background rounded-t-3xl p-6 space-y-6 shadow-elevated">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="Enter your full name" />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" />
          </div>
        </div>

        <Button variant="cannabis" className="w-full h-12 text-lg">
          {isLogin ? "Log in" : "Sign up"}
        </Button>

        <div className="text-center">
          <span className="text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="p-0 text-primary font-semibold"
          >
            {isLogin ? "Sign up" : "Log in"}
          </Button>
        </div>
      </div>
    </div>
  );
}