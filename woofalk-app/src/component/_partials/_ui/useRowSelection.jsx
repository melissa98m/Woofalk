import { useCallback, useMemo, useState } from "react";

// Shared selection state for every admin resource table (places, ballades,
// categories, tags, addresses, users) backing the bulk-actions toolbar:
// tracks selected ids as a Set, independent of pagination, so "select all"
// can span every page already loaded client-side.
export function useRowSelection() {
    const [selected, setSelected] = useState(() => new Set());

    const isSelected = useCallback((id) => selected.has(id), [selected]);

    const toggle = useCallback((id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleMany = useCallback((ids, checked) => {
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
            return next;
        });
    }, []);

    const selectAll = useCallback((ids) => {
        setSelected(new Set(ids));
    }, []);

    const clear = useCallback(() => setSelected(new Set()), []);

    return useMemo(() => ({
        selected,
        isSelected,
        toggle,
        toggleMany,
        selectAll,
        clear,
        count: selected.size,
    }), [selected, isSelected, toggle, toggleMany, selectAll, clear]);
}

export default useRowSelection;
