import { clsx } from 'clsx'

export function Card({ className, children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-2xl p-4', className)}
      style={{ border: '1px solid var(--border)', background: 'var(--surface)', ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
