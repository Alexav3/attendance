import { useEffect, useMemo, useState } from "react";

const employees = [
  "Kantanga",
  "Johnny",
  "Oscar",
  "Juan",
  "Adil",
  "Karwan",
];

const STORAGE_KEY = "employeeAttendanceRecordsV3";

function App() {
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        return JSON.parse(saved);
      }

      const oldV2 = localStorage.getItem(
        "employeeAttendanceRecordsV2"
      );

      if (oldV2) {
        return JSON.parse(oldV2);
      }

      const oldRecords =
        localStorage.getItem("attendanceRecords");

      if (oldRecords) {
        return JSON.parse(oldRecords);
      }

      return {};
    } catch {
      return {};
    }
  });

  const [selectedDate, setSelectedDate] =
    useState(getToday());

  const [editingEmployee, setEditingEmployee] =
    useState(null);

  const [manualClockIn, setManualClockIn] =
    useState("");

  const [manualClockOut, setManualClockOut] =
    useState("");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );
  }, [records]);

  const weekDates = useMemo(() => {
    return getMondayToSaturday(selectedDate);
  }, [selectedDate]);

  function getEmployeeRecord(date, employee) {
    return records[date]?.[employee] || {
      clockIn: null,
      clockOut: null,
      dayOff: false,
    };
  }

  function clockIn(employee) {
    setRecords((previousRecords) => ({
      ...previousRecords,

      [selectedDate]: {
        ...previousRecords[selectedDate],

        [employee]: {
          ...previousRecords[selectedDate]?.[employee],
          clockIn: getCurrentTime24(),
          clockOut: null,
          dayOff: false,
        },
      },
    }));
  }

  function clockOut(employee) {
    const currentRecord = getEmployeeRecord(
      selectedDate,
      employee
    );

    if (!currentRecord.clockIn) {
      alert(`${employee} must clock in first.`);
      return;
    }

    setRecords((previousRecords) => ({
      ...previousRecords,

      [selectedDate]: {
        ...previousRecords[selectedDate],

        [employee]: {
          ...previousRecords[selectedDate]?.[employee],
          clockOut: getCurrentTime24(),
          dayOff: false,
        },
      },
    }));
  }

  function startEditing(employee) {
    const currentRecord = getEmployeeRecord(
      selectedDate,
      employee
    );

    setEditingEmployee(employee);

    setManualClockIn(
      convertTo24Hour(currentRecord.clockIn)
    );

    setManualClockOut(
      convertTo24Hour(currentRecord.clockOut)
    );
  }

  function saveManualTimes(employee) {
    setRecords((previousRecords) => ({
      ...previousRecords,

      [selectedDate]: {
        ...previousRecords[selectedDate],

        [employee]: {
          ...previousRecords[selectedDate]?.[employee],
          clockIn: manualClockIn || null,
          clockOut: manualClockOut || null,
          dayOff: false,
        },
      },
    }));

    closeEditor();
  }

  function closeEditor() {
    setEditingEmployee(null);
    setManualClockIn("");
    setManualClockOut("");
  }

  function toggleDayOff(employee) {
    const currentRecord = getEmployeeRecord(
      selectedDate,
      employee
    );

    if (!currentRecord.dayOff) {
      const confirmed = window.confirm(
        `Mark ${employee} as Day Off for ${formatFullDate(
          selectedDate
        )}?`
      );

      if (!confirmed) return;
    }

    setRecords((previousRecords) => ({
      ...previousRecords,

      [selectedDate]: {
        ...previousRecords[selectedDate],

        [employee]: currentRecord.dayOff
          ? {
              clockIn: null,
              clockOut: null,
              dayOff: false,
            }
          : {
              clockIn: null,
              clockOut: null,
              dayOff: true,
            },
      },
    }));

    closeEditor();
  }

  function markEntireDayOff() {
    const confirmed = window.confirm(
      `Mark ALL employees as Day Off for ${formatFullDate(
        selectedDate
      )}?`
    );

    if (!confirmed) return;

    const dayRecords = {};

    employees.forEach((employee) => {
      dayRecords[employee] = {
        clockIn: null,
        clockOut: null,
        dayOff: true,
      };
    });

    setRecords((previousRecords) => ({
      ...previousRecords,
      [selectedDate]: dayRecords,
    }));

    closeEditor();
  }

  function clearSelectedDay() {
    const confirmed = window.confirm(
      `Delete all records for ${formatFullDate(
        selectedDate
      )}?`
    );

    if (!confirmed) return;

    setRecords((previousRecords) => {
      const updated = {
        ...previousRecords,
      };

      delete updated[selectedDate];

      return updated;
    });

    closeEditor();
  }

  function clearCurrentWeek() {
    const confirmed = window.confirm(
      `Delete all attendance records from ${formatFullDate(
        weekDates[0]
      )} through ${formatFullDate(
        weekDates[5]
      )}?`
    );

    if (!confirmed) return;

    setRecords((previousRecords) => {
      const updated = {
        ...previousRecords,
      };

      weekDates.forEach((date) => {
        delete updated[date];
      });

      return updated;
    });

    closeEditor();
  }

  function exportDailyCSV() {
    const rows = [
      [
        "Date",
        "Day",
        "Employee",
        "Clock In",
        "Clock Out",
        "Status",
      ],
    ];

    employees.forEach((employee) => {
      const record = getEmployeeRecord(
        selectedDate,
        employee
      );

      rows.push([
        selectedDate,
        formatDayName(selectedDate),
        employee,
        record.dayOff
          ? ""
          : formatTime(record.clockIn),
        record.dayOff
          ? ""
          : formatTime(record.clockOut),
        getStatus(record),
      ]);
    });

    downloadCSV(
      `attendance-${selectedDate}.csv`,
      rows
    );
  }

  function exportWeeklyCSV() {
    const rows = [
      [
        "Employee",
        `Monday ${formatShortDate(weekDates[0])}`,
        `Tuesday ${formatShortDate(weekDates[1])}`,
        `Wednesday ${formatShortDate(weekDates[2])}`,
        `Thursday ${formatShortDate(weekDates[3])}`,
        `Friday ${formatShortDate(weekDates[4])}`,
        `Saturday ${formatShortDate(weekDates[5])}`,
      ],
    ];

    employees.forEach((employee) => {
      const employeeRow = [employee];

      weekDates.forEach((date) => {
        const record = getEmployeeRecord(
          date,
          employee
        );

        let value = "No Record";

        if (record.dayOff) {
          value = "Day Off";
        } else if (
          record.clockIn &&
          record.clockOut
        ) {
          value =
            `${formatTime(record.clockIn)} - ` +
            `${formatTime(record.clockOut)}`;
        } else if (
          record.clockIn &&
          !record.clockOut
        ) {
          value =
            `${formatTime(record.clockIn)} - No Clock Out`;
        } else if (
          !record.clockIn &&
          record.clockOut
        ) {
          value =
            `No Clock In - ${formatTime(record.clockOut)}`;
        }

        employeeRow.push(value);
      });

      rows.push(employeeRow);
    });

    downloadCSV(
      `attendance-${weekDates[0]}-to-${weekDates[5]}.csv`,
      rows
    );
  }

  function goToPreviousWeek() {
    const monday = parseLocalDate(
      weekDates[0]
    );

    monday.setDate(
      monday.getDate() - 7
    );

    setSelectedDate(
      toDateKey(monday)
    );

    closeEditor();
  }

  function goToNextWeek() {
    const monday = parseLocalDate(
      weekDates[0]
    );

    monday.setDate(
      monday.getDate() + 7
    );

    setSelectedDate(
      toDateKey(monday)
    );

    closeEditor();
  }

  function goToToday() {
    setSelectedDate(getToday());
    closeEditor();
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Employee Attendance</h1>

        <p className="subtitle">
          Local attendance tracker
        </p>
      </header>

      <section className="week-section">
        <div className="week-title-row">
          <div>
            <p className="section-label">
              WEEK
            </p>

            <h2 className="week-title">
              {formatShortDate(weekDates[0])}
              {" - "}
              {formatShortDate(weekDates[5])}
            </h2>
          </div>

          <button
            className="today-button"
            onClick={goToToday}
          >
            Today
          </button>
        </div>

        <div className="week-navigation">
          <button
            className="week-arrow"
            onClick={goToPreviousWeek}
          >
            ← Previous
          </button>

          <button
            className="week-arrow"
            onClick={goToNextWeek}
          >
            Next →
          </button>
        </div>

        <div className="day-tabs">
          {weekDates.map((date) => (
            <button
              key={date}
              className={
                selectedDate === date
                  ? "day-tab active-day"
                  : "day-tab"
              }
              onClick={() => {
                setSelectedDate(date);
                closeEditor();
              }}
            >
              <span>
                {formatShortDayName(date)}
              </span>

              <strong>
                {getDayNumber(date)}
              </strong>
            </button>
          ))}
        </div>
      </section>

      <section className="selected-day-section">
        <p className="section-label">
          SELECTED DAY
        </p>

        <h2 className="selected-date-title">
          {formatFullDate(selectedDate)}
        </h2>

        <div className="day-actions">
          <button
            className="secondary-button"
            onClick={exportDailyCSV}
          >
            Export Day CSV
          </button>

          <button
            className="day-off-all-button"
            onClick={markEntireDayOff}
          >
            Mark Entire Day Off
          </button>
        </div>
      </section>

      <div className="employee-list">
        {employees.map((employee) => {
          const record = getEmployeeRecord(
            selectedDate,
            employee
          );

          const clockedIn = record.clockIn;
          const clockedOut = record.clockOut;
          const dayOff = record.dayOff;

          return (
            <div
              className={
                dayOff
                  ? "employee-card day-off-card"
                  : "employee-card"
              }
              key={employee}
            >
              <div className="employee-heading">
                <h2>{employee}</h2>

                {dayOff && (
                  <span className="day-off-badge">
                    DAY OFF
                  </span>
                )}
              </div>

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
                      onClick={closeEditor}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : dayOff ? (
                <>
                  <p className="day-off-message">
                    This employee is marked Day Off.
                  </p>

                  <button
                    className="remove-day-off-button"
                    onClick={() =>
                      toggleDayOff(employee)
                    }
                  >
                    Remove Day Off
                  </button>
                </>
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
                        clockedIn &&
                        !clockedOut
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
                        !clockedIn ||
                        clockedOut
                      }
                    >
                      Clock Out
                    </button>
                  </div>

                  <div className="employee-options">
                    <button
                      className="edit-button"
                      onClick={() =>
                        startEditing(employee)
                      }
                    >
                      Edit Time
                    </button>

                    <button
                      className="day-off-button"
                      onClick={() =>
                        toggleDayOff(employee)
                      }
                    >
                      Day Off
                    </button>
                  </div>

                  {clockedIn &&
                    !clockedOut && (
                      <p className="working">
                        ● Currently Working
                      </p>
                    )}

                  {clockedOut && (
                    <p className="completed">
                      ✓ Shift Completed
                    </p>
                  )}

                  {!clockedIn &&
                    !clockedOut && (
                      <p className="no-record">
                        No attendance recorded
                      </p>
                    )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <section className="report-section">
        <h2>Weekly Report</h2>

        <p className="report-description">
          Monday through Saturday
        </p>

        <div className="weekly-columns">
          {weekDates.map((date) => (
            <div
              className="day-report-card"
              key={date}
            >
              <div className="day-report-header">
                <div>
                  <strong>
                    {formatDayName(date)}
                  </strong>

                  <span>
                    {formatShortDate(date)}
                  </span>
                </div>
              </div>

              <div className="day-report-list">
                {employees.map((employee) => {
                  const record =
                    getEmployeeRecord(
                      date,
                      employee
                    );

                  return (
                    <div
                      className="report-row"
                      key={employee}
                    >
                      <div className="report-name">
                        {employee}
                      </div>

                      <div className="report-time">
                        {record.dayOff ? (
                          <span className="report-day-off">
                            Day Off
                          </span>
                        ) : record.clockIn ||
                          record.clockOut ? (
                          <>
                            <span>
                              {formatTime(
                                record.clockIn
                              )}
                            </span>

                            <span className="report-divider">
                              →
                            </span>

                            <span>
                              {formatTime(
                                record.clockOut
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="report-empty">
                            No Record
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          className="weekly-export-button"
          onClick={exportWeeklyCSV}
        >
          Export Weekly CSV
        </button>
      </section>

      <section className="danger-section">
        <h2>Reset Records</h2>

        <p>
          Export your CSV before deleting
          attendance.
        </p>

        <button
          className="clear-day-button"
          onClick={clearSelectedDay}
        >
          Clear Selected Day
        </button>

        <button
          className="clear-week-button"
          onClick={clearCurrentWeek}
        >
          Clear This Week
        </button>
      </section>
    </div>
  );
}

/* DATE HELPERS */

function getToday() {
  return toDateKey(new Date());
}

function parseLocalDate(dateString) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );
}

function toDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMondayToSaturday(dateString) {
  const selectedDate =
    parseLocalDate(dateString);

  const day = selectedDate.getDay();

  const differenceToMonday =
    day === 0 ? -6 : 1 - day;

  const monday = new Date(selectedDate);

  monday.setDate(
    selectedDate.getDate() +
      differenceToMonday
  );

  const dates = [];

  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);

    date.setDate(
      monday.getDate() + i
    );

    dates.push(toDateKey(date));
  }

  return dates;
}

function formatFullDate(dateString) {
  return parseLocalDate(
    dateString
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateString) {
  return parseLocalDate(
    dateString
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDayName(dateString) {
  return parseLocalDate(
    dateString
  ).toLocaleDateString("en-US", {
    weekday: "long",
  });
}

function formatShortDayName(dateString) {
  return parseLocalDate(
    dateString
  ).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function getDayNumber(dateString) {
  return parseLocalDate(
    dateString
  ).getDate();
}

/* TIME HELPERS */

function getCurrentTime24() {
  const now = new Date();

  const hours = String(
    now.getHours()
  ).padStart(2, "0");

  const minutes = String(
    now.getMinutes()
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatTime(time) {
  if (!time) return "--";

  const upper = time.toUpperCase();

  if (
    upper.includes("AM") ||
    upper.includes("PM")
  ) {
    return time;
  }

  const [hourText, minute] =
    time.split(":");

  let hour = Number(hourText);

  const period =
    hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${period}`;
}

function convertTo24Hour(time) {
  if (!time) return "";

  const upper = time.toUpperCase();

  if (
    !upper.includes("AM") &&
    !upper.includes("PM")
  ) {
    return time.substring(0, 5);
  }

  const parts =
    time.trim().split(" ");

  const [hourText, minute] =
    parts[0].split(":");

  const period =
    parts[1]?.toUpperCase();

  let hour = Number(hourText);

  if (
    period === "PM" &&
    hour !== 12
  ) {
    hour += 12;
  }

  if (
    period === "AM" &&
    hour === 12
  ) {
    hour = 0;
  }

  return `${String(hour).padStart(
    2,
    "0"
  )}:${minute}`;
}

/* CSV HELPERS */

function getStatus(record) {
  if (record.dayOff) {
    return "Day Off";
  }

  if (
    record.clockIn &&
    record.clockOut
  ) {
    return "Worked";
  }

  if (
    record.clockIn &&
    !record.clockOut
  ) {
    return "Clocked In";
  }

  if (
    !record.clockIn &&
    record.clockOut
  ) {
    return "Incomplete";
  }

  return "No Record";
}

function escapeCSV(value) {
  return `"${String(
    value ?? ""
  ).replace(/"/g, '""')}"`;
}

function downloadCSV(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map(escapeCSV)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    {
      type:
        "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export default App;