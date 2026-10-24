import { useEffect, useState } from "react";

const defaultEmployees = [
  "Alejandro",
  "Kantanga",
  "Johnny",
  "Oscar",
  "Juan",
  "Adil",
  "Karwan",
];

function App() {
  const [records, setRecords] = useState(() => {
    const savedRecords = localStorage.getItem("attendanceRecords");

    return savedRecords ? JSON.parse(savedRecords) : {};
  });

  useEffect(() => {
    localStorage.setItem(
      "attendanceRecords",
      JSON.stringify(records)
    );
  }, [records]);

  function getToday() {
    return new Date().toLocaleDateString("en-CA");
  }

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function clockIn(employee) {
    const today = getToday();

    setRecords((previousRecords) => {
      const employeeRecords =
        previousRecords[today]?.[employee] || {};

      return {
        ...previousRecords,

        [today]: {
          ...previousRecords[today],

          [employee]: {
            ...employeeRecords,
            clockIn: getCurrentTime(),
            clockOut: null,
          },
        },
      };
    });
  }

  function clockOut(employee) {
    const today = getToday();

    if (!records[today]?.[employee]?.clockIn) {
      alert(`${employee} must clock in first.`);
      return;
    }

    setRecords((previousRecords) => ({
      ...previousRecords,

      [today]: {
        ...previousRecords[today],

        [employee]: {
          ...previousRecords[today][employee],
          clockOut: getCurrentTime(),
        },
      },
    }));
  }

  const today = getToday();

  return (
    <div className="container">
      <h1>Employee Attendance</h1>

      <p className="subtitle">
        {new Date().toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <div className="employee-list">
        {defaultEmployees.map((employee) => {
          const employeeRecord =
            records[today]?.[employee] || {};

          const clockedIn = employeeRecord.clockIn;
          const clockedOut = employeeRecord.clockOut;

          return (
            <div className="employee-card" key={employee}>
              <h2>{employee}</h2>

              <div className="attendance-info">
                <p>
                  Clock In:
                  <strong>
                    {" "}
                    {clockedIn || "--"}
                  </strong>
                </p>

                <p>
                  Clock Out:
                  <strong>
                    {" "}
                    {clockedOut || "--"}
                  </strong>
                </p>
              </div>

              <div className="buttons">
                <button
                  className="clock-in"
                  onClick={() => clockIn(employee)}
                  disabled={clockedIn && !clockedOut}
                >
                  Clock In
                </button>

                <button
                  className="clock-out"
                  onClick={() => clockOut(employee)}
                  disabled={!clockedIn || clockedOut}
                >
                  Clock Out
                </button>
              </div>

              {clockedIn && !clockedOut && (
                <p className="working">
                  ● Currently Working
                </p>
              )}

              {clockedOut && (
                <p className="completed">
                  ✓ Shift Completed
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;