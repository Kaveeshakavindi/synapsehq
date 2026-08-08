from supabase import create_client, Client
from app.core.config import settings

# ⚠️ service_role key — bypasses Row Level Security entirely.
# Only import this in code paths that have already verified the caller
# via get_current_user, or that are triggered by trusted server-side logic.
supabase_admin: Client = create_client(
    settings.supabase_url,
    settings.supabase_secret_key,
)