import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import pt from "./locales/pt";
import { supabase } from "@/integrations/supabase/safeClient";

const savedLanguage = localStorage.getItem("language") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Load language preference from database
(async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userRow, error: userRowError } = await supabase
      .from("users")
      .select("client_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userRowError || !userRow?.client_id) return;

    const { data, error } = await supabase
      .from("clients")
      .select("language")
      .eq("id", userRow.client_id)
      .maybeSingle();

    if (error) return;

    if (data?.language && data.language !== i18n.language) {
      i18n.changeLanguage(data.language);
      localStorage.setItem("language", data.language);
    }
  } catch {
    // ignore
  }
})();

export default i18n;
