import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  type?: 'videos' | 'users' | 'general' | 'loading' | 'error';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  type = 'general',
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'videos':
        return {
          title: 'No Videos Found',
          description: 'There are no videos available at the moment. Try checking back later or add some videos.',
          icon: '🎬',
        };
      case 'users':
        return {
          title: 'No Users Found',
          description: 'No users are currently registered in the system.',
          icon: '👥',
        };
      case 'loading':
        return {
          title: 'Loading...',
          description: 'Please wait while we fetch your content.',
          icon: '⏳',
        };
      case 'error':
        return {
          title: 'Something went wrong',
          description: 'We encountered an error while loading the content. Please try again.',
          icon: '⚠️',
        };
      default:
        return {
          title: 'No Data Available',
          description: 'There is no data to display at the moment.',
          icon: '📭',
        };
    }
  };

  const defaultContent = getDefaultContent();

  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <div className="empty-state-icon">{icon || defaultContent.icon}</div>
        <h3 className="empty-state-title">{title || defaultContent.title}</h3>
        <p className="empty-state-description">{description || defaultContent.description}</p>
        {actionText && onAction && (
          <button className="empty-state-action" onClick={onAction}>
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
