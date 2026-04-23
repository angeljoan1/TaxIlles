import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, style, children, ...props }: ButtonProps) {
  const variantStyle =
    variant === 'primary' ? { background: 'var(--indigo)', color: '#fff' } :
    variant === 'secondary' ? { background: 'var(--surface2)', color: 'var(--foreground)' } :
    variant === 'danger' ? { background: '#ef4444', color: '#fff' } :
    { background: 'transparent', color: 'var(--foreground)', opacity: 0.7 }

  return (
    <button
      className={clsx(
        'rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
        {
          'px-3 py-2 text-sm': size === 'sm',
          'px-4 py-3 text-base': size === 'md',
          'px-6 py-4 text-lg': size === 'lg',
        },
        className
      )}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  )
}
