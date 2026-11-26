import { useEffect, useRef, useState } from 'react'

/**
 * Conta quantas vezes `value` AUMENTOU (ex.: itens no carrinho). Usado como `key`
 * de um ícone para tocar de novo a animação de "pulinho" a cada aumento.
 * O primeiro valor carregado (undefined → número) não conta.
 */
export function useBumpOnIncrease(value: number | undefined) {
  const previous = useRef(value)
  const [bumps, setBumps] = useState(0)

  useEffect(() => {
    if (value !== undefined && previous.current !== undefined && value > previous.current) {
      setBumps((n) => n + 1)
    }
    previous.current = value
  }, [value])

  return bumps
}
