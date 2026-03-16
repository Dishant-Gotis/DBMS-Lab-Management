import React from 'react';
import { ModalProps } from '../../types';
import { FiX } from 'react-icons/fi';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'w-96',
    md: 'w-2xl',
    lg: 'w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
