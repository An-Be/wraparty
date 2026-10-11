"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { TITLE_MAX } from "@/lib/spaces-schema";

export function CreateSpaceForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const res = await api<{ token: string }>("/api/spaces", { method: "POST", body: { title } });
    if (!res.ok) {
      setError(res.error);
      setPending(false);
      return;
    }
    router.push(`/t/${res.data.token}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field htmlFor="title" label="Name" error={error}>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          autoComplete="off"
          placeholder="Friday dinner"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "title-desc" : undefined}
          required
        />
      </Field>
      <Button type="submit" size="lg" block disabled={pending || !title.trim()}>
        {pending ? "Creating" : "Create link"}
      </Button>
    </form>
  );
}
