const focusRing = {
    outline: 'none',
    boxShadow: '0 0 0 2px #362E27, 0 0 0 4px #F0AF7C',
};

const reduceMotion = '@media (prefers-reduced-motion: reduce)';

export const darkTheme = {
    palette: {
        type: 'dark',
        mode: 'dark',
        primary: {
            main: '#F0AF7C',
            light: '#E29A63',
            dark: '#C98955',
            // Light peach main color in dark mode needs dark text for contrast,
            // unlike the light theme where the same role is dark enough for white text.
            contrastText: '#2C1D0F',
        },
        secondary: {
            main: '#C3DDBB',
            light: '#9BC091',
            dark: '#9BC091',
            contrastText: '#1E2B19',
        },
        warning: {
            main: '#F0AF7C',
            light: 'rgb(255, 172, 51)',
            dark: 'rgb(178, 106, 0)',
            contrastText: '#2C1D0F',
        },
        info: {
            main: '#7CA0C2',
            light: 'rgb(77, 171, 245)',
            dark: 'rgb(23, 105, 170)',
            contrastText: '#1E2320',
        },
        success: {
            main: '#9BC091',
            light: 'rgb(111, 191, 115)',
            dark: 'rgb(53, 122, 56)',
            contrastText: '#1E2B19',
        },
        error: {
            main: '#EA8065',
            light: '#EA8065',
            dark: '#C25B41',
            contrastText: '#2C1D0F',
        },
        presentation: {
            main: '#48583F',
            light: 'rgb(111, 191, 115)',
            dark: 'rgb(53, 122, 56)',
            contrastText: '#F1EAE0',
        },
        grey: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#eeeeee',
            300: '#e0e0e0',
            400: '#bdbdbd',
            500: '#9e9e9e',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
            A100: '#f5f5f5',
            A200: '#eeeeee',
            A400: '#bdbdbd',
            A700: '#616161'
        },
        divider: '#5A4C41',
        background: {
            default: '#362E27',
            paper: '#423830',
            alt: '#2C2520',
            drawer: '#423830'
        },
        text: {
            primary: '#F1EAE0',
            secondary: '#C2B7A6',
            disabled: 'rgba(241, 234, 224, 0.5)',
            hint: 'rgba(241, 234, 224, 0.5)',
        },
        border: '#5A4C41',
        sage: '#9BC091',
        sageDark: '#C3DDBB',
        sageSoft: '#48583F',
        terracotta: '#E29A63',
        terracottaDark: '#F0AF7C',
        terracottaSoft: '#5C4630',
        coral: '#EA8065',
        coralSoft: '#55352C',
        shadow: '0 8px 24px -8px rgba(0,0,0,0.45)',
        contrastThreshold: 3,
        tonalOffset: 0.2,
    },
    spacing: 4,
    shape: {
        borderRadius: 14
    },
    mixins: {
        minHeight: 56
    },
    typography: {
        fontFamily: "'Nunito', 'Helvetica', 'Arial', sans-serif",
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 600,
        fontWeightBold: 700,
        htmlFontSize: 16,
        h1: { fontFamily: "'Fredoka', sans-serif", fontWeight: 700 },
        h2: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600 },
        h3: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600 },
        h4: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600 },
        h5: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600 },
        h6: { fontFamily: "'Fredoka', sans-serif", fontWeight: 600 },
        button: { fontFamily: "'Nunito', sans-serif", fontWeight: 700, textTransform: 'none' },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                '::selection': { background: '#E29A63', color: '#2C1D0F' },
            },
        },
        MuiButtonBase: {
            styleOverrides: {
                root: {
                    '&.Mui-focusVisible': focusRing,
                },
            },
        },
        MuiInput: {
            styleOverrides: {
                root: {
                    "&:before": {
                        borderColor: '#5A4C41'
                    }
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '999px',
                    padding: '10px 22px',
                    fontWeight: 700,
                    transition: 'transform 0.15s ease, filter 0.15s ease',
                    '&:hover': { transform: 'translateY(-1px)' },
                    [reduceMotion]: { transition: 'none', '&:hover': { transform: 'none' } },
                    '&.Mui-disabled': {
                        backgroundColor: '#4A4038',
                        color: 'rgba(241, 234, 224, 0.5)'
                    }
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none', filter: 'brightness(1.08)' },
                },
                outlined: {
                    borderWidth: '1px',
                },
            }
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    '&.Mui-focusVisible': focusRing,
                },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    '&:focus-visible': focusRing,
                    borderRadius: '4px',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    border: '1px solid #5A4C41',
                    boxShadow: '0 8px 24px -8px rgba(0,0,0,0.45)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 14px 30px -8px rgba(0,0,0,0.55)',
                    },
                    [reduceMotion]: { transition: 'none', '&:hover': { transform: 'none' } },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 20,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: '999px',
                    fontWeight: 700,
                    '&.Mui-focusVisible': focusRing,
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    backgroundColor: '#423830',
                },
            },
        },
        MuiPaginationItem: {
            styleOverrides: {
                root: {
                    fontWeight: 700,
                    borderColor: '#5A4C41',
                    '&.Mui-focusVisible': focusRing,
                    '&.Mui-selected': {
                        backgroundColor: '#F0AF7C',
                        color: '#2C1D0F',
                        '&:hover': { backgroundColor: '#F0AF7C' },
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #5A4C41',
                },
                head: {
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#C2B7A6',
                },
            },
        },
        MuiModal: {
            styleOverrides: {
                root: {
                    '& .MuiBackdrop-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    },
                },
            },
        },
        MuiDrawer: {
             styleOverrides: {
                paper: {
                  backgroundColor: '#423830',
                }
             }
        },
    }
};
