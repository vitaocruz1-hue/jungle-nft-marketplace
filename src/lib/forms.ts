/** Leva o foco ao primeiro campo com erro (após enviar o formulário). */
export function focusFirstError(form: HTMLFormElement | null, fieldErrors: Record<string, string>) {
  const first = Object.keys(fieldErrors)[0]
  if (!form || !first) return
  const input = form.querySelector<HTMLInputElement>(`[name="${first}"]`)
  input?.focus()
}
