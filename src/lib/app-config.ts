const DEFAULT_BOT_INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1113403511045107773&permissions=2255511571262711&integration_type=0&scope=bot+applications.commands';

export const appConfig = {
  botInviteUrl: (import.meta.env.VITE_BOT_INVITE_URL as string | undefined) ?? DEFAULT_BOT_INVITE_URL,
};
