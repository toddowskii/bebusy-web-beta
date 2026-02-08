'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getReports, updateReportStatus, deleteReport, type ReportStatus } from '@/lib/supabase/reports'
import { isAdmin } from '@/lib/supabase/admin'
import { CheckCircle, XCircle, Eye, Trash2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

const statusTabs: Array<{ label: string; value: ReportStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' }
]

export default function ReportsAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [activeStatus, setActiveStatus] = useState<ReportStatus | 'all'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    setLoading(true)
    const adminStatus = await isAdmin()
    if (!adminStatus) {
      toast.error('Access denied - Admin only')
      router.push('/')
      return
    }

    await loadReports('all')
    setLoading(false)
  }

  const loadReports = async (status: ReportStatus | 'all') => {
    try {
      const data = await getReports(status === 'all' ? undefined : status)
      setReports(data)
    } catch (error) {
      console.error('Error loading reports:', error)
      toast.error('Failed to load reports')
    }
  }

  const handleStatusChange = async (reportId: string, status: ReportStatus) => {
    if (updatingId) return
    setUpdatingId(reportId)

    try {
      const result = await updateReportStatus(reportId, status)
      if (result.error) throw new Error(result.error)
      toast.success('Report updated')
      await loadReports(activeStatus)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update report')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (reportId: string) => {
    const confirmed = confirm('Delete this report? This cannot be undone.')
    if (!confirmed) return

    try {
      const result = await deleteReport(reportId)
      if (result.error) throw new Error(result.error)
      toast.success('Report deleted')
      await loadReports(activeStatus)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete report')
    }
  }

  const handleFilterChange = async (status: ReportStatus | 'all') => {
    setActiveStatus(status)
    await loadReports(status)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin h-10 w-10 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: '24px' }}>
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Review and resolve user reports</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap" style={{ marginBottom: '20px' }}>
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeStatus === tab.value
                ? 'bg-[#10B981]/10 text-[#10B981]'
                : ''
            }`}
            style={activeStatus !== tab.value ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="rounded-[20px] border p-12 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-[20px] border p-5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '8px' }}>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      {report.content_type.toUpperCase()}
                    </span>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      {report.reason.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#10B981]/10 text-[#10B981]">
                      {report.status}
                    </span>
                  </div>

                    <div className="text-sm" style={{ marginBottom: '6px', color: 'var(--text-muted)' }}>
                      Reported by <span style={{ color: 'var(--text-primary)' }}>@{report.reporter?.username || 'unknown'}</span>
                      {' '}against <span style={{ color: 'var(--text-primary)' }}>@{report.reported_user?.username || 'unknown'}</span>
                  </div>

                  {report.content_id && (
                    <div className="text-xs text-[#6B7280]" style={{ marginBottom: '6px' }}>
                      Content ID: {report.content_id}
                    </div>
                  )}

                  {report.description && (
                      <p className="text-sm" style={{ marginTop: '8px', color: 'var(--text-primary)' }}>{report.description}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleStatusChange(report.id, 'reviewing')}
                    disabled={updatingId === report.id}
                      className="px-3 py-2 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    Review
                  </button>
                  <button
                    onClick={() => handleStatusChange(report.id, 'resolved')}
                    disabled={updatingId === report.id}
                    className="px-3 py-2 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Resolve
                  </button>
                  <button
                    onClick={() => handleStatusChange(report.id, 'dismissed')}
                    disabled={updatingId === report.id}
                    className="px-3 py-2 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-xs font-semibold"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="px-3 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
