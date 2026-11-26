import type { PointerEvent } from 'react'

/** Inclinação máxima do card (graus) no efeito 3D que segue o mouse. */
const MAX_TILT_DEG = 6

/**
 * Efeito visual apenas: grava a inclinação em duas variáveis CSS do card
 * (--tilt-x/--tilt-y). O CSS decide se usa (só com mouse e sem
 * prefers-reduced-motion). Não guarda estado nem re-renderiza o React.
 */
export function tiltCard(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse') return
  const card = event.currentTarget
  const box = card.getBoundingClientRect()
  const x = (event.clientX - box.left) / box.width - 0.5
  const y = (event.clientY - box.top) / box.height - 0.5
  card.style.setProperty('--tilt-x', `${(-y * 2 * MAX_TILT_DEG).toFixed(2)}deg`)
  card.style.setProperty('--tilt-y', `${(x * 2 * MAX_TILT_DEG).toFixed(2)}deg`)
}

export function resetCardTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty('--tilt-x')
  event.currentTarget.style.removeProperty('--tilt-y')
}
