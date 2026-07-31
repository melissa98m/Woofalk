import { TableCell, TableSortLabel } from "@mui/material";

// Column header with a built-in ascending/descending sort button (MUI's
// TableSortLabel), used by every admin resource table. Non-data columns
// (selection checkbox, row actions) keep a plain TableCell instead.
export function SortableTableCell({ sortKey, orderBy, order, onSort, children, sx, ...cellProps }) {
    const active = orderBy === sortKey;
    return (
        <TableCell sortDirection={active ? order : false} sx={sx} {...cellProps}>
            <TableSortLabel
                active={active}
                direction={active ? order : "asc"}
                onClick={() => onSort(sortKey)}
            >
                {children}
            </TableSortLabel>
        </TableCell>
    );
}

export default SortableTableCell;
