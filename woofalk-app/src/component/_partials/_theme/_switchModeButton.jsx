import { Box, IconButton, useTheme } from "@mui/material";
import React from "react";
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

import { ColorContext } from "./_colorContext";

export const SwitchModeButton = () => {
  const theme = useTheme();
  const colorMode = React.useContext(ColorContext);
  const {isDarkMode, toggleDarkMode} = ColorContext;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconButton
        sx={{ ml: 1 }}
        onClick={colorMode.toggleColorMode}
        checked={isDarkMode}
        onChange={toggleDarkMode}
        color="inherit"
      >
        {theme.palette.mode === "dark" ? <DarkModeOutlinedIcon className="icon-header"/> : <LightModeOutlinedIcon className="icon-header" />}
      </IconButton>
    </Box>
  );
};