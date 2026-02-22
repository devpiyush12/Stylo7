import { motion } from 'framer-motion';

/**
 * Checkbox Component - Custom checkbox with label
 */
const Checkbox = ({
  checked,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
  name,
  value,
  className = '',
}) => {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          name={name}
          value={value}
          className="sr-only"
        />
        <motion.div
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${checked || indeterminate
              ? 'bg-primary-600 border-primary-600'
              : 'bg-white border-gray-300 hover:border-primary-400'
            }
          `}
          whileTap={{ scale: disabled ? 1 : 0.9 }}
        >
          {checked && !indeterminate && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {indeterminate && !checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          )}
        </motion.div>
      </div>
      
      {label && (
        <span className="text-sm text-gray-700 select-none">{label}</span>
      )}
    </label>
  );
};

export default Checkbox;
