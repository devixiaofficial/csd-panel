import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CSDEntry {
  id: string;
  company_name: string;
  contact_name: string;
  email?: string;
  contact_number?: string;
  business: string;
}

interface RequestBody {
  entries: CSDEntry[];
}

const GMAIL_USER = "devixia.official@gmail.com";
const DEVIXIA_PHONE = "03215419958";

async function sendEmail(entry: CSDEntry): Promise<boolean> {
  try {
    const subject = "Business Collaboration Opportunity – Devixia";
    const message = `Dear ${entry.contact_name},

We explored your business, "${entry.business}," and found it impressive.

Devixia specializes in professional web development services and digital solutions that help businesses grow online.

We would love to discuss how we can support your business with modern, high-performing web solutions.

Best Regards,
Team Devixia
📧 devixia.official@gmail.com
📞 03215419958`;

    console.log(`[EMAIL] Would send to: ${entry.email}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Message: ${message}`);

    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send to ${entry.email}:`, error);
    return false;
  }
}

async function sendWhatsApp(entry: CSDEntry): Promise<boolean> {
  try {
    const message = `Dear ${entry.contact_name},

We explored your business, "${entry.business}," and found it impressive.

Devixia specializes in professional web development services and digital solutions that help businesses grow online.

We would love to discuss how we can support your business with modern, high-performing web solutions.

Best Regards,
Team Devixia
📧 devixia.official@gmail.com
📞 03215419958`;

    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = entry.contact_number!.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    console.log(`[WHATSAPP] Would send to: ${entry.contact_number}`);
    console.log(`[WHATSAPP] URL: ${whatsappUrl}`);
    console.log(`[WHATSAPP] Message: ${message}`);

    return true;
  } catch (error) {
    console.error(`[WHATSAPP ERROR] Failed to send to ${entry.contact_number}:`, error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { entries }: RequestBody = await req.json();

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request: entries array is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let emailsSent = 0;
    let whatsappSent = 0;
    const results: Array<{ id: string; email: boolean; whatsapp: boolean }> = [];

    for (const entry of entries) {
      const result = {
        id: entry.id,
        email: false,
        whatsapp: false,
      };

      if (entry.email) {
        const emailSuccess = await sendEmail(entry);
        if (emailSuccess) {
          emailsSent++;
          result.email = true;
        }
      }

      if (entry.contact_number) {
        const whatsappSuccess = await sendWhatsApp(entry);
        if (whatsappSuccess) {
          whatsappSent++;
          result.whatsapp = true;
        }
      }

      results.push(result);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        whatsappSent,
        totalProcessed: entries.length,
        results,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[ERROR] Error processing request:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
