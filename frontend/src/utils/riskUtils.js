export function riskLevelClass(level) {
  switch ((level || '').toLowerCase()) {
    case 'low':
      return 'badge badge-low';
    case 'medium':
      return 'badge badge-medium';
    case 'high':
      return 'badge badge-high';
    case 'critical':
      return 'badge badge-critical';
    default:
      return 'badge badge-low';
  }
}

export function riskColor(level) {
  switch ((level || '').toLowerCase()) {
    case 'low':
      return '#16a34a';
    case 'medium':
      return '#f59e0b';
    case 'high':
      return '#ef4444';
    case 'critical':
      return '#7f1d1d';
    default:
      return '#64748b';
  }
}
