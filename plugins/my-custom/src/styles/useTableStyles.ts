import { makeStyles } from '@material-ui/core/styles';

export const useTableStyles = makeStyles({
  badge: {
    padding: '0.25rem 0.5rem', // equivalent to px-2 py-1
    fontSize: '0.75rem', // equivalent to text-xs
    lineHeight: '1rem', // line-height: 1rem
    fontWeight: 500, // font-medium
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '9999px', // rounded-full for perfectly round corners
    textAlign: 'center',
    color: '#4B5563', // default text color (gray-600)
    borderWidth: '1px', // setting a 1px border width
    borderStyle: 'solid', // solid border style
  },
  gray: {
    backgroundColor: '#F9FAFB', // bg-gray-50
    color: '#4B5563', // text-gray-600
    borderColor: '#E5E7EB', // ring-gray-500/10 (light gray border)
  },
  red: {
    backgroundColor: '#FEF2F2', // bg-red-50
    color: '#B91C1C', // text-red-700
    borderColor: '#FECACA', // ring-red-600/10 (light red border)
  },
  yellow: {
    backgroundColor: '#FFFBEB', // bg-yellow-50
    color: '#92400E', // text-yellow-800
    borderColor: '#FBBF24', // ring-yellow-600/20 (light yellow border)
  },
  green: {
    backgroundColor: '#ECFDF5', // bg-green-50
    color: '#047857', // text-green-700
    borderColor: '#34D399', // ring-green-600/20 (light green border)
  },
  blue: {
    backgroundColor: '#EFF6FF', // bg-blue-50
    color: '#1D4ED8', // text-blue-700
    borderColor: '#3B82F6', // ring-blue-700/10 (light blue border)
  },
  indigo: {
    backgroundColor: '#EEF2FF', // bg-indigo-50
    color: '#4338CA', // text-indigo-700
    borderColor: '#6366F1', // ring-indigo-700/10 (light indigo border)
  },
  purple: {
    backgroundColor: '#F5F3FF', // bg-purple-50
    color: '#6D28D9', // text-purple-700
    borderColor: '#7C3AED', // ring-purple-700/10 (light purple border)
  },
  pink: {
    backgroundColor: '#FDF2F8', // bg-pink-50
    color: '#BE185D', // text-pink-700
    borderColor: '#F472B6', // ring-pink-700/10 (light pink border)
  },
  switchButton: {
    width: '100%',
    marginBottom: '0.5rem',
    '&:hover': {
      backgroundColor: '#c2c9db', // hover:bg-gray-200
    },
  },
  threeDotButton: {
    fontSize: '1.5rem',
    minWidth: 'auto',
    padding: '0 8px',
    lineHeight: '1',
  },
});
