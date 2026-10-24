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

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [manualClockIn, setManualClockIn] = useState("");
  const [manualClockOut, setManualClockOut] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "attendanceRecords",
      JSON.stringify(records)
    );
  }, [records]);

  function getToday() {
    return new Date().toLocaleDateString("en-CA");
  }

  function getCurrentTime24() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  function formatTime(time) {
    if (!time) {
      return "--";
    }

    // If an older saved time already contains AM or PM,
    // show it as-is.
    if (
      time.toUpperCase().includes("AM") ||
      time.toUpperCase().includes("PM")
    ) {
      return time;
    }

    const [hourString, minute] = time.split(":");

    let hour = Number(hourString);
    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${hour}:${minute} ${period}`;
  }

  function clockIn(employee) {
    const today = getToday();

    setRecords((previousRecords) => ({
      ...previousRecords,

      [today]: {
        ...previousRecords[today],

        [employee]: {
          ...previousRecords[today]?.[employee],
          clockIn: getCurrentTime24(),
          clockOut: null,
        },
      },
    }));
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
          ...previousRecords[today]?.[employee],
          clockOut: getCurrentTime24(),
        },
      },
    }));
  }

  function startEditing(employee) {
    const today = getToday();

    const employeeRecord =
      records[today]?.[employee] || {};

    let clockIn = employeeRecord.clockIn || "";
    let clockOut = employeeRecord.clockOut || "";

    // Older values that contain AM/PM cannot be used directly
    // inside an input type="time", so convert them first.
    clockIn = convertTo24Hour(clockIn);
    clockOut = convertTo24Hour(clockOut);

    setEditingEmployee(employee);
    setManualClockIn(clockIn);
    setManualClockOut(clockOut);
  }

  function convertTo24Hour(time) {
    if (!time) {
      return "";
    }

    // Already in HH:MM format
    if (
      !time.toUpperCase().includes("AM") &&
      !time.toUpperCase().includes("PM")
    ) {
      return time.substring(0, 5);
    }

    const parts = time.trim().split(" ");

    const timePart = parts[0];
    const period = parts[1]?.toUpperCase();

    const [hourString, minute] = timePart.split(":");

    let hour = Number(hourString);

    if (period === "PM" && hour !== 12) {
      hour += 12;
    }

    if (period === "AM" && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  function saveManualTimes(employee) {
    const today = getToday();

    setRecords((previousRecords) => ({
      ...previousRecords,

      [today]: {
        ...previousRecords[today],

        [employee]: {
          ...previousRecords[today]?.[employee],
          clockIn: manualClockIn || null,
          clockOut: manualClockOut || null,
        },
      },
    }));

    setEditingEmployee(null);
    setManualClockIn("");
    setManualClockOut("");
  }

  function cancelEditing() {
    setEditingEmployee(null);
    setManualClockIn("");
    setManualClockOut("");
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
            <div
              className="employee-card"
              key={employee}
            >
              <h2>{employee}</h2>

              {editingEmployee === employee ? (
                <div className="edit-section">
                  <label>
                    Clock In
                    <input
                      type="time"
                      value={manualClockIn}
                      onChange={(event) =>
                        setManualClockIn(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Clock Out
                    <input
                      type="time"
                      value={manualClockOut}
                      onChange={(event) =>
                        setManualClockOut(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <div className="buttons">
                    <button
                      className="save-button"
                      onClick={() =>
                        saveManualTimes(employee)
                      }
                    >
                      Save
                    </button>

                    <button
                      className="cancel-button"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="attendance-info">
                    <p>
                      Clock In:{" "}
                      <strong>
                        {formatTime(clockedIn)}
                      </strong>
                    </p>

                    <p>
                      Clock Out:{" "}
                      <strong>
                        {formatTime(clockedOut)}
                      </strong>
                    </p>
                  </div>

                  <div className="buttons">
                    <button
                      className="clock-in"
                      onClick={() =>
                        clockIn(employee)
                      }
                      disabled={
                        clockedIn && !clockedOut
                      }
                    >
                      Clock In
                    </button>

                    <button
                      className="clock-out"
                      onClick={() =>
                        clockOut(employee)
                      }
                      disabled={
                        !clockedIn || clockedOut
                      }
                    >
                      Clock Out
                    </button>
                  </div>

                  <button
                    className="edit-button"
                    onClick={() =>
                      startEditing(employee)
                    }
                  >
                    Edit Time
                  </button>

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
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;