export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="sk-row">
        <div className="sk-thumb" />
        <div className="sk-lines">
          <div className="sk-line w80" />
          <div className="sk-line w55" />
          <div className="sk-line w80" />
          <div className="sk-line w40" />
          <div className="sk-line w55" />
        </div>
      </div>
      <div className="sk-bottom" />
    </div>
  )
}
