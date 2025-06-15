import React, { useState } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails, Checkbox, Typography,
  List, ListItem, ListItemIcon, ListItemText, Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';

/**
 * VersionSelector - Selector jerárquico de versiones y subversiones
 * 
 * Props:
 * - versionsData: { [version]: [subversion1, subversion2, ...] }
 * - selectedSubversions: string[] (ej: ["1.21.1", "1.21.2"])
 * - onChange: (string[]) => void
 */
const VersionSelector = ({
  versionsData,
  selectedSubversions,
  onChange,
  disabled = false
}) => {
  const [expanded, setExpanded] = useState(null);
  const theme = useTheme();

  const handleVersionToggle = (version) => {
    const allSubs = versionsData[version];
    const isAllSelected = allSubs.every(sub => selectedSubversions.includes(sub));
    let nextSelected;
    if (isAllSelected) {
      nextSelected = selectedSubversions.filter(sub => !allSubs.includes(sub));
    } else {
      nextSelected = [
        ...selectedSubversions,
        ...allSubs.filter(sub => !selectedSubversions.includes(sub))
      ];
    }
    onChange(nextSelected);
  };

  const handleSubversionToggle = (subversion) => {
    let nextSelected;
    if (selectedSubversions.includes(subversion)) {
      nextSelected = selectedSubversions.filter(sv => sv !== subversion);
    } else {
      nextSelected = [...selectedSubversions, subversion];
    }
    onChange(nextSelected);
  };

  const isVersionChecked = (version) =>
    versionsData[version].every(sub => selectedSubversions.includes(sub));
  const isVersionIndeterminate = (version) =>
    versionsData[version].some(sub => selectedSubversions.includes(sub)) &&
    !isVersionChecked(version);

  return (
    <Box>
      {Object.keys(versionsData).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
        .map((version) => (
        <Accordion
          key={version}
          expanded={expanded === version}
          onChange={() => setExpanded(expanded === version ? null : version)}
          disabled={disabled}
          sx={{
            mb: 1,
            boxShadow: 'none',
            border: '1px solid #23272e',
            bgcolor: theme.palette.mode === 'dark' ? '#202635' : '#f6f8fb'
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: 48,
              bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#f6f8fb',
              color: theme.palette.text.primary,
            }}
          >
            <ListItemIcon>
              <Checkbox
                checked={isVersionChecked(version)}
                indeterminate={isVersionIndeterminate(version)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleVersionToggle(version);
                }}
                tabIndex={-1}
                disableRipple
                disabled={disabled}
              />
            </ListItemIcon>
            <Typography fontWeight={600}>{version}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <List dense>
              {versionsData[version].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(subversion => (
                <ListItem key={subversion} sx={{ pl: 4 }}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedSubversions.includes(subversion)}
                      tabIndex={-1}
                      disableRipple
                      onChange={() => handleSubversionToggle(subversion)}
                      disabled={disabled}
                    />
                  </ListItemIcon>
                  <ListItemText primary={subversion} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default VersionSelector;
