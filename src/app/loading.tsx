// Root loading state — shown while any Server Component page below is
// fetching data (e.g. the initial Prisma query on a slow connection),
// instead of a blank white screen during the wait.
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-m20fog">
      <div className="flex items-center gap-3 text-sm text-black/40">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-m20navy" />
        Loading...
      </div>
    </div>
  );
}
