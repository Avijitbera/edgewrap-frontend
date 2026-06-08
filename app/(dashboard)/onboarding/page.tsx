"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateProject } from "@/lib/queries/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle, Loader2, FolderPlus } from "lucide-react";
import type { Metadata } from "next";

export default function OnboardingPage() {
  const router = useRouter();
  const createProject = useCreateProject();

  const [name, setName] = useState("");
  const [originUrl, setOriginUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createProject.mutateAsync({
        name,
        originUrl: originUrl || undefined,
        description: description || undefined,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-4 py-16">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
          <FolderPlus className="h-6 w-6 text-foreground" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your first project
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          A project represents an API or service you want to protect and
          accelerate at the edge.
        </p>
      </div>

      <Card className="w-full max-w-md border-border">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="project-name">Project name *</Label>
              <Input
                id="project-name"
                type="text"
                placeholder="my-api"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="origin-url">Origin URL</Label>
              <Input
                id="origin-url"
                type="url"
                placeholder="https://api.example.com"
                value={originUrl}
                onChange={(e) => setOriginUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The upstream API server requests will be forwarded to.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createProject.isPending || !name}
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create project"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
