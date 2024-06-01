export default function Loading() {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
        <span className="sr-only">Loading...</span>
      </div>
      <h1>Loading</h1>
    </div>
  ) 
}