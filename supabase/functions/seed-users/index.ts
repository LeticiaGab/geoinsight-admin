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

    // Sample users data with Brazilian names
    const usersData = [
      { 
        email: 'ana.silva@exemplo.com.br', 
        full_name: 'Ana Paula Silva', 
        role: 'administrator',
        status: 'active',
        registration_date: '2023-01-10T10:00:00Z'
      },
      { 
        email: 'carlos.santos@exemplo.com.br', 
        full_name: 'Carlos Eduardo Santos', 
        role: 'researcher',
        status: 'active',
        registration_date: '2023-02-15T14:30:00Z'
      },
      { 
        email: 'juliana.oliveira@exemplo.com.br', 
        full_name: 'Juliana Oliveira Costa', 
        role: 'analyst',
        status: 'active',
        registration_date: '2023-03-20T09:15:00Z'
      },
      { 
        email: 'marcos.ferreira@exemplo.com.br', 
        full_name: 'Marcos Vinicius Ferreira', 
        role: 'coordinator',
        status: 'active',
        registration_date: '2023-04-05T11:45:00Z'
      },
      { 
        email: 'patricia.almeida@exemplo.com.br', 
        full_name: 'Patrícia Almeida Rocha', 
        role: 'researcher',
        status: 'inactive',
        registration_date: '2023-05-12T16:20:00Z'
      },
      { 
        email: 'rodrigo.lima@exemplo.com.br', 
        full_name: 'Rodrigo Lima Barbosa', 
        role: 'analyst',
        status: 'active',
        registration_date: '2023-06-18T08:30:00Z'
      },
      { 
        email: 'fernanda.costa@exemplo.com.br', 
        full_name: 'Fernanda Costa Ribeiro', 
        role: 'researcher',
        status: 'active',
        registration_date: '2023-07-22T13:10:00Z'
      },
      { 
        email: 'bruno.souza@exemplo.com.br', 
        full_name: 'Bruno Henrique Souza', 
        role: 'coordinator',
        status: 'inactive',
        registration_date: '2023-08-30T15:45:00Z'
      },
      { 
        email: 'camila.rodrigues@exemplo.com.br', 
        full_name: 'Camila Rodrigues Martins', 
        role: 'analyst',
        status: 'active',
        registration_date: '2023-09-14T10:25:00Z'
      },
      { 
        email: 'rafael.pereira@exemplo.com.br', 
        full_name: 'Rafael Pereira Gomes', 
        role: 'researcher',
        status: 'active',
        registration_date: '2023-10-08T12:00:00Z'
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