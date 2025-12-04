import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'created' | 'updated' | 'deleted';
  user: {
    name: string;
    email: string;
    role?: string;
  };
  adminEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, user, adminEmail }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification for user:`, user.email);

    let subject = "";
    let html = "";

    switch (type) {
      case 'created':
        subject = `Novo usuário criado: ${user.name}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Novo Usuário Criado</h2>
            <p>Um novo usuário foi criado no sistema GeoCidades.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nome:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              ${user.role ? `<p><strong>Perfil:</strong> ${user.role}</p>` : ''}
            </div>
            <p style="color: #6b7280; font-size: 14px;">Esta é uma notificação automática do sistema GeoCidades.</p>
          </div>
        `;
        break;

      case 'updated':
        subject = `Usuário atualizado: ${user.name}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Usuário Atualizado</h2>
            <p>As informações de um usuário foram atualizadas no sistema GeoCidades.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nome:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              ${user.role ? `<p><strong>Perfil:</strong> ${user.role}</p>` : ''}
            </div>
            <p style="color: #6b7280; font-size: 14px;">Esta é uma notificação automática do sistema GeoCidades.</p>
          </div>
        `;
        break;

      case 'deleted':
        subject = `Usuário removido: ${user.name}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Usuário Removido</h2>
            <p>Um usuário foi removido do sistema GeoCidades.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nome:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Esta é uma notificação automática do sistema GeoCidades.</p>
          </div>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "GeoCidades <onboarding@resend.dev>",
      to: [adminEmail],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
