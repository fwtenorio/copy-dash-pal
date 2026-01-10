import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DisputeRequest {
  order_id: string;
  customer_email: string;
  customer_name?: string;
  problem_type: "not_received" | "defect" | "regret" | "cancel" | "fraud";
  evidence_data: {
    description: string;
    photos?: string[];
    checked_neighbors?: boolean;
    checked_carrier?: boolean;
    defect_type?: string;
    product_opened?: boolean;
    product_packaging?: boolean;
    regret_reason?: string;
    recognize_address?: string;
    family_purchase?: boolean;
    chargeback_initiated?: boolean;
    chargeback_protocol?: string;
  };
  preferred_resolution: "credit" | "refund";
  order_total?: number;
  currency?: string;
  client_id?: string;
  shop?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role to bypass RLS for inserting dispute requests
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: DisputeRequest = await req.json();

    // Validate required fields
    if (!body.order_id || !body.customer_email || !body.problem_type || !body.preferred_resolution) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: order_id, customer_email, problem_type, preferred_resolution" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate problem_type
    const validProblemTypes = ["not_received", "defect", "regret", "cancel", "fraud"];
    if (!validProblemTypes.includes(body.problem_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid problem_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate preferred_resolution
    if (!["credit", "refund"].includes(body.preferred_resolution)) {
      return new Response(
        JSON.stringify({ error: "Invalid preferred_resolution. Must be 'credit' or 'refund'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate protocol number
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const protocolNumber = `REQ-${timestamp}-${randomSuffix}`;

    // Find client_id from shop if provided
    let clientId = body.client_id;
    if (!clientId && body.shop) {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("shopify_store_name", body.shop)
        .maybeSingle();
      
      if (client) {
        clientId = client.id;
      }
    }

    // Insert the dispute request
    const { data, error } = await supabase
      .from("dispute_requests")
      .insert({
        order_id: body.order_id,
        customer_email: body.customer_email,
        customer_name: body.customer_name || null,
        problem_type: body.problem_type,
        evidence_data: body.evidence_data,
        preferred_resolution: body.preferred_resolution,
        order_total: body.order_total || null,
        currency: body.currency || "USD",
        protocol_number: protocolNumber,
        client_id: clientId || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting dispute request:", error);
      return new Response(
        JSON.stringify({ error: "Failed to submit dispute request", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Dispute request created:", data);

    return new Response(
      JSON.stringify({
        success: true,
        protocol_number: protocolNumber,
        message: "Your request has been submitted for review. You will receive an email within 24 hours.",
        request_id: data.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in submit-dispute function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
