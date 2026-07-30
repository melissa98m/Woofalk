import { Alert, Box, Card, Snackbar, TableContainer, TablePagination, Typography } from "@mui/material";

// Shared shell for every admin resource list (places, ballades, categories,
// tags, users, addresses): header with title/count + actions, table wrapped
// in a rounded card per the mockup's admin table, pagination and toast.
export function AdminResourceLayout({
    title,
    countLabel,
    actions,
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
                {actions}
            </Box>
            {loading ? (
                <Typography role="status" aria-live="polite" color="text.secondary">{loadingLabel}</Typography>
            ) : (
                <Card sx={{ borderRadius: "16px" }}>
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
