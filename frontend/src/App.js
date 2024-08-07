import React, { useState } from 'react';
import axios from 'axios';
import { Container, Grid, Paper, Typography, Button, Checkbox, FormControlLabel, FormGroup, TextField, Box } from '@mui/material';


function App() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [data, setData] = useState([]);
  const [isDataAvailable, setIsDataAvailable] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setColumns([]);
    setSelectedColumns([]); // Clear selected columns when a new file is uploaded
    setData([]);
    setIsDataAvailable(false);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setColumns(response.data.columns);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleColumnSelection = (column) => {
    setSelectedColumns(prev => 
      prev.includes(column) ? prev.filter(col => col !== column) : [...prev, column]
    );
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('file', file);
    selectedColumns.forEach(col => formData.append('columns[]', col));
    try {
      const response = await axios.post('http://127.0.0.1:5000/selected_columns', formData);
      setData(response.data);
      setIsDataAvailable(true);
    } catch (error) {
      console.error('Error submitting selected columns:', error);
    }
  };

  const handleDownload = () => {
    const jsonData = JSON.stringify(data, null, 4); // Convert data to JSON string
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_data.json'); // Set the downloaded file name
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: '2rem', marginTop: '2rem' }}>
        <Typography variant="h4" gutterBottom>
          File Table Data Extraction Tool
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              type="file"
              onChange={handleFileChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleUpload} fullWidth>
              Upload
            </Button>
          </Grid>
        </Grid>
        {columns.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6">Select Columns</Typography>
            <FormGroup>
              {columns.map((col, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={selectedColumns.includes(col)}
                      onChange={() => handleColumnSelection(col)}
                    />
                  }
                  label={col}
                />
              ))}
            </FormGroup>
          </Box>
        )}
        <Grid container spacing={2} style={{ marginTop: '2rem' }}>
          <Grid item xs={12}>
            <Button variant="contained" color="secondary" onClick={handleSubmit} fullWidth>
              Submit
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="success"
              onClick={handleDownload}
              fullWidth
              disabled={!isDataAvailable}
            >
              Download JSON
            </Button>
          </Grid>
        </Grid>
        {data.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6">Selected Data</Typography>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default App;
