import { clsx } from 'clsx'

export function Card({ className, children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-2xl shadow-sm border border-gray-100 p-4', className)}
      style={{ background: 'var(--surface)', ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
