import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  CssBaseline, 
  Drawer, 
  List, 
  Typography, 
  Divider, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Switch,
  createTheme,
  ThemeProvider,
  Avatar,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';

// Icons
import HomeIcon from '@mui/icons-material/Home';
import ConstructionIcon from '@mui/icons-material/Construction';
import DataObjectIcon from '@mui/icons-material/DataObject';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import ModeNightOutlinedIcon from '@mui/icons-material/ModeNightOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

// Components
import DatapackGenerator from '/src/components/DatapackGenerator.jsx';
import MaterialsImageGenerator from '/src/components/MaterialsImageGenerator.jsx';
import Settings from '/src/components/Settings.jsx';
import Placeholder from '/src/components/Placeholder.jsx';
import TimestampsFormatter from '/src/components/TimestampsFormatter.jsx';
import DescriptionGenerator from '/src/components/DescriptionGenerator.jsx';
import ExpressGenerator from '/src/components/ExpressGenerator.jsx';

const expandedDrawerWidth = 260;
const collapsedDrawerWidth = 88;

export default function App() {
  const [activeSection, setActiveSection] = useState('Express');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [settings, setSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        const defaultSettings = {
          packFormat: 71, buildingBlockId: 'smooth_stone', downloadResolution: '1920x1080',
          imageTitle: 'MATERIALES', imageSubtitle: 'La cantidad puede variar ligeramente',
        };
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      }
    } catch (error) { console.error("Error al leer la configuración:", error); }
    return {
      packFormat: 71, buildingBlockId: 'smooth_stone', downloadResolution: '1920x1080',
      imageTitle: 'MATERIALES', imageSubtitle: 'La cantidad puede variar ligeramente',
    };
  });

  const [mode, setMode] = useState(() => localStorage.getItem('app-theme-mode') || 'dark');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => { localStorage.setItem('app-theme-mode', mode); }, [mode]);

  const handleSidebarToggle = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleColorMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      ...(mode === 'dark' ? {
        background: { default: '#0F172A', paper: '#1E293B' }, text: { primary: '#E2E8F0', secondary: '#94A3B8' },
        primary: { main: '#EF4444' },
      } : {
        background: { default: '#F1F5F9', paper: '#FFFFFF' }, text: { primary: '#0F172A', secondary: '#64748B' },
        primary: { main: '#EF4444' },
      }),
    },
    typography: { fontFamily: "'Inter', sans-serif" },
    components: {
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8, margin: '4px 12px', '&:hover': { backgroundColor: mode === 'dark' ? '#334155' : '#E2E8F0' },
            '&.Mui-selected': { backgroundColor: '#EF4444', color: '#FFFFFF', '& .MuiListItemIcon-root': { color: '#FFFFFF' }, '&:hover': { backgroundColor: '#D93737' } },
          },
        },
      },
    },
  }), [mode]);

  const menuItems = [
    { text: 'Home', icon: <HomeIcon /> },
    { text: 'Express', icon: <RocketLaunchIcon /> },
    { text: 'Datapack', icon: <DataObjectIcon /> },
    { text: 'Materiales', icon: <ConstructionIcon /> },
    { text: 'Descripción', icon: <DescriptionIcon /> },
    { text: 'Timestamps', icon: <AccessTimeIcon /> },
    { text: 'Visualizador', icon: <VisibilityIcon /> },
  ];

  const settingsMenuItem = { text: 'Configuracion', icon: <SettingsIcon /> };

  const sectionContent = {
    Home: <Placeholder title="Home" />,
    Express: <ExpressGenerator settings={settings} />, 
    Materiales: <MaterialsImageGenerator {...settings} />,
    Datapack: <DatapackGenerator packFormat={settings.packFormat} />,
    Descripción: <DescriptionGenerator buildingBlockId={settings.buildingBlockId} />,
    Timestamps: <TimestampsFormatter />,
    Visualizador: <Placeholder title="Visualizador" />,
    Configuracion: <Settings savedSettings={settings} onSave={(newSettings) => {
      try {
        localStorage.setItem('app-settings', JSON.stringify(newSettings));
        setSettings(newSettings);
        setSnackbarOpen(true);
      } catch(error) { console.error("Error al guardar la configuración:", error); }
    }} />,
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center' }}>
        {isSidebarOpen && <><Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>U</Avatar><Box flexGrow={1}><Typography variant="subtitle1" fontWeight="bold">Usuario</Typography></Box></>}
        <IconButton onClick={handleSidebarToggle}>{isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}</IconButton>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton onClick={() => setActiveSection(item.text)} selected={activeSection === item.text} sx={{ justifyContent: 'initial', px: 2.5 }}>
              <ListItemIcon sx={{ color: 'inherit', minWidth: 0, mr: isSidebarOpen ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ opacity: isSidebarOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setActiveSection(settingsMenuItem.text)} selected={activeSection === settingsMenuItem.text}>
              <ListItemIcon sx={{ color: 'inherit' }}>{settingsMenuItem.icon}</ListItemIcon>
              <ListItemText primary={settingsMenuItem.text} sx={{ opacity: isSidebarOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
          <ListItem sx={{ display: 'flex', justifyContent: isSidebarOpen ? 'space-between' : 'center' }}>
            {isSidebarOpen && <><ListItemIcon sx={{ color: 'text.secondary' }}><ModeNightOutlinedIcon /></ListItemIcon><ListItemText primary="Modo Oscuro" /></>}
            <Switch edge={isSidebarOpen ? 'end' : false} checked={mode === 'dark'} onChange={toggleColorMode} />
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: isSidebarOpen ? expandedDrawerWidth : collapsedDrawerWidth,
            transition: (t) => t.transitions.create('width'),
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: isSidebarOpen ? expandedDrawerWidth : collapsedDrawerWidth,
              transition: (t) => t.transitions.create('width'),
              overflowX: 'hidden',
              borderRight: 'none'
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            {activeSection}
          </Typography>
          {sectionContent[activeSection]}
        </Box>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            ¡Configuración guardada correctamente!
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
