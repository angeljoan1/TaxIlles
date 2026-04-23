'use client'
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  fullscreen?: boolean
}

export function Modal({ isOpen, onClose, title, children, fullscreen }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full ${fullscreen ? 'h-full rounded-none' : 'max-h-[90vh] rounded-t-3xl'} flex flex-col`}
        style={{ background: 'var(--surface)' }}
      >
        {/* Drag handle */}
        {!fullscreen && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-gray-200" />
          </div>
        )}
        <div
          className="flex items-center justify-between px-5 pt-3 pb-3"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
