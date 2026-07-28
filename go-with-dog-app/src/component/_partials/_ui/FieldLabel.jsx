import { Typography } from "@mui/material";

// Bold label sitting above a boxed input, per the "Formulaire" section of the
// design mockup — used instead of MUI's floating TextField label so create/edit
// forms read like the mockup rather than default MUI density.
export function FieldLabel({ htmlFor, children, sx, ...props }) {
    return (
        <Typography
            component="label"
            htmlFor={htmlFor}
            id={htmlFor ? `${htmlFor}-label` : undefined}
            sx={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "13px", color: "text.primary", ...sx }}
            {...props}
        >
            {children}
        </Typography>
    );
}

export default FieldLabel;
