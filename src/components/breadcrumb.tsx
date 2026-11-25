import { Link, type LinkProps } from '@tanstack/react-router'
import { Fragment } from 'react'

type Crumb = { label: string; link?: LinkProps }

/** Trilha "Início / Mercado / ..." do Figma. O último item é a página atual. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <Fragment key={item.label}>
              <li>
                {item.link && !last ? (
                  <Link {...item.link} className="hover:text-highlight">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined}>{item.label}</span>
                )}
              </li>
              {!last && (
                <li aria-hidden="true" className="select-none">
                  /
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
