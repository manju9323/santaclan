import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

function App() {
  const [employeeData, setEmployeeData] = useState([]);
  const [previousAssignments, setPreviousAssignments] = useState([]);
  const [newAssignments, setNewAssignments] = useState([]);
  const [error, setError] = useState('');

  
  const parseCSV = (file, setDataCallback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setDataCallback(jsonData);
    };
    reader.onerror = () => {
      setError('Error reading Excel file');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEmployeeCSV = (e) => {
    parseCSV(e.target.files[0], setEmployeeData);
  };

  const handlePreviousCSV = (e) => {
    parseCSV(e.target.files[0], setPreviousAssignments);
  };

  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const isValidAssignment = (giver, receiver, prevMap) => {
    if (giver.Employee_EmailID === receiver.Employee_EmailID) return false;
    const prevChild = prevMap[giver.Employee_EmailID];
    return !(prevChild && prevChild === receiver.Employee_EmailID);
  };

  const assignSecretSantas = () => {
    if (employeeData.length < 2) {
      setError('Need at least 2 employees to assign');
      return;
    }

    const prevMap = {};
    previousAssignments.forEach(row => {
      prevMap[row.Employee_EmailID] = row.Secret_Child_EmailID;
    });

    const givers = [...employeeData];
    let receivers = shuffleArray(employeeData);
    let attempts = 0;
    let maxAttempts = 1000;
    let success = false;

    while (attempts < maxAttempts) {
      const assignment = [];
      let isValid = true;

      for (let i = 0; i < givers.length; i++) {
        const giver = givers[i];
        const receiver = receivers[i];
        if (!isValidAssignment(giver, receiver, prevMap)) {
          isValid = false;
          break;
        } else {
          assignment.push({
            Employee_Name: giver.Employee_Name,
            Employee_EmailID: giver.Employee_EmailID,
            Secret_Child_Name: receiver.Employee_Name,
            Secret_Child_EmailID: receiver.Employee_EmailID
          });
        }
      }

      if (isValid) {
        setNewAssignments(assignment);
        setError('');
        success = true;
        break;
      }

      receivers = shuffleArray(receivers);
      attempts++;
    }

    if (!success) {
      setError('Could not find valid assignments after many attempts.');
    }
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(newAssignments);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'secret_santa_assignments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>🎅 Secret Santa Assignment - Acme Corp</h1>

      <div>
        <label><strong>Upload Current Employee List (CSV):</strong></label><br />
        <input type="file" accept=".csv" onChange={handleEmployeeCSV} />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label><strong>Upload Last Year Assignments (CSV):</strong></label><br />
        <input type="file" accept=".csv" onChange={handlePreviousCSV} />
      </div>

      <button
        style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', fontSize: '1rem' }}
        onClick={assignSecretSantas}
      >
        Generate Assignments
      </button>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      {newAssignments.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>🎁 New Assignments</h2>
          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee Email</th>
                <th>Secret Child Name</th>
                <th>Secret Child Email</th>
              </tr>
            </thead>
            <tbody>
              {newAssignments.map((a, index) => (
                <tr key={index}>
                  <td>{a.Employee_Name}</td>
                  <td>{a.Employee_EmailID}</td>
                  <td>{a.Secret_Child_Name}</td>
                  <td>{a.Secret_Child_EmailID}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
            onClick={downloadCSV}
          >
            ⬇️ Download CSV
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
