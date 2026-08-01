import { Box, Button, useTheme } from "@mui/material";
import axios from "axios";
import { useEffect, useRef } from "react";
import { FcGoogle } from "react-icons/fc";
import { API_URL } from "../../../config";

const GSI_SCRIPT_ID = "google-identity-services";
const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Loaded lazily (only while this component is mounted, i.e. on Login/Register)
// rather than from index.html, so pages that don't offer Google sign-in never
// pay for it.
function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.getElementById(GSI_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google script failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.id = GSI_SCRIPT_ID;
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed to load"));
    document.body.appendChild(script);
  });
}

/**
 * "Continuer avec Google" button using Google Identity Services.
 * Stays a real disabled MUI button (not just dimmed) until `acceptTerms` is
 * true, matching the consent gate already required by the classic form.
 */
function GoogleSignInButton({ acceptTerms, onSuccess, onError }) {
  const buttonRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const isDarkMode = useTheme().palette.mode === "dark";

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!acceptTerms) return;

    let cancelled = false;

    const handleCredential = async (response) => {
      try {
        const formData = new FormData();
        formData.append("credential", response.credential);
        formData.append("accept_terms", "1");
        const res = await axios.post(`${API_URL}/api/auth/google`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        onSuccessRef.current(res.data.user, res.data.expires_at);
      } catch (err) {
        const message = err.response?.data?.message || "Une erreur est survenue avec la connexion Google";
        onErrorRef.current(message);
      }
    };

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredential,
        });
        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          // "pill" + a theme-matched fill keep Google's button from looking
          // like a foreign widget dropped next to the app's own pill-shaped,
          // rounded buttons (see MuiButton overrides in _darkTheme/_lightTheme).
          shape: "pill",
          theme: isDarkMode ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          logo_alignment: "left",
          locale: "fr",
          width: 300,
        });
      })
      .catch(() => {
        if (!cancelled) onErrorRef.current("Impossible de charger la connexion Google");
      });

    return () => {
      cancelled = true;
    };
  }, [acceptTerms, isDarkMode]);

  if (!acceptTerms) {
    return (
      <Button
        variant="outlined"
        disabled
        startIcon={<FcGoogle size={20} />}
        fullWidth
        sx={{ mt: 2, maxWidth: 300, height: 40 }}
      >
        Continuer avec Google
      </Button>
    );
  }

  return <Box ref={buttonRef} sx={{ display: "flex", justifyContent: "center", mt: 2, minHeight: 40 }} />;
}

export default GoogleSignInButton;
