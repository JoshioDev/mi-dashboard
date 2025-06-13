import React from 'react';
import { Box, Typography, TextField, Autocomplete } from '@mui/material';

/**
 * Selector de entidades con cantidades editables.
 * 
 * Props:
 * - entities: array de entidades ({ Registry name, NameEsp, ... })
 * - selectedEntities: array de objetos { entity, quantity }
 * - onChange: función (array de { entity, quantity }) => void
 * - label: string (opcional)
 */
const EntitySelector = ({ entities, selectedEntities, onChange, label = "Selecciona entidades" }) => {
    // Cuando cambias la selección del Autocomplete
    const handleSelectionChange = (_, newValue) => {
        // Conserva la cantidad si ya existía, default 1 si es nuevo
        const updated = newValue.map(entity => {
            const found = selectedEntities.find(sel => sel.entity['Registry name'] === entity['Registry name']);
            return found || { entity, quantity: 1 };
        });
        onChange(updated);
    };

    // Cuando cambias la cantidad en el input
    const handleQuantityChange = (registryName, value) => {
        const updated = selectedEntities.map(sel =>
            sel.entity['Registry name'] === registryName
                ? { ...sel, quantity: Math.max(1, Number(value)) }
                : sel
        );
        onChange(updated);
    };

    return (
        <Box>
            <Autocomplete
                multiple
                options={entities}
                value={selectedEntities.map(se => se.entity)}
                getOptionLabel={opt => opt.NameEsp || opt['Registry name'] || ''}
                onChange={handleSelectionChange}
                isOptionEqualToValue={(opt, val) => opt['Registry name'] === val['Registry name']}
                renderInput={params => <TextField {...params} variant="outlined" label={label} />}
                sx={{ mt: 2 }}
            />
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedEntities.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ flexGrow: 1 }}>{item.entity.NameEsp || item.entity['Registry name']}</Typography>
                        <TextField
                            type="number"
                            label="Cantidad"
                            size="small"
                            value={item.quantity}
                            onChange={e => handleQuantityChange(item.entity['Registry name'], e.target.value)}
                            inputProps={{ min: 1, style: { width: '60px' } }}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default EntitySelector;
