import { Table } from "@tanstack/react-table";
import { Pagination } from "./Pagination";
import { PageSizeSelector } from "./PageSizeSelector";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  currentPage?: number;
  totalPages?: number;
}

export function DataTablePagination<TData>({
  table,
  currentPage,
  totalPages,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex flex-col md:flex-row flex-wrap md:items-center justify-between  grow gap-5 space-x-6 lg:space-x-8">
        <PageSizeSelector defaultPageSize={10} pageSizeOptions={[10, 20, 50, 100, 200, 500]} />
        <Pagination
          currentPage={currentPage || table.getState().pagination.pageIndex + 1}
          totalPages={totalPages || table.getPageCount()}
          dynamic={currentPage ? true : false}
          table={table}
          // onPageChange={(page) => table.setPageIndex(page - 1)}
        />
      </div>
    </div>
  );
}
