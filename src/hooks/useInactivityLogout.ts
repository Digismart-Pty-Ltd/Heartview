import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import { toast } from "sonner";

const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const DRAFT_KEY = "create-draft";

export const useInactivityLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (auth.currentUser) {
          await signOut(auth);
          localStorage.removeItem(DRAFT_KEY);
          toast.info("You've been signed out after 2 hours of inactivity.");
          navigate("/auth");
        }
      }, TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "pointerdown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [navigate]);
};