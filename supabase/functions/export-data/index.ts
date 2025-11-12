import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  format: "csv" | "pdf";
  data: any[];
  filename: string;
  columns: string[];
  userName?: string;
}

const generateCSV = (data: any[], columns: string[]): string => {
  const headers = columns.join(",");
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col] || "";
      // Escape commas and quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers, ...rows].join("\n");
};

const generatePDF = (data: any[], columns: string[], userName: string): string => {
  // Simple HTML structure for PDF conversion
  const date = new Date().toLocaleDateString("pt-BR");
  const time = new Date().toLocaleTimeString("pt-BR");
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; color: #22C55E; font-weight: bold; }
        .meta { color: #666; font-size: 14px; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #22C55E; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Geo-Cidades</div>
        <div class="meta">
          Exportado em: ${date} às ${time}<br>
          Responsável: ${userName || "Sistema"}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => `<td>${row[col] || ""}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  return html;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { format, data, filename, columns, userName }: ExportRequest = await req.json();

    if (!format || !data || !filename || !columns) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let content: string;
    let contentType: string;
    let fileExtension: string;

    if (format === "csv") {
      content = generateCSV(data, columns);
      contentType = "text/csv";
      fileExtension = "csv";
    } else if (format === "pdf") {
      content = generatePDF(data, columns, userName || user.email || "Sistema");
      contentType = "text/html"; // Return HTML for client-side PDF conversion
      fileExtension = "html";
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid format. Use 'csv' or 'pdf'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}.${fileExtension}"`,
      },
    });
  } catch (error: any) {
    console.error("Error in export-data function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
