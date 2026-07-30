import { Alert, Box, Card, InputAdornment, Snackbar, TableContainer, TablePagination, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

// Shared shell for every admin resource list (places, ballades, categories,
// tags, users, addresses): header with title/count + actions, table wrapped
// in a rounded card per the mockup's admin table, pagination and toast.
export function AdminResourceLayout({
    title,
    countLabel,
    actions,
    searchValue,
    onSearchChange,
    searchPlaceholder,
    searchAriaLabel,
    loading,
    loadingLabel,
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    toast,
    toastMessage,
    onCloseToast,
    bulkBar,
    children,
}) {
    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", mb: "24px" }}>
                <Box>
                    <Typography variant="h1" sx={{ fontSize: "26px", m: 0 }}>{title}</Typography>
                    {countLabel ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: "6px" }}>{countLabel}</Typography>
                    ) : null}
                </Box>
                {onSearchChange ? (
                    <TextField
                        size="small"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={onSearchChange}
                        sx={{ minWidth: { xs: "100%", sm: 260 }, order: { xs: 3, sm: 0 } }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            },
                            htmlInput: { "aria-label": searchAriaLabel },
                        }}
                    />
                ) : null}
                {actions}
            </Box>
            {loading ? (
                <Typography role="status" aria-live="polite" color="text.secondary">{loadingLabel}</Typography>
            ) : (
                <Card sx={{ borderRadius: "16px" }}>
                    {bulkBar}
                    <TableContainer>{children}</TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 100]}
                        component="div"
                        count={count}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={onPageChange}
                        onRowsPerPageChange={onRowsPerPageChange}
                    />
                </Card>
            )}
            <Snackbar
                open={toast}
                autoHideDuration={3000}
                onClose={onCloseToast}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={onCloseToast} severity={toastMessage.severity} sx={{ width: "100%" }}>
                    {toastMessage.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default AdminResourceLayout;
