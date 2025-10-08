"use client";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowBigRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ExtensionAuth() {
  const searchParams = useSearchParams();
  const redirect_uri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");

  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const mintSigil = useMutation(api.auth.mintSigil);

  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const handleInteractionStart = () => {
    if (isCompleted) return;
    setIsDragging(true);
  };

  const handleInteractionEnd = useCallback(() => {
    if (!isDragging || isCompleted) return;
    setIsDragging(false);
    if (sliderPosition < (sliderRef.current?.clientWidth ?? 0) * 0.9) {
      setSliderPosition(0);
    }
  }, [isDragging, isCompleted, sliderPosition]);

  const handleInteractionMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !sliderRef.current || !thumbRef.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const sliderRect = sliderRef.current.getBoundingClientRect();
      const thumbWidth = thumbRef.current.offsetWidth;
      const maxPosition = sliderRect.width - thumbWidth;

      let newPosition = clientX - sliderRect.left - thumbWidth / 2;
      newPosition = Math.max(0, Math.min(newPosition, maxPosition));
      setSliderPosition(newPosition);

      if (newPosition >= maxPosition * 0.98) {
        setIsDragging(false);
        setIsCompleted(true);
        setSliderPosition(maxPosition);
        if (
          !redirect_uri ||
          !/https:\/\/[a-z]{32}\.chromiumapp\.org\/provider_cb/.test(
            redirect_uri,
          )
        ) {
          console.error("Invalid redirect_uri");
          return;
        }
        if (redirect_uri && state) {
          mintSigil().then(sigil => {
            const url = new URL(redirect_uri);
            url.searchParams.set("sigil", sigil);
            url.searchParams.set("state", state);
            window.location.href = url.toString();
          });
        }
      }
    },
    [isDragging, redirect_uri, state, mintSigil],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleInteractionMove);
    window.addEventListener("touchmove", handleInteractionMove);
    window.addEventListener("mouseup", handleInteractionEnd);
    window.addEventListener("touchend", handleInteractionEnd);

    return () => {
      window.removeEventListener("mousemove", handleInteractionMove);
      window.removeEventListener("touchmove", handleInteractionMove);
      window.removeEventListener("mouseup", handleInteractionEnd);
      window.removeEventListener("touchend", handleInteractionEnd);
    };
  }, [
    isDragging,
    isCompleted,
    redirect_uri,
    state,
    handleInteractionEnd,
    handleInteractionMove,
  ]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 h-[calc(100dvh-3.5rem)] pb-32">
      <div className="flex flex-col items-start font-title text-4xl font-extrabold select-none relative">
        Hypershelf
        <div className="absolute bottom-0 left-0 h-1 w-11.5 overflow-hidden">
          <div className="bg-brand h-full w-full" />
        </div>
      </div>
      <p className="text-center text-muted-foreground">
        Сдвинь слайдер, чтобы авторизоваться во внешнем приложении
      </p>
      {redirect_uri && state && (
        <div
          ref={sliderRef}
          className="relative w-96 h-16 border border-border rounded-full flex items-center justify-center overflow-hidden select-none"
        >
          <span
            className={cn(
              "z-10 transition-opacity duration-300 slide-to-unlock",
              isDragging || isCompleted ? "opacity-0" : "opacity-100",
            )}
          >
            Потяни для авторизации
          </span>
          <motion.div
            ref={thumbRef}
            onMouseDown={handleInteractionStart}
            onTouchStart={handleInteractionStart}
            className={
              "absolute top-1/2 -translate-y-1/2 left-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-20 cursor-grab active:cursor-grabbing"
            }
            animate={{ x: sliderPosition }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
          >
            <ArrowBigRight className="size-6 text-border/60" />
          </motion.div>
        </div>
      )}
    </div>
  );
}
