import { useState } from "react";

function App() {
  const [employees, setEmployees] = useState([
    { id: 1, name: "Johnny", status: "Present" },
    { id: 2, name: "Oscar", status: "Present" },
    { id: 3, name: "Juan", status: "Present" }
  ]);

  function changeStatus(id, newStatus) {
    setEmployees(
      employees.map((employee) =>
        employee.id === id
          ? { ...employee, status: newStatus }
          : employee
      )
    );
  }

  return (
    <div className="container">
      <h1>Employee Attendance</h1>
      <p className="subtitle">Track attendance for your team</p>

      {employees.map((employee) => (
        <div className="employee-card" key={employee.id}>
          <h2>{employee.name}</h2>

          <p>
            Status: <strong>{employee.status}</strong>
          </p>

          <div className="buttons">
            <button onClick={() => changeStatus(employee.id, "Present")}>
              Present
            </button>

            <button onClick={() => changeStatus(employee.id, "Late")}>
              Late
            </button>

            <button onClick={() => changeStatus(employee.id, "Absent")}>
              Absent
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;