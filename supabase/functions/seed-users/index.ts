import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log("Starting user seeding process...");

    // 5 Admin users
    const usersData = [
      { 
        email: 'admin1@exemplo.com.br', 
        full_name: 'Admin User One', 
        role: 'administrator',
        status: 'active',
        registration_date: '2024-01-10T10:00:00Z'
      },
      { 
        email: 'admin2@exemplo.com.br', 
        full_name: 'Admin User Two', 
        role: 'administrator',
        status: 'active',
        registration_date: '2024-01-11T10:00:00Z'
      },
      { 
        email: 'admin3@exemplo.com.br', 
        full_name: 'Admin User Three', 
        role: 'administrator',
        status: 'active',
        registration_date: '2024-01-12T10:00:00Z'
      },
      { 
        email: 'admin4@exemplo.com.br', 
        full_name: 'Admin User Four', 
        role: 'administrator',
        status: 'active',
        registration_date: '2024-01-13T10:00:00Z'
      },
      { 
        email: 'admin5@exemplo.com.br', 
        full_name: 'Admin User Five', 
        role: 'administrator',
        status: 'active',
        registration_date: '2024-01-14T10:00:00Z'
      }
    ];

    const createdUsers = [];

    for (const userData of usersData) {
      console.log(`Creating user: ${userData.email}`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: 'Test@123456', // Default password for all test users
        email_confirm: true,
      });

      if (authError) {
        console.error(`Error creating auth user ${userData.email}:`, authError);
        continue;
      }

      console.log(`Auth user created: ${authData.user.id}`);

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: userData.full_name,
          registration_date: userData.registration_date,
          status: userData.status,
        });

      if (profileError) {
        console.error(`Error creating profile for ${userData.email}:`, profileError);
        continue;
      }

      console.log(`Profile created for: ${userData.full_name}`);

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: userData.role,
        });

      if (roleError) {
        console.error(`Error assigning role to ${userData.email}:`, roleError);
        continue;
      }

      console.log(`Role assigned: ${userData.role} to ${userData.full_name}`);

      createdUsers.push({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
      });
    }

    console.log(`Successfully created ${createdUsers.length} users`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully created ${createdUsers.length} test users`,
        users: createdUsers,
        defaultPassword: 'Test@123456'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in seed-users function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});