import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";
import { ShieldAlert } from "lucide-react";

export default function OAuthConsent() {
  return (
    <AuthLayout
      icon={ShieldAlert}
      title="OAuth unavailable"
      subtitle="This standalone Supabase version does not use the old MCP consent flow."
      footer={<Link to="/" className="text-primary font-medium hover:underline">Back to JobShield</Link>}
    >
      <p className="text-center text-sm text-muted-foreground">
        Continue using JobShield through the main app pages.
      </p>
      <Button asChild className="mt-4 w-full">
        <Link to="/analyzer">Check an offer</Link>
      </Button>
    </AuthLayout>
  );
}
