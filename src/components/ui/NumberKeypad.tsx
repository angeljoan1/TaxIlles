'use client'

interface NumberKeypadProps {
  value: string // raw cents string e.g. "1250"
  onChange: (value: string) => void
}

export function NumberKeypad({ value, onChange }: NumberKeypadProps) {
  const displayValue = value === '' ? '0.00' : (parseInt(value, 10) / 100).toFixed(2)

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
      <div className="text-center text-5xl font-bold text-gray-900 py-4 tracking-tight">
        {displayValue} <span className="text-2xl text-gray-400">€</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map(k => (
          <button
            key={k}
            onPointerDown={e => { e.preventDefault(); press(k) }}
            className={`
              py-4 rounded-2xl text-2xl font-semibold transition-all active:scale-95
              ${k === '⌫' ? 'bg-red-50 text-red-600' : k === '.' ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
            `}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
