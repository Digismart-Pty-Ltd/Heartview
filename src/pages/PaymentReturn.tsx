import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import { toast } from "sonner";

const PaymentReturn = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = params.get("paymentId") || localStorage.getItem("pending-payment-id");
  const cancelled = params.get("cancelled");
  const failed = params.get("failed");
  const [status, setStatus] = useState<"waiting" | "failed">("waiting");

  useEffect(() => {
    if (cancelled) {
      toast.info("Payment cancelled");
      navigate("/create", { replace: true });
      return;
    }
    if (!paymentId) {
      navigate("/create", { replace: true });
      return;
    }
    const unsub = onSnapshot(doc(db, "payments", paymentId), (snap) => {
      const data = snap.data();
      if (data?.status === "paid") {
        localStorage.removeItem("pending-payment-id");
        localStorage.removeItem("create-draft");
        toast.success("Payment received — program created");
        navigate(`/program/${data.programId}?edit=true`, { replace: true });
      }
      if (data?.status === "failed" || failed) {
        setStatus("failed");
      }
    });
    return () => unsub();
  }, [paymentId, cancelled, failed, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm p-6 text-center">
      {status === "waiting" ? (
        <p className="text-whisper">Confirming your payment…</p>
      ) : (
        <div>
          <p className="text-whisper">Payment failed — please try again.</p>
          <button onClick={() => navigate("/create")} className="mt-4 underline">
            Back to program
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentReturn;