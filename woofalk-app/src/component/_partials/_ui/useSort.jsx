import { useState } from "react";

// Shared column-sort state for every admin resource table (places, ballades,
// categories, tags, users, addresses, contact messages): tracks which column
// key is active and its direction. Sorting itself is applied via `sortRows`
// on the already-filtered dataset, before it's sliced into pages.
export function useSort() {
    const [orderBy, setOrderBy] = useState(null);
    const [order, setOrder] = useState("asc");

    const toggleSort = (key) => {
        if (orderBy === key) {
            setOrder(order === "asc" ? "desc" : "asc");
        } else {
            setOrderBy(key);
            setOrder("asc");
        }
    };

    return { orderBy, order, toggleSort };
}

function compareValues(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), "fr", { sensitivity: "base", numeric: true });
}

// Returns a sorted copy of `rows`, ranked by `getValue(row, orderBy)`.
// Leaves `rows` untouched (same reference) when no column is selected yet.
export function sortRows(rows, orderBy, order, getValue) {
    if (!orderBy) return rows;
    const sign = order === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => sign * compareValues(getValue(a, orderBy), getValue(b, orderBy)));
}

export default useSort;
