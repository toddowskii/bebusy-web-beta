export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ padding: '20px', backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center" style={{ marginBottom: '40px' }}>
          <h1 className="text-4xl font-bold" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
            Be<span className="text-[#10B981]">Busy</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Social network for productive people</p>
        </div>
        {children}
      </div>
    </div>
  )
}
