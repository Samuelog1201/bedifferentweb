"use client";

import { useActionState, type FormEvent } from "react";
import { archiveProduct, type ArchiveState } from "@/app/admin/actions";

const initialState: ArchiveState = {};

export function ArchiveProductForm({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(archiveProduct, initialState);

  function confirmArchive(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`¿Archivar “${name}”? Dejará de aparecer en el catálogo.`)) event.preventDefault();
  }

  return <form action={action} onSubmit={confirmArchive}>
    <input name="id" type="hidden" value={id} />
    <button aria-label={`Archivar ${name}`} disabled={pending} type="submit">{pending ? "Archivando…" : "Archivar"}</button>
    {state.error && <span aria-live="polite" className="form-error">{state.error}</span>}
    {state.success && <span aria-live="polite" className="form-success">Producto archivado.</span>}
  </form>;
}
