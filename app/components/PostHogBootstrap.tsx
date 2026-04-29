"use client";

import { useEffect } from "react";

import { ensurePosthog } from "@/lib/posthog-browser";

export default function PostHogBootstrap() {
  useEffect(() => {
    void ensurePosthog();
  }, []);

  return null;
}
