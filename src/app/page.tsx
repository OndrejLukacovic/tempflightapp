"use client";
import { useState, useRef } from "react";
import { Container, Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Stack, Collapse } from "@mui/material";
import Papa from "papaparse";
import { Flight } from "@/lib/types";
import React from "react";

export default function Home() {
  const [flightGroups, setFlightGroups] = useState<Flight[][]>([]);
  const [form, setForm] = useState<Partial<Flight>>({
    FLT: "",
    DEP: "",
    ARR: "",
    DATE: "",
    AC: "",
  });


  const [dragActive, setDragActive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const parseCSVToGroups = (csvText: string): Flight[][] => {
    const lines = csvText.split(/\r?\n/);
    const header = lines[0];
    const groups: string[][] = [];
    let currentGroup: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Chekovani pro ",,,,,,,"
      if (/^\s*,+\s*$/.test(line)) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      } else if (line.trim() !== "") {
        currentGroup.push(line);
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups.map(groupLines => {
      const csv = [header, ...groupLines].join("\n");
      const result = Papa.parse<Flight>(csv, { header: true, skipEmptyLines: true });
      return result.data as Flight[];
    });
  };

  // Handlovani CSV
  const handleCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const groups = parseCSVToGroups(text);
      setFlightGroups((prev) => [...prev, ...groups]);
    };
    reader.readAsText(file);
  };



  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCSV(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCSV(e.dataTransfer.files[0]);
    }
  };


  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddFlight = (e: React.FormEvent) => {
    e.preventDefault();
    setFlightGroups((prev) => {
      if (prev.length === 0) return [[form as Flight]];
      const newGroups = [...prev];
      newGroups[newGroups.length - 1] = [...newGroups[newGroups.length - 1], form as Flight];
      return newGroups;
    });
    setForm({ FLT: "", DEP: "", ARR: "", DATE: "", AC: "" });
    setShowForm(false);
  };

  return (
    <Box sx={{ bgcolor: "#fff", minHeight: "100vh", py: 4 }}>
      {/* Main container*/}
      <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 4 } }}>
        <Box mb={2}>
          {/* Button pro show/hide add/upload*/}
          <Button variant="outlined" onClick={() => setShowForm((v) => !v)} sx={{ mb: 2 }}>
            {showForm ? "Hide" : "Add / Upload Flights"}
          </Button>
          <Collapse in={showForm}>
            {/* Drag-and-drop CSV */}
        <Box
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: dragActive ? "2px solid #1976d2" : "2px dashed #aaa",
            borderRadius: 2,
            p: 4,
            mb: 4,
            textAlign: "center",
            background: dragActive ? "#e3f2fd" : "#fafafa",
            transition: "background 0.2s, border 0.2s",
            cursor: "pointer",
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            hidden
            onChange={handleCSVUpload}
          />
          <Typography variant="h6" color="textSecondary">
            {dragActive ? "Drop your CSV file here" : "Drag & drop CSV here or click to select"}
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
            Select CSV File
          </Button>
        </Box>
            {/* Manual form */}
            <Box component="form" onSubmit={handleAddFlight} sx={{ background: "#f5f5f5", p: 2, borderRadius: 2, mb: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <TextField label="Flight Number" name="FLT" value={form.FLT} onChange={handleFormChange} required size="small" />
                <TextField label="Origin" name="DEP" value={form.DEP} onChange={handleFormChange} required size="small" />
                <TextField label="Destination" name="ARR" value={form.ARR} onChange={handleFormChange} required size="small" />
                <TextField label="Date" name="DATE" type="text" value={form.DATE} onChange={handleFormChange} required size="small" placeholder="YYYY-MM-DD" />
                <TextField label="Aircraft" name="AC" value={form.AC} onChange={handleFormChange} required size="small" />
                <Button type="submit" variant="contained">Add</Button>
              </Stack>
            </Box>
          </Collapse>
        </Box>
        <Box>
          {/* Flights list table */}
          <Typography variant="h6" gutterBottom sx={{ color: '#111' }}>
            Flights List
          </Typography>
          <TableContainer component={Paper} sx={{ height: 400, maxHeight: 400, minHeight: 400, background: '#e3f2fd', width: '100%', color: '#111', display: 'flex', flexDirection: 'column' }}>
            <Table stickyHeader sx={{ width: '100%', color: '#111', flex: 1, tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Flight Number</TableCell>
                  <TableCell>Origin</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Aircraft</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>

                {flightGroups.map((group, groupIdx) => (
                  <React.Fragment key={groupIdx}>
                    {group.map((flight: Flight, idx: number) => (
                      <TableRow key={groupIdx + '-' + idx}>
                        <TableCell sx={{ color: '#111' }}>{flight.FLT || <span style={{ color: '#aaa' }}>N/A</span>}</TableCell>
                        <TableCell sx={{ color: '#111' }}>{flight.DEP}</TableCell>
                        <TableCell sx={{ color: '#111' }}>{flight.ARR}</TableCell>
                        <TableCell sx={{ color: '#111' }}>{flight.DATE}</TableCell>
                        <TableCell sx={{ color: '#111' }}>{flight.AC}</TableCell>
                      </TableRow>
                    ))}

                  
                    {groupIdx < flightGroups.length - 1 && (
                      <TableRow key={'divider-' + groupIdx}>
                        <TableCell colSpan={5} sx={{ p: 0 }}>
                          <Box sx={{ borderBottom: '2px solid #1976d2', my: 1 }} />
                        </TableCell>
                  </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </Box>
  );
}
