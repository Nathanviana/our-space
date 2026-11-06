// Música da memória tocando na própria tela: Spotify, YouTube e Apple Music. Sem imports: testado com node --test.

export interface EmbedMusica {
  servico: "spotify" | "youtube" | "apple";
  src: string;
  altura: number | null; // null = vídeo 16:9
}

export function embedDaMusica(link: string | null): EmbedMusica | null {
  if (!link) return null;
  let u: URL;
  try {
    u = new URL(link);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, "");

  if (host === "open.spotify.com") {
    const m = u.pathname.match(/^\/(?:intl-[\w-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    return { servico: "spotify", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, altura: m[1] === "track" || m[1] === "episode" ? 152 : 352 };
  }

  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtu.be") {
    const id = host === "youtu.be" ? u.pathname.slice(1).split("/")[0] : u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1];
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
    return { servico: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}`, altura: null };
  }

  if (host === "music.apple.com") {
    return { servico: "apple", src: `https://embed.music.apple.com${u.pathname}${u.search}`, altura: u.searchParams.has("i") ? 175 : 450 };
  }
  return null;
}
