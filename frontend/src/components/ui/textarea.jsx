import React from 'react';

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 ${className}`}
      {...props}
    />
  );
}import React from 'react';

export function Textarea({ 
  className = '', 
  label,
  error,
  ...props 
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-2 border border-gray-300 
          rounded-xl focus:outline-none focus:ring-2 
          focus:ring-blue-500 focus:border-transparent
          min-h-[100px]
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}