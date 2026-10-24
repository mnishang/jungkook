import type { ReactNode } from 'react'
export function Card({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}><div className="card-head"><h2>{title}</h2>{action}</div>{children}</section>
}
export function PrimaryButton({ children, onClick, type = 'button', disabled = false }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }) {
  return <button type={type} className="btn-primary" onClick={onClick} disabled={disabled}>{children}</button>
}
export function EmptyHint({ children }: { children: ReactNode }) {
  return <div className="empty-hint">{children}</div>
}
