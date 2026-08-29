export function Stat({ icon, label, value }) {
  return (
    <article className="stat">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </article>
  )
}
