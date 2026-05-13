type Status = 'Active' | 'Closed' | 'Pending' | 'Paid' | 'Overdue';

const styles: Record<Status, string> = {
  Active:  'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Closed:  'bg-gray-50 text-gray-600 ring-gray-500/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Paid:    'bg-blue-50 text-blue-700 ring-blue-600/20',
  Overdue: 'bg-red-50 text-red-700 ring-red-600/20',
};

const dots: Record<Status, string> = {
  Active:  'bg-emerald-500',
  Closed:  'bg-gray-400',
  Pending: 'bg-amber-500',
  Paid:    'bg-blue-500',
  Overdue: 'bg-red-500',
};

const labels: Record<Status, string> = {
  Active:  'Aktif',
  Closed:  'Kapalı',
  Pending: 'Bekliyor',
  Paid:    'Ödendi',
  Overdue: 'Gecikmiş',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {labels[status]}
    </span>
  );
}
