
export function LoadingSpinner() {
  return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-blue-600 font-medium">處理PDF中，請稍候...</p>
    </div>
  )
}
