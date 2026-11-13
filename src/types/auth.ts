export interface DiscordUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface AuthState {
  authenticated: boolean;
  user: DiscordUser | null;
  loading: boolean;
  error: string | null;
}
