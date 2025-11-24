import { useEffect } from "react";

const MIDTRANS_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/snap.js";
const MIDTRANS_PRODUCTION_URL = "https://app.midtrans.com/snap/snap.js";

/**
 * Loads the Midtrans Snap script once and attaches the configured client key.
 * This hook is safe to call from multiple components; the script will only
 * be appended the first time.
 */
export const useMidtransSnap = () => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existingScript = document.getElementById("midtrans-snap-script");
    if (existingScript) {
      return;
    }

    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      console.warn("MIDTRANS_CLIENT_KEY is not set. Snap payments will not work.");
      return;
    }

    const snapUrl =
      import.meta.env.VITE_MIDTRANS_SNAP_URL ||
      (import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === "true"
        ? MIDTRANS_PRODUCTION_URL
        : MIDTRANS_SANDBOX_URL);

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = snapUrl;
    script.async = true;
    script.setAttribute("data-client-key", clientKey);

    document.body.appendChild(script);
  }, []);
};

export default useMidtransSnap;

