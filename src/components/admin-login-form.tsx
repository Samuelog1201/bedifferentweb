"use client";

import { useActionState } from "react";
import { signInAdmin, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(signInAdmin, initialState);
  return <form action={action} className="admin-form">
    <label htmlFor="email">Correo administrador</label>
    <input autoComplete="username" id="email" name="email" required type="email" />
    <label htmlFor="password">Contraseña</label>
    <input autoComplete="current-password" id="password" name="password" required type="password" />
    {state.error && <p aria-live="polite" className="form-error">{state.error}</p>}
    <button className="button button-dark button-wide" disabled={pending} type="submit">{pending ? "Ingresando…" : "Entrar al panel"}</button>
  </form>;
}
