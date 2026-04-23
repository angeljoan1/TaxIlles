'use client'

interface NumberKeypadProps {
  value: string // raw cents string e.g. "1250"
  onChange: (value: string) => void
}

export function NumberKeypad({ value, onChange }: NumberKeypadProps) {
  const displayValue = value === '' ? '0,00' : (parseInt(value, 10) / 100).toFixed(2).replace('.', ',')

  const press = (key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else if (key === '.') {
      // decimal already implicit — ignore
    } else {
      if (value.length >= 6) return // max 9999.99
      onChange(value + key)
    }
  }

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫']

  return (
    <div className="px-4 pb-2">
      <div
        className="text-center py-5 tracking-tight rounded-2xl mb-2"
        style={{ background: 'var(--surface2)' }}
      >
        <span className="text-5xl font-extrabold" style={{ color: 'var(--foreground)' }}>
          {displayValue}
        </span>
        <span className="text-2xl font-bold ml-1" style={{ color: 'var(--foreground)', opacity: 0.4 }}>€</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map(k => (
          <button
            key={k}
            onPointerDown={e => { e.preventDefault(); press(k) }}
            className="py-4 rounded-2xl text-2xl font-semibold transition-all active:scale-95"
            style={
              k === '⌫'
                ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                : k === '.'
                ? { background: 'var(--surface2)', color: 'var(--foreground)', opacity: 0.3, cursor: 'default' }
                : { background: 'var(--surface2)', color: 'var(--foreground)' }
            }
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
