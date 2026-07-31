const focusRing = {
    outline: 'none',
    boxShadow: '0 0 0 2px #F5F0E6, 0 0 0 4px #A65E2C',
};

const reduceMotion = '@media (prefers-reduced-motion: reduce)';

export const lightTheme = {
    palette: {
        type: 'light',
        mode: 'light',
        primary: {
            main: '#A65E2C',
            light: '#D98B4F',
            dark: '#8A4C22',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#4F6B47',
            light: '#8CAB82',
            dark: '#3B5034',
            contrastText: '#ffffff',
        },
        warning: {
            main: '#A65E2C',
            light: 'rgb(255, 172, 51)',
            dark: 'rgb(178, 106, 0)',
            contrastText: '#ffffff',
        },
        info: {
            main: '#2196f3',
            light: 'rgb(77, 171, 245)',
            dark: 'rgb(23, 105, 170)',
            contrastText: '#000000',
        },
        success: {
            main: '#4F6B47',
            light: 'rgb(111, 191, 115)',
            dark: 'rgb(53, 122, 56)',
            contrastText: '#ffffff',
        },
        error: {
            main: '#E2624B',
            light: '#EA8065',
            dark: '#B94A36',
            contrastText: '#ffffff',
        },
        presentation: {
             main: '#E1EBDA',
             light: 'rgb(111, 191, 115)',
             dark: 'rgb(53, 122, 56)',
             contrastText: '#362E24',
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
        divider: '#DDD2BE',
        background: {
            default: '#F5F0E6',
            paper: '#FFFDF8',
            alt: '#ECE4D4',
            drawer: '#FFFDF8',
        },
        text: {
            primary: '#362E24',
            secondary: '#6B6151',
            disabled: 'rgba(54, 46, 36, 0.38)',
            hint: 'rgba(54, 46, 36, 0.38)',
        },
        border: '#DDD2BE',
        sage: '#8CAB82',
        sageDark: '#4F6B47',
        sageSoft: '#E1EBDA',
        terracotta: '#D98B4F',
        terracottaDark: '#A65E2C',
        terracottaSoft: '#F4E3CD',
        coral: '#E2624B',
        coralSoft: '#FCE1DB',
        shadow: '0 8px 24px -8px rgba(60,45,25,0.18)',
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
                '::selection': { background: '#D98B4F', color: '#fff' },
            },
        },
        MuiButtonBase: {
            styleOverrides: {
                root: {
                    '&.Mui-focusVisible': focusRing,
                },
            },
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
                        color: 'rgba(54, 46, 36, 0.38)'
                    }
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none', filter: 'brightness(1.06)' },
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
                    border: '1px solid #DDD2BE',
                    boxShadow: '0 8px 24px -8px rgba(60,45,25,0.18)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 14px 30px -8px rgba(60,45,25,0.26)',
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
                    backgroundColor: '#FFFDF8',
                },
            },
        },
        MuiPaginationItem: {
            styleOverrides: {
                root: {
                    fontWeight: 700,
                    borderColor: '#DDD2BE',
                    '&.Mui-focusVisible': focusRing,
                    '&.Mui-selected': {
                        backgroundColor: '#A65E2C',
                        color: '#ffffff',
                        '&:hover': { backgroundColor: '#A65E2C' },
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #DDD2BE',
                },
                head: {
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#6B6151',
                },
            },
        },
        MuiModal: {
            styleOverrides: {
                root: {
                    '& .MuiBackdrop-root': {
                        backgroundColor: 'rgba(54, 46, 36, 0.4)',
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#FFFDF8',
                }
            }
        },
    }
};
