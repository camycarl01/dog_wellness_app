import { Construction } from 'lucide-react'

export default function ComingSoon({ title, day }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-50 rounded-2xl mb-4">
        <Construction size={24} className="text-amber-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500">
        Coming on Day {day} of the build plan.
      </p>
    </div>
  )
}
