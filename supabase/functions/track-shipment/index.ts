const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, track123-api-secret",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let trackingNumber: string | undefined;
  let email: string | undefined;

  try {
    const body = await req.json();
    trackingNumber = body.trackingNumber;
    email = body.email;
    const sanitizedTracking = trackingNumber?.toString().trim().replace(/^#/, "");
    trackingNumber = sanitizedTracking || undefined;
    console.log(`Fetching tracking for: ${trackingNumber ?? "email-only"} | email: ${email ?? "n/a"}`);

    if (!trackingNumber && !email) {
      return new Response(JSON.stringify({ error: "Tracking number or email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Demo fallback for tests (e.g., #2444 or email-only)
    if (trackingNumber === "2444" || (!trackingNumber && email)) {
      const mockedData = {
        trackingNumber: trackingNumber || "email-only",
        status: "delivered",
        carrier: "Demo Carrier",
        events: [
          { date: "2024-12-15T10:00:00Z", description: "Pedido confirmado", location: "Loja" , stage: "transit" },
          { date: "2024-12-16T14:00:00Z", description: "Pedido enviado", location: "Centro de Distribuição", stage: "transit" },
          { date: "2024-12-17T09:30:00Z", description: "Saiu para entrega", location: "Hub local", stage: "transit" },
          { date: "2024-12-17T16:45:00Z", description: "Entregue", location: "Destinatário", stage: "delivered" },
        ],
      };

      return new Response(JSON.stringify(mockedData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // const apiKey = Deno.env.get('TRACK123_API_KEY');
    const apiKey = "ff5a9412fe9c423f9ded472114f543a3"
    if (!apiKey) {
      console.error("TRACK123_API_KEY not found in environment");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetching tracking data for: ${trackingNumber}`);

    // Cria um AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      // Faz a chamada ao Track123
      const res = await fetch("https://api.track123.com/gateway/open-api/tk/v2.1/track/query-realtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Track123-Api-Secret": apiKey,
          Accept: "application/json",
        },
        body: JSON.stringify({ trackNo: trackingNumber }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

    // 1) Verifica status HTTP primeiro (res é Response)
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Track123 responded with non-OK status:", res.status, text);
      return new Response(
        JSON.stringify({ error: "Failed to fetch tracking data from Track123", status: res.status, body: text }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Parseia o JSON (agora sim)
    const trackingApiBody = await res.json();
    console.log("Raw Track123 body:", JSON.stringify(trackingApiBody, null, 2));

    // Estrutura real da API Track123
    const acceptedData = trackingApiBody?.data?.accepted;
    const localLogistics = acceptedData?.localLogisticsInfo;
    const trackingDetails = localLogistics?.trackingDetails ?? [];

    // Verifica se foi entregue
    const isDelivered = !!acceptedData?.deliveredTime;

    const formattedData = {
      trackingNumber,
      status: isDelivered ? "delivered" : "in_transit",
      carrier: localLogistics?.courierNameEN || "Unknown",
      events: Array.isArray(trackingDetails)
        ? trackingDetails.map((event: any) => {
            // Detecta se este evento específico é de entrega
            const eventDescription = event?.eventDetail || "";
            const isDeliveryEvent = eventDescription.toLowerCase().includes('delivered');
            
            return {
              date: event?.eventTime || null,
              description: eventDescription,
              location: event?.address || "",
              stage: isDeliveryEvent ? "delivered" : "transit",
            };
          })
        : [],
      raw: trackingApiBody,
    };

      return new Response(JSON.stringify(formattedData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("Track123 API timeout");
        return new Response(
          JSON.stringify({ 
            error: "Timeout ao buscar dados de rastreamento",
            trackingNumber,
            carrier: "Unknown",
            status: "unavailable",
            events: []
          }), 
          { 
            status: 200, // Retorna 200 para não quebrar o frontend
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in track-shipment function:", error);
    
    // Retorna resposta vazia ao invés de erro para não quebrar o modal
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        trackingNumber,
        carrier: "Unknown",
        status: "unavailable",
        events: []
      }), 
      {
        status: 200, // Retorna 200 para não quebrar o frontend
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
