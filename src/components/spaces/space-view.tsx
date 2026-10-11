"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/copy-field";
import { Dialog } from "@/components/ui/dialog";
import { SectionLabel } from "@/components/ui/section-label";
import { api } from "@/lib/api-client";
import { toast } from "@/lib/toast";

const subscribeNoop = () => () => {};

export function SpaceView({ token, title }: { token: string; title: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rotating, setRotating] = useState(false);
  // The origin is only known in the browser; render a path on the server.
  const origin = useSyncExternalStore(subscribeNoop, () => window.location.origin, () => "");
  const shareUrl = `${origin}/t/${token}`;

  async function rotate() {
    setRotating(true);
    const res = await api<{ token: string }>(`/api/spaces/${token}/rotate`, { method: "POST" });
    setRotating(false);
    setConfirmOpen(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast("New link ready. The old one no longer works.");
    router.replace(`/t/${res.data.token}`);
  }

  return (
    <>
      <section className="flex flex-col gap-2">
        <p className="label text-mute">Space</p>
        <h1 className="display break-words text-5xl">{title}</h1>
      </section>

      <section>
        <SectionLabel n="01">Share</SectionLabel>
        <CopyField value={shareUrl} />
        <p className="mt-3 text-xs text-mute">Anyone with this link can open this space. No login.</p>
      </section>

      <section>
        <SectionLabel n="02">Link</SectionLabel>
        <Button variant="outline" block onClick={() => setConfirmOpen(true)}>
          Replace link
        </Button>
      </section>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Replace link?"
        description="The current link stops working right away. Share the new one with anyone who should keep access."
      >
        <div className="flex gap-3">
          <Button variant="outline" block onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button block onClick={rotate} disabled={rotating}>
            {rotating ? "Replacing" : "Replace"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
