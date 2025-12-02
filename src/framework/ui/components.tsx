/**
 * Shared UI components for views
 */

import { RefreshCw } from 'lucide-react';
import './styles.css';

export interface LoadingSpinnerProps {
  message?: string;
}

/**
 * Standard loading spinner component
 */
export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="list-view-loading">
      <div className="spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
}

export interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

/**
 * Standard error display component
 */
export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="error-container">
      <div className="error-box">
        <p className="error-message">Error: {error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-danger">
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

/**
 * Standard empty state component
 */
export function EmptyState({ 
  message = 'No items found.', 
  icon 
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <p className="empty-text">{message}</p>
    </div>
  );
}

export interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  size?: number;
}

/**
 * Standard action buttons for items
 */
export function ActionButtons({
  onView,
  onEdit,
  onDelete,
  viewLabel = 'View',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  size = 14,
}: ActionButtonsProps) {
  return (
    <>
      {onView && (
        <button onClick={onView} className="btn btn-secondary btn-sm">
          <span>{viewLabel}</span>
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className="btn btn-info btn-sm">
          <span>{editLabel}</span>
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="btn btn-danger btn-sm">
          <span>{deleteLabel}</span>
        </button>
      )}
    </>
  );
}
