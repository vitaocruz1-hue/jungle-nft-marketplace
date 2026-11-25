import { Link, useRouter } from '@tanstack/react-router'
import { XIcon } from 'lucide-react'

import { notifyComingSoon } from '@/lib/coming-soon'
import { cn } from '@/lib/utils'

interface AuthPanelProps {
  mode: 'login' | 'register'
  description: string
  redirect?: string
  children: React.ReactNode
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z"
      />
    </svg>
  )
}

/** Painel "Entrar | Criar conta" do Figma, usado pelas rotas /login e /cadastro. */
export function AuthPanel({ mode, description, redirect, children }: AuthPanelProps) {
  const router = useRouter()
  const tabClass = 'transition-colors hover:text-highlight'

  return (
    <div className="mx-auto w-full max-w-[500px] border-b-8 border-primary bg-card shadow-2xl">
      <div className="relative px-6 pt-12 pb-10 sm:px-20">
        <button
          type="button"
          onClick={() =>
            window.history.length > 1 ? router.history.back() : void router.navigate({ to: '/' })
          }
          aria-label="Fechar e voltar"
          className="absolute top-3 right-3 grid size-9 cursor-pointer place-items-center rounded-sm text-highlight hover:bg-secondary"
        >
          <XIcon className="size-5" />
        </button>

        <nav
          aria-label="Acesso à conta"
          className="flex items-center justify-center gap-2 text-lg sm:text-xl"
        >
          <Link
            to="/login"
            search={{ redirect }}
            aria-current={mode === 'login' ? 'page' : undefined}
            className={cn(tabClass, mode === 'login' && 'text-highlight')}
          >
            Entrar
          </Link>
          <span aria-hidden="true" className="h-6 w-px bg-primary" />
          <Link
            to="/cadastro"
            search={{ redirect }}
            aria-current={mode === 'register' ? 'page' : undefined}
            className={cn(tabClass, mode === 'register' && 'text-highlight')}
          >
            Criar conta
          </Link>
        </nav>

        <h1 className="sr-only">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="mt-8 text-center text-sm leading-5">{description}</p>

        <div className="mt-6">{children}</div>
      </div>

      <div className="relative border-t border-[#3d2a1f] px-6 pb-10 sm:px-20">
        <p className="mx-auto -mt-3 w-fit bg-card px-3 text-sm">Ou continue com</p>
        <div className="mt-4 space-y-3">
          {[
            { label: 'Google', icon: <GoogleIcon /> },
            {
              label: 'Facebook',
              icon: (
                <span aria-hidden="true" className="text-xl leading-none font-bold text-[#3b5998]">
                  f
                </span>
              ),
            },
          ].map((provider) => (
            <button
              key={provider.label}
              type="button"
              onClick={() => notifyComingSoon(`Login com ${provider.label}`)}
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-3 rounded-sm border border-[#3d2a1f] text-sm transition-colors hover:border-primary"
            >
              {provider.icon}
              Continuar com {provider.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
