import React from 'react';



interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = status.toLowerCase();
  
  let badgeClass = 'badge-pending';
  if (normalizedStatus.includes('draft') || normalizedStatus === 'open') badgeClass = 'badge-draft';
  if (normalizedStatus.includes('approve') || normalizedStatus === 'verified' || normalizedStatus === 'matched') badgeClass = 'badge-approved';
  if (normalizedStatus.includes('reject') || normalizedStatus === 'cancelled' || normalizedStatus === 'exception') badgeClass = 'badge-rejected';
  if (normalizedStatus.includes('paid') || normalizedStatus === 'closed') badgeClass = 'badge-paid';

  return (
    <span className={`badge ${badgeClass}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};
