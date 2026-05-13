type Status = 'Active' | 'Closed' | 'Pending' | 'Paid' | 'Overdue';

const styles: Record<Status, string> = {
  Active:  'bg-green-100 text-green-800',
  Closed:  'bg-gray-100 text-gray-600',
  Pending: 'bg-yellow-100 text-yellow-800',
  Paid:    'bg-blue-100 text-blue-800',
  Overdue: 'bg-red-100 text-red-800',
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
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
