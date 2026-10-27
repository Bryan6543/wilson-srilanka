import { ProductGridSkeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div className="container-site pt-16">
      <div className="h-14 w-64 animate-pulse bg-surface-alt" />
      <div className="mt-12">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
