import { motion } from 'framer-motion';

/**
 * Loader Component - Various loading spinners and skeletons
 */

// Spinner variants
export const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colors = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
};

// Full page loader
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <Spinner size="lg" />
    <p className="mt-4 text-gray-500 text-sm">{message}</p>
  </div>
);

// Inline loader for buttons, etc.
export const InlineLoader = ({ className = '' }) => (
  <Spinner size="sm" className={className} />
);

// Skeleton for content placeholders
export const Skeleton = ({ 
  width = 'full', 
  height = '4', 
  rounded = 'md',
  className = '' 
}) => {
  const widths = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/4': 'w-1/4',
  };

  const heights = {
    '2': 'h-2',
    '3': 'h-3',
    '4': 'h-4',
    '6': 'h-6',
    '8': 'h-8',
    '12': 'h-12',
    '24': 'h-24',
    '32': 'h-32',
    '48': 'h-48',
  };

  const roundeds = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <motion.div
      className={`bg-gray-200 animate-pulse ${widths[width] || width} ${heights[height]} ${roundeds[rounded]} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    />
  );
};

// Card skeleton for product cards, etc.
export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <Skeleton height="48" rounded="none" />
    <div className="p-4 space-y-3">
      <Skeleton height="4" width="3/4" />
      <Skeleton height="3" width="1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton height="4" width="1/4" />
        <Skeleton height="8" width="1/4" />
      </div>
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton height="4" />
      </td>
    ))}
  </tr>
);

// Default export for main loader
const Loader = Spinner;
export default Loader;
