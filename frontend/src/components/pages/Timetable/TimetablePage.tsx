import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { useTimetable } from '../../../hooks';
import { mockData } from '../../../mockData';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../../../utils/constants';

const TimetablePage: React.FC = () => {
  const { timetable } = useTimetable();
  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [selectedLab, setSelectedLab] = useState<string | null>(null);

  const filteredTimetable = timetable.filter(
    entry =>
      entry.dayOfWeek === selectedDay &&
      (!selectedLab || entry.labId === selectedLab)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Timetable</h1>
        <p className="text-sm text-slate-500 mt-1">View lab schedules and class allocations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card title="Filter">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Day</h3>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Lab</h3>
                <select
                  value={selectedLab || ''}
                  onChange={(e) => setSelectedLab(e.target.value || null)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                >
                  <option value="">All Labs</option>
                  {mockData.labs.map(lab => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card title={`${selectedDay} - ${selectedLab ? mockData.labs.find(l => l.id === selectedLab)?.name : 'All Labs'}`}>
            {filteredTimetable.length > 0 ? (
              <div className="space-y-3">
                {filteredTimetable.map(entry => {
                  const lab = mockData.labs.find(l => l.id === entry.labId);
                  const classInfo = mockData.classes.find(c => c.id === entry.classId);
                  const courseInfo = mockData.courses.find(c => c.id === entry.courseId);
                  const facultyInfo = mockData.faculty.find(f => f.id === entry.facultyId);

                  return (
                    <div
                      key={entry.id}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-md"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Time</p>
                          <p className="font-semibold text-slate-900">
                            {entry.startTime} - {entry.endTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Lab</p>
                          <p className="font-semibold text-slate-900">{lab?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Class</p>
                          <p className="font-semibold text-slate-900">{classInfo?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Course</p>
                          <p className="font-semibold text-slate-900">{courseInfo?.name}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Faculty:</span> {facultyInfo?.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No classes scheduled for {selectedDay}</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card title="Weekly Overview">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Time</th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.slice(0, 10).map(time => (
                <tr key={time} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-700">{time}</td>
                  {DAYS_OF_WEEK.map(day => {
                    const entry = timetable.find(
                      e =>
                        e.dayOfWeek === day &&
                        e.startTime === time &&
                        (!selectedLab || e.labId === selectedLab)
                    );
                    return (
                      <td key={`${day}-${time}`} className="px-4 py-3 bg-white text-xs">
                        {entry ? (
                          <div className="bg-sky-50 text-sky-700 p-2 rounded border border-sky-100">
                            <p className="font-medium">{mockData.labs.find(l => l.id === entry.labId)?.name}</p>
                            <p>{mockData.classes.find(c => c.id === entry.classId)?.name}</p>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TimetablePage;
