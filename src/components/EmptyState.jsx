export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      {Icon && (
        <span className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}
