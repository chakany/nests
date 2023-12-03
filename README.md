# Nostr Nests

Nostr Nests is an audio space for chatting, brainstorming, debating, jamming, micro-conferences and more.

## Developing

Once you've created a project and installed dependencies with `pnpm install`, start a development server:

If you use `npm`, you're going to have a bad time.

```bash
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
