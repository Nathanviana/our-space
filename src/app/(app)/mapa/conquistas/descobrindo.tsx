"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { continuarDescobrindo } from "./actions";

// Descobre a cidade dos lugares novos em segundo plano e atualiza os números quando termina
export function Descobrindo({ restam: inicial }: { restam: number }) {
  const router = useRouter();
  const [restam, setRestam] = useState(inicial);

  useEffect(() => {
    let vivo = true;
    (async () => {
      let r = inicial;
      while (vivo && r > 0) {
        const antes = r;
        r = (await continuarDescobrindo().catch(() => ({ restam: 0 }))).restam;
        if (!vivo) return;
        setRestam(r);
        router.refresh();
        if (r >= antes) break; // o serviço não respondeu: tenta na próxima visita
      }
    })();
    return () => {
      vivo = false;
    };
  }, [inicial, router]);

  if (restam <= 0) return null;
  return (
    <p className="descobrindo" aria-live="polite">
      <span className="girando escuro" aria-hidden /> Descobrindo as cidades de {restam} {restam === 1 ? "lugar novo" : "lugares novos"}…
    </p>
  );
}
