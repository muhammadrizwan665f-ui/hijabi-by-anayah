
import { createSupabaseAdminClient } from './integrations/supabase/client.server';

async function run() {
  const email = process.env.ADMIN_EMAIL || 'hijabibyanayah@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'hijab:anayah:by//@hijani11001x0nsTvy';
  
  console.log(`Provisioning admin: ${email}`);
  
  const supabase = createSupabaseAdminClient();
  
  // 1. Create/Get User
  let userId: string | null = null;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Anayah Admin" }
  });
  
  if (createError) {
    console.log(`User might exist or error: ${createError.message}`);
    const { data: list } = await supabase.auth.admin.listUsers();
    userId = list?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())?.id || null;
    if (userId) {
      console.log(`Found existing user: ${userId}. Updating password.`);
      await supabase.auth.admin.updateUserById(userId, { password });
    }
  } else {
    userId = created.user.id;
    console.log(`Created new user: ${userId}`);
  }
  
  if (!userId) {
    console.error("Failed to acquire User ID");
    process.exit(1);
  }
  
  // 2. Profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    full_name: "Anayah Admin"
  });
  if (profileError) console.error(`Profile error: ${profileError.message}`);
  
  // 3. Admin Role
  const { error: roleError } = await supabase.from('user_roles').upsert({
    user_id: userId,
    role: 'admin'
  }, { onConflict: 'user_id,role' });
  
  if (roleError) {
    console.error(`Role error: ${roleError.message}`);
    process.exit(1);
  }
  
  console.log("Admin provisioned successfully.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
