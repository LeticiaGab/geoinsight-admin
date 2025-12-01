import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  action: "create" | "delete" | "list";
  email?: string;
  password?: string;
  full_name?: string;
  role?: string;
  status?: string;
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's token to verify they're authenticated
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !currentUser) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await userClient.rpc('has_role', {
      _user_id: currentUser.id,
      _role: 'administrator'
    });

    if (roleError || !isAdmin) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create admin client with service role key for user management
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreateUserRequest = await req.json();
    console.log("Request body:", body);

    switch (body.action) {
      case "create": {
        if (!body.email || !body.password || !body.full_name || !body.role) {
          return new Response(
            JSON.stringify({ error: "Email, password, full_name and role are required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
          return new Response(
            JSON.stringify({ error: "Invalid email format" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Validate password strength
        if (body.password.length < 6) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 6 characters" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Validate role
        const validRoles = ['administrator', 'researcher', 'analyst', 'coordinator'];
        if (!validRoles.includes(body.role)) {
          return new Response(
            JSON.stringify({ error: "Invalid role" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Create auth user
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: { full_name: body.full_name },
        });

        if (authError) {
          console.error("Auth create error:", authError);
          return new Response(
            JSON.stringify({ error: authError.message }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        if (!authData.user) {
          return new Response(
            JSON.stringify({ error: "Failed to create user" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Create profile
        const { error: profileError } = await adminClient
          .from("profiles")
          .insert({
            id: authData.user.id,
            full_name: body.full_name,
            status: body.status || "active",
          });

        if (profileError) {
          console.error("Profile create error:", profileError);
          // Cleanup: delete auth user if profile creation fails
          await adminClient.auth.admin.deleteUser(authData.user.id);
          return new Response(
            JSON.stringify({ error: profileError.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Assign role
        const { error: roleAssignError } = await adminClient
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: body.role,
          });

        if (roleAssignError) {
          console.error("Role assign error:", roleAssignError);
          // Cleanup: delete profile and auth user
          await adminClient.from("profiles").delete().eq("id", authData.user.id);
          await adminClient.auth.admin.deleteUser(authData.user.id);
          return new Response(
            JSON.stringify({ error: roleAssignError.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log("User created successfully:", authData.user.id);

        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: authData.user.id,
              email: authData.user.email,
              full_name: body.full_name,
              role: body.role,
              status: body.status || "active",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "delete": {
        if (!body.user_id) {
          return new Response(
            JSON.stringify({ error: "user_id is required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Prevent self-deletion
        if (body.user_id === currentUser.id) {
          return new Response(
            JSON.stringify({ error: "Cannot delete your own account" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Delete user role first
        const { error: roleDeleteError } = await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", body.user_id);

        if (roleDeleteError) {
          console.error("Role delete error:", roleDeleteError);
        }

        // Delete profile
        const { error: profileDeleteError } = await adminClient
          .from("profiles")
          .delete()
          .eq("id", body.user_id);

        if (profileDeleteError) {
          console.error("Profile delete error:", profileDeleteError);
        }

        // Delete auth user
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(body.user_id);

        if (authDeleteError) {
          console.error("Auth delete error:", authDeleteError);
          return new Response(
            JSON.stringify({ error: authDeleteError.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        console.log("User deleted successfully:", body.user_id);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "list": {
        // Get all auth users
        const { data: authUsersData, error: listError } = await adminClient.auth.admin.listUsers();

        if (listError) {
          console.error("List users error:", listError);
          return new Response(
            JSON.stringify({ error: listError.message }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Map auth users to get emails
        const authUsers = authUsersData?.users || [];
        const emailMap: Record<string, string> = {};
        authUsers.forEach((u) => {
          emailMap[u.id] = u.email || "N/A";
        });

        return new Response(
          JSON.stringify({ success: true, emails: emailMap }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }
  } catch (error: any) {
    console.error("Error in admin-user-management:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
