import type { ReactNode } from 'react'
export function Card({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}><div className="card-head"><h2>{title}</h2>{action}</div>{children}</section>
}
export function PrimaryButton({ children, onClick, type = 'button' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit' }) {
  return <button type={type} className="btn-primary" onClick={onClick}>{children}</button>
}
export function EmptyHint({ children }: { children: ReactNode }) {
  return <div className="empty-hint">{children}</div>
}
