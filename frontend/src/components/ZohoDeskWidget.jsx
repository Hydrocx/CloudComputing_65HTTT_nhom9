import { useEffect } from "react";

/**
 * Zoho Desk ASAP Widget
 * Embeds a floating support button for Zoho Desk.
 */
const ZohoDeskWidget = () => {
  const widgetId = import.meta.env.VITE_ZOHO_DESK_WIDGET_ID;

  useEffect(() => {
    if (!widgetId) return;

    // Check if script already loaded
    if (document.getElementById("zoho-desk-asap-script")) return;

    const script = document.createElement("script");
    script.id = "zoho-desk-asap-script";
    script.type = "text/javascript";
    script.defer = true;
    script.src = `https://desk.zoho.com/portal/api/web/inapp/${widgetId}?orgId=__ORG_ID__`;

    // Zoho ASAP configuration
    window.ZohoHCAsapSettings = {
      hideLauncher: false,
      position: "bottomright",
      themeColor: "#0ea5e9",
      ticketsSettings: {
        preFillFields: {},
      },
    };

    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("zoho-desk-asap-script");
      if (el) el.remove();
    };
  }, [widgetId]);

  if (!widgetId) return null;

  return null; // Widget renders itself via the injected script
};

export default ZohoDeskWidget;
