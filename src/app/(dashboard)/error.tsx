"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isMigrationError = error.message.includes("Could not find the table") || 
                           error.message.includes("PGRST205");

  if (isMigrationError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="max-w-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">Database Migration Required</h1>
              <p className="text-muted-foreground mb-4">
                The database tables haven't been created yet. You need to run the migration first.
              </p>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h2 className="font-semibold mb-2">Quick Fix (2 minutes):</h2>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to your Supabase Dashboard → SQL Editor</li>
                  <li>Copy the SQL from: <code className="bg-background px-2 py-1 rounded">supabase/migrations/00000000000001_business_management.sql</code></li>
                  <li>Paste and run the SQL</li>
                  <li>Refresh this page</li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📚 Detailed Instructions
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Check the <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">RUN_MIGRATION_INSTRUCTIONS.md</code> file 
                  in your project root for step-by-step guidance.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={reset}>
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                >
                  Open Supabase Dashboard
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium mb-2">Technical Details</summary>
                  <pre className="bg-muted p-3 rounded-lg overflow-auto text-xs">
                    {error.message}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="max-w-lg p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Please try again.
            </p>

            <Button onClick={reset} className="mb-4">
              Try Again
            </Button>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
              <pre className="bg-muted p-3 rounded-lg overflow-auto text-xs mt-2">
                {error.message}
              </pre>
            </details>
          </div>
        </div>
      </Card>
    </div>
  );
}
